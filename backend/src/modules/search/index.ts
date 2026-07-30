/**
 * Search Module
 * Owns: search index (PostgreSQL full-text + trigrams), search history, suggestions
 * No cross-module DB queries — reads from materialized search views only
 * Emits: nothing (read-only module)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { optionalAuth } from '../../core/middleware/auth.middleware.js';

export function registerSearchModule(app: Express): void {
  const router = Router();

  router.get('/', optionalAuth, async (req, res, next) => {
    try {
      const q      = (req.query['q'] as string ?? '').trim();
      const type   = (req.query['type'] as string) ?? 'all';
      const limit  = Math.min(Number(req.query['limit'] ?? 20), 50);

      if (!q || q.length < 2) {
        res.json({ success: true, data: { jobs: [], workers: [], listings: [] } });
        return;
      }

      const tsQuery = q.split(/\s+/).join(' & ');

      const [jobs, workers] = await Promise.all([
        type === 'all' || type === 'jobs'
          ? db.client().from('jobs').select('id, title, category, budget, currency, created_at')
              .textSearch('search_vector', tsQuery, { config: 'french' })
              .eq('status', 'open').limit(limit)
          : { data: [] },
        type === 'all' || type === 'workers'
          ? db.client().from('profiles').select('id, full_name, role, avatar_url, skills')
              .textSearch('search_vector', tsQuery, { config: 'french' })
              .eq('role', 'worker').eq('status', 'active').limit(limit)
          : { data: [] },
      ]);

      res.json({ success: true, data: { jobs: jobs.data ?? [], workers: workers.data ?? [] } });
    } catch (err) { next(err); }
  });

  router.get('/suggestions', async (req, res, next) => {
    try {
      const q      = (req.query['q'] as string ?? '').trim();
      const { data } = await db.client().from('search_suggestions').select('term, count')
        .ilike('term', `${q}%`).order('count', { ascending: false }).limit(10);
      res.json({ success: true, data: data ?? [] });
    } catch (err) { next(err); }
  });

  app.use('/api/search', router);
}
