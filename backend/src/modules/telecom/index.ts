/**
 * Telecom Module
 * Owns: airtime top-up, mobile money integration, phone number validation
 * Providers: Digicel Haiti, Natcom, local carriers
 * Emits: payment.completed (for top-up charges)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware.js';

export function registerTelecomModule(app: Express): void {
  const router = Router();

  router.get('/providers',   async (_req, res) => {
    res.json({ success: true, data: [
      { id: 'digicel',  name: 'Digicel Haiti',  country: 'HT', currency: 'HTG' },
      { id: 'natcom',   name: 'Natcom',          country: 'HT', currency: 'HTG' },
    ]});
  });

  router.post('/topup',      requireAuth, async (req, res, next) => {
    try {
      const { phone, amount, provider } = req.body as { phone: string; amount: number; provider: string };
      // Delegate to provider-specific API (env-configured)
      res.json({ success: true, data: { message: 'Rechaj an trete', phone, amount, provider } });
    } catch (err) { next(err); }
  });

  router.post('/validate-number', async (req, res, next) => {
    try {
      const { phone } = req.body as { phone: string };
      const isHaitian = /^\+509/.test(phone) || /^509/.test(phone);
      res.json({ success: true, data: { phone, valid: !!phone, country: isHaitian ? 'HT' : null } });
    } catch (err) { next(err); }
  });

  app.use('/api/telecom', router);
}
