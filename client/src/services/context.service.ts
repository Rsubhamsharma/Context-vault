import api from '../lib/api';
import type { ContextUpdateRequest, ContextUpdateResponseData, ContextSnapshot, ApiResponse } from '../types/context.types';

export interface RestoreVersionRequest {
  versionNumber: number;
}

export interface RestoreVersionResponseData {
  restoredFromVersion: number;
  snapshot: ContextSnapshot;
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
};
