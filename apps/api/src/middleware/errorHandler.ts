import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      message = 'A record with this data already exists';
      code = 'DUPLICATE_RECORD';
    } else if (err.code === 'P2025') {
      message = 'Record not found';
      code = 'NOT_FOUND';
      statusCode = 404;
    }
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};
