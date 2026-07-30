import type { Request, Response, NextFunction } from 'express';
import { isAppError, toHttpError } from '../errors/AppError.js';

export function errorHandler(
  err:  unknown,
  _req: Request,
  res:  Response,
  _next: NextFunction,
): void {
  const { statusCode, body } = toHttpError(err);

  if (statusCode >= 500 && !isAppError(err)) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Wout sa a pa egziste' });
}
