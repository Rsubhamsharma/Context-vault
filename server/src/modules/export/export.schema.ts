import { z } from 'zod';

export const exportRequestSchema = z.object({
  target: z.enum(['chatgpt', 'claude', 'cursor', 'windsurf', 'generic_markdown', 'json']),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
