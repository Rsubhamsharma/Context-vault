import { ContextUpdate } from '../context/context.types';

const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  return [String(val).trim()];
};

const ensureString = (val: any): string => {
  if (!val) return '';
  return String(val).trim();
};

export function normalizeAIResponse(raw: any): ContextUpdate {
  return {
    features_added: ensureArray(
      raw.features_added || raw.features || raw.active_features
    ),
    features_removed: ensureArray(
      raw.features_removed || raw.removed_features
    ),
    decisions_made: ensureArray(
      raw.decisions_made || raw.decisions
    ),
    issues_found: ensureArray(
      raw.issues_found || raw.current_issues || raw.issues
    ),
    issues_resolved: ensureArray(
      raw.issues_resolved || raw.resolved_issues
    ),
    dependencies_added: ensureArray(
      raw.dependencies_added || raw.dependencies
    ),
    constraints_added: ensureArray(
      raw.constraints_added || raw.important_constraints || raw.constraints
    ),
    next_steps: ensureArray(raw.next_steps),
    project_goal: ensureString(
      raw.project_goal || raw.goal || raw.objective || raw.purpose
    ),
    tech_stack: ensureArray(
      raw.tech_stack || raw.stack || raw.technologies || raw.tech
    ),
  };
}
