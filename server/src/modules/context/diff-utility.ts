import { ProjectContext } from './context.types';

export interface ArrayDiff {
  added: string[];
  removed: string[];
}

export interface GoalDiff {
  before: string;
  after: string;
  changed: boolean;
}

export interface ProjectContextDiff {
  features: ArrayDiff;
  removed_features: ArrayDiff;
  decisions: ArrayDiff;
  current_issues: ArrayDiff;
  resolved_issues: ArrayDiff;
  dependencies: ArrayDiff;
  important_constraints: ArrayDiff;
  next_steps: ArrayDiff;
  project_goal: GoalDiff;
  tech_stack: ArrayDiff;
}

export function computeContextDiff(from: ProjectContext, to: ProjectContext): ProjectContextDiff {
  const diffArray = (fromArr: string[] = [], toArr: string[] = []): ArrayDiff => {
    const added = toArr.filter(item => !fromArr.includes(item));
    const removed = fromArr.filter(item => !toArr.includes(item));
    return { added, removed };
  };

  return {
    features: diffArray(from.features, to.features),
    removed_features: diffArray(from.removed_features, to.removed_features),
    decisions: diffArray(from.decisions, to.decisions),
    current_issues: diffArray(from.current_issues, to.current_issues),
    resolved_issues: diffArray(from.resolved_issues, to.resolved_issues),
    dependencies: diffArray(from.dependencies, to.dependencies),
    important_constraints: diffArray(from.important_constraints, to.important_constraints),
    next_steps: diffArray(from.next_steps, to.next_steps),
    tech_stack: diffArray(from.tech_stack, to.tech_stack),
    project_goal: {
      before: from.project_goal,
      after: to.project_goal,
      changed: from.project_goal !== to.project_goal,
    },
  };
}
