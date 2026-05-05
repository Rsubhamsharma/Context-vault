import { motion } from 'framer-motion';
import { Folder, Clock, Trash2 } from 'lucide-react';
import type { Project } from '../../types/project.types';

interface FolderCardProps {
  project: Project;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const FolderCard = ({ project, onClick, onDelete }: FolderCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      className="group relative cursor-pointer pt-[22px]" // Space for tab
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Folder Tab */}
      <div className="absolute top-0 left-0 w-[80px] h-[22px] bg-folder-tab dark:bg-surface-elevated group-hover:bg-folder-tab-hover dark:group-hover:bg-surface border-t border-l border-r border-surface-border dark:border-accent/20 rounded-t-lg transition-colors duration-200 z-10 before:content-[''] before:absolute before:bottom-0 before:-right-3 before:w-3 before:h-full before:bg-folder-tab dark:before:bg-surface-elevated before:group-hover:bg-folder-tab-hover dark:before:group-hover:bg-surface before:[clip-path:polygon(0_0,0_100%,100%_100%)] before:transition-colors before:duration-200 after:content-[''] after:absolute after:bottom-0 after:-right-[68px] after:w-[68px] after:h-full after:border-b after:border-surface-border dark:after:border-accent/20 after:z-0" />

      {/* Folder Body */}
      <div className="relative bg-surface rounded-xl rounded-tl-none border border-surface-border dark:border-accent/20 shadow-sm group-hover:shadow-md transition-shadow duration-200 z-20 flex flex-col h-full p-5">
        
        {/* Subtle inner line to simulate folder fold */}
        <div className="absolute top-0 left-0 right-0 h-px bg-surface/50" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-50 dark:bg-surface-elevated rounded-lg text-accent border border-transparent dark:border-accent/10">
              <Folder className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <button 
              onClick={onDelete}
              className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
              title="Delete vault"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-1">
          {project.name}
        </h3>
        
        <p className="text-sm text-text-secondary line-clamp-2 flex-grow mb-6">
          {project.description || 'No description provided.'}
        </p>
        
        <div className="mt-auto pt-4 border-t border-surface-border/60 dark:border-accent/10 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Open vault</span>
          <span className="text-accent group-hover:translate-x-1 transition-transform duration-200">
            →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
