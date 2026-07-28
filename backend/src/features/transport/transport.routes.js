import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { type, city, page = 1, limit = 20 } = req.query;
  const cacheKey = `transport:${type}:${city}:${page}`;
  const data = await withCache(cache.short, cacheKey, async () => {
    let q = supabase.from('transport_providers').select('*', { count: 'exact' }).eq('is_active', true).eq('is_available', true);
    if (type) q = q.eq('vehicle_type', type);
    if (city) q = q.ilike('service_area', `%${city}%`);
    q = q.order('rating', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 30_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

router.get('/drivers', asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  const { data } = await supabase.from('profiles')
    .select('id, name, stats, location, profileMetadata')
    .eq('category', 'transport')
    .eq('is_available', true)
    .limit(30);
  res.json({ success: true, data: data || [] });
}));

router.post('/request', authMiddleware, asyncHandler(async (req, res) => {
  const { pickup, destination, vehicleType } = req.body;
  const { data, error } = await supabase.from('transport_requests').insert({
    user_id: req.user.id, pickup, destination, vehicle_type: vehicleType, status: 'pending',
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

router.get('/estimate', asyncHandler(async (req, res) => {
  const { fromLat, fromLon, toLat, toLon, vehicleType = 'moto' } = req.query;
  const base = { moto: 50, car: 150, truck: 500 };
  const pricePerKm = { moto: 15, car: 35, truck: 80 };
  const R = 6371;
  const dLat = ((+toLat - +fromLat) * Math.PI) / 180;
  const dLon = ((+toLon - +fromLon) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((+fromLat * Math.PI) / 180) * Math.cos((+toLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const amount = Math.round((base[vehicleType] || 150) + (pricePerKm[vehicleType] || 35) * km);
  res.json({ success: true, data: { estimatedPrice: amount, distanceKm: Math.round(km * 10) / 10, currency: 'HTG', vehicleType } });
}));

export default router;
