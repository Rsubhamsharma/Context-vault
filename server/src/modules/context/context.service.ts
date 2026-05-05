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
    
    const history = await Promise.all(snapshots.map(async (snapshot) => {
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
 
  async processRawUpdate(userId: string, projectId: string, rawInput: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
  
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
  
    // 1. Extract structured update using AI (includes validation)
    const extractedUpdate = await aiService.extractContext(rawInput);
  
    // 2. Use transaction to prevent partial writes
    return await prisma.$transaction(async (tx) => {
      // Store the Update record
      const updateRecord = await tx.contextUpdate.create({
        data: {
          projectId,
          rawInput,
          extractedUpdateJson: extractedUpdate as any,
        },
      });
  
      // 3. Apply merge and create new snapshot
      // We need to modify applyUpdate to accept the transaction client
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
}

 
export const contextService = new ContextService();
