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
  
  // In production, hide internal error messages for 500 errors
  const message = (process.env.NODE_ENV === 'production' && statusCode === 500)
    ? 'An internal server error occurred. Please try again later.'
    : (err instanceof Error ? err.message : 'Internal Server Error');

  logger.error(`[Error] ${req.method} ${req.url} - ${err instanceof Error ? err.message : 'Unknown Error'}`);

  return sendResponse(res, statusCode, null, message);
};
