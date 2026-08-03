import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { GovernmentController }     from '../controllers/GovernmentController.js';

export const governmentRouter = Router();
const R  = requireAuth;
const A  = requireRole('admin', 'superadmin');
const G  = requireRole('admin', 'superadmin', 'gov_officer');
const C  = GovernmentController;

// ── Public ────────────────────────────────────────────────────────────────────
governmentRouter.get  ('/agencies',                    C.listAgencies);
governmentRouter.get  ('/taxes/rates',                 C.getTaxRates);

// ── AI Assistant ──────────────────────────────────────────────────────────────
governmentRouter.post ('/ai/query',                    R, C.aiQuery);
governmentRouter.post ('/ai/validate',                 R, C.validateForm);

// ── Citizen dashboard ─────────────────────────────────────────────────────────
governmentRouter.get  ('/dashboard',                   R, C.getCitizenDashboard);

// ── Identity verification ─────────────────────────────────────────────────────
governmentRouter.get  ('/identity/status',             R, C.getIdentityStatus);
governmentRouter.post ('/identity/start',              R, C.startIdentityVerification);
governmentRouter.post ('/identity/:id/verify',         R, C.verifyDocument);

// ── Permits ───────────────────────────────────────────────────────────────────
governmentRouter.get  ('/permits',                     R, C.listMyPermits);
governmentRouter.post ('/permits',                     R, C.applyPermit);
governmentRouter.post ('/permits/:id/documents',       R, C.uploadPermitDocument);
governmentRouter.post ('/permits/:id/review',          R, G, C.reviewPermit);

// ── Licenses ──────────────────────────────────────────────────────────────────
governmentRouter.get  ('/licenses',                    R, C.listMyLicenses);
governmentRouter.post ('/licenses',                    R, G, C.issueLicense);
governmentRouter.post ('/licenses/:id/renew',          R, C.renewLicense);
governmentRouter.post ('/licenses/:id/suspend',        R, G, C.suspendLicense);

// ── Taxes ─────────────────────────────────────────────────────────────────────
governmentRouter.get  ('/taxes',                       R, C.listMyTaxes);
governmentRouter.post ('/taxes',                       R, C.declareTax);
governmentRouter.post ('/taxes/:id/pay',               R, C.payTax);

// ── Certificates ──────────────────────────────────────────────────────────────
governmentRouter.get  ('/certificates',                R, C.listMyCertificates);
governmentRouter.post ('/certificates',                R, C.requestCertificate);
governmentRouter.post ('/certificates/:id/issue',      R, G, C.issueCertificate);
governmentRouter.post ('/certificates/:id/deliver',    R, G, C.deliverCertificate);

// ── Appointments ──────────────────────────────────────────────────────────────
governmentRouter.get  ('/appointments',                R, C.listMyAppointments);
governmentRouter.post ('/appointments',                R, C.bookAppointment);
governmentRouter.post ('/appointments/:id/cancel',     R, C.cancelAppointment);

// ── Analytics (admin/gov officer) ─────────────────────────────────────────────
governmentRouter.get  ('/analytics/:agencyId',         R, A, C.getAgencyAnalytics);