import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error.middleware';
import { projectContextSchema } from '../context/context.schema';
import { exportFormatter } from './export.formatter';
import { ExportRequest } from './export.schema';

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

    const content = exportFormatter.format(project.name, validation.data, request.target);

    await prisma.export.create({
      data: {
        projectId,
        target: request.target,
        content,
      },
    });

    return {
      target: request.target,
      content,
    };
  }
}

export const exportService = new ExportService();
