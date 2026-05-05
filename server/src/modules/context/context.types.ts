export interface ProjectContext {
  project_goal: string;
  tech_stack: string[];
  features: string[];
  removed_features: string[];
  decisions: string[];
  current_issues: string[];
  resolved_issues: string[];
  dependencies: string[];
  important_constraints: string[];
  next_steps: string[];
}

export type ContextUpdate = {
  features_added: string[];
  features_removed: string[];
  decisions_made: string[];
  issues_found: string[];
  issues_resolved: string[];
  dependencies_added: string[];
  constraints_added: string[];
  next_steps: string[];
  project_goal?: string;
  tech_stack?: string[];
};
