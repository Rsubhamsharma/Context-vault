import { Response, NextFunction } from 'express';
import { contextService } from './context.service';
import { createSnapshotSchema, createUpdateSchema, projectContextSchema, restoreVersionSchema } from './context.schema';
import { cleanupPreviewSchema, cleanupApplySchema } from './cleanup.schema';
import { sendResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
import { computeContextDiff } from './diff-utility';
  
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
      const { rawInput } = createUpdateSchema.parse({ ...req.body, projectId });
      
      const result = await contextService.processRawUpdate(req.user!.id, projectId, rawInput);
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
}
 
  
export const contextController = new ContextController();

