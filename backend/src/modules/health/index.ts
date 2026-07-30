/**
 * Health Module
 * Owns: health appointments, medical workers, wellness listings
 * NO diagnosis logic — routes to care providers only
 * Disclaimer enforced: all responses include NO_DIAGNOSIS_DISCLAIMER
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';

const NO_DIAGNOSIS_DISCLAIMER = 'Enfòmasyon sa a pa yon dyagnostik medikal. Tanpri konsilte yon doktè.';

export function registerHealthModule(app: Express): void {
  const router = Router();

  router.get('/providers',     async (req, res, next) => {
    try {
      const { data } = await db.client().from('health_providers').select('*').eq('active', true);
      res.json({ success: true, data, disclaimer: NO_DIAGNOSIS_DISCLAIMER });
    } catch (err) { next(err); }
  });

  router.post('/appointments', requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('health_appointments')
        .insert({ ...req.body, patient_id: req.user!.sub, created_at: new Date().toISOString() })
        .select().single();
      if (error) throw error;
      res.status(201).json({ success: true, data, disclaimer: NO_DIAGNOSIS_DISCLAIMER });
    } catch (err) { next(err); }
  });

  router.get('/appointments',  requireAuth, async (req, res, next) => {
    try {
      const { data } = await db.client().from('health_appointments')
        .select('*').eq('patient_id', req.user!.sub).order('scheduled_at');
      res.json({ success: true, data, disclaimer: NO_DIAGNOSIS_DISCLAIMER });
    } catch (err) { next(err); }
  });

  app.use('/api/health', router);
}
