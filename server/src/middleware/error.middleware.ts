import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  logger.error(`[Error] ${req.method} ${req.url} - ${message}`);

  return sendResponse(res, statusCode, null, message);
};
