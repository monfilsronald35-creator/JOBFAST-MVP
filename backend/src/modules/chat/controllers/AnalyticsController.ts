import type { Request, Response, NextFunction } from 'express';
import { ChatAnalyticsService } from '../services/ChatAnalyticsService.js';

export const ChatAnalyticsController = {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q    = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = {};
      if (q['from'])   opts['from']   = String(q['from']);
      if (q['to'])     opts['to']     = String(q['to']);
      if (q['userId']) opts['userId'] = String(q['userId']);
      const metrics = await ChatAnalyticsService.getMetrics(opts);
      res.json({ data: metrics });
    } catch (err) { next(err); }
  },

  async getRoomStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ChatAnalyticsService.getRoomStats(String(req.params['roomId']));
      res.json({ data: stats });
    } catch (err) { next(err); }
  },
};
