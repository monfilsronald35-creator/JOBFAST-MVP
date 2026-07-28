import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, cuisine, city, search } = req.query;
  const cacheKey = `restaurants:${page}:${cuisine}:${city}:${search}`;
  const data = await withCache(cache.short, cacheKey, async () => {
    let q = supabase.from('businesses').select('*', { count: 'exact' }).eq('type', 'restaurant').eq('is_active', true);
    if (cuisine) q = q.eq('metadata->>cuisine', cuisine);
    if (city)    q = q.ilike('location->>city', `%${city}%`);
    if (search)  q = q.ilike('name', `%${search}%`);
    q = q.order('metadata->>rating', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 60_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const data = await withCache(cache.medium, 'restaurants:featured', async () => {
    const { data } = await supabase.from('businesses').select('*').eq('type', 'restaurant').eq('is_featured', true).limit(10);
    return data || [];
  }, 10 * 60_000);
  res.json({ success: true, data });
}));

router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lon, radius = 5 } = req.query;
  const { data } = await supabase.rpc('nearby_businesses', { lat: +lat, lon: +lon, radius_km: +radius, btype: 'restaurant' }).limit(20);
  res.json({ success: true, data: data || [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ success: false, error: 'Restaurant not found' });
  res.json({ success: true, data });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('businesses').insert({ ...req.body, type: 'restaurant', owner_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

export default router;
