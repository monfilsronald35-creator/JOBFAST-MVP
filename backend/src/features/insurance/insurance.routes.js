import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/plans', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const cacheKey = `insurance:plans:${type}`;
  const data = await withCache(cache.long, cacheKey, async () => {
    let q = supabase.from('insurance_plans').select('*').eq('is_active', true);
    if (type) q = q.eq('type', type);
    q = q.order('monthly_premium', { ascending: true });
    const { data } = await q;
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.get('/providers', asyncHandler(async (req, res) => {
  const data = await withCache(cache.long, 'insurance:providers', async () => {
    const { data } = await supabase.from('businesses').select('*').eq('type', 'insurance').eq('is_active', true).limit(20);
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.get('/my-policies', authMiddleware, asyncHandler(async (req, res) => {
  const { data } = await supabase.from('insurance_policies').select('*, insurance_plans(*)').eq('user_id', req.user.id);
  res.json({ success: true, data: data || [] });
}));

router.post('/apply', authMiddleware, asyncHandler(async (req, res) => {
  const { planId, beneficiaries } = req.body;
  const { data, error } = await supabase.from('insurance_applications').insert({
    user_id: req.user.id, plan_id: planId, beneficiaries, status: 'pending', applied_at: new Date().toISOString(),
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

export default router;
