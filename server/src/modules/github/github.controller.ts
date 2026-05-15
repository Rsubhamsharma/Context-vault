import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error.middleware';
import { sendResponse } from '../../utils/response';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { encrypt } from '../../utils/encryption';
import { GitHubAppError, GitHubAppService, type GitHubInstallationRepository } from '../../services/github-app.service';

export class GitHubIntegrationController {
  constructor() {
    this.getStatus = this.getStatus.bind(this);
    this.getRepositories = this.getRepositories.bind(this);
    this.selectRepository = this.selectRepository.bind(this);
    this.getBranches = this.getBranches.bind(this);
    this.selectBranch = this.selectBranch.bind(this);
    this.startInstall = this.startInstall.bind(this);
    this.callback = this.callback.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.getChangesPreview = this.getChangesPreview.bind(this);
    this.getDiff = this.getDiff.bind(this);
  }

  private buildInstallationSettingsUrl(installationId: string | null | undefined) {
    return installationId ? `https://github.com/settings/installations/${installationId}` : null;
  }

  private getQueryValue(value: unknown) {
    return typeof value === 'string' ? value : null;
  }

  private toGitHubStatus(integration: {
    connectedAt: Date | null;
    defaultBranch: string | null;
    githubAccountLogin: string | null;
    installationId: string | null;
    isActive: boolean;
    permissionsSummary: string | null;
    repoFullName: string | null;
    repoName: string | null;
    repoOwner: string | null;
    repoUrl: string | null;
    selectedBranch: string | null;
    updatedAt: Date | null;
  }) {
    return {
      connected: Boolean(integration.isActive && integration.installationId),
      needsRepositorySelection: Boolean(integration.isActive && integration.installationId && !integration.repoFullName),
      githubAccountLogin: integration.githubAccountLogin,
      repoOwner: integration.repoOwner,
      repoName: integration.repoName,
      repoFullName: integration.repoFullName,
      repoUrl: integration.repoUrl,
      defaultBranch: integration.defaultBranch,
      selectedBranch: integration.selectedBranch,
      permissionsSummary: 'Read-only' as const,
      isActive: integration.isActive,
      connectedAt: integration.connectedAt,
      updatedAt: integration.updatedAt,
      installationSettingsUrl: this.buildInstallationSettingsUrl(integration.installationId),
    };
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });

      if (integration && integration.isActive) {
        return sendResponse(res, 200, this.toGitHubStatus(integration), 'GitHub integration status retrieved');
      }

      return sendResponse(res, 200, { 
        connected: false, 
        needsRepositorySelection: false,
        githubAccountLogin: null,
        repoOwner: null,
        repoName: null,
        repoFullName: null,
        repoUrl: null,
        defaultBranch: null,
        selectedBranch: null,
        permissionsSummary: 'Read-only',
        isActive: false,
        connectedAt: null,
        updatedAt: null,
        installationSettingsUrl: null,
      }, 'GitHub integration status retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getRepositories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });

      if (!integration || !integration.isActive) {
        return sendResponse(res, 404, null, 'GitHub is not connected yet', 'GITHUB_NOT_CONNECTED');
      }

      if (!integration.installationId) {
        return sendResponse(res, 409, null, 'GitHub installation is incomplete. Please reconnect GitHub.', 'GITHUB_INSTALLATION_INCOMPLETE');
      }

      try {
        const data = await GitHubAppService.getInstallationRepositories(integration.installationId);
        
        if (!data || !Array.isArray(data.repositories)) {
          return sendResponse(res, 200, [], 'No accessible repositories found');
        }

        const repos = data.repositories.map((repo) => ({
          id: repo.id,
          owner: repo.owner?.login,
          name: repo.name,
          fullName: repo.full_name,
          htmlUrl: repo.html_url,
          private: repo.private,
          defaultBranch: repo.default_branch,
          updatedAt: repo.pushed_at,
        }));

        return sendResponse(res, 200, repos, 'Accessible repositories retrieved');
      } catch (error: any) {
        if (error instanceof AppError) {
          if (error.statusCode === 401 || error.statusCode === 403) {
            return sendResponse(res, 401, null, 'GitHub authorization could not be verified. Please reconnect GitHub.', 'AUTH_FAILED');
          }
          return sendResponse(res, error.statusCode, null, error.message, 'GITHUB_API_ERROR');
        }
        
        return sendResponse(res, 502, null, 'GitHub API communication failure. Please try again.', 'GATEWAY_ERROR');
      }
    } catch (error: any) {
      next(error);
    }
  }

  async selectRepository(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }
      const { repoFullName } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });
      if (!integration || !integration.isActive || !integration.installationId) {
        return sendResponse(res, 400, null, 'No active GitHub installation found for this project', 'INSTALLATION_MISSING');
      }

      const repositories = await GitHubAppService.getInstallationRepositories(integration.installationId);
      const repoData = repositories.repositories?.find((repo) => repo.full_name === repoFullName);

      if (!repoData) {
        return sendResponse(res, 404, null, 'GitHub repository not found or access denied for this installation', 'REPOSITORY_NOT_ACCESSIBLE');
      }

      const updatedIntegration = await prisma.gitHubIntegration.update({
        where: { projectId },
        data: {
          repoOwner: repoData.owner.login,
          repoName: repoData.name,
          repoFullName: repoData.full_name,
          repoUrl: repoData.html_url,
          defaultBranch: repoData.default_branch,
          selectedBranch: repoData.default_branch,
          permissionsSummary: 'Read-only',
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return sendResponse(res, 200, this.toGitHubStatus(updatedIntegration), 'Repository selected and linked successfully');
    } catch (error) {
      next(error);
    }
  }

  async getBranches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });

      if (!integration || !integration.isActive) {
        return sendResponse(res, 404, null, 'GitHub is not connected yet', 'GITHUB_NOT_CONNECTED');
      }

      if (!integration.installationId) {
        return sendResponse(res, 409, null, 'GitHub installation is incomplete. Please reconnect GitHub.', 'GITHUB_INSTALLATION_INCOMPLETE');
      }

      if (!integration.repoFullName) {
        return sendResponse(res, 409, null, 'Select a repository before loading branches.', 'REPOSITORY_NOT_SELECTED');
      }

      try {
        const branches = await GitHubAppService.getRepositoryBranches(integration.installationId, integration.repoFullName);
        
        if (!Array.isArray(branches)) {
          return sendResponse(res, 200, [], 'No branches found for this repository');
        }

        const safeBranches = branches.map((b: any) => ({
          name: b.name,
          commitSha: b.commit?.sha,
          protected: b.protected,
        }));

        return sendResponse(res, 200, safeBranches, 'Branches retrieved');
      } catch (error: any) {
        if (error instanceof AppError) {
          if (error.statusCode === 401 || error.statusCode === 403) {
            return sendResponse(res, 401, null, 'GitHub authorization could not be verified. Please reconnect GitHub.', 'AUTH_FAILED');
          }
          return sendResponse(res, error.statusCode, null, error.message, 'GITHUB_API_ERROR');
        }
        
        return sendResponse(res, 502, null, 'GitHub API communication failure. Please try again.', 'GATEWAY_ERROR');
      }
    } catch (error) {
      next(error);
    }
  }

  async selectBranch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }
      const { branch } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });

      if (!integration || !integration.isActive || !integration.installationId || !integration.repoFullName) {
        return sendResponse(res, 400, null, 'Repository not selected for this project', 'REPOSITORY_NOT_SELECTED');
      }

      const branches = await GitHubAppService.getRepositoryBranches(integration.installationId, integration.repoFullName);
      const exists = branches.some((b: any) => b.name === branch);

      if (!exists) {
        return sendResponse(res, 400, null, 'Selected branch does not exist in the repository', 'BRANCH_NOT_FOUND');
      }

      const updatedIntegration = await prisma.gitHubIntegration.update({
        where: { projectId },
        data: {
          selectedBranch: branch,
          updatedAt: new Date(),
        },
      });

      return sendResponse(res, 200, this.toGitHubStatus(updatedIntegration), 'Branch selected successfully');
    } catch (error) {
      next(error);
    }
  }

  async startInstall(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const installState = await GitHubAppService.createInstallationState(projectId, req.user!.id);
      return sendResponse(res, 200, { url: installState.url }, 'GitHub installation started');
    } catch (error: unknown) {
      if (error instanceof AppError) {
        const code = error.statusCode >= 500 ? 'GITHUB_INSTALL_START_FAILED' : 'GITHUB_INSTALL_START_INVALID';
        return sendResponse(res, error.statusCode, null, error.message, code);
      }

      return sendResponse(res, 500, null, 'GitHub installation could not be started. Check backend GitHub App configuration.', 'GITHUB_INSTALL_START_FAILED');
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const state = this.getQueryValue(req.query.state);
      const installationId = this.getQueryValue(req.query.installation_id);
      const frontendUrl = process.env.FRONTEND_URL || '';

      if (!state) {
        const redirectUrl = `${frontendUrl}/dashboard?github=state_missing`;
        return res.redirect(redirectUrl);
      }

      const installState = await prisma.gitHubInstallState.findUnique({
        where: { state },
      });

      if (!installState) {
        const redirectUrl = `${frontendUrl}/dashboard?github=state_invalid`;
        return res.redirect(redirectUrl);
      }

      const projectId = installState.projectId;
      const userId = installState.userId;

      if (!installationId) {
        const redirectUrl = `${frontendUrl}/project/${projectId}?github=installation_missing`;
        return res.redirect(redirectUrl);
      }

      if (installState.expiresAt < new Date()) {
        const redirectUrl = `${frontendUrl}/project/${projectId}?github=state_expired`;
        return res.redirect(redirectUrl);
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        const redirectUrl = `${frontendUrl}/dashboard?github=project_not_found`;
        return res.redirect(redirectUrl);
      }

      const ownershipPassed = project.userId === installState.userId;

      if (!ownershipPassed) {
        const redirectUrl = `${frontendUrl}/project/${projectId}?github=project_ownership_failed`;
        return res.redirect(redirectUrl);
      }

      try {
        await GitHubAppService.validateAppJwtCreation();

        const installationDetails = await GitHubAppService.getInstallationDetails(installationId);

        const repositories = await GitHubAppService.getInstallationRepositories(installationId);

        const repoList = repositories.repositories || [];
        const githubAccountId = installationDetails.account?.id ? String(installationDetails.account.id) : null;
        const githubAccountLogin = installationDetails.account?.login || null;

        const saveIntegration = async (repo?: GitHubInstallationRepository) => {
          await prisma.gitHubIntegration.upsert({
            where: { projectId },
            update: {
              installationId,
              githubAccountId,
              githubAccountLogin,
              repoOwner: repo?.owner.login || null,
              repoName: repo?.name || null,
              repoFullName: repo?.full_name || null,
              repoUrl: repo?.html_url || null,
              defaultBranch: repo?.default_branch || null,
              selectedBranch: repo?.default_branch || null,
              permissionsSummary: 'Read-only',
              connectedAt: new Date(),
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              projectId,
              userId,
              installationId,
              githubAccountId,
              githubAccountLogin,
              repoOwner: repo?.owner.login,
              repoName: repo?.name,
              repoFullName: repo?.full_name,
              repoUrl: repo?.html_url,
              defaultBranch: repo?.default_branch,
              selectedBranch: repo?.default_branch,
              permissionsSummary: 'Read-only',
              isActive: true,
            },
          });
        };

        if (repoList.length === 0) {
          try {
            await saveIntegration();
          } catch (saveError) {
            const redirectUrl = `${frontendUrl}/project/${projectId}?github=integration_save_failed`;
            return res.redirect(redirectUrl);
          }

          await prisma.gitHubInstallState.delete({ where: { state } });
          const redirectUrl = `${frontendUrl}/project/${projectId}?github=no_repositories`;
          return res.redirect(redirectUrl);
        }

        if (repoList.length === 1) {
          const repo = repoList[0];
          try {
            await saveIntegration(repo);
          } catch (saveError) {
            const redirectUrl = `${frontendUrl}/project/${projectId}?github=integration_save_failed`;
            return res.redirect(redirectUrl);
          }

          await prisma.gitHubInstallState.delete({ where: { state } });
          const redirectUrl = `${frontendUrl}/project/${projectId}?github=connected`;
          res.redirect(redirectUrl);
          return;
        }

        try {
          await saveIntegration();
        } catch (saveError) {
          const redirectUrl = `${frontendUrl}/project/${projectId}?github=integration_save_failed`;
          return res.redirect(redirectUrl);
        }

        await prisma.gitHubInstallState.delete({ where: { state } });
        const redirectUrl = `${frontendUrl}/project/${projectId}?github=select_repo`;
        res.redirect(redirectUrl);
        return;
      } catch (apiError: unknown) {
        const errorCode = apiError instanceof GitHubAppError ? apiError.githubCode : 'repo_fetch_failed';
        const redirectUrl = `${frontendUrl}/project/${projectId}?github=${errorCode}`;
        return res.redirect(redirectUrl);
      }

    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || '';
      res.redirect(`${frontendUrl}/dashboard?github=callback_failed`);
    }
  }


  async connect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { 
        repoOwner, 
        repoName, 
        selectedBranch,
        installationId,
        githubAccountId,
        accessToken
      } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied');
      }

      if (!repoOwner || !repoName) {
        return sendResponse(res, 400, null, 'Missing required repository owner or name');
      }

      let encryptedToken = null;
      let repoDetails = {
        repoFullName: '',
        repoUrl: '',
        defaultBranch: '',
      };

      if (accessToken) {
        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'User-Agent': 'Context-Vault-App',
              'Accept': 'application/vnd.github.v3+json'
            },
          });

          if (!userRes.ok) {
            return sendResponse(res, 401, null, 'Invalid GitHub access token');
          }
          
          encryptedToken = encrypt(accessToken);

          const repoRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
            headers: {
              'Authorization': `token ${accessToken}`,
              'User-Agent': 'Context-Vault-App',
              'Accept': 'application/vnd.github.v3+json'
            },
          });

          if (!repoRes.ok) {
            return sendResponse(res, 404, null, 'GitHub repository not found or access denied');
          }

          const repoData = await repoRes.json();
          repoDetails = {
            repoFullName: repoData.full_name,
            repoUrl: repoData.html_url,
            defaultBranch: repoData.default_branch,
          };
        } catch (error) {
          return sendResponse(res, 500, null, 'Error communicating with GitHub API');
        }
      } else {
        return sendResponse(res, 400, null, 'GitHub access token is required');
      }

      const integration = await prisma.gitHubIntegration.upsert({
        where: { projectId },
        update: {
          repoOwner,
          repoName,
          ...repoDetails,
          selectedBranch,
          installationId,
          githubAccountId,
          accessTokenEncrypted: encryptedToken || undefined,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          projectId,
          userId: req.user!.id,
          repoOwner,
          repoName,
          ...repoDetails,
          selectedBranch,
          installationId,
          githubAccountId,
          accessTokenEncrypted: encryptedToken,
          isActive: true,
        },
      });

      const { accessTokenEncrypted, ...safeIntegration } = integration;
      return sendResponse(res, 201, safeIntegration, 'GitHub repository connected successfully');
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }
    
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied');
      }
    
      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });
    
      if (!integration) {
        return sendResponse(res, 200, null, 'No GitHub integration to disconnect');
      }
    
      await prisma.gitHubIntegration.delete({
        where: { id: integration.id },
      });
    
      return sendResponse(res, 200, null, 'GitHub repository disconnected successfully');
    } catch (error) {
      next(error);
    }
  }

  async getChangesPreview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }
    
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }
    
      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });
    
      if (!integration || !integration.isActive || !integration.installationId) {
        return sendResponse(res, 404, null, 'Connect GitHub first.', 'GITHUB_NOT_CONNECTED');
      }
    
      if (!integration.repoFullName) {
        return sendResponse(res, 409, null, 'Choose a repository first.', 'REPOSITORY_NOT_SELECTED');
      }
    
      if (!integration.selectedBranch) {
        return sendResponse(res, 409, null, 'Choose a tracked branch first.', 'BRANCH_NOT_SELECTED');
      }
    
      try {
        const { commits, pullRequests } = await GitHubAppService.getRecentChanges(
          integration.installationId,
          integration.repoFullName,
          integration.selectedBranch
        );
    
        const changes = [
          ...commits.map(c => ({ ...c, source: 'commit' })),
          ...pullRequests.map(p => ({ ...p, source: 'pull_request' })),
        ].sort((a, b) => {
          const dateA = a.source === 'commit' ? (a as any).authorDate : (a as any).updatedAt;
          const dateB = b.source === 'commit' ? (b as any).authorDate : (b as any).updatedAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }).slice(0, 25);
    
        return sendResponse(res, 200, changes, 'Recent GitHub changes retrieved successfully');
      } catch (error: any) {
        if (error instanceof AppError) {
          return sendResponse(res, error.statusCode, null, error.message, 'GITHUB_API_ERROR');
        }
        return sendResponse(res, 502, null, 'Could not fetch GitHub changes. Please retry.', 'GATEWAY_ERROR');
      }
    } catch (error) {
      next(error);
    }
  }

  async getDiff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 400, null, 'Project id is required', 'PROJECT_ID_REQUIRED');
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied', 'PROJECT_NOT_FOUND');
      }

      const integration = await prisma.gitHubIntegration.findUnique({
        where: { projectId },
      });

      if (!integration || !integration.isActive || !integration.installationId) {
        return sendResponse(res, 404, null, 'Connect GitHub first.', 'GITHUB_NOT_CONNECTED');
      }

      if (!integration.repoFullName) {
        return sendResponse(res, 409, null, 'Choose a repository first.', 'REPOSITORY_NOT_SELECTED');
      }

      if (!integration.selectedBranch) {
        return sendResponse(res, 409, null, 'Choose a tracked branch first.', 'BRANCH_NOT_SELECTED');
      }

      const { source, sha, number } = req.body;
      if (!source || (source === 'commit' && !sha) || (source === 'pull_request' && !number)) {
        return sendResponse(res, 400, null, 'Invalid request body. Source and identifier (SHA/number) are required.', 'INVALID_REQUEST');
      }

      try {
        const diff = await GitHubAppService.getDiff(
          integration.installationId,
          integration.repoFullName,
          integration.selectedBranch,
          { source, sha, number }
        );

        if (diff.stats.isOverLimit) {
          return sendResponse(res, 413, diff, 'Diff is too large to preview safely, some parts may be truncated.', 'DIFF_TOO_LARGE');
        }

        return sendResponse(res, 200, diff, 'GitHub diff retrieved successfully');
      } catch (error: any) {
        if (error instanceof AppError) {
          return sendResponse(res, error.statusCode, null, error.message, 'GITHUB_API_ERROR');
        }
        return sendResponse(res, 502, null, 'Could not fetch diff from GitHub. Please retry.', 'GATEWAY_ERROR');
      }
    } catch (error) {
      next(error);
    }
  }

}
 
export const githubIntegrationController = new GitHubIntegrationController();

