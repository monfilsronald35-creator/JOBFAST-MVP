import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/courses', asyncHandler(async (req, res) => {
  const { category, level, free, page = 1, limit = 20 } = req.query;
  const cacheKey = `edu:courses:${category}:${level}:${free}:${page}`;
  const data = await withCache(cache.medium, cacheKey, async () => {
    let q = supabase.from('courses').select('*', { count: 'exact' }).eq('is_active', true);
    if (category) q = q.eq('category', category);
    if (level)    q = q.eq('level', level);
    if (free === 'true') q = q.eq('is_free', true);
    q = q.order('enrollment_count', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 10 * 60_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/tutors', asyncHandler(async (req, res) => {
  const { subject } = req.query;
  let q = supabase.from('profiles').select('id, name, profession, stats, location, profileMetadata').eq('category', 'education').eq('is_available', true);
  if (subject) q = q.ilike('profession', `%${subject}%`);
  const { data } = await q.limit(30);
  res.json({ success: true, data: data || [] });
}));

router.get('/schools', asyncHandler(async (req, res) => {
  const { city } = req.query;
  const cacheKey = `edu:schools:${city}`;
  const data = await withCache(cache.long, cacheKey, async () => {
    let q = supabase.from('businesses').select('*').eq('type', 'school').eq('is_active', true);
    if (city) q = q.ilike('location->>city', `%${city}%`);
    const { data } = await q.limit(30);
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.post('/enroll', authMiddleware, asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const { data, error } = await supabase.from('enrollments').insert({
    user_id: req.user.id, course_id: courseId, status: 'active', enrolled_at: new Date().toISOString(),
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

export default router;
