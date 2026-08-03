import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { SecurityController }       from '../controllers/SecurityController.js';

export const securityRouter = Router();
const R  = requireAuth;
const A  = requireRole('admin', 'superadmin');
const C  = SecurityController;

// ── Security stats (admin) ────────────────────────────────────────────────────
securityRouter.get  ('/stats',                     R, A, C.getStats);

// ── Audit log (admin) ─────────────────────────────────────────────────────────
securityRouter.get  ('/audit',                     R, A, C.searchAuditLog);

// ── Fraud & risk scores ───────────────────────────────────────────────────────
securityRouter.get  ('/risk/me',                   R,    C.getUserRiskScore);
securityRouter.get  ('/risk/:userId',              R, A, C.getUserRiskScore);

// ── Device management (own user) ─────────────────────────────────────────────
securityRouter.get  ('/devices',                   R,    C.listMyDevices);
securityRouter.post ('/devices/trust',             R,    C.trustDevice);
securityRouter.post ('/devices/revoke',            R,    C.revokeDevice);

// ── Incidents (admin) ─────────────────────────────────────────────────────────
securityRouter.get  ('/incidents',                 R, A, C.listIncidents);
securityRouter.post ('/incidents',                 R, A, C.createIncident);
securityRouter.post ('/incidents/:id/resolve',     R, A, C.resolveIncident);
securityRouter.post ('/incidents/:id/assign',      R, A, C.assignIncident);
securityRouter.post ('/incidents/:id/false-positive', R, A, C.falsePositive);

// ── Blocked entities (admin) ──────────────────────────────────────────────────
securityRouter.get  ('/blocked',                   R, A, C.listBlocked);
securityRouter.post ('/blocked',                   R, A, C.blockEntity);
securityRouter.delete('/blocked',                  R, A, C.unblockEntity);

// ── Threat intelligence (admin) ───────────────────────────────────────────────
securityRouter.get  ('/threats',                   R, A, C.getThreats);

// ── Compliance & privacy (own user) ─────────────────────────────────────────
securityRouter.get  ('/consent',                   R,    C.getConsent);
securityRouter.post ('/consent/grant',             R,    C.grantConsent);
securityRouter.post ('/consent/revoke',            R,    C.revokeConsent);
securityRouter.post ('/consent/erasure',           R,    C.requestErasure);
securityRouter.get  ('/compliance/retention',      R, A, C.getRetentionPolicy);