import type { Request, Response, NextFunction } from 'express';
import { AutocompleteService }                   from '../services/AutocompleteService.js';
import { SearchAnalyticsRepository }             from '../repositories/SearchAnalyticsRepository.js';

export const AutocompleteController = {
  async suggest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q     = String(req.query['q'] ?? '').trim();
      const lang  = String(req.query['lang'] ?? 'ht');
      const limit = Number(req.query['limit'] ?? 8);
      const suggestions = await AutocompleteService.suggest(q, lang, limit);
      res.json({ data: suggestions });
    } catch (err) { next(err); }
  },

  async trending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const country = String(req.query['country'] ?? 'HT');
      const lang    = String(req.query['lang'] ?? 'ht');
      const trending = await SearchAnalyticsRepository.getTrending(country, lang);
      res.json({ data: trending });
    } catch (err) { next(err); }
  },
};