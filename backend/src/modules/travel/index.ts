/**
 * Travel Module
 * Owns: travel jobs, itineraries, transport bookings, hotel listings (JOBFAST Travel vertical)
 * Listens to: nothing (triggers from HTTP)
 * Emits: job.created (re-uses job domain for travel tasks)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';

export function registerTravelModule(app: Express): void {
  const router = Router();

  router.get('/destinations',  async (req, res, next) => {
    try {
      const { data } = await db.client().from('travel_destinations').select('*').eq('active', true);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/itinerary',    requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('travel_itineraries')
        .insert({ ...req.body, user_id: req.user!.sub, created_at: new Date().toISOString() })
        .select().single();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/itineraries',   requireAuth, async (req, res, next) => {
    try {
      const { data } = await db.client().from('travel_itineraries')
        .select('*').eq('user_id', req.user!.sub).order('created_at', { ascending: false });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  app.use('/api/travel', router);
}
