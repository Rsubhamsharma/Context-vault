import { ProjectContext, ContextUpdate } from './context.types';
 
const unique = <T>(items: T[]): T[] => [...new Set(items)];
 
export function mergeContext(
  context: ProjectContext,
  update: ContextUpdate
): ProjectContext {
  const isMilestone = (text: string) => {
    const milestonePatterns = [
      /^version\s+\d+(\.\d+)*\s*[-–:]/i,
      /^v\d+(\.\d+)*\s*[-–:]/i,
      /^completed\s+version/i,
      /^release\s+\d+/i,
      /^milestone\s+\d+/i
    ];
    return milestonePatterns.some(pattern => pattern.test(text));
  };

  return {
    project_goal: (update.project_goal && update.project_goal.trim().length > 0 && !isMilestone(update.project_goal)) 
      ? update.project_goal 
      : context.project_goal,
    tech_stack: unique([
      ...context.tech_stack,
      ...(update.tech_stack || []),
    ]),
    features: unique(
      [...context.features, ...update.features_added].filter(
        (f) => !update.features_removed.includes(f)
      )
    ),
    removed_features: unique([...context.removed_features, ...update.features_removed]),
    decisions: unique([...context.decisions, ...update.decisions_made]),
    current_issues: unique(
      [...context.current_issues, ...update.issues_found].filter(
        (i) => !update.issues_resolved.includes(i)
      )
    ),
    resolved_issues: unique([...context.resolved_issues, ...update.issues_resolved]),
    dependencies: unique([...context.dependencies, ...update.dependencies_added]),
    important_constraints: unique([
      ...context.important_constraints,
      ...update.constraints_added,
    ]),
    next_steps: update.next_steps.length > 0 ? update.next_steps : context.next_steps,
  };
}
