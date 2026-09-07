import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: any;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  message,
  data,
  pagination,
  errors,
}: ApiResponseOptions<T>) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data !== undefined && { data }),
    ...(pagination && { pagination }),
    ...(errors && { errors }),
  });
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  pagination?: PaginationMeta
) => {
  return sendResponse({
    res,
    statusCode,
    message,
    data,
    pagination,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any
) => {
  return sendResponse({
    res,
    statusCode,
    message,
    errors,
  });
};
