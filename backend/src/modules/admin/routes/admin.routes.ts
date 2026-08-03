import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { AdminController }          from '../controllers/AdminController.js';

export const adminRouter = Router();
const R = requireAuth;
const A = requireRole('admin', 'superadmin');
const S = requireRole('superadmin');
const C = AdminController;

// All admin routes require auth + admin role
adminRouter.use(R, A);

// ── Platform stats ────────────────────────────────────────────────────────────
adminRouter.get  ('/stats',                       C.getStats);
adminRouter.get  ('/health',                      C.health);

// ── User management ───────────────────────────────────────────────────────────
adminRouter.get  ('/users',                       C.listUsers);
adminRouter.post ('/users/:userId/suspend',       C.suspendUser);
adminRouter.post ('/users/:userId/activate',      C.activateUser);
adminRouter.post ('/users/:userId/ban',           S, C.banUser);
adminRouter.patch('/users/:userId/role',          S, C.changeRole);

// ── Moderation ────────────────────────────────────────────────────────────────
adminRouter.get  ('/moderation',                  C.getModerationQueue);
adminRouter.post ('/moderation/:id/resolve',      C.resolveModeration);

// ── Feature flags ─────────────────────────────────────────────────────────────
adminRouter.get  ('/flags',                       C.getFlags);
adminRouter.patch('/flags/:key',                  S, C.setFlag);

// ── System config ─────────────────────────────────────────────────────────────
adminRouter.get  ('/config',                      S, C.getConfig);
adminRouter.put  ('/config/:key',                 S, C.setConfig);

// ── Audit log ─────────────────────────────────────────────────────────────────
adminRouter.get  ('/audit',                       C.getAuditLog);