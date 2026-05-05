import { cn } from '../../lib/utils';
import { GitCompare, ArrowUpRight } from 'lucide-react';

interface TimelineItemProps {
  version: number;
  date: string;
  summary: string[];
  isActive: boolean;
  isLatest: boolean;
  onClick: () => void;
  onCompare?: () => void;
  onRestore?: () => void;
}

export const TimelineItem = ({ 
  version, 
  date, 
  summary, 
  isActive, 
  isLatest,
  onClick, 
  onCompare,
  onRestore
}: TimelineItemProps) => {
  return (
    <div 
      className={cn(
        'relative pl-10 pb-8 group overflow-visible',
        isActive ? 'z-10' : 'z-0'
      )}
    >
      {/* Vertical Line */}
      <div className="absolute left-3 top-2 bottom-0 w-px bg-surface-border dark:bg-surface-border group-last:hidden" />
      
      {/* Node */}
      <div className={cn(
        'absolute rounded-full border-2 transition-all duration-300 z-10',
        isActive 
          ? 'w-5 h-5 left-[3px] top-1.5 bg-accent border-accent shadow-[0_0_0_4px_rgba(214,168,90,0.15)] dark:shadow-[0_0_0_4px_rgba(214,168,90,0.1)]' 
          : 'w-3 h-3 left-[7px] top-2.5 bg-surface dark:bg-surface-elevated border-surface-border dark:border-surface-border group-hover:border-accent'
      )} />

      <div className={cn(
        'p-4 rounded-2xl border transition-all duration-300 relative',
        isActive 
          ? 'bg-white dark:bg-surface border-accent dark:border-accent shadow-md scale-[1.01]' 
          : 'bg-transparent border-transparent hover:bg-stone-100/50 dark:hover:bg-surface-elevated/50 hover:border-surface-border dark:hover:border-accent/20'
      )}>
        <div className="flex items-start justify-between mb-2">
          <div className="cursor-pointer flex-1" onClick={onClick}>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-sm font-bold',
                isActive ? 'text-text-primary dark:text-text-primary' : 'text-text-secondary dark:text-text-secondary'
              )}>
                Version {version}
              </span>
              {isLatest && (
                <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-surface-elevated text-[10px] font-bold text-stone-500 dark:text-text-secondary uppercase tracking-tight">
                  Latest
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 dark:text-text-secondary/60 font-medium uppercase tracking-wider">
              {new Date(date).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {!isLatest && (
            <div className="flex items-center gap-2">
              {onCompare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompare();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-text-secondary dark:text-text-secondary hover:text-accent dark:hover:text-accent hover:bg-accent/5 dark:hover:bg-accent/10 border border-transparent hover:border-accent/10 transition-all duration-200"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare
                </button>
              )}
              {onRestore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-text-secondary dark:text-text-secondary hover:text-accent dark:hover:text-accent hover:bg-accent/5 dark:hover:bg-accent/10 border border-transparent hover:border-accent/10 transition-all duration-200"
                >
                  Restore
                </button>
              )}
            </div>
          )}
          
          {isLatest && (
            <div className="p-1.5 rounded-lg text-stone-300 dark:text-surface-border">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        
        {summary.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {summary.slice(0, 4).map((line, i) => (
              <li key={i} className="text-xs text-text-secondary dark:text-text-secondary leading-relaxed flex gap-2 items-start">
                <span className="text-accent mt-1 shrink-0 opacity-40">•</span> 
                <span className="line-clamp-1 group-hover:line-clamp-none transition-all">{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


