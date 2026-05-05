import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { createProjectSchema, updateProjectSchema } from './project.schema';
import { sendResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ProjectController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createProjectSchema.parse(req.body);
      const project = await projectService.createProject(req.user!.id, validatedData);
      return sendResponse(res, 201, project, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getProjects(req.user!.id);
      return sendResponse(res, 200, projects, 'Projects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(req.user!.id, id);
      return sendResponse(res, 200, project, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateProjectSchema.parse(req.body);
      const project = await projectService.updateProject(req.user!.id, id, validatedData);
      return sendResponse(res, 200, project, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await projectService.deleteProject(req.user!.id, id);
      return sendResponse(res, 200, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
