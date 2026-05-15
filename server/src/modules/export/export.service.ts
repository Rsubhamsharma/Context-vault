import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error.middleware';
import { projectContextSchema } from '../context/context.schema';
import { exportFormatter } from './export.formatter';
import { ExportRequest } from './export.schema';
import { estimateTokens, calculateSavings } from '../../utils/tokenEstimate';
import { aiService } from '../ai/ai.service';

export class ExportService {
  async exportContext(projectId: string, userId: string, request: ExportRequest) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    if (project.userId !== userId) {
      throw new AppError(403, 'You do not own this project');
    }

    const snapshot = await prisma.contextSnapshot.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    if (!snapshot) {
      throw new AppError(404, 'No context snapshot found for this project');
    }

    const validation = projectContextSchema.safeParse(snapshot.contextJson);
    if (!validation.success) {
      throw new AppError(500, 'Context snapshot data is invalid');
    }

    const mode = request.mode || 'full';
    let content: string | undefined;
    let relevanceMode: 'ai' | 'fallback' | 'none' = 'none';
    let aiMetadata: any = null;
    let cacheStatus: 'hit' | 'miss' | 'regenerated' | 'none' = 'none';

    if (mode === 'smart') {
      const normalizedTask = (request.task || '').trim().toLowerCase();
      const versionNumber = snapshot.versionNumber;

      if (!request.forceRegenerate) {
        try {
          const cached = await prisma.smartExportCache.findUnique({
            where: {
              projectId_versionNumber_normalizedTask_targetPlatform: {
                projectId,
                versionNumber,
                normalizedTask,
                targetPlatform: request.target,
              },
            },
          });

          if (cached) {
            content = cached.exportText;
            relevanceMode = cached.relevanceMode as any;
            aiMetadata = cached.aiMetadata;
            cacheStatus = 'hit';
          }
        } catch (error) {
          console.error('SmartExportCache lookup failed:', error);
          // Fall through to AI generation on cache lookup failure
        }
      }

      if (!content) {
        try {
          aiMetadata = await aiService.getSmartExportContext(request.task!, snapshot.contextJson);
          content = exportFormatter.format(project.name, aiMetadata, request.target, 'smart');
          relevanceMode = 'ai';
          cacheStatus = request.forceRegenerate ? 'regenerated' : 'miss';
        } catch (error) {
          // Fallback for Smart Export if AI fails
          const fallbackAiOutput = {
            normalizedTask: request.task || 'Continue development',
            taskCategory: 'general_continuation' as const,
            taskIntent: 'General continuation based on task.',
            project_goal: validation.data.project_goal,
            relevant_product_context: [],
            relevant_tech_stack: getEffectiveTechStack(validation.data),
            relevant_existing_features: compressionHelper(validation.data.features || []),
            relevant_decisions: validation.data.decisions?.slice(0, 5) || [],
            relevant_current_issues: validation.data.current_issues || [],
            relevant_resolved_issues: [],
            relevant_constraints: [
              'Do not rebuild from scratch',
              'Do not remove existing working features',
              'Respect current stack',
              'Treat ProjectContext as source of truth',
            ],
            do_not_change: [],
            continuation_instructions: ['Focus on the current task while preserving project state.'],
            excluded_summary: ['AI relevance extraction failed, providing broader context.'],
            confidence: 'low' as const,
          };
          content = exportFormatter.format(project.name, fallbackAiOutput, request.target, 'smart');
          relevanceMode = 'fallback';
          cacheStatus = request.forceRegenerate ? 'regenerated' : 'miss';
          aiMetadata = fallbackAiOutput;
        }

        // Save to cache - wrapped in try-catch to ensure result is returned even if caching fails
        try {
          await prisma.smartExportCache.upsert({
            where: {
              projectId_versionNumber_normalizedTask_targetPlatform: {
                projectId,
                versionNumber,
                normalizedTask,
                targetPlatform: request.target,
              },
            },
            update: {
              exportText: content,
              characterCount: content.length,
              estimatedTokens: estimateTokens(content),
              fullEstimatedTokens: estimateTokens(exportFormatter.format(project.name, validation.data, request.target, 'full')),
              estimatedSavingsPercent: calculateSavings(
                estimateTokens(exportFormatter.format(project.name, validation.data, request.target, 'full')),
                estimateTokens(content)
              ),
              relevanceMode,
              aiMetadata,
              originalTask: request.task || '',
            },
            create: {
              projectId,
              versionNumber,
              normalizedTask,
              originalTask: request.task || '',
              targetPlatform: request.target,
              exportText: content,
              characterCount: content.length,
              estimatedTokens: estimateTokens(content),
              fullEstimatedTokens: estimateTokens(exportFormatter.format(project.name, validation.data, request.target, 'full')),
              estimatedSavingsPercent: calculateSavings(
                estimateTokens(exportFormatter.format(project.name, validation.data, request.target, 'full')),
                estimateTokens(content)
              ),
              relevanceMode,
              aiMetadata,
            },
          });
        } catch (cacheError) {
          console.error('SmartExportCache save failed:', cacheError);
        }
      }
    } else {
      content = exportFormatter.format(project.name, validation.data, request.target, mode);
    }
    
    if (!content) {
      throw new AppError(500, 'Failed to generate export content');
    }
    
    const fullContent = exportFormatter.format(project.name, validation.data, request.target, 'full');
    const compactContent = exportFormatter.format(project.name, validation.data, request.target, 'compact');
    
    const fullTokens = estimateTokens(fullContent);
    const compactTokens = estimateTokens(compactContent);
    const currentTokens = estimateTokens(content);
    const characterCount = content.length;

    await prisma.export.create({
      data: {
        projectId,
        target: request.target,
        content,
      },
    });

    return {
      target: request.target,
      mode,
      content,
      estimatedTokens: currentTokens,
      characterCount,
      fullEstimatedTokens: fullTokens,
      compactEstimatedTokens: compactTokens,
      estimatedSavingsPercent: mode !== 'full' ? calculateSavings(fullTokens, currentTokens) : null,
      relevanceMode,
      aiMetadata: aiMetadata?.confidence === 'low' ? { confidence: 'low' } : null,
      cacheStatus,
    };
  }
}

// Local helper to avoid circular dependency if needed, or use the one from formatter if exported
function getEffectiveTechStack(context: any): string[] {
  if (context.tech_stack && context.tech_stack && context.tech_stack.length > 0 && context.tech_stack[0] !== 'None specified') {
    return context.tech_stack;
  }
  return context.dependencies || ['None specified'];
}

function compressionHelper(features: string[]): string[] {
  return features.slice(0, 10);
}

export const exportService = new ExportService();

