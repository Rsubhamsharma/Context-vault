import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { exportService } from './export.service';
import { exportRequestSchema } from './export.schema';
import { sendResponse } from '../../utils/response';

export class ExportController {
  async exportContext(req: AuthRequest, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const body = exportRequestSchema.parse(req.body);
    const data = await exportService.exportContext(projectId, userId, body);

    return sendResponse(res, 200, data, 'Context exported successfully');
  }
}

export const exportController = new ExportController();
