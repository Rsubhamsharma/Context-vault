import { prisma } from '../../config/db';
import { z } from 'zod';
import { 
  createSnapshotSchema, 
  createUpdateSchema, 
  projectContextSchema, 
  contextUpdateSchema,
  restoreVersionSchema
} from './context.schema';
import { AppError } from '../../middleware/error.middleware';
import { mergeContext } from './context-merger';
import { ProjectContext, ContextUpdate } from './context.types';
import { aiService } from '../ai/ai.service';

export class ContextService {
  async createSnapshot(userId: string, data: z.infer<typeof createSnapshotSchema>) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    return prisma.contextSnapshot.create({ 
      data: {
        projectId: data.projectId,
        versionNumber: data.versionNumber,
        contextJson: data.contextJson as any
      }
    });
  }
  
  async createUpdate(userId: string, data: z.infer<typeof createUpdateSchema>) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    // This is where AI extraction logic would go (e.g. calling aiService.extractContext)
    return prisma.contextUpdate.create({
      data: {
        projectId: data.projectId,
        rawInput: data.rawInput,
        extractedUpdateJson: {} as any, // Placeholder
      },
    });
  }
  
  async applyUpdate(userId: string, projectId: string, update: ContextUpdate, tx?: any) {
    const prismaClient = tx || prisma;
    const project = await prismaClient.project.findFirst({
      where: { id: projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    const latestSnapshot = await prismaClient.contextSnapshot.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
  
    const baseContext: ProjectContext = latestSnapshot 
      ? (projectContextSchema.parse(latestSnapshot.contextJson) as ProjectContext)
      : {
          project_goal: '',
          tech_stack: [],
          features: [],
          removed_features: [],
          decisions: [],
          current_issues: [],
          resolved_issues: [],
          dependencies: [],
          important_constraints: [],
          next_steps: [],
        };
  
    const validatedUpdate = contextUpdateSchema.parse(update) as ContextUpdate;
    const updatedContext = mergeContext(baseContext, validatedUpdate);
  
    return prismaClient.contextSnapshot.create({
      data: {
        projectId,
        versionNumber: latestSnapshot ? latestSnapshot.versionNumber + 1 : 1,
        contextJson: updatedContext as any,
      },
    });
  }
  
  async getSnapshotByVersion(userId: string, projectId: string, versionNumber: number) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
 
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    return prisma.contextSnapshot.findFirst({
      where: { projectId, versionNumber },
    });
  }
  
  async getLatestSnapshot(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    return prisma.contextSnapshot.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
  }
  
  async getContextHistory(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    const snapshots = await prisma.contextSnapshot.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
  
    // For each snapshot, try to find the corresponding update
    // Since the system creates a snapshot immediately after an update,
    // we can look for the update created around the same time or
    // simply match based on some logic.
    // In a real system, we might store the updateId in the snapshot.
    // For now, let's match by closest createdAt before snapshot.
    
    const history = await Promise.all(snapshots.map(async (snapshot: any) => {
      const update = await prisma.contextUpdate.findFirst({
        where: { 
          projectId,
          createdAt: { lte: snapshot.createdAt }
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return {
        versionNumber: snapshot.versionNumber,
        createdAt: snapshot.createdAt,
        contextJson: snapshot.contextJson,
        update: update ? { extractedUpdateJson: update.extractedUpdateJson } : null,
      };
    }));
  
    return history;
  }
  
  async processRawUpdate(userId: string, projectId: string, rawInput: string, skipAI: boolean = false, manualGoal?: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    let extractedUpdate: ContextUpdate;

    if (skipAI) {
      // Manual fallback: minimal structure preserving raw input
      extractedUpdate = {
        project_goal: project.description?.trim() 
          ? project.description 
          : `Manual context vault for ${project.name}.`,
        tech_stack: [],
        features_added: ['Manual initialization: raw context saved'],
        features_removed: [],
        decisions_made: [],
        issues_found: [],
        issues_resolved: [],
        dependencies_added: [],
        constraints_added: [],
        next_steps: ['Review and structure context using AI when available'],
      };
    } else {
      // 1. Extract structured update using AI (includes validation)
      extractedUpdate = await aiService.extractContext(rawInput);
    }
  
    // 2. Use transaction to prevent partial writes
    return await prisma.$transaction(async (tx) => {
      // Store the Update record
      const updateRecord = await (tx as any).contextUpdate.create({
        data: {
          projectId,
          rawInput,
          extractedUpdateJson: extractedUpdate as any,
        },
      });
  
      // 3. Apply merge and create new snapshot
      const newSnapshot = await this.applyUpdate(userId, projectId, extractedUpdate, tx);
  
      return {
        extractedUpdate,
        snapshot: newSnapshot,
      };
    });
  }
  
  async restoreVersion(userId: string, projectId: string, versionNumber: number) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    const snapshotToRestore = await prisma.contextSnapshot.findFirst({
      where: { projectId, versionNumber },
    });
  
    if (!snapshotToRestore) {
      throw new AppError(404, 'Snapshot version not found');
    }
  
    // Validate contextJson
    projectContextSchema.parse(snapshotToRestore.contextJson);
  
    const latestSnapshot = await prisma.contextSnapshot.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
  
    const newVersionNumber = latestSnapshot ? latestSnapshot.versionNumber + 1 : 1;
  
    const newSnapshot = await prisma.contextSnapshot.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        contextJson: snapshotToRestore.contextJson as any,
      },
    });
  
    return {
      restoredFromVersion: versionNumber,
      snapshot: newSnapshot,
    };
  }
 
  async previewCleanup(userId: string, projectId: string) {
    const latestSnapshot = await this.getLatestSnapshot(userId, projectId);
    if (!latestSnapshot) {
      throw new AppError(404, 'No context snapshot found for this project');
    }
 
    const currentContext = projectContextSchema.parse(latestSnapshot.contextJson) as ProjectContext;
    const cleanedContext = await aiService.cleanupContext(currentContext);
 
    return {
      before: currentContext,
      after: cleanedContext,
    };
  }
 
  async applyCleanup(userId: string, projectId: string, cleanedContext: ProjectContext) {
    // Validate cleaned context again before applying
    projectContextSchema.parse(cleanedContext);
 
    const latestSnapshot = await this.getLatestSnapshot(userId, projectId);
    const newVersionNumber = latestSnapshot ? latestSnapshot.versionNumber + 1 : 1;
 
    const newSnapshot = await prisma.contextSnapshot.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        contextJson: cleanedContext as any,
      },
    });
 
    return {
      snapshot: newSnapshot,
      message: 'Context cleanup applied and new version created',
    };
  }

  async createGitImportRecord(userId: string, projectId: string, data: any) {
    return prisma.gitChangeImport.create({
      data: {
        userId,
        projectId,  
        title: data.title,
        changeType: data.changeType,
        branch: data.branch,
        baseBranch: data.baseBranch,
        sanitizedInputPreview: data.sanitizedInputPreview,
        rawInputHash: data.rawInputHash,
        suggestedUpdateJson: data.suggestedUpdateJson,
        redactionCount: data.redactionCount,
        status: 'analyzed',
      },
    });
  }

  async updateGitImportStatus(userId: string, projectId: string, gitImportId: string, status: string) {
    const gitImport = await prisma.gitChangeImport.findFirst({
      where: { id: gitImportId, projectId, userId },
    });

    if (!gitImport) {
      throw new AppError(404, 'Git import record not found');
    }

    if (status === 'applied' && gitImport.status === 'applied') {
      throw new AppError(400, 'This Git import has already been applied');
    }

    return prisma.gitChangeImport.update({
      where: { id: gitImportId },
      data: { status },
    });
  }

  async getGitImportHistory(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return prisma.gitChangeImport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyPreAnalyzedUpdate(userId: string, projectId: string, rawInput: string, extractedUpdate: ContextUpdate, source: string = 'manual') {
    return await prisma.$transaction(async (tx) => {
      // Store the Update record
      const updateRecord = await (tx as any).contextUpdate.create({
        data: {
          projectId,
          rawInput,
          extractedUpdateJson: extractedUpdate as any,
        },
      });

      // Apply merge and create new snapshot
      const newSnapshot = await this.applyUpdate(userId, projectId, extractedUpdate, tx);

      return {
        updateRecord,
        snapshot: newSnapshot,
      };
    });
  }
}
  
export const contextService = new ContextService();
