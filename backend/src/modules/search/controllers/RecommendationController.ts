import type { Request, Response, NextFunction } from 'express';
import { RecommendationService }                 from '../services/RecommendationService.js';
import { SearchSource }                          from '../types/search.types.js';

export const RecommendationController = {
  async forUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const limit  = Number(req.query['limit'] ?? 10);
      const items  = await RecommendationService.forUser(userId, limit);
      res.json({ data: items });
    } catch (err) { next(err); }
  },

  async popular(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query['limit'] ?? 10);
      const items = await RecommendationService.popular(limit);
      res.json({ data: items });
    } catch (err) { next(err); }
  },

  async nearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat   = Number(req.query['lat'] ?? 0);
      const lng   = Number(req.query['lng'] ?? 0);
      const limit = Number(req.query['limit'] ?? 10);
      const items = await RecommendationService.nearby(lat, lng, limit);
      res.json({ data: items });
    } catch (err) { next(err); }
  },

  async similar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sourceId = String(req.params['sourceId']);
      const source   = String(req.params['source']) as SearchSource;
      const limit    = Number(req.query['limit'] ?? 6);
      const items    = await RecommendationService.similar(sourceId, source, limit);
      res.json({ data: items });
    } catch (err) { next(err); }
  },
};