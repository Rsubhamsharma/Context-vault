import { z } from 'zod';

export const smartExportSchema = z.object({
  normalizedTask: z.string(),
  taskCategory: z.enum([
    'frontend_ui', 
    'backend_api', 
    'ai_pipeline', 
    'export_system', 
    'auth_security', 
    'database', 
    'git_integration', 
    'onboarding', 
    'bug_fix', 
    'planning', 
    'general_continuation', 
    'versioning',
    'unclear'
  ]),
  taskIntent: z.string(),
  project_goal: z.string(),
  relevant_product_context: z.array(z.string()),
  relevant_tech_stack: z.array(z.string()),
  relevant_existing_features: z.array(z.string()),
  relevant_decisions: z.array(z.string()),
  relevant_current_issues: z.array(z.string()),
  relevant_resolved_issues: z.array(z.string()),
  relevant_constraints: z.array(z.string()),
  do_not_change: z.array(z.string()),
  continuation_instructions: z.array(z.string()),
  excluded_summary: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});

export type SmartExportAIOutput = z.infer<typeof smartExportSchema>;
