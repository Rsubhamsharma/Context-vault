import api from '../lib/api';
import type { ApiResponse } from '../types/context.types';

export interface GitHubIntegrationStatus {
  connected: boolean;
  needsRepositorySelection: boolean;
  githubAccountLogin: string | null;
  repoOwner: string | null;
  repoName: string | null;
  repoFullName: string | null;
  repoUrl: string | null;
  defaultBranch: string | null;
  selectedBranch: string | null;
  permissionsSummary: 'Read-only';
  isActive: boolean;
  connectedAt: string | null;
  updatedAt: string | null;
  installationId?: string | null;
  installationSettingsUrl?: string | null;
}

export interface GitHubRepository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string | null;
}

export interface GitHubBranch {
  name: string;
  commitSha?: string;
  protected: boolean;
}

export interface GitHubDiffFile {
  filename: string;
  status: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  patchPreview?: string;
  truncated?: boolean;
  risky?: boolean;
  ignoredReason?: string;
}

export interface GitHubDiffResponse {
  source: 'commit' | 'pull_request';
  sha?: string;
  shortSha?: string;
  number?: number;
  repository: string;
  branch: string;
  message?: string;
  files: GitHubDiffFile[];
  stats: {
    filesChanged: number;
    additions: number;
    deletions: number;
    truncatedFiles: number;
    riskyFiles: number;
    ignoredFiles: number;
    totalChars: number;
    isOverLimit: boolean;
  };
}

export interface GitHubChange {
  source: 'commit' | 'pull_request';
  sha?: string;
  shortSha?: string;
  message?: string;
  authorName?: string;
  authorDate?: string;
  url: string;
  branch: string;
  number?: number;
  title?: string;
  state?: string;
  merged?: boolean;
  updatedAt?: string;
}

export const githubService = {
  async getIntegrationStatus(projectId: string): Promise<ApiResponse<GitHubIntegrationStatus>> {
    const response = await api.get(`/projects/${projectId}/github/status`);
    return response.data as ApiResponse<GitHubIntegrationStatus>;
  },
  
  async getDiff(projectId: string, diffRequest: { source: 'commit' | 'pull_request'; sha?: string; number?: number }): Promise<ApiResponse<GitHubDiffResponse>> {
    const response = await api.post(`/projects/${projectId}/github/diff`, diffRequest);
    return response.data as ApiResponse<GitHubDiffResponse>;
  },

  async getChangesPreview(projectId: string): Promise<ApiResponse<GitHubChange[]>> {
    const response = await api.get(`/projects/${projectId}/github/changes/preview`);
    return response.data as ApiResponse<GitHubChange[]>;
  },
 
  async getRepositories(projectId: string): Promise<ApiResponse<GitHubRepository[]>> {
    const response = await api.get(`/projects/${projectId}/github/repositories`);
    return response.data as ApiResponse<GitHubRepository[]>;
  },


  async selectRepository(projectId: string, repoFullName: string): Promise<ApiResponse<GitHubIntegrationStatus>> {
    const response = await api.post(`/projects/${projectId}/github/repository/select`, { repoFullName });
    return response.data as ApiResponse<GitHubIntegrationStatus>;
  },

  async getBranches(projectId: string): Promise<ApiResponse<GitHubBranch[]>> {
    const response = await api.get(`/projects/${projectId}/github/branches`);
    return response.data as ApiResponse<GitHubBranch[]>;
  },

  async selectBranch(projectId: string, branch: string): Promise<ApiResponse<GitHubIntegrationStatus>> {
    const response = await api.post(`/projects/${projectId}/github/branch/select`, { branch });
    return response.data as ApiResponse<GitHubIntegrationStatus>;
  },

  async startInstallation(projectId: string): Promise<ApiResponse<{ url: string }>> {
    const response = await api.post(`/projects/${projectId}/github/install/start`, {});
    return response.data as ApiResponse<{ url: string }>;
  },

  async disconnectRepository(projectId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/projects/${projectId}/github/disconnect`);
    return response.data as ApiResponse<null>;
  },
};
