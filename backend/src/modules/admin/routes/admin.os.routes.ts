import { Router }                    from 'express';
import { requireRole }              from '../../../core/middleware/auth.middleware.js';
import { AdminOSController }        from '../controllers/AdminOSController.js';

export const adminOSRouter = Router();
const C  = AdminOSController;
const A  = requireRole('admin', 'superadmin');
const S  = requireRole('superadmin');

// All OS routes require at minimum admin role (applied by parent router)

// ── 1. Global Dashboard ───────────────────────────────────────────────────────
adminOSRouter.get('/dashboard/stats',   C.getGlobalStats);
adminOSRouter.get('/dashboard/live',    C.getLiveMetrics);

// ── 2. User Control (extended) ────────────────────────────────────────────────
adminOSRouter.get ('/users/:userId/detail',         C.getUserDetail);
adminOSRouter.get ('/users/:userId/devices',        C.getUserDevices);
adminOSRouter.get ('/users/:userId/activity',       C.getUserActivity);
adminOSRouter.post('/users/:userId/verify',         C.verifyUser);
adminOSRouter.post('/users/:userId/reset-sessions', S, C.resetUserSessions);
adminOSRouter.post('/users/:userId/reset-mfa',      S, C.resetUserMFA);

// ── 3. Country Command ────────────────────────────────────────────────────────
adminOSRouter.get  ('/countries',                       C.listCountriesAdmin);
adminOSRouter.get  ('/countries/:code',                 C.getCountryAdmin);
adminOSRouter.patch('/countries/:code/features',        S, C.updateCountryFeatures);
adminOSRouter.get  ('/countries/context/:userId',       C.getUserCountryContext);

// ── 5. AI Command ─────────────────────────────────────────────────────────────
adminOSRouter.get  ('/ai/config',           C.getAIConfig);
adminOSRouter.patch('/ai/config/routing',   S, C.updateAIModelRouting);
adminOSRouter.patch('/ai/config/template',  S, C.updateAIPromptTemplate);
adminOSRouter.patch('/ai/config/cost',      S, C.updateAICostLimits);
adminOSRouter.patch('/ai/config/feature',   S, C.toggleAIFeature);
adminOSRouter.get  ('/ai/cost',             C.getAICostReport);

// ── 6. Revenue Command ────────────────────────────────────────────────────────
adminOSRouter.get('/revenue/dashboard',    C.getRevenueDashboard);
adminOSRouter.get('/revenue/ai-insights',  C.getRevenueAIInsights);
adminOSRouter.get('/revenue/commissions',  C.getCommissionReport);

// ── 7. Security Command ───────────────────────────────────────────────────────
adminOSRouter.get('/security/overview',    C.getSecurityOverview);
adminOSRouter.get('/audit',                C.getAuditLogAdmin);

// ── 8. Live Monitoring ────────────────────────────────────────────────────────
adminOSRouter.get('/monitoring/feed',      C.getLiveFeed);
adminOSRouter.get('/monitoring/errors',    C.getRecentErrors);

// ── 9. Global Search ──────────────────────────────────────────────────────────
adminOSRouter.get('/search',               C.globalSearch);

// ── 10. Emergency Mode ────────────────────────────────────────────────────────
adminOSRouter.get ('/emergency',            C.getEmergencyStatus);
adminOSRouter.post('/emergency/activate',   S, C.activateEmergency);
adminOSRouter.post('/emergency/deactivate', S, C.deactivateEmergency);

// ── 11. Broadcast ─────────────────────────────────────────────────────────────
adminOSRouter.post('/broadcast',           C.sendBroadcast);
adminOSRouter.get ('/broadcasts',          C.listBroadcasts);

// ── 13. Role System ───────────────────────────────────────────────────────────
adminOSRouter.get ('/roles',                  C.listAdminRoles);
adminOSRouter.get ('/roles/:role/permissions',C.getRolePermissions);
adminOSRouter.post('/roles/assign',           S, C.assignAdminRole);
adminOSRouter.get ('/roles/admin-users',      C.listAdminUsers);

// ── 15. System Health ─────────────────────────────────────────────────────────
adminOSRouter.get('/system/health',                   C.getSystemHealth);
adminOSRouter.get('/system/health/:service/history',  C.getServiceHealthHistory);

// ── 17. Founder Mode (superadmin only) ───────────────────────────────────────
adminOSRouter.get('/founder/dashboard',    S, C.getFounderDashboard);
