export type ExportTarget = 'chatgpt' | 'claude' | 'cursor' | 'windsurf' | 'generic_markdown' | 'json';

export interface ExportRequest {
  target: ExportTarget;
}

export interface ExportResponse {
  success: boolean;
  data: {
    target: ExportTarget;
    content: string;
  };
  message?: string;
}
