import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../domain/errors/AppError';
import { LoggerUtils } from '../../infrastructure/utils/Logger';

export function handleCentralizedError(
  error: Error,
  request: Request,
  response: Response,
  nextFunction: NextFunction
): void {
  if (error instanceof AppError) {
    LoggerUtils.warn(`[${error.name}] ${error.message} (${request.method} ${request.originalUrl})`);
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.name,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload provided in request',
        details: error.flatten().fieldErrors
      }
    });
    return;
  }

  LoggerUtils.error(
    `[UnhandledError] ${error.message}`,
    error,
    `${request.method} ${request.originalUrl}`
  );

  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred'
    }
  });
}
