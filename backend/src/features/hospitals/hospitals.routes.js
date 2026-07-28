import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { city, specialty, emergency, page = 1, limit = 20 } = req.query;
  const cacheKey = `hospitals:${city}:${specialty}:${emergency}:${page}`;
  const data = await withCache(cache.medium, cacheKey, async () => {
    let q = supabase.from('healthcare_providers').select('*', { count: 'exact' }).eq('is_active', true);
    if (city)      q = q.ilike('location->>city', `%${city}%`);
    if (specialty) q = q.contains('specialties', [specialty]);
    if (emergency === 'true') q = q.eq('has_emergency', true);
    q = q.range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 5 * 60_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/emergency', asyncHandler(async (req, res) => {
  const data = await withCache(cache.short, 'hospitals:emergency', async () => {
    const { data } = await supabase.from('healthcare_providers').select('*').eq('has_emergency', true).eq('is_active', true).limit(20);
    return data || [];
  }, 60_000);
  res.json({ success: true, data });
}));

router.get('/doctors', asyncHandler(async (req, res) => {
  const { specialty } = req.query;
  let q = supabase.from('profiles').select('id, name, profession, stats, location, profileMetadata').eq('category', 'healthcare').eq('is_available', true);
  if (specialty) q = q.ilike('profession', `%${specialty}%`);
  const { data } = await q.limit(30);
  res.json({ success: true, data: data || [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('healthcare_providers').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ success: false, error: 'Provider not found' });
  res.json({ success: true, data });
}));

router.post('/appointment', authMiddleware, asyncHandler(async (req, res) => {
  const { providerId, doctorId, date, type } = req.body;
  const { data, error } = await supabase.from('appointments').insert({
    user_id: req.user.id, provider_id: providerId, doctor_id: doctorId, date, type, status: 'pending',
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

export default router;
