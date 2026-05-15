import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { redactSecrets } from '../utils/redact';

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface GitHubInstallStateResult {
  state: string;
  projectId: string;
  userId: string;
  expiresAt: Date;
  url: string;
}

export interface GitHubInstallationRepository {
  id: number;
  owner: { login: string };
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  pushed_at: string | null;
}

export interface GitHubInstallationRepositoriesResponse {
  repositories: GitHubInstallationRepository[];
}

export type GitHubCallbackErrorCode =
  | 'app_auth_failed'
  | 'installation_token_failed'
  | 'repo_fetch_failed';

export class GitHubAppError extends AppError {
  constructor(statusCode: number, message: string, public githubCode: GitHubCallbackErrorCode) {
    super(statusCode, message);
  }
}

export class GitHubAppService {
  private static getConfig(): GitHubAppConfig {
    return {
      appId: (process.env.GITHUB_APP_ID || '').trim(),
      privateKey: this.resolvePrivateKey(),
      clientId: (process.env.GITHUB_CLIENT_ID || '').trim(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
    };
  }

  private static resolvePrivateKey(): string {
    const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH?.trim();
    if (privateKeyPath) {
      try {
        return fs.readFileSync(privateKeyPath, 'utf8').replace(/\\n/g, '\n').trim();
      } catch {
        throw new GitHubAppError(500, 'GitHub App private key file could not be read', 'app_auth_failed');
      }
    }

    const envPrivateKey = (process.env.GITHUB_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
    if (this.isPemPrivateKey(envPrivateKey)) {
      return envPrivateKey;
    }

    return this.readUnquotedPrivateKeyFromEnvFile() || envPrivateKey;
  }

  private static isPemPrivateKey(value: string): boolean {
    return value.includes('-----BEGIN') && value.includes('-----END');
  }

  private static readUnquotedPrivateKeyFromEnvFile(): string | null {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const envFile = fs.readFileSync(envPath, 'utf8');
      const match = envFile.match(/GITHUB_PRIVATE_KEY=(-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----)/);
      return match?.[1]?.replace(/\\n/g, '\n').trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Generates a GitHub App JWT for authenticating as the App
   */
  private static async generateAppJwt(): Promise<string> {
    const config = this.getConfig();
    if (!config.appId || !config.privateKey) {
      throw new GitHubAppError(500, 'GitHub App configuration is missing', 'app_auth_failed');
    }

    if (!this.isPemPrivateKey(config.privateKey)) {
      throw new GitHubAppError(500, 'GitHub App private key is not a valid PEM value', 'app_auth_failed');
    }

    const payload = {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + (10 * 60),
      iss: config.appId,
    };

    try {
      return jwt.sign(payload, config.privateKey, { algorithm: 'RS256' });
    } catch {
      throw new GitHubAppError(500, 'GitHub App JWT could not be created', 'app_auth_failed');
    }
  }

  static async validateAppJwtCreation(): Promise<void> {
    await this.generateAppJwt();
  }

  /**
   * Exchanges an installation ID for a short-lived access token
   */
  static async getInstallationToken(installationId: string): Promise<string> {
    const jwtToken = await this.generateAppJwt();

    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new GitHubAppError(response.status, 'Failed to retrieve GitHub installation token', 'installation_token_failed');
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Generates the GitHub App installation URL with state for CSRF and project linking
   */
  static async getInstallationUrl(projectId: string, userId: string): Promise<string> {
    const installState = await this.createInstallationState(projectId, userId);
    return installState.url;
  }

  static async createInstallationState(projectId: string, userId: string): Promise<GitHubInstallStateResult> {
    const appSlug = process.env.GITHUB_APP_SLUG;
    if (!appSlug?.trim()) {
      throw new AppError(500, 'GitHub App slug is not configured on the server.');
    }

    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.gitHubInstallState.create({
      data: {
        state,
        projectId,
        userId,
        expiresAt,
      },
    });

    const url = `https://github.com/apps/${appSlug.trim()}/installations/new?state=${state}`;

    return {
      state,
      projectId,
      userId,
      expiresAt,
      url,
    };
  }

  /**
   * Fetches installation details including account login
   */
  static async getInstallationDetails(installationId: string) {
    const jwtToken = await this.generateAppJwt();

    const response = await fetch(`https://api.github.com/app/installations/${installationId}`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new GitHubAppError(response.status, 'Failed to fetch installation details', 'app_auth_failed');
    }

    return response.json();
  }

  /**
    * Fetches safe repository metadata for a specific installation

   */
  static async getInstallationRepositories(installationId: string): Promise<GitHubInstallationRepositoriesResponse> {
    const token = await this.getInstallationToken(installationId);

    const response = await fetch('https://api.github.com/installation/repositories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new GitHubAppError(response.status, 'Failed to fetch repositories for installation', 'repo_fetch_failed');
    }

    return response.json() as Promise<GitHubInstallationRepositoriesResponse>;
  }

  /**
   * Fetches branches for a specific repository using an installation token
   */
  static async getRepositoryBranches(installationId: string, repoFullName: string) {
    const token = await this.getInstallationToken(installationId);
    
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/branches`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    
    if (!response.ok) {
      throw new AppError(response.status, 'Failed to fetch branches for repository');
    }
    
    return response.json();
  }

  /**
   * Fetches recent commits and pull requests for a specific repository and branch
   */
  static async getRecentChanges(installationId: string, repoFullName: string, branch: string, limit = 10) {
    const token = await this.getInstallationToken(installationId);
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Fetch commits
    const commitsRes = await fetch(`https://api.github.com/repos/${repoFullName}/commits?sha=${branch}&per_page=${limit}`, { headers });
    if (!commitsRes.ok) {
      throw new AppError(commitsRes.status, 'Failed to fetch recent commits from GitHub');
    }
    const commits = await commitsRes.json() as any[];

    // Fetch pull requests
    const prsRes = await fetch(`https://api.github.com/repos/${repoFullName}/pulls?state=all&per_page=${limit}`, { headers });
    let prs: any[] = [];
    if (prsRes.ok) {
      prs = await prsRes.json();
    }

    const safeCommits = commits.map(c => ({
      source: 'commit' as const,
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      message: c.commit.message,
      authorName: c.commit.author.name,
      authorDate: c.commit.author.date,
      url: c.html_url,
      branch,
    }));

    const safePrs = prs.map(p => ({
      source: 'pull_request' as const,
      number: p.number,
      title: p.title,
      state: p.state,
      merged: p.merged,
      updatedAt: p.updated_at,
      url: p.html_url,
      branch: p.base.ref,
    }));

    return {
      commits: safeCommits,
      pullRequests: safePrs,
    };
  }

  /**
   * Fetches and sanitizes a diff for a commit or PR
   */
  static async getDiff(installationId: string, repoFullName: string, branch: string, changeData: { source: 'commit' | 'pull_request'; sha?: string; number?: number }) {
    const token = await this.getInstallationToken(installationId);
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    let files: any[] = [];
    let metadata: any = {};

    if (changeData.source === 'commit') {
      if (!changeData.sha) throw new AppError(400, 'Commit SHA is required for diff');
      
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/commits/${changeData.sha}`, { headers });
      if (!res.ok) throw new AppError(res.status, 'Failed to fetch commit details');
      const data = await res.json();
      
      files = data.files || [];
      metadata = {
        sha: changeData.sha,
        shortSha: changeData.sha.slice(0, 7),
        message: data.commit.message,
      };
    } else {
      if (!changeData.number) throw new AppError(400, 'PR number is required for diff');
      
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${changeData.number}/files`, { headers });
      if (!res.ok) throw new AppError(res.status, 'Failed to fetch PR files');
      
      files = await res.json();
      metadata = {
        number: changeData.number,
      };
    }

    // Filtering and Sanitization
    const IGNORED_PATTERNS = [
      /node_modules\//, /dist\//, /build\//, /coverage\//, /\.next\//, /\.vite\//,
      /package-lock\.json$/, /yarn\.lock$/, /pnpm-lock\.yaml$/,
      /\.(pem|key|crt|cert|p12|der)$/, /\.env.*$/,
      /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|woff|woff2|ttf|otf)$/
    ];

    let totalAdditions = 0;
    let totalDeletions = 0;
    let truncatedFiles = 0;
    let riskyFilesCount = 0;
    let ignoredFilesCount = 0;
    let totalDiffChars = 0;
    const MAX_PATCH_CHARS = 4000;
    const MAX_TOTAL_CHARS = 30000;
    const MAX_FILES = 20;

    const processedFiles = files.slice(0, MAX_FILES).map(file => {
      const filename = file.filename;
      
      if (IGNORED_PATTERNS.some(p => p.test(filename))) {
        ignoredFilesCount++;
        return { filename, status: 'ignored', ignoredReason: 'noisy/binary file' };
      }

      let patch = file.patch || '';
      let truncated = false;
      
      if (patch.length > MAX_PATCH_CHARS) {
        patch = patch.slice(0, MAX_PATCH_CHARS) + '\n... [TRUNCATED]';
        truncated = true;
        truncatedFiles++;
      }

      const { text: redactedPatch, secretsRedactedCount, riskyFilesDetected } = redactSecrets(patch);
      if (secretsRedactedCount > 0 || riskyFilesDetected.length > 0) {
        riskyFilesCount++;
      }

      totalAdditions += file.additions || 0;
      totalDeletions += file.deletions || 0;
      totalDiffChars += redactedPatch.length;

      return {
        filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patchPreview: redactedPatch,
        truncated,
        risky: secretsRedactedCount > 0 || riskyFilesDetected.length > 0,
      };
    });

    if (files.length > MAX_FILES) {
      truncatedFiles += (files.length - MAX_FILES);
    }

    return {
      source: changeData.source,
      repository: repoFullName,
      branch,
      ...metadata,
      files: processedFiles,
      stats: {
        filesChanged: files.length,
        additions: totalAdditions,
        deletions: totalDeletions,
        truncatedFiles,
        riskyFiles: riskyFilesCount,
        ignoredFiles: ignoredFilesCount,
        totalChars: totalDiffChars,
        isOverLimit: totalDiffChars > MAX_TOTAL_CHARS,
      }
    };
  }
}


