import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { ValidationError } from '../errors/AppError.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        fields[path] = issue.message;
      }
      return next(new ValidationError('Done yo envalid', fields));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join('.')] = issue.message;
      }
      return next(new ValidationError('Paramèt yo envalid', fields));
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new ValidationError('Paramèt URL envalid'));
    }
    req.params = result.data as typeof req.params;
    next();
  };
}

// Common reusable schemas
export const schemas = {
  id:     z.object({ id: z.string().uuid() }),
  cursor: z.object({
    cursor: z.string().optional(),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
  }),
};
