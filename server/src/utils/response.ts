import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T | null;
  message?: string;
  code?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T | null,
  message: string = '',
  code?: string
) => {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    data,
    message,
    code,
  };
  return res.status(statusCode).json(response);
};
