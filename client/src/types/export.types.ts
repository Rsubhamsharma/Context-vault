export type ExportTarget = 'chatgpt' | 'claude' | 'cursor' | 'windsurf' | 'generic_markdown' | 'json';
export type ExportMode = 'full' | 'compact' | 'smart';

export interface ExportRequest {
  target: ExportTarget;
  mode?: ExportMode;
  task?: string;
}

export interface ExportResponse {
  success: boolean;
  data: {
    target: ExportTarget;
    mode: ExportMode;
    content: string;
    estimatedTokens: number;
    characterCount: number;
    fullEstimatedTokens: number;
    compactEstimatedTokens: number;
    estimatedSavingsPercent: number | null;
    relevanceMode?: 'ai' | 'fallback' | 'none' | string;
    aiMetadata?: {
      confidence?: 'high' | 'medium' | 'low';
      taskCategory?: string;
      taskIntent?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
}
