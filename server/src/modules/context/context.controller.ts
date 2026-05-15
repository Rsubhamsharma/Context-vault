import { Response, NextFunction } from 'express';
import { contextService } from './context.service';
import { createSnapshotSchema, createUpdateSchema, projectContextSchema, restoreVersionSchema, gitImportSchema, gitImportStatusSchema } from './context.schema';
import { cleanupPreviewSchema, cleanupApplySchema } from './cleanup.schema';
import { sendResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
import { computeContextDiff } from './diff-utility';
import { aiService } from '../ai/ai.service';
import { redactSecrets } from '../../utils/redact';
import { MAX_GIT_IMPORT_LENGTH } from '../../utils/redact';
import { prisma } from '../../config/db';
import { gitPreprocessService } from '../../services/git-preprocess.service';

export class ContextController {
  async createSnapshot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createSnapshotSchema.parse(req.body);
      const snapshot = await contextService.createSnapshot(req.user!.id, validatedData);
      return sendResponse(res, 201, snapshot, 'Snapshot created successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async createUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createUpdateSchema.parse(req.body);
      const update = await contextService.createUpdate(req.user!.id, validatedData);
      return sendResponse(res, 201, update, 'Update created successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async handleRawUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { rawInput, skipAI } = createUpdateSchema.parse({ ...req.body, projectId });
      
      const result = await contextService.processRawUpdate(req.user!.id, projectId, rawInput, skipAI);
      return sendResponse(res, 200, result, 'Context update applied successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async getLatestSnapshot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const snapshot = await contextService.getLatestSnapshot(req.user!.id, projectId);
      return sendResponse(res, 200, snapshot, snapshot ? 'Latest snapshot retrieved' : 'No snapshot found');
    } catch (error) {
      next(error);
    }
  }
  
  async getContextHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const history = await contextService.getContextHistory(req.user!.id, projectId);
      return sendResponse(res, 200, history, 'Context history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async getDiff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const fromVersion = parseInt(req.query.fromVersion as string);
      const toVersion = parseInt(req.query.toVersion as string);
    
      if (isNaN(fromVersion) || isNaN(toVersion)) {
        return sendResponse(res, 400, null, 'fromVersion and toVersion are required and must be numbers');
      }
    
      const fromSnapshot = await contextService.getSnapshotByVersion(req.user!.id, projectId, fromVersion);
      const toSnapshot = await contextService.getSnapshotByVersion(req.user!.id, projectId, toVersion);
    
      if (!fromSnapshot || !toSnapshot) {
        return sendResponse(res, 404, null, 'One or both snapshots not found');
      }
    
      const fromContext = projectContextSchema.parse(fromSnapshot.contextJson);
      const toContext = projectContextSchema.parse(toSnapshot.contextJson);
    
      const diff = computeContextDiff(fromContext, toContext);
    
      return sendResponse(res, 200, {
        fromVersion,
        toVersion,
        diff,
      }, 'Context diff generated successfully');
    } catch (error) {
      next(error);
    }
  }
  
  async restoreVersion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const validatedData = restoreVersionSchema.parse(req.body);
      
      const result = await contextService.restoreVersion(req.user!.id, projectId, validatedData.versionNumber);
      
      return sendResponse(res, 200, result, 'Version restored successfully');
    } catch (error) {
      next(error);
    }
  }
 
  async previewCleanup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const validatedData = cleanupPreviewSchema.parse(req.body);
      
      const preview = await contextService.previewCleanup(req.user!.id, projectId);
      return sendResponse(res, 200, preview, 'Cleanup preview generated successfully');
    } catch (error) {
      next(error);
    }
  }
 
  async applyCleanup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const validatedData = cleanupApplySchema.parse(req.body);
      
      const result = await contextService.applyCleanup(req.user!.id, projectId, validatedData.cleanedContext);
      return sendResponse(res, 200, result, 'Context cleanup applied successfully');
    } catch (error) {
      next(error);
    }
  }

  async analyzeGitImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      
      // Validate project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied');
      }

      const validatedData = gitImportSchema.parse(req.body);

      // 1. Preprocessing (Filtering & Redaction)
      const { sanitizedText, metadata } = gitPreprocessService.preprocess(validatedData.changeText);

      // 2. Large Input Handling (Check sanitized size)
      if (sanitizedText.length > MAX_GIT_IMPORT_LENGTH) {
        return sendResponse(res, 400, null, `The filtered git change is still too large to analyze safely (${(sanitizedText.length / 1024).toFixed(1)} KB). Please paste a PR summary, commit summary, or smaller diff.`);
      }

      // 3. AI Analysis
      const suggestedUpdate = await aiService.analyzeGitChanges({
        ...validatedData,
        changeText: sanitizedText,
        preprocessingMetadata: metadata,
      });

      // 4. Persistence in Audit Trail
      const importRecord = await contextService.createGitImportRecord(req.user!.id, projectId, {
        title: validatedData.title,
        changeType: validatedData.changeType,
        branch: validatedData.branch,
        baseBranch: validatedData.baseBranch,
        redactionCount: metadata.redactionCount,
        sanitizedInputPreview: sanitizedText.slice(0, 1000),
        rawInputHash: Buffer.from(validatedData.changeText).toString('base64').slice(0, 32),
        suggestedUpdateJson: suggestedUpdate,
        preprocessingMetadata: metadata,
      });

      return sendResponse(res, 200, {
        suggestedUpdate,
        metadata: {
          ...metadata,
          branch: validatedData.branch,
          gitImportId: importRecord.id,
        },
      }, 'Git changes analyzed successfully');
    } catch (error) {
      next(error);
    }
  }

  async applyGitImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const { gitImportId, rawInput: input, extractedUpdate: update } = req.body;
      
      if (!gitImportId || !input || !update) {
        return sendResponse(res, 400, null, 'gitImportId, rawInput, and extractedUpdate are required to apply the import.');
      }

      // 1. Validate project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
      });
      if (!project) {
        return sendResponse(res, 404, null, 'Project not found or access denied');
      }

      // 2. Verify Git Import record ownership and status BEFORE applying
      const gitImport = await prisma.gitChangeImport.findFirst({
        where: { id: gitImportId, projectId, userId: req.user!.id },
      });

      if (!gitImport) {
        return sendResponse(res, 404, null, 'Git import record not found or access denied');
      }

      if (gitImport.status !== 'analyzed') {
        return sendResponse(res, 400, null, `Cannot apply import with status ${gitImport.status}. Only analyzed imports can be applied.`);
      }

      // 3. Apply the update
      const result = await contextService.applyPreAnalyzedUpdate(req.user!.id, projectId, input, update, 'git_import');
      
      // 4. Update import status
      await contextService.updateGitImportStatus(req.user!.id, projectId, gitImportId, 'applied');
      
      // 5. Link version
      await prisma.gitChangeImport.update({
        where: { id: gitImportId },
        data: { 
          createdVersionId: result.snapshot.id,
          appliedAt: new Date()
        },
      });

      return sendResponse(res, 200, result, 'Git import applied successfully');
    } catch (error) {
      next(error);
    }
  }

  async cancelGitImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId, gitImportId } = req.params;
      const { status } = gitImportStatusSchema.parse(req.body);
      
      await contextService.updateGitImportStatus(req.user!.id, projectId, gitImportId, status);
      
      return sendResponse(res, 200, null, 'Git import status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getGitImportHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const history = await contextService.getGitImportHistory(req.user!.id, projectId);
      return sendResponse(res, 200, history, 'Git import history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const contextController = new ContextController();
