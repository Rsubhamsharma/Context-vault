import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T | null;
  message?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T | null,
  message: string = ''
) => {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};
