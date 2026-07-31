import type { Request, Response, NextFunction } from 'express';
import { SearchOrchestratorService }             from '../services/SearchOrchestratorService.js';
import { SearchMode, SearchSource }              from '../types/search.types.js';
import type { SearchQuery, SearchFilters, SearchLocation } from '../types/search.types.js';

function parseLocation(query: Record<string, unknown>): SearchLocation | undefined {
  const lat = query['lat'] ? Number(query['lat']) : undefined;
  const lng = query['lng'] ? Number(query['lng']) : undefined;
  if (lat == null || lng == null) return undefined;
  const loc: SearchLocation = { lat, lng };
  if (query['radius']) loc.radiusKm = Number(query['radius']);
  if (query['city'])   loc.city     = String(query['city']);
  if (query['country']) loc.country = String(query['country']);
  return loc;
}

function parseFilters(query: Record<string, unknown>): SearchFilters {
  const f: SearchFilters = {};
  if (query['country'])       f.country       = String(query['country']);
  if (query['verified'])      f.verified      = query['verified'] === 'true';
  if (query['rating'])        f.rating        = Number(query['rating']);
  if (query['priceMin'])      f.priceMin      = Number(query['priceMin']);
  if (query['priceMax'])      f.priceMax      = Number(query['priceMax']);
  if (query['remote'])        f.remote        = query['remote'] === 'true';
  if (query['jobType'])       f.jobType       = String(query['jobType']);
  if (query['stars'])         f.stars         = Number(query['stars']);
  if (query['hasWifi'])       f.hasWifi       = query['hasWifi'] === 'true';
  if (query['inStock'])       f.inStock       = query['inStock'] === 'true';
  if (query['hasDelivery'])   f.hasDelivery   = query['hasDelivery'] === 'true';
  if (query['sortBy'])        f.sortBy        = String(query['sortBy']);
  if (query['sortDir'])       f.sortDir       = query['sortDir'] === 'desc' ? 'desc' : 'asc';
  return f;
}

export const SearchController = {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q      = req.query as Record<string, unknown>;
      const query  = String(q['q'] ?? '').trim();
      const mode   = (q['mode'] as SearchMode | undefined) ?? SearchMode.Hybrid;
      const srcRaw = q['source'] ? String(q['source']).split(',') : [];
      const sources = srcRaw.filter((s): s is SearchSource => Object.values(SearchSource).includes(s as SearchSource));

      const searchQuery: SearchQuery = {
        q:       query,
        mode,
        sources: sources.length > 0 ? sources : undefined,
        filters: parseFilters(q),
        limit:   Number(q['limit'] ?? 20),
        lang:    q['lang'] ? String(q['lang']) : 'ht',
        userId:  req.user?.sub,
      };

      const loc = parseLocation(q);
      if (loc) searchQuery.location = loc;
      if (q['cursor']) searchQuery.cursor = String(q['cursor']);

      const response = await SearchOrchestratorService.search(searchQuery);
      res.json(response);
    } catch (err) { next(err); }
  },

  async multiSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q      = req.query as Record<string, unknown>;
      const qStr   = String(q['q'] ?? '').trim();
      const result = await SearchOrchestratorService.multiSourceSearch({
        q:       qStr,
        filters: parseFilters(q),
        lang:    q['lang'] ? String(q['lang']) : 'ht',
        userId:  req.user?.sub,
      });
      res.json({ data: result });
    } catch (err) { next(err); }
  },
};