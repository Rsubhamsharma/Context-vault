import { GitCompare } from 'lucide-react';
import { DiffSection } from './DiffSection';
import type { ProjectContext } from '../../types/context.types';

interface CleanupPreviewViewProps {
  before: ProjectContext;
  after: ProjectContext;
}

export const CleanupPreviewView = ({ before, after }: CleanupPreviewViewProps) => {
  const getArrayDiff = (beforeArr: string[] | undefined, afterArr: string[] | undefined) => {
    const b = beforeArr || [];
    const a = afterArr || [];
    return {
      added: a.filter(item => !b.includes(item)),
      removed: b.filter(item => !a.includes(item)),
    };
  };

  const diffs = {
    project_goal: before.project_goal !== after.project_goal ? {
      before: before.project_goal || '',
      after: after.project_goal || '',
    } : null,
    tech_stack: getArrayDiff(before.tech_stack, after.tech_stack),
    features: getArrayDiff(before.features, after.features),
    removed_features: getArrayDiff(before.removed_features, after.removed_features),
    decisions: getArrayDiff(before.decisions, after.decisions),
    current_issues: getArrayDiff(before.current_issues, after.current_issues),
    resolved_issues: getArrayDiff(before.resolved_issues, after.resolved_issues),
    dependencies: getArrayDiff(before.dependencies, after.dependencies),
    important_constraints: getArrayDiff(before.important_constraints, after.important_constraints),
    next_steps: getArrayDiff(before.next_steps, after.next_steps),
  };

  return (
    <div className="flex flex-col max-h-[450px] bg-stone-50/30 dark:bg-stone-50/5 rounded-3xl border border-surface-border dark:border-accent/20 overflow-hidden">
      <div className="px-6 py-4 bg-surface-elevated border-b border-surface-border dark:border-accent/20 flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-xl bg-stone-100 dark:bg-surface text-stone-600 dark:text-text-secondary">
          <GitCompare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-primary dark:text-text-primary">Cleanup Preview</h2>
          <p className="text-xs text-text-secondary dark:text-text-secondary font-medium">
            Review how the latest context will be organized before applying cleanup.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-6 pb-6">
          {diffs.project_goal && (
            <DiffSection 
              title="Project Goal" 
              changed={diffs.project_goal} 
              delay={0.1}
            />
          )}
          <DiffSection 
            title="Tech Stack" 
            added={diffs.tech_stack.added} 
            removed={diffs.tech_stack.removed} 
            delay={0.15}
          />
          <DiffSection 
            title="Features" 
            added={diffs.features.added} 
            removed={diffs.features.removed} 
            delay={0.2}
          />
          <DiffSection 
            title="Deprecated Features" 
            added={diffs.removed_features.added} 
            removed={diffs.removed_features.removed} 
            delay={0.25}
          />
          <DiffSection 
            title="Decisions" 
            added={diffs.decisions.added} 
            removed={diffs.decisions.removed} 
            delay={0.3}
          />
          <DiffSection 
            title="Active Issues" 
            added={diffs.current_issues.added} 
            removed={diffs.current_issues.removed} 
            delay={0.35}
          />
          <DiffSection 
            title="Resolved Issues" 
            resolved={diffs.resolved_issues.added} 
            delay={0.4}
          />
          <DiffSection 
            title="Dependencies" 
            added={diffs.dependencies.added} 
            removed={diffs.dependencies.removed} 
            delay={0.45}
          />
          <DiffSection 
            title="Constraints" 
            added={diffs.important_constraints.added} 
            removed={diffs.important_constraints.removed} 
            delay={0.5}
          />
          <DiffSection 
            title="Next Steps" 
            added={diffs.next_steps.added} 
            removed={diffs.next_steps.removed} 
            delay={0.55}
          />
        </div>
      </div>
    </div>
  );
};
