import { ArrowLeft, RefreshCw, Download, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types/project.types';

interface VaultHeaderProps {
  project: Project;
  currentVersion: number | null;
  onRefresh: () => void;
  onExport: () => void;
  onAddUpdate: () => void;
  onDelete: () => void;
  onCleanup: () => void;
  hasContext: boolean;
}

export const VaultHeader = ({
  project,
  currentVersion,
  onRefresh,
  onExport,
  onAddUpdate,
  onDelete,
  onCleanup,
  hasContext,
}: VaultHeaderProps) => {
  const navigate = useNavigate();

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
