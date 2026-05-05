import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, AlertCircle, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { contextHistoryService } from '../../services/contextHistory.service';
import { DiffSection } from './DiffSection';

interface VersionCompareViewProps {
  projectId: string;
  versions: { versionNumber: number; createdAt: string }[];
  initialFrom?: number;
  initialTo?: number;
  onClose?: () => void;
}

export const VersionCompareView = ({ 
  projectId, 
  versions, 
  initialFrom, 
  initialTo,
  onClose 
}: VersionCompareViewProps) => {
  const [fromVersion, setFromVersion] = useState<number | undefined>(initialFrom);
  const [toVersion, setToVersion] = useState<number | undefined>(initialTo);
  const [showSelectors, setShowSelectors] = useState(false);

  useEffect(() => {
    if (initialFrom) setFromVersion(initialFrom);
    if (initialTo) setToVersion(initialTo);
  }, [initialFrom, initialTo]);

  const { data: diffResponse, isLoading } = useQuery({
    queryKey: ['diff', projectId, fromVersion, toVersion],
    queryFn: () => contextHistoryService.getDiff(projectId, fromVersion!, toVersion!),
    enabled: !!fromVersion && !!toVersion,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  const diffData = diffResponse?.data?.diff;

  const hasAnyChanges = diffData ? (
    diffData.project_goal?.changed ||
    (diffData.tech_stack?.added?.length || 0) > 0 || (diffData.tech_stack?.removed?.length || 0) > 0 ||
    (diffData.features?.added?.length || 0) > 0 || (diffData.features?.removed?.length || 0) > 0 ||
    (diffData.removed_features?.added?.length || 0) > 0 || (diffData.removed_features?.removed?.length || 0) > 0 ||
    (diffData.decisions?.added?.length || 0) > 0 || (diffData.decisions?.removed?.length || 0) > 0 ||
    (diffData.current_issues?.added?.length || 0) > 0 || (diffData.current_issues?.removed?.length || 0) > 0 ||
    (diffData.resolved_issues?.added?.length || 0) > 0 || (diffData.resolved_issues?.removed?.length || 0) > 0 ||
    (diffData.dependencies?.added?.length || 0) > 0 || (diffData.dependencies?.removed?.length || 0) > 0 ||
    (diffData.important_constraints?.added?.length || 0) > 0 || (diffData.important_constraints?.removed?.length || 0) > 0 ||
    (diffData.next_steps?.added?.length || 0) > 0 || (diffData.next_steps?.removed?.length || 0) > 0
  ) : false;

  return (
    <div className="flex flex-col max-h-[70vh] lg:max-h-[calc(100vh-220px)] bg-stone-50/30 dark:bg-stone-50/5 rounded-3xl border border-surface-border dark:border-accent/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-surface-elevated border-b border-surface-border dark:border-accent/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-stone-100 dark:bg-surface text-stone-600 dark:text-text-secondary">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-primary dark:text-text-primary">Version Comparison</h2>
            {fromVersion && toVersion ? (
              <p className="text-xs text-text-secondary dark:text-text-secondary font-medium">
                Comparing <span className="text-accent">v{fromVersion}</span> with <span className="text-accent">v{toVersion}</span>
              </p>
            ) : (
              <p className="text-xs text-text-secondary dark:text-text-secondary">Select versions to see changes</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSelectors(!showSelectors)}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-surface text-stone-400 dark:text-text-secondary transition-colors"
            title="Manual Selection"
          >
            {showSelectors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 dark:text-text-secondary dark:hover:bg-surface">
              <span className="sr-only">Close</span>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Manual Selection Fallback */}
      <AnimatePresence>
        {showSelectors && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-surface-elevated border-b border-surface-border dark:border-accent/20"
          >
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 dark:text-text-secondary uppercase ml-1">From Version</label>
                <select
                  value={fromVersion}
                  onChange={(e) => setFromVersion(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-surface-border dark:border-surface-border bg-stone-50 dark:bg-surface px-3 text-xs dark:text-text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                >
                  <option value="">Select</option>
                  {versions.map(v => (
                    <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 dark:text-text-secondary uppercase ml-1">To Version</label>
                <select
                  value={toVersion}
                  onChange={(e) => setToVersion(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-surface-border dark:border-accent/20 bg-stone-50 dark:bg-surface px-3 text-xs dark:text-text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                >
                  <option value="">Select</option>
                  {versions.map(v => (
                    <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-secondary dark:text-text-secondary font-medium">Calculating differences...</p>
            </motion.div>
          ) : diffData ? (
            <motion.div 
              key={`${fromVersion}-${toVersion}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-6"
            >
              {diffData.project_goal?.changed && (
                <DiffSection 
                  title="Project Goal" 
                  changed={{ 
                    before: diffData.project_goal.before, 
                    after: diffData.project_goal.after 
                  }} 
                  delay={0.1}
                />
              )}

              <DiffSection 
                title="Tech Stack" 
                added={diffData.tech_stack?.added} 
                removed={diffData.tech_stack?.removed} 
                delay={0.15}
              />

              <DiffSection 
                title="Features" 
                added={diffData.features?.added} 
                removed={diffData.features?.removed} 
                delay={0.2}
              />

              <DiffSection 
                title="Deprecated Features" 
                added={diffData.removed_features?.added} 
                removed={diffData.removed_features?.removed} 
                delay={0.25}
              />

              <DiffSection 
                title="Decisions" 
                added={diffData.decisions?.added} 
                removed={diffData.decisions?.removed} 
                delay={0.3}
              />

              <DiffSection 
                title="Active Issues" 
                added={diffData.current_issues?.added} 
                removed={diffData.current_issues?.removed} 
                delay={0.35}
              />

              <DiffSection 
                title="Resolved Issues" 
                resolved={diffData.resolved_issues?.added} 
                delay={0.4}
              />

              <DiffSection 
                title="Dependencies" 
                added={diffData.dependencies?.added} 
                removed={diffData.dependencies?.removed} 
                delay={0.45}
              />

              <DiffSection 
                title="Constraints" 
                added={diffData.important_constraints?.added} 
                removed={diffData.important_constraints?.removed} 
                delay={0.5}
              />

              <DiffSection 
                title="Next Steps" 
                added={diffData.next_steps?.added} 
                removed={diffData.next_steps?.removed} 
                delay={0.55}
              />

              {!hasAnyChanges && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center bg-surface-elevated rounded-3xl border border-dashed border-surface-border dark:border-surface-border"
                >
                  <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-surface-elevated flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-stone-300 dark:text-text-secondary/50" />
                  </div>
                  <h3 className="text-lg font-bold text-primary dark:text-text-primary mb-2">No differences found</h3>
                  <p className="text-sm text-text-secondary dark:text-text-secondary max-w-xs mx-auto">
                    The context between v{fromVersion} and v{toVersion} is identical. No changes were extracted during this update.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-surface-elevated flex items-center justify-center mb-6">
                <History className="w-8 h-8 text-stone-300 dark:text-text-secondary/50" />
              </div>
              <h3 className="text-lg font-bold text-primary dark:text-text-primary mb-2">Select versions to compare</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary max-w-xs mx-auto mb-8">
                Use the timeline actions or the manual selectors above to start comparing history snapshots.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowSelectors(true)}
                className="gap-2 dark:border-surface-border dark:text-text-secondary dark:hover:bg-surface-elevated"
              >
                <GitCompare className="w-4 h-4" />
                Select Versions
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

