import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GitBranch, Link, Unlink, AlertCircle, RefreshCw, ExternalLink, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { githubService, type GitHubChange, type GitHubDiffResponse } from '../../services/github.service';
import { motion, AnimatePresence } from 'framer-motion';

interface GitHubIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialError?: string | null;
  onClearError?: () => void;
  onAnalyzeGitHubChange?: (summary: string) => Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

export const GitHubIntegrationModal = ({
  isOpen,
  onClose,
  projectId,
  initialError,
  onClearError,
  onAnalyzeGitHubChange,
}: GitHubIntegrationModalProps) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    } else {
      setErrorMessage(null);
    }
  }, [initialError, isOpen]);

  const { data: statusData, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['github-integration-status', projectId],
    queryFn: () => githubService.getIntegrationStatus(projectId),
    enabled: isOpen && !!projectId,
    retry: 1,
  });

  const integration = statusData?.data;
  const isConnected = integration?.connected === true;
  const needsRepositorySelection = isConnected && integration.needsRepositorySelection === true;
  const hasSelectedRepository = isConnected && Boolean(integration.repoFullName);
  const installationSettingsUrl = integration?.installationSettingsUrl || (
    integration?.installationId ? `https://github.com/settings/installations/${integration.installationId}` : null
  );

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [changesPreview, setChangesPreview] = useState<GitHubChange[] | null>(null);
  const [isFetchingChanges, setIsFetchingChanges] = useState(false);
  const [diffPreview, setDiffPreview] = useState<GitHubDiffResponse | null>(null);
  const [isFetchingDiff, setIsFetchingDiff] = useState<string | null>(null);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);

  const { data: reposData, isLoading: reposLoading, error: reposError, refetch: refetchRepos } = useQuery({
    queryKey: ['github-repositories', projectId],
    queryFn: () => githubService.getRepositories(projectId),
    enabled: isOpen && !!projectId && needsRepositorySelection,
    retry: 0,
  });

  const { data: branchesData, isLoading: branchesLoading, error: branchesError, refetch: refetchBranches } = useQuery({
    queryKey: ['github-branches', projectId],
    queryFn: () => githubService.getBranches(projectId),
    enabled: isOpen && !!projectId && hasSelectedRepository,
    retry: 0,
  });

  const installMutation = useMutation({
    mutationFn: () => githubService.startInstallation(projectId),
    onSuccess: (res) => {
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, 'GitHub connection could not be completed. Please try again or check your GitHub authorization.'));
    },
  });

  const selectRepoMutation = useMutation({
    mutationFn: (repoFullName: string) => githubService.selectRepository(projectId, repoFullName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-integration-status', projectId] });
      queryClient.invalidateQueries({ queryKey: ['github-branches', projectId] });
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, 'Failed to select repository. Please try again.'));
    },
  });

  const selectBranchMutation = useMutation({
    mutationFn: (branch: string) => githubService.selectBranch(projectId, branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-integration-status', projectId] });
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, 'Failed to select branch. Please try again.'));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => githubService.disconnectRepository(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-integration-status', projectId] });
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, 'Failed to disconnect GitHub. Please try again.'));
    },
  });

  const reconnectMutation = useMutation({
    mutationFn: async () => {
      if (isConnected) {
        try {
          await githubService.disconnectRepository(projectId);
        } catch (error: unknown) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status !== 400 && axiosError.response?.status !== 404) {
            throw error;
          }
        }
      }
    
      const res = await githubService.startInstallation(projectId);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    },
    onError: (error: unknown) => {
      setErrorMessage(getErrorMessage(error, 'Failed to reconnect GitHub. Please try again.'));
    },
  });

  const fetchChanges = async () => {
    setIsFetchingChanges(true);
    setErrorMessage(null);
    setDiffPreview(null);
    setSelectedChangeId(null);
    try {
      const res = await githubService.getChangesPreview(projectId);
      if (res.success) {
        setChangesPreview(res.data);
      } else {
        setErrorMessage(res.message || 'Failed to fetch changes');
      }
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Could not fetch GitHub changes. Please try again.'));
    } finally {
      setIsFetchingChanges(false);
    }
  };

  const analyzeChange = async (change: GitHubChange) => {
    if (!onAnalyzeGitHubChange) return;

    const id = change.sha || `#${change.number}`;
    setAnalyzingId(id);

    try {
      const integration = statusData?.data;
      const repoFullName = integration?.repoFullName || 'Unknown Repo';
      const branch = change.branch || 'main';
      
      let summary = '';
      if (change.source === 'commit') {
        summary = `GitHub Commit Change\nRepository: ${repoFullName}\nBranch: ${branch}\nCommit: ${change.sha}\nAuthor: ${change.authorName}\nDate: ${change.authorDate}\nMessage: ${change.message}\nURL: ${change.url}`;
      } else {
        summary = `GitHub Pull Request Change\nRepository: ${repoFullName}\nBranch: ${branch}\nPR: #${change.number}\nTitle: ${change.title}\nState: ${change.state}\nMerged: ${change.merged}\nUpdated: ${change.updatedAt}\nURL: ${change.url}`;
      }

      await onAnalyzeGitHubChange(summary);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Could not analyze this GitHub change. Please try again.'));
    } finally {
      setAnalyzingId(null);
    }
  };

  const viewDiff = async (change: GitHubChange) => {
    const id = change.sha || `#${change.number}`;
    setSelectedChangeId(id);
    setIsFetchingDiff(id);
    setErrorMessage(null);
    try {
      const res = await githubService.getDiff(projectId, {
        source: change.source,
        sha: change.sha,
        number: change.number,
      });
      if (res.success) {
        setDiffPreview(res.data);
      } else {
        setErrorMessage(res.message || 'Failed to fetch diff');
      }
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Could not fetch GitHub diff. Please try again.'));
    } finally {
      setIsFetchingDiff(null);
    }
  };

  const analyzeDiff = async (diff: GitHubDiffResponse) => {
    if (!onAnalyzeGitHubChange) return;

    try {
      // Construct a detailed summary from the diff for the AI
      const filesSummary = diff.files
        .filter(f => f.status !== 'ignored')
        .map(f => `File: ${f.filename}\nChanges: ${f.changes} (Add: ${f.additions}, Del: ${f.deletions})\nPatch:\n${f.patchPreview}`)
        .join('\n\n');

      const summary = `GitHub Diff Analysis Request\nRepository: ${diff.repository}\nBranch: ${diff.branch}\nSource: ${diff.source}\n\nDiff Summary:\n${filesSummary}`;

      await onAnalyzeGitHubChange(summary);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Could not analyze this diff. Please try again.'));
    }
  };


  const openInstallationSettings = () => {

    if (installationSettingsUrl) {
      window.open(installationSettingsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderConnectState = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>You will be redirected to GitHub to authorize Context Vault. You can select exactly which repositories to grant read-only access to. Context Vault does not push code, modify repositories, or update project memory automatically.</span>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => installMutation.mutate()}
          isLoading={installMutation.isPending}
          className="flex gap-2"
        >
          <Link className="w-4 h-4" /> Connect GitHub
        </Button>
      </div>
    </div>
  );

  const renderRepositorySelection = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-stone-50 dark:bg-surface-elevated border border-surface-border text-xs text-text-secondary">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-primary uppercase">Choose Repository</p>
          {integration?.githubAccountLogin && (
            <span className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-[10px] font-medium text-text-secondary border border-stone-300 dark:border-stone-700">
              {integration.githubAccountLogin}
            </span>
          )}
        </div>
        <p>The connection is authorized. Please choose which repository this vault should track.</p>
      </div>

      {reposLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      ) : reposError ? (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load repositories</span>
          </div>
          <p className="text-xs text-text-secondary">Update repository access on GitHub or try again.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => refetchRepos()}>Retry</Button>
            <Button size="sm" variant="ghost" onClick={openInstallationSettings} disabled={!installationSettingsUrl}>
              Update Repository Access on GitHub
            </Button>
            <Button size="sm" variant="ghost" onClick={() => reconnectMutation.mutate()} isLoading={reconnectMutation.isPending}>
              Reconnect GitHub
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {reposData?.data?.map((repo) => (
            <button
              key={repo.id}
              onClick={() => selectRepoMutation.mutate(repo.fullName)}
              className="w-full text-left p-3 rounded-lg border border-surface-border bg-surface hover:border-primary transition-colors group flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary group-hover:text-primary truncate">{repo.fullName}</p>
                <p className="text-[10px] text-text-secondary">{repo.private ? 'Private' : 'Public'} - Default: {repo.defaultBranch}</p>
              </div>
              <Button size="sm" variant="ghost" isLoading={selectRepoMutation.isPending}>
                Select
              </Button>
            </button>
          ))}
          {(!reposData?.data || reposData.data.length === 0) && (
            <div className="text-center py-8 space-y-4 rounded-xl border border-surface-border bg-surface">
              <div className="space-y-2 px-4">
                <p className="text-primary text-sm font-bold">No repositories available</p>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Context Vault is connected to GitHub, but no repositories are currently accessible. Update repository access on GitHub or reconnect with another account.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 px-4">
                <Button size="sm" onClick={openInstallationSettings} disabled={!installationSettingsUrl}>
                  Update Repository Access on GitHub
                </Button>
                <Button size="sm" variant="ghost" onClick={() => reconnectMutation.mutate()} isLoading={reconnectMutation.isPending}>
                  Reconnect GitHub
                </Button>
                <Button size="sm" variant="ghost" onClick={() => refetchRepos()}>
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Repository and branch selection only configures future GitHub change detection. Context Vault does not read file contents, analyze code, or update memory during this step.</span>
        </div>
      </div>
    </div>
  );

  const renderConnectedRepository = () => (
    <div className="flex flex-col h-full max-h-[75vh] overflow-hidden">
      {/* Compact Top Header / Summary */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">Connected</span>
            <span className="text-xs text-text-secondary font-mono bg-stone-100 dark:bg-surface-elevated px-2 py-0.5 rounded border border-surface-border truncate max-w-[200px]">
              {integration?.repoFullName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-text-secondary uppercase tracking-wider border border-surface-border">
              {integration?.permissionsSummary || 'Read-only'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-primary uppercase tracking-wider border border-surface-border flex items-center gap-1">
              <GitBranch className="w-2.5 h-2.5" />
              {integration?.selectedBranch || integration?.defaultBranch || 'main'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="h-8 px-3 text-xs flex gap-1.5 hover:bg-stone-100 dark:hover:bg-surface-elevated transition-colors"
          >
            Details <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            isLoading={disconnectMutation.isPending}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 h-8 px-3 text-xs flex gap-1.5 border border-transparent hover:border-red-200 dark:hover:border-red-800"
          >
            <Unlink className="w-3.5 h-3.5" /> Disconnect
          </Button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col min-h-0 pt-4">
        {/* Toolbar Row */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-tight">GitHub Change Detection</h3>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">Preview recent repository activity before analyzing.</p>
          </div>
          <Button 
            size="sm" 
            onClick={fetchChanges} 
            isLoading={isFetchingChanges}
            className="flex gap-2 h-9 px-4 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingChanges ? 'animate-spin' : ''}`} /> 
            Check GitHub Changes
          </Button>
        </div>

        {/* Muted Callout */}
        {!changesPreview && (
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/20 border border-surface-border text-[11px] text-text-secondary italic mb-4 shrink-0 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Nothing is added to project memory unless you analyze and apply a suggested update.
          </div>
        )}

        {/* Master-Detail Container */}
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
          {/* Master List (40%) */}
          <div className="w-[40%] flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!changesPreview ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-xl bg-stone-50/50 dark:bg-stone-900/10">
                  <p className="text-xs text-text-secondary text-center max-w-[200px]">
                    No changes loaded yet. Click Check GitHub Changes to preview recent commits.
                  </p>
                </div>
              ) : changesPreview.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-surface-border bg-stone-50/50 dark:bg-stone-900/10">
                  <p className="text-xs text-text-secondary italic">No recent changes found on the selected branch.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changesPreview.map((change) => {
                    const id = change.sha || `#${change.number}`;
                    const isSelected = selectedChangeId === id;
                    return (
                      <div 
                        key={id} 
                        onClick={() => viewDiff(change)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                            : 'border-surface-border bg-surface hover:border-stone-400 dark:hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              change.source === 'commit' 
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {change.source === 'commit' ? 'Commit' : 'PR'}
                            </span>
                            <span className="text-xs font-bold text-primary truncate">
                              {change.title || change.message}
                            </span>
                          </div>
                          <a 
                            href={change.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-text-secondary hover:text-primary transition-colors shrink-0"
                            title="View on GitHub"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                            <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded">{change.shortSha || `#${change.number}`}</span>
                            <span>•</span>
                            <span className="truncate">{change.authorName || 'PR author'}</span>
                            <span>•</span>
                            <span>{new Date(change.authorDate || change.updatedAt || '').toLocaleDateString()}</span>
                          </div>
                          {isSelected && isFetchingDiff && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel (60%) */}
          <div className="w-[60%] border-l border-surface-border pl-6 flex flex-col min-h-0 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {diffPreview ? (
                <motion.div 
                  key="diff-detail"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col h-full space-y-4"
                >
                  {/* Diff Header */}
                  <div className="flex items-center justify-between shrink-0 bg-stone-50 dark:bg-stone-900/10 p-3 rounded-xl border border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Diff Preview</h4>
                        <span className="text-[10px] text-text-secondary font-mono mt-0.5">
                          {diffPreview.source === 'commit' ? `Commit ${diffPreview.shortSha}` : `PR #${diffPreview.number}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-3 text-[11px] font-bold"
                        onClick={() => setDiffPreview(null)}
                      >
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-3 text-[11px] font-bold border border-surface-border"
                        onClick={() => {
                          const change = changesPreview?.find(c => (c.sha || `#${c.number}`) === selectedChangeId);
                          if (change) analyzeChange(change);
                        }}
                        isLoading={!!analyzingId}
                      >
                        Metadata
                      </Button>
                    </div>
                  </div>

                  {/* Compact Stats Row */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-surface-border shadow-sm">
                      <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tight">Files</span>
                      <span className="text-xs font-bold text-primary">{diffPreview.stats.filesChanged}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+{diffPreview.stats.additions}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 shadow-sm">
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">-{diffPreview.stats.deletions}</span>
                    </div>
                    {diffPreview.stats.riskyFiles > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 shadow-sm">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Risky {diffPreview.stats.riskyFiles}</span>
                      </div>
                    )}
                    {diffPreview.stats.truncatedFiles > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-surface-border shadow-sm">
                        <span className="text-[10px] text-text-secondary font-bold uppercase">Truncated {diffPreview.stats.truncatedFiles}</span>
                      </div>
                    )}
                  </div>

                  {/* File List & Patches */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {diffPreview.files.map((file, idx) => (
                      <div key={idx} className={`rounded-xl border overflow-hidden ${file.status === 'ignored' ? 'border-surface-border bg-stone-50 dark:bg-stone-900/5 opacity-60' : 'border-surface-border bg-surface shadow-sm'} flex flex-col`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-900/20 border-b border-surface-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-primary truncate" title={file.filename}>{file.filename}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              file.status === 'ignored' ? 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400' : 
                              file.risky ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}>
                              {file.status === 'ignored' ? (file.ignoredReason || 'Ignored') : file.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600">+{file.additions}</span>
                            <span className="text-[10px] font-bold text-red-600">-{file.deletions}</span>
                          </div>
                        </div>
                        {file.patchPreview && file.status !== 'ignored' && (
                          <div className="p-0 bg-stone-950">
                            <pre className="p-4 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap text-stone-300 custom-scrollbar-horizontal leading-relaxed">
                              {file.patchPreview}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Panel Footer */}
                  <div className="pt-4 border-t border-surface-border shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 text-[10px] text-text-secondary italic">
                      <span>Diffs are previewed and redacted before analysis.</span>
                      <a 
                        href={changesPreview?.find(c => (c.sha || `#${c.number}`) === selectedChangeId)?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 non-italic font-bold"
                      >
                        Open on GitHub <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <Button 
                      onClick={() => analyzeDiff(diffPreview)}
                      className="w-full h-10 flex gap-2 font-bold shadow-md shadow-primary/10"
                    >
                      <Sparkles className="w-4 h-4" /> Analyze This Diff
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="no-selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 px-8"
                >
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-surface-elevated flex items-center justify-center border border-surface-border">
                    <GitBranch className="w-6 h-6 text-stone-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-primary">No Change Selected</p>
                    <p className="text-xs text-text-secondary">
                      Select a commit or pull request from the list to preview changes and analyze them.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Expandable Connection Details - Moved inside the same flex column */}
      <AnimatePresence>
        {detailsOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-stone-50 dark:bg-stone-900/10 border-t border-surface-border -mx-6 mt-4"
          >
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2 rounded bg-white dark:bg-surface border border-surface-border">
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Account</p>
                  <p className="text-xs font-bold text-primary truncate">{integration?.githubAccountLogin || 'N/A'}</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-surface border border-surface-border">
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Permissions</p>
                  <p className="text-xs font-bold text-primary">{integration?.permissionsSummary || 'Read-only'}</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-surface border border-surface-border">
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Default</p>
                  <p className="text-xs font-bold text-primary truncate">{integration?.defaultBranch || 'N/A'}</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-surface border border-surface-border">
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-1">Tracked</p>
                  <p className="text-xs font-bold text-primary truncate">{integration?.selectedBranch || integration?.defaultBranch || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-3 rounded-lg bg-white dark:bg-surface border border-surface-border">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 block">Change Tracked Branch</label>
                  <div className="flex gap-2">
                    {branchesLoading ? (
                      <div className="flex-1 h-9 flex items-center justify-center bg-stone-50 dark:bg-stone-900/5 border border-surface-border rounded-lg">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    ) : branchesError ? (
                      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="w-3 h-3" />
                        <span>Error loading branches</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => refetchBranches()}>Retry</Button>
                      </div>
                    ) : (
                      <>
                        <select
                          value={integration?.selectedBranch || integration?.defaultBranch || ''}
                          onChange={(event) => selectBranchMutation.mutate(event.target.value)}
                          className="flex-1 h-9 rounded-lg border border-surface-border bg-stone-50 dark:bg-stone-900/5 px-3 py-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          disabled={selectBranchMutation.isPending}
                        >
                          {branchesData?.data?.map((branch) => (
                            <option key={branch.name} value={branch.name}>
                              {branch.name} {branch.protected ? '(protected)' : ''}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 px-4 text-xs font-bold border border-surface-border"
                          isLoading={selectBranchMutation.isPending}
                          onClick={() => selectBranchMutation.mutate(integration?.selectedBranch || integration?.defaultBranch || '')}
                        >
                          Update
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="md:w-1/3 p-3 rounded-lg bg-white dark:bg-surface border border-surface-border">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 block">Repository Link</label>
                  <a href={integration?.repoUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline truncate flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Open Repository
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GitHub Connection"
      size="xl"
    >
      <div className="flex flex-col max-h-[85vh] overflow-hidden">
        {errorMessage && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => {
                setErrorMessage(null);
                onClearError?.();
              }}
              className="text-[10px] font-bold hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {statusLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-text-secondary">Fetching GitHub connection status...</p>
          </div>
        ) : statusError ? (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>Unable to fetch GitHub status</span>
            </div>
            <p className="text-xs text-text-secondary">Something went wrong while checking your connection.</p>
            <Button size="sm" onClick={() => refetchStatus()}>Retry</Button>
          </div>
        ) : !isConnected ? (
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-stone-100 dark:bg-surface-elevated rounded-xl border border-surface-border text-sm text-text-secondary leading-relaxed">
              <p className="mb-2">Connect your GitHub account through GitHub's secure authorization page. You choose which repositories Context Vault can access.</p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <GitBranch className="w-4 h-4" />
                <span>Context Vault uses read-only access and does not push code, modify repositories, or update project memory automatically.</span>
              </div>
            </div>
            {renderConnectState()}
          </div>
        ) : hasSelectedRepository ? (
          renderConnectedRepository()
        ) : needsRepositorySelection ? (
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-stone-100 dark:bg-surface-elevated rounded-xl border border-surface-border text-sm text-text-secondary leading-relaxed">
              <p className="mb-2">Connect your GitHub account through GitHub's secure authorization page. You choose which repositories Context Vault can access.</p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <GitBranch className="w-4 h-4" />
                <span>Context Vault uses read-only access and does not push code, modify repositories, or update project memory automatically.</span>
              </div>
            </div>
            {renderRepositorySelection()}
          </div>
        ) : (
          renderConnectState()
        )}
      </div>
    </Modal>
  );
};
