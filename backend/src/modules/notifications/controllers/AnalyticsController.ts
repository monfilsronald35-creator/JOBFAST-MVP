import type { Request, Response, NextFunction } from 'express';
import { NotificationAnalyticsService }          from '../services/NotificationAnalyticsService.js';

export const AnalyticsController = {
  async channelStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days  = Number(req.query['days'] ?? 30);
      const stats = await NotificationAnalyticsService.getChannelStats(days);
      res.json({ data: stats });
    } catch (err) { next(err); }
  },

  async dailyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days  = Number(req.query['days'] ?? 7);
      const stats = await NotificationAnalyticsService.getDailyStats(days);
      res.json({ data: stats });
    } catch (err) { next(err); }
  },

  async topEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit  = Number(req.query['limit'] ?? 10);
      const events = await NotificationAnalyticsService.getTopEvents(limit);
      res.json({ data: events });
    } catch (err) { next(err); }
  },
};