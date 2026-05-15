import api from '../lib/api';
import type { 
  ContextUpdateRequest, 
  ContextUpdateResponseData, 
  ContextSnapshot, 
  ApiResponse, 
  ProjectContext,
  RestoreVersionRequest,
  RestoreVersionResponseData,
  CleanupPreviewResponseData,
  CleanupApplyResponseData
} from '../types/context.types';

export const contextService = {
  async getLatestSnapshot(projectId: string): Promise<ApiResponse<ContextSnapshot | null>> {
    const response = await api.get(`/projects/${projectId}/context/latest`);
    return response.data as ApiResponse<ContextSnapshot | null>;
  },
  async updateContext(projectId: string, data: ContextUpdateRequest): Promise<ApiResponse<ContextUpdateResponseData>> {
    const response = await api.post(`/projects/${projectId}/context/updates`, data);
    return response.data as ApiResponse<ContextUpdateResponseData>;
  },
  async restoreVersion(projectId: string, data: RestoreVersionRequest): Promise<ApiResponse<RestoreVersionResponseData>> {
    const response = await api.post(`/projects/${projectId}/context/restore`, data);
    return response.data as ApiResponse<RestoreVersionResponseData>;
  },
  async previewCleanup(projectId: string): Promise<ApiResponse<CleanupPreviewResponseData>> {
    const response = await api.post(`/projects/${projectId}/context/cleanup/preview`, { projectId });
    return response.data as ApiResponse<CleanupPreviewResponseData>;
  },
  async applyCleanup(projectId: string, cleanedContext: ProjectContext): Promise<ApiResponse<CleanupApplyResponseData>> {
    const response = await api.post(`/projects/${projectId}/context/cleanup/apply`, {
      projectId,
      cleanedContext,
    });
    return response.data as ApiResponse<CleanupApplyResponseData>;
  },
  async analyzeGitImport(projectId: string, data: any): Promise<ApiResponse<any>> {
    const response = await api.post(`/projects/${projectId}/git-import/analyze`, data);
    return response.data as ApiResponse<any>;
  },
  async applyGitImport(projectId: string, data: any): Promise<ApiResponse<any>> {
    const response = await api.post(`/projects/${projectId}/git-import/apply`, data);
    return response.data as ApiResponse<any>;
  },
  async updateGitImportStatus(projectId: string, gitImportId: string, status: string): Promise<ApiResponse<any>> {
    const response = await api.patch(`/projects/${projectId}/git-import/${gitImportId}/status`, { status });
    return response.data as ApiResponse<any>;
  },
  async getGitImportHistory(projectId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/projects/${projectId}/git-import/history`);
    return response.data as ApiResponse<any[]>;
  },
};
