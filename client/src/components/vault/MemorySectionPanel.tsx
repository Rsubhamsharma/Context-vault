import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MemorySectionPanelProps {
  title: string;
  children: ReactNode;
  isEmpty?: boolean;
}

export const MemorySectionPanel = ({ title, children, isEmpty }: MemorySectionPanelProps) => {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col h-full min-h-[400px] pt-[32px]" // space for tab
    >
      {/* Folder Tab */}
      <div className="absolute top-0 left-0 h-[32px] px-6 bg-surface border-t border-l border-r border-surface-border dark:border-accent/20 rounded-t-xl z-10 flex items-center shadow-sm before:content-[''] before:absolute before:bottom-0 before:-right-4 before:w-4 before:h-full before:bg-surface before:[clip-path:polygon(0_0,0_100%,100%_100%)] before:z-10 after:content-[''] after:absolute after:bottom-0 after:-right-[17px] after:w-[17px] after:h-full after:border-b after:border-surface-border dark:after:border-accent/20 after:z-0">
        <h2 className="text-sm font-semibold text-primary dark:text-accent uppercase tracking-wider">{title}</h2>
      </div>

      {/* Main Folder Body */}
      <div className="relative bg-surface rounded-xl rounded-tl-none border border-surface-border dark:border-accent/20 shadow-sm flex-1 flex flex-col z-20 overflow-hidden">
        {/* Subtle inner line to simulate folder fold */}
        <div className="absolute top-0 left-0 right-0 h-px bg-surface/50" />
        
        <div className="p-8 flex-1 flex flex-col">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
              <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-surface-elevated flex items-center justify-center mb-4 border border-surface-border/50 dark:border-surface-border">
                <span className="text-stone-400 dark:text-text-secondary text-xl font-serif italic">i</span>
              </div>
              <h3 className="text-lg font-medium text-primary dark:text-text-primary mb-1">No items saved yet</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary">This folder is empty.</p>
            </div>
          ) : (

            <div className="space-y-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Sub-components for specific lists

export const FolderList = ({ items, bulletColor = 'bg-stone-200' }: { items: string[], bulletColor?: string }) => {
  if (!items || items.length === 0) return <p className="text-sm text-text-secondary italic">None specified</p>;
  
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${bulletColor}`} />
          <span className="text-primary leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

export const SectionBlock = ({ title, children }: { title: string, children: ReactNode }) => (
  <div>
    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">{title}</h3>
    {children}
  </div>
);
