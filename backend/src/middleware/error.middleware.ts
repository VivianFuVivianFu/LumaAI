import { Request, Response, NextFunction } from 'express';
import { isDevelopment } from '../config/env.config';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    details: isDevelopment ? err.details : undefined,
    stack: isDevelopment ? err.stack : undefined,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
  });
};
