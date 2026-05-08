import { z } from 'zod';

export const exportRequestSchema = z.object({
  target: z.enum(['chatgpt', 'claude', 'cursor', 'windsurf', 'generic_markdown', 'json']),
  mode: z.enum(['full', 'compact', 'smart']).optional().default('full'),
  task: z.string().max(1000).optional(),
}).refine((data) => {
  if (data.mode === 'smart' && (!data.task || data.task.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Task is required for smart export mode',
  path: ['task'],
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
