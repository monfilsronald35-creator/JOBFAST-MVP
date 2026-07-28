import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { category, city, from, to, page = 1, limit = 20 } = req.query;
  const cacheKey = `events:${category}:${city}:${from}:${page}`;
  const data = await withCache(cache.short, cacheKey, async () => {
    let q = supabase.from('events').select('*', { count: 'exact' }).eq('is_active', true).gte('start_date', new Date().toISOString());
    if (category) q = q.eq('category', category);
    if (city)     q = q.ilike('location->>city', `%${city}%`);
    if (from)     q = q.gte('start_date', from);
    if (to)       q = q.lte('start_date', to);
    q = q.order('start_date', { ascending: true }).range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 5 * 60_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/upcoming', asyncHandler(async (req, res) => {
  const data = await withCache(cache.short, 'events:upcoming', async () => {
    const { data } = await supabase.from('events').select('*').eq('is_active', true).eq('is_featured', true).gte('start_date', new Date().toISOString()).order('start_date').limit(10);
    return data || [];
  }, 5 * 60_000);
  res.json({ success: true, data });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ success: false, error: 'Event not found' });
  res.json({ success: true, data });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('events').insert({ ...req.body, organizer_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

router.post('/:id/register', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('event_registrations').insert({
    event_id: req.params.id, user_id: req.user.id, status: 'confirmed',
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

export default router;
