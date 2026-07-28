import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { type, region, page = 1, limit = 20 } = req.query;
  const cacheKey = `tourism:${type}:${region}:${page}`;
  const data = await withCache(cache.medium, cacheKey, async () => {
    let q = supabase.from('tourism_listings').select('*', { count: 'exact' }).eq('is_active', true);
    if (type)   q = q.eq('type', type);
    if (region) q = q.ilike('region', `%${region}%`);
    q = q.order('rating', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 10 * 60_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const data = await withCache(cache.long, 'tourism:featured', async () => {
    const { data } = await supabase.from('tourism_listings').select('*').eq('is_featured', true).limit(12);
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.get('/guides', asyncHandler(async (req, res) => {
  const { data } = await supabase.from('profiles')
    .select('id, name, stats, location, profileMetadata')
    .eq('category', 'tourism')
    .eq('is_available', true).limit(20);
  res.json({ success: true, data: data || [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('tourism_listings').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ success: false, error: 'Listing not found' });
  res.json({ success: true, data });
}));

export default router;
