/**
 * Admin Module
 * Owns: platform governance, moderation queue, feature flags, system reports
 * All routes require role: admin or superadmin
 * Emits: user.suspended, user.activated (via user module events)
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware.js';

const admin = requireRole('admin', 'superadmin');

export function registerAdminModule(app: Express): void {
  const router = Router();
  router.use(requireAuth, admin);  // All admin routes require auth + admin role

  // Platform stats
  router.get('/stats', async (_req, res, next) => {
    try {
      const [users, jobs, payments] = await Promise.all([
        db.client().from('profiles').select('id', { count: 'exact', head: true }),
        db.client().from('jobs').select('id', { count: 'exact', head: true }),
        db.client().from('payment_intents').select('amount').eq('status', 'completed'),
      ]);
      const revenue = (payments.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
      res.json({ success: true, data: { users: users.count, jobs: jobs.count, revenue } });
    } catch (err) { next(err); }
  });

  // Moderation queue
  router.get('/moderation',           async (_req, res, next) => {
    try {
      const { data } = await db.client().from('moderation_queue').select('*').eq('status', 'pending').order('created_at');
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/moderation/:id/resolve', async (req, res, next) => {
    try {
      const { action, reason } = req.body as { action: 'approve' | 'reject'; reason?: string };
      await db.query(c => c.from('moderation_queue').update({
        status: action === 'approve' ? 'approved' : 'rejected', reason, resolved_at: new Date().toISOString(),
        resolver_id: req.user!.sub,
      }).eq('id', req.params['id']));
      res.status(204).end();
    } catch (err) { next(err); }
  });

  // Feature flags
  router.get('/flags',                async (_req, res, next) => {
    try {
      const { data } = await db.client().from('feature_flags').select('*');
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.patch('/flags/:key',         async (req, res, next) => {
    try {
      await db.query(c => c.from('feature_flags').upsert({ key: req.params['key'], ...req.body }));
      res.status(204).end();
    } catch (err) { next(err); }
  });

  // Health check (system status)
  router.get('/health',               async (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: Date.now() } });
  });

  app.use('/api/admin', router);
}
