import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { MonetizationController }   from '../controllers/MonetizationController.js';

export const monetizationRouter = Router();
const C = MonetizationController;
const R = requireAuth;
const A = requireRole('admin', 'superadmin');

// ── Public ────────────────────────────────────────────────────────────────────
monetizationRouter.get('/fees', C.calculateFeePreview);

// ── Authenticated ─────────────────────────────────────────────────────────────
monetizationRouter.get ('/status',            R, C.getStatus);
monetizationRouter.get ('/my-invoices',       R, C.getMyInvoices);
monetizationRouter.get ('/my-invoices/:id',   R, C.getInvoice);
monetizationRouter.post('/modal-seen',        R, C.markModalSeen);
monetizationRouter.get ('/modal-status',      R, C.getModalStatus);
monetizationRouter.get ('/free-tier-check',   R, C.checkFreeTier);

// ── Admin: global config ──────────────────────────────────────────────────────
monetizationRouter.get  ('/config',                       R, A, C.getFullConfig);
monetizationRouter.patch('/config/global',                R, A, C.setGlobalEnabled);
monetizationRouter.patch('/config/services/:service',     R, A, C.setServiceEnabled);

// ── Admin: fee rules ──────────────────────────────────────────────────────────
monetizationRouter.get   ('/rules',       R, A, C.listFeeRules);
monetizationRouter.post  ('/rules',       R, A, C.upsertFeeRule);
monetizationRouter.delete('/rules/:id',   R, A, C.deleteFeeRule);

// ── Admin: free tier strategies ───────────────────────────────────────────────
monetizationRouter.get   ('/free-tiers',       R, A, C.listStrategies);
monetizationRouter.post  ('/free-tiers',       R, A, C.upsertStrategy);
monetizationRouter.delete('/free-tiers/:id',   R, A, C.deleteStrategy);

// ── Admin: analytics & dashboard ──────────────────────────────────────────────
monetizationRouter.get('/dashboard',   R, A, C.getDashboard);
monetizationRouter.get('/ai-insights', R, A, C.getAIInsights);

// ── Admin: announcements ──────────────────────────────────────────────────────
monetizationRouter.post('/announce',      R, A, C.announce);
monetizationRouter.get ('/announcements', R, A, C.listAnnouncements);

// ── Admin: reports ────────────────────────────────────────────────────────────
monetizationRouter.get('/reports/commissions', R, A, C.getCommissionReport);