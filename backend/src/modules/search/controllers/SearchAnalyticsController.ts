import type { Request, Response, NextFunction } from 'express';
import { SearchAnalyticsService }                from '../services/SearchAnalyticsService.js';

export const SearchAnalyticsController = {
  async mostSearched(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days  = Number(req.query['days']  ?? 30);
      const limit = Number(req.query['limit'] ?? 10);
      const data  = await SearchAnalyticsService.getMostSearched(days, limit);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async zeroResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days  = Number(req.query['days']  ?? 7);
      const limit = Number(req.query['limit'] ?? 10);
      const data  = await SearchAnalyticsService.getZeroResults(days, limit);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async trending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const country = String(req.query['country'] ?? 'HT');
      const lang    = String(req.query['lang']    ?? 'ht');
      const days    = Number(req.query['days']    ?? 7);
      const limit   = Number(req.query['limit']   ?? 10);
      const data    = await SearchAnalyticsService.getTrending(country, lang, days, limit);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async performance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = Number(req.query['days'] ?? 7);
      const data = await SearchAnalyticsService.getPerformance(days);
      res.json({ data });
    } catch (err) { next(err); }
  },
};