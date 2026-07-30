import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';

export const AnalyticsController = {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q    = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = {};
      if (q['userId'])   opts['userId']   = String(q['userId']);
      if (q['from'])     opts['from']     = String(q['from']);
      if (q['to'])       opts['to']       = String(q['to']);
      if (q['country'])  opts['country']  = String(q['country']);
      if (q['currency']) opts['currency'] = String(q['currency']);
      const metrics = await AnalyticsService.getMetrics(opts);
      res.json({ data: metrics });
    } catch (err) { next(err); }
  },

  async getRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q    = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = {};
      if (q['from'])     opts['from']     = String(q['from']);
      if (q['to'])       opts['to']       = String(q['to']);
      if (q['currency']) opts['currency'] = String(q['currency']);
      const revenue = await AnalyticsService.getRevenue(opts as { from: string; to: string; currency?: string });
      res.json({ data: revenue });
    } catch (err) { next(err); }
  },

  async getMyMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const q      = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = { userId };
      if (q['from'])     opts['from']     = String(q['from']);
      if (q['to'])       opts['to']       = String(q['to']);
      if (q['currency']) opts['currency'] = String(q['currency']);
      const metrics = await AnalyticsService.getMetrics(opts);
      res.json({ data: metrics });
    } catch (err) { next(err); }
  },
};
