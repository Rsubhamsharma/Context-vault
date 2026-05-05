import type { Project } from './project.types';

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

export interface ContextSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  contextJson: ProjectContext;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ContextUpdateRequest {
  rawInput: string;
}

export interface ContextUpdateResponseData {
  extractedUpdate: {
    features_added: string[];
    features_removed: string[];
    decisions_made: string[];
    issues_found: string[];
    issues_resolved: string[];
    dependencies_added: string[];
    constraints_added: string[];
    next_steps: string[];
  };
  snapshot: ContextSnapshot;
}

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

export type ProjectDetailData = {
  project: Project;
  snapshot: ContextSnapshot | null;
};
