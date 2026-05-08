import api from '../lib/api';
import type { ContextUpdateRequest, ContextUpdateResponseData, ContextSnapshot, ApiResponse, ProjectContext } from '../types/context.types';

export interface RestoreVersionRequest {
  versionNumber: number;
}

export interface RestoreVersionResponseData {
  restoredFromVersion: number;
  snapshot: ContextSnapshot;
}

export interface CleanupPreviewResponseData {
  before: ProjectContext;
  after: ProjectContext;
}

export interface CleanupApplyResponseData {
  snapshot: ContextSnapshot;
  message: string;
}

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
};
