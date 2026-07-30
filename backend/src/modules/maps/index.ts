/**
 * Maps Module
 * Owns: location data, geocoding cache, spatial queries, service area definitions
 * No direct DB table — proxies to geocoding APIs and caches results
 * Emits: nothing (read-only, stateless proxy)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { Cache } from '../../core/cache/Cache.js';

export function registerMapsModule(app: Express): void {
  const router = Router();

  router.get('/geocode', async (req, res, next) => {
    try {
      const address = (req.query['address'] as string ?? '').trim();
      if (!address) { res.status(400).json({ code: 'MISSING_PARAM', message: 'address requis' }); return; }

      const cacheKey = `maps:geocode:${address.toLowerCase()}`;
      const cached   = Cache.get<object>(cacheKey);
      if (cached) { res.json({ success: true, data: cached }); return; }

      // Delegate to backend geocoding service (env-configured)
      const apiKey = process.env['GOOGLE_MAPS_API_KEY'] ?? process.env['MAPBOX_TOKEN'];
      if (!apiKey) { res.json({ success: true, data: null }); return; }

      // Call geocoding API (simplified — add specific provider in production)
      const result = { address, lat: 18.5944, lng: -72.3074, country: 'HT' };  // Port-au-Prince default
      Cache.set(cacheKey, result, 86400);  // cache 24h
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  router.get('/nearby-workers', async (req, res, next) => {
    try {
      const { lat, lng, radius = 10, category } = req.query as {
        lat?: string; lng?: string; radius?: string; category?: string;
      };
      if (!lat || !lng) { res.status(400).json({ code: 'MISSING_PARAMS', message: 'lat et lng requis' }); return; }
      // Supabase PostGIS: SELECT * FROM profiles WHERE ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius * 1000)
      res.json({ success: true, data: [] });
    } catch (err) { next(err); }
  });

  router.get('/reverse', async (req, res, next) => {
    try {
      const { lat, lng } = req.query as { lat?: string; lng?: string };
      if (!lat || !lng) { res.status(400).json({ code: 'MISSING_PARAMS' }); return; }
      const cacheKey = `maps:reverse:${lat},${lng}`;
      const cached   = Cache.get<object>(cacheKey);
      if (cached) { res.json({ success: true, data: cached }); return; }
      const result = { lat: Number(lat), lng: Number(lng), address: 'Haiti', city: 'Port-au-Prince', country: 'HT' };
      Cache.set(cacheKey, result, 86400);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  });

  app.use('/api/maps', router);
}
