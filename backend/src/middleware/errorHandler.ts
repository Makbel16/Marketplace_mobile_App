import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { config } from '../config/environment';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any;

  constructor(message: string, statusCode: number = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // Handle Prisma Known Errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    statusCode = 409;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    message = `A record with this ${target} already exists.`;
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404;
    message = 'Requested record not found.';
  } else if (err.code === 'P2003') {
    // Foreign key constraint failed
    statusCode = 400;
    message = 'Invalid reference: related record does not exist.';
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please authenticate again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please log in again.';
  }

  // Log non-operational errors in development/testing
  if (!err.isOperational && !config.isProduction) {
    console.error('💥 UNHANDLED ERROR:', err);
  }

  return sendError(res, message, statusCode, errors);
};
