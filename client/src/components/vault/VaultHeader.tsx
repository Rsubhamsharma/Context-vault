import { ArrowLeft, RefreshCw, Download, Plus, Trash2, Sparkles, GitBranch } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types/project.types';
import type { GitHubIntegrationStatus } from '../../services/github.service';

interface VaultHeaderProps {
  project: Project;
  currentVersion: number | null;
  onRefresh: () => void;
  onExport: () => void;
  onAddUpdate: () => void;
  onImportGitChanges: () => void;
  onConnectGitHub: () => void;
  onDelete: () => void;
  onCleanup: () => void;
  hasContext: boolean;
  githubStatus?: GitHubIntegrationStatus | null;
}

export const VaultHeader = ({
  project,
  currentVersion,
  onRefresh,
  onExport,
  onAddUpdate,
  onImportGitChanges,
  onConnectGitHub,
  onDelete,
  onCleanup,
  hasContext,
  githubStatus,
}: VaultHeaderProps) => {
  const navigate = useNavigate();
  const isGitHubConnected = githubStatus?.connected === true;
  const needsGitHubSetup = isGitHubConnected && githubStatus.needsRepositorySelection === true;
  const githubTooltip = isGitHubConnected
    ? githubStatus.repoFullName
      ? `Connected to ${githubStatus.repoFullName}`
      : 'GitHub connected - choose a repository to finish setup'
    : 'Connect GitHub';

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-surface-border pb-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mt-1 -ml-3 text-text-secondary hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary tracking-tight">{project.name}</h1>
            {currentVersion && (
              <Badge variant="accent" className="bg-folder-tab text-accent border-none px-2 py-0.5 rounded-md">
                v{currentVersion}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="text-base text-text-secondary mt-1.5 max-w-2xl">{project.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onRefresh}
          className="gap-2 bg-white dark:bg-surface-elevated border-surface-border dark:border-accent/10 text-primary dark:text-text-primary shadow-sm hover:bg-stone-50 dark:hover:bg-surface transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
           <Button 
             variant="outline" 
             onClick={onImportGitChanges} 
             className="gap-2 bg-white dark:bg-surface-elevated border-surface-border dark:border-accent/10 text-primary dark:text-text-primary shadow-sm hover:bg-stone-50 dark:hover:bg-surface transition-all"
           >
             <GitBranch className="w-4 h-4" /> Import Git
           </Button>
           <Button 
             variant="outline" 
             onClick={onConnectGitHub} 
             title={githubTooltip}
             className="gap-2 bg-white dark:bg-surface-elevated border-surface-border dark:border-accent/10 text-primary dark:text-text-primary shadow-sm hover:bg-stone-50 dark:hover:bg-surface transition-all"
           >
             <span className="relative inline-flex">
               <GitBranch className="w-4 h-4" />
               {isGitHubConnected && (
                 <span
                   className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-white dark:ring-surface-elevated ${
                     needsGitHubSetup ? 'bg-amber-400' : 'bg-emerald-500'
                   }`}
                 />
               )}
             </span>
             <span>GitHub</span>
             {isGitHubConnected && (
               <span
                 className={`hidden sm:inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none border ${
                   needsGitHubSetup
                     ? 'border-amber-300/60 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                     : 'border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                 }`}
               >
                 {needsGitHubSetup ? 'Setup needed' : 'Connected'}
               </span>
             )}
           </Button>

          {hasContext && (
            <>

            <Button 
              variant="outline" 
              onClick={onCleanup} 
              className="gap-2 bg-white dark:bg-surface-elevated border-surface-border dark:border-accent/10 text-primary dark:text-text-primary shadow-sm hover:bg-stone-50 dark:hover:bg-surface transition-all"
            >
              <Sparkles className="w-4 h-4" /> Clean Up
            </Button>
            <Button 
              variant="outline" 
              onClick={onExport} 
              className="gap-2 bg-white dark:bg-surface-elevated border-surface-border dark:border-accent/10 text-primary dark:text-text-primary shadow-sm hover:bg-stone-50 dark:hover:bg-surface transition-all"
            >
              <Download className="w-4 h-4" /> Export
            </Button>
          </>
        )}
        <Button 
          onClick={onAddUpdate} 
          className="gap-2 bg-indigo-600 text-white border-none hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Add Update
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          onClick={onDelete} 
          className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all"
          title="Delete vault"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
