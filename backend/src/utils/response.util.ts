import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  if (details) {
    response.message = details;
  }

  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: any
): void => {
  sendError(res, 'Validation failed', 400, errors);
};
