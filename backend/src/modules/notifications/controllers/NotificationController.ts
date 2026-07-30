import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../_base/BaseController.js';
import type { NotificationService } from '../services/NotificationService.js';

export class NotificationController extends BaseController {
  constructor(private readonly _service: NotificationService) { super(); }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cursor, limit } = req.query as { cursor?: string; limit?: string };
      const result = await this._service.listForUser(req.user!.sub, cursor, Number(limit ?? 20));
      this.paginated(res, result.items as never[], result.nextCursor);
    } catch (err) { next(err); }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this._service.getUnreadCount(req.user!.sub);
      this.ok(res, { count });
    } catch (err) { next(err); }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.markRead(req.user!.sub, req.params['id']!);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.markAllRead(req.user!.sub);
      this.noContent(res);
    } catch (err) { next(err); }
  };
}
