import type { Response } from 'express';

export abstract class BaseController {
  protected ok<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json({ success: true, data });
  }

  protected created<T>(res: Response, data: T): void {
    this.ok(res, data, 201);
  }

  protected noContent(res: Response): void {
    res.status(204).end();
  }

  protected paginated<T>(
    res:   Response,
    items: T[],
    nextCursor?: string,
    total?: number,
  ): void {
    res.json({ success: true, data: items, pagination: { nextCursor, total } });
  }
}
