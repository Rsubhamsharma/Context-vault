import api from '../lib/api';
import type { ProjectContext, ProjectContextDiff, ContextUpdateResponseData } from '../types/context.types';

export interface HistoryItem {
  versionNumber: number;
  createdAt: string;
  contextJson: ProjectContext;
  update: {
    extractedUpdateJson: ContextUpdateResponseData['extractedUpdate'];
  } | null;
}

export interface HistoryResponse {
  success: boolean;
  data: HistoryItem[];
  message?: string;
}

export interface DiffResponse {
  success: boolean;
  data: {
    fromVersion: number;
    toVersion: number;
    diff: ProjectContextDiff;
  };
  message?: string;
}

export const contextHistoryService = {
  async getHistory(projectId: string): Promise<HistoryResponse> {
    const response = await api.get(`/context/history/${projectId}`);
    return response.data;
  },

  async getDiff(projectId: string, fromVersion: number, toVersion: number): Promise<DiffResponse> {
    const response = await api.get(`/context/diff/${projectId}?fromVersion=${fromVersion}&toVersion=${toVersion}`);
    return response.data;
  },
};
