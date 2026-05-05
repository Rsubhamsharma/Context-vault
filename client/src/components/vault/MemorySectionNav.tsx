import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Layers, 
  GitCommit, 
  AlertCircle, 
  Link2, 
  ShieldAlert, 
  FastForward, 
  History 
} from 'lucide-react';

export type SectionType = 
  | 'overview' 
  | 'features' 
  | 'decisions' 
  | 'issues' 
  | 'dependencies' 
  | 'constraints' 
  | 'next_steps' 
  | 'history';

interface NavItem {
  id: SectionType;
  label: string;
  icon: React.ElementType;
  count?: number;
}

interface MemorySectionNavProps {
  activeSection: SectionType;
  onSelect: (section: SectionType) => void;
  counts: Record<SectionType, number>;
}

const items: Omit<NavItem, 'count'>[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'features', label: 'Features', icon: Layers },
  { id: 'decisions', label: 'Decisions', icon: GitCommit },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'dependencies', label: 'Dependencies', icon: Link2 },
  { id: 'constraints', label: 'Constraints', icon: ShieldAlert },
  { id: 'next_steps', label: 'Next Steps', icon: FastForward },
  { id: 'history', label: 'History', icon: History },
];

export const MemorySectionNav = ({ activeSection, onSelect, counts }: MemorySectionNavProps) => {
  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar border-b md:border-b-0 md:border-r border-surface-border dark:border-accent/10 md:pr-4">
      {items.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;
        const count = counts[item.id];

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal text-left",
              isActive 
                ? "text-accent" 
                : "text-text-secondary hover:bg-stone-50 dark:hover:bg-surface-elevated hover:text-primary dark:hover:text-text-primary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeSection"
                className="absolute inset-0 bg-folder-tab dark:bg-surface-elevated border border-transparent dark:border-accent/20 rounded-lg z-0 shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4", isActive ? "text-accent" : "text-stone-400 dark:text-text-secondary/50")} />
                <span>{item.label}</span>
              </div>
              {count > 0 && item.id !== 'overview' && item.id !== 'history' && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  isActive ? "bg-surface/50 dark:bg-surface/20 text-accent" : "bg-stone-50 dark:bg-surface-elevated text-text-secondary"
                )}>
                  {count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
