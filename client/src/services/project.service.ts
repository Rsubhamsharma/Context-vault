import api from '../lib/api';
import type { Project, ProjectResponse, ProjectCreateRequest } from '../types/project.types';
import type { ApiResponse } from '../types/context.types';

export const projectService = {
  async getProjects(): Promise<ProjectResponse> {
    const response = await api.get('/projects');
    return response.data as ProjectResponse;
  },
  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data as ApiResponse<Project>;
  },
  async createProject(data: ProjectCreateRequest): Promise<ApiResponse<Project>> {
    const response = await api.post('/projects', data);
    return response.data as ApiResponse<Project>;
  },
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },
};
