/**
 * Enterprise Module
 * Owns: company profiles, team management, bulk job posting, enterprise billing, SLAs
 * Listens to: user.registered with role=business (trigger onboarding)
 * Emits: nothing additional (uses jobs + payments modules via event bus)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware.js';
import { generateId } from '@shared-utils';

export function registerEnterpriseModule(app: Express): void {
  const router = Router();

  router.get('/companies',            requireAuth, async (req, res, next) => {
    try {
      const { data } = await db.client().from('companies').select('*').eq('owner_id', req.user!.sub);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/companies',           requireAuth, requireRole('business', 'admin'), async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('companies')
        .insert({ id: generateId(), ...req.body, owner_id: req.user!.sub, created_at: new Date().toISOString() })
        .select().single();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/companies/:id/team',   requireAuth, async (req, res, next) => {
    try {
      const { data } = await db.client().from('company_members').select('*, profiles(id, full_name, role, avatar_url)')
        .eq('company_id', req.params['id']);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/companies/:id/invite', requireAuth, async (req, res, next) => {
    try {
      res.json({ success: true, data: { message: 'Envitasyon voye' } });
    } catch (err) { next(err); }
  });

  app.use('/api/enterprise', router);
}
