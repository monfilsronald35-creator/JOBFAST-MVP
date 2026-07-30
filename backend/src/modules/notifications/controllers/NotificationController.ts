import type { Request, Response, NextFunction } from 'express';
import { NotificationOrchestratorService }       from '../services/NotificationOrchestratorService.js';

export const NotificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId     = req.user!.sub;
      const limit      = Number(req.query['limit']  ?? 20);
      const cursor     = req.query['cursor'] ? String(req.query['cursor']) : undefined;
      const unreadOnly = req.query['unread'] === 'true';
      const items = await NotificationOrchestratorService.list(userId, { limit, cursor, unreadOnly });
      res.json({ data: items });
    } catch (err) { next(err); }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await NotificationOrchestratorService.getUnreadCount(req.user!.sub);
      res.json({ count });
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationOrchestratorService.markRead(String(req.params['id']), req.user!.sub);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationOrchestratorService.markAllRead(req.user!.sub);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationOrchestratorService.cancel(String(req.params['id']), req.user!.sub);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};