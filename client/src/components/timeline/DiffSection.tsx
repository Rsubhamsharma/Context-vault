import { motion } from 'framer-motion';
import { Plus, Minus, Check, ArrowRight } from 'lucide-react';

interface DiffSectionProps {
  title: string;
  added?: string[];
  removed?: string[];
  changed?: {
    before: string;
    after: string;
  };
  resolved?: string[];
  delay?: number;
}

export const DiffSection = ({ 
  title, 
  added = [], 
  removed = [], 
  changed, 
  resolved = [],
  delay = 0 
}: DiffSectionProps) => {
  const hasChanges = added.length > 0 || removed.length > 0 || changed || resolved.length > 0;

  if (!hasChanges) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-surface rounded-2xl border border-surface-border dark:border-accent/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="px-4 py-3 bg-stone-50/50 dark:bg-surface-elevated/50 border-b border-surface-border dark:border-accent/10">
        <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Changed Fields (Specific for things like Project Goal) */}
        {changed && (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-surface-elevated border border-stone-100 dark:border-surface-border">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-stone-400 dark:text-text-secondary uppercase">
                <span>Before</span>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary line-through decoration-stone-300 dark:decoration-surface-border decoration-1">
                {changed.before}
              </p>
            </div>
            <div className="flex justify-center -my-1 relative z-10">
              <div className="bg-white dark:bg-surface p-1 rounded-full border border-surface-border dark:border-surface-border shadow-sm">
                <ArrowRight className="w-3 h-3 text-amber-500" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/30 dark:bg-accent/10 border border-amber-100/50 dark:border-accent/20">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-amber-600 dark:text-accent uppercase">
                <span>After</span>
              </div>
              <p className="text-sm text-primary dark:text-text-primary font-medium">
                {changed.after}
              </p>
            </div>
          </div>
        )}

        {/* Removed Items */}
        {removed.length > 0 && (
          <div className="space-y-2">
            {removed.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (i * 0.05) }}
                className="flex items-start gap-3 p-2 rounded-lg bg-red-50/30 dark:bg-red-500/5 border border-red-100/50 dark:border-red-500/10 group"
              >
                <div className="mt-0.5 p-1 rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/70 transition-colors">
                  <Minus className="w-3 h-3" />
                </div>
                <span className="text-sm text-text-secondary dark:text-text-secondary leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Added Items */}
        {added.length > 0 && (
          <div className="space-y-2">
            {added.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (i * 0.05) }}
                className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 group"
              >
                <div className="mt-0.5 p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/70 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-sm text-primary dark:text-text-primary font-medium leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Resolved Issues */}
        {resolved.length > 0 && (
          <div className="space-y-2">
            {resolved.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + (i * 0.05) }}
                className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 group"
              >
                <div className="mt-0.5 p-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm text-text-secondary dark:text-text-secondary italic leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

