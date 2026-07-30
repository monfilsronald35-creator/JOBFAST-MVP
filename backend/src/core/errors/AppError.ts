export class AppError extends Error {
  constructor(
    message:                     string,
    public readonly statusCode:  number  = 500,
    public readonly code:        string  = 'INTERNAL_ERROR',
    public readonly isOperational = true,
    public readonly context?:    Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return { code: this.code, message: this.message, context: this.context };
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) {
    super(id ? `${resource} "${id}" pa jwenn` : `${resource} pa jwenn`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 422, 'VALIDATION_ERROR', true, fields ? { fields } : undefined);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Ou pa otorize') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Aksès entèdi') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Twò anpil demann. Tanpri tann yon ti moman.', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service?: string) {
    super(service ? `Sèvis ${service} pa disponib` : 'Sèvis pa disponib', 503, 'SERVICE_UNAVAILABLE');
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toHttpError(err: unknown): { statusCode: number; body: unknown } {
  if (isAppError(err)) {
    return { statusCode: err.statusCode, body: err.toJSON() };
  }
  return {
    statusCode: 500,
    body: { code: 'INTERNAL_ERROR', message: 'Yon erè entèn te rive' },
  };
}
