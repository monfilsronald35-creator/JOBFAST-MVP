/**
 * Marketplace Module
 * Owns: listings, categories, service packages, bids/proposals, reviews
 * Listens to: job.completed (trigger review prompt), user.verified (unlock premium listing)
 * Emits: marketplace.listing_created, marketplace.bid_accepted, marketplace.review_posted
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';
import { TypedEventBus } from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES } from '@shared-events';

export function registerMarketplaceModule(app: Express): void {
  const router = Router();

  // Listings
  router.get('/listings',          async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('listings').select('*')
        .eq('status', 'active').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/listings/:id',      async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('listings').select('*').eq('id', req.params['id']).single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/listings',         requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('listings').insert({ ...req.body, user_id: req.user!.sub }).select().single();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  // Categories
  router.get('/categories',        async (_req, res, next) => {
    try {
      const { data, error } = await db.client().from('categories').select('*').order('name');
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  // Reviews
  router.get('/listings/:id/reviews', async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('reviews').select('*').eq('listing_id', req.params['id']);
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/listings/:id/reviews', requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('reviews').insert({
        ...req.body, listing_id: req.params['id'], reviewer_id: req.user!.sub,
      }).select().single();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  app.use('/api/marketplace', router);

  // Listen to job completion to unlock review
  TypedEventBus.subscribe(EVENT_NAMES.JOB_COMPLETED, async () => {
    // Future: prompt for review via notification
  });
}
