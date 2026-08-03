import { Router }               from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { AnalyticsController }  from '../controllers/AnalyticsController.js';

export const analyticsRouter = Router();
const R  = requireAuth;
const A  = requireRole('admin', 'superadmin');
const C  = AnalyticsController;

// ── Ingest (public write) ─────────────────────────────────────────────────────
analyticsRouter.post  ('/events',               C.trackEvent);
analyticsRouter.post  ('/batch',                C.trackEvent);

// ── Platform KPIs (admin) ─────────────────────────────────────────────────────
analyticsRouter.get   ('/kpis',                 R, A, C.getKPIs);
analyticsRouter.get   ('/realtime',             R, A, C.getRealtime);
analyticsRouter.get   ('/cohort',               R, A, C.getCohort);
analyticsRouter.post  ('/funnel',               R, A, C.getFunnel);

// ── User behavior (own user or admin) ─────────────────────────────────────────
analyticsRouter.get   ('/users/me',             R, C.getUserBehavior);
analyticsRouter.get   ('/users/:userId',        R, A, C.getUserBehavior);

// ── Reports ───────────────────────────────────────────────────────────────────
analyticsRouter.post  ('/reports',              R, C.saveReport);
analyticsRouter.get   ('/reports',              R, C.listReports);

// ── Legacy compat (preserve existing routes) ──────────────────────────────────
analyticsRouter.get   ('/dashboard',            R, A, C.getKPIs);
analyticsRouter.get   ('/media/stats/:id',      R, C.getUserBehavior);