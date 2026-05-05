import { prisma } from '../../config/db';
import { AppError } from '../../middleware/error.middleware';
import { createProjectSchema, updateProjectSchema } from './project.schema';
import { z } from 'zod';

export class ProjectService {
  async createProject(userId: string, data: z.infer<typeof createProjectSchema>) {
    return prisma.project.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getProjects(userId: string) {
    return prisma.project.findMany({
      where: { userId },
    });
  }

  async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return project;
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.getProjectById(userId, projectId);
    
    // Delete all associated records in a transaction
    return prisma.$transaction([
      prisma.contextSnapshot.deleteMany({ where: { projectId: project.id } }),
      prisma.contextUpdate.deleteMany({ where: { projectId: project.id } }),
      prisma.export.deleteMany({ where: { projectId: project.id } }),
      prisma.project.delete({ where: { id: project.id } }),
    ]);
  }

  async updateProject(userId: string, projectId: string, data: z.infer<typeof updateProjectSchema>) {
    const project = await this.getProjectById(userId, projectId);
    return prisma.project.update({
      where: { id: project.id },
      data,
    });
  }
}

export const projectService = new ProjectService();
