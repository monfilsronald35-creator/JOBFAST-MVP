import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/services', asyncHandler(async (req, res) => {
  const data = await withCache(cache.long, 'banking:services', async () => {
    const { data } = await supabase.from('banking_services').select('*').eq('is_active', true).order('name');
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.get('/institutions', asyncHandler(async (req, res) => {
  const data = await withCache(cache.long, 'banking:institutions', async () => {
    const { data } = await supabase.from('businesses').select('*').eq('type', 'bank').eq('is_active', true);
    return data || [];
  }, 30 * 60_000);
  res.json({ success: true, data });
}));

router.get('/exchange-rate', asyncHandler(async (req, res) => {
  const { from = 'USD', to = 'HTG' } = req.query;
  const data = await withCache(cache.short, `fx:${from}:${to}`, async () => {
    // TODO: integrate live FX API (Banque de la République d'Haïti / XE.com)
    const rates = { 'USD:HTG': 131.5, 'HTG:USD': 0.0076, 'EUR:HTG': 142.0, 'HTG:EUR': 0.007 };
    const rate = rates[`${from}:${to}`] || 1;
    return { from, to, rate, source: 'BRH', updatedAt: new Date().toISOString() };
  }, 5 * 60_000);
  res.json({ success: true, data });
}));

router.post('/send-money', authMiddleware, asyncHandler(async (req, res) => {
  const { recipientPhone, amount, currency, note } = req.body;
  // TODO: integrate MonCash / Natcom / Digicel API
  const ref = `JF-${Date.now()}`;
  res.json({ success: true, data: { reference: ref, status: 'pending', message: 'Peman an ap trete' } });
}));

export default router;
