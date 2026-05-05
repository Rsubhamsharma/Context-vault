import api from '../lib/api';
import type { ExportRequest, ExportResponse } from '../types/export.types';

export const exportService = {
  async exportContext(projectId: string, data: ExportRequest): Promise<ExportResponse> {
    const response = await api.post(`/projects/${projectId}/context/export`, data);
    return response.data as ExportResponse;
  },
};
