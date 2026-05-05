import { z } from 'zod';

export const projectContextSchema = z.object({
  project_goal: z.string(),
  tech_stack: z.array(z.string()),
  features: z.array(z.string()),
  removed_features: z.array(z.string()),
  decisions: z.array(z.string()),
  current_issues: z.array(z.string()),
  resolved_issues: z.array(z.string()),
  dependencies: z.array(z.string()),
  important_constraints: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export const contextUpdateSchema = z.object({
  features_added: z.array(z.string()).default([]),
  features_removed: z.array(z.string()).default([]),
  decisions_made: z.array(z.string()).default([]),
  issues_found: z.array(z.string()).default([]),
  issues_resolved: z.array(z.string()).default([]),
  dependencies_added: z.array(z.string()).default([]),
  constraints_added: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  project_goal: z.string().optional().default(''),
  tech_stack: z.array(z.string()).optional().default([]),
});

export const createSnapshotSchema = z.object({
  projectId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  contextJson: projectContextSchema,
});

export const createUpdateSchema = z.object({
  projectId: z.string().uuid(),
  rawInput: z.string().min(10, 'Raw input must be at least 10 characters long'),
});

export const restoreVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
});
