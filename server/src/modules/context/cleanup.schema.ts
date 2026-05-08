import { z } from 'zod';
import { projectContextSchema } from './context.schema';

export const cleanupPreviewSchema = z.object({
  projectId: z.string(),
});

export const cleanupApplySchema = z.object({
  projectId: z.string(),
  cleanedContext: z.any(), // validated by projectContextSchema in service
});

export type CleanupPreviewRequest = z.infer<typeof cleanupPreviewSchema>;
export type CleanupApplyRequest = z.infer<typeof cleanupApplySchema>;
