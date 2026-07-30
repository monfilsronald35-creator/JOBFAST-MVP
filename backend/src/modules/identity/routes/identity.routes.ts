import { Router } from 'express';
import { requireAuth } from '../../../core/middleware/auth.middleware.js';
import { IdentityController } from '../controllers/IdentityController.js';
import { SessionController } from '../controllers/SessionController.js';
import { DeviceController } from '../controllers/DeviceController.js';
import { MFAController } from '../controllers/MFAController.js';
import { RecoveryController } from '../controllers/RecoveryController.js';

function wrap(fn: (req: import('express').Request, res: import('express').Response) => Promise<void>) {
  return (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void => {
    fn(req, res).catch(next);
  };
}

export function buildIdentityRouter(): Router {
  const router = Router();

  // ——— Public auth endpoints ————————————————————————————————————————————————
  router.post('/register',              wrap(IdentityController.register));
  router.post('/login',                 wrap(IdentityController.login));
  router.post('/refresh',               wrap(IdentityController.refresh));
  router.post('/oauth/:provider',       wrap(IdentityController.oauthCallback));

  // ——— Account recovery (public) ———————————————————————————————————————————
  router.post('/forgot-password',       wrap(RecoveryController.forgotPassword));
  router.post('/reset-password',        wrap(RecoveryController.resetPassword));
  router.post('/magic-link',            wrap(RecoveryController.requestMagicLink));
  router.post('/magic-link/verify',     wrap(RecoveryController.verifyMagicLink));
  router.post('/verify-email',          wrap(RecoveryController.verifyEmail));

  // ——— Authenticated endpoints —————————————————————————————————————————————
  router.use(requireAuth);

  router.get('/me',                     wrap(IdentityController.me));
  router.post('/logout',                wrap(IdentityController.logout));
  router.post('/logout-all',            wrap(IdentityController.logoutAll));

  // Sessions
  router.get('/sessions',               wrap(SessionController.list));
  router.delete('/sessions',            wrap(SessionController.revokeOthers));
  router.delete('/sessions/:id',        wrap(SessionController.revoke));

  // Devices
  router.get('/devices',                wrap(DeviceController.list));
  router.post('/devices/:id/trust',     wrap(DeviceController.trust));
  router.patch('/devices/:id',          wrap(DeviceController.rename));
  router.delete('/devices/:id',         wrap(DeviceController.remove));

  // MFA
  router.get('/mfa',                    wrap(MFAController.status));
  router.post('/mfa/totp/setup',        wrap(MFAController.setupTOTP));
  router.post('/mfa/totp/verify',       wrap(MFAController.verifyTOTP));
  router.post('/mfa/verify',            wrap(MFAController.verifyMFA));
  router.delete('/mfa/totp',            wrap(MFAController.disableTOTP));
  router.post('/mfa/backup-codes',      wrap(MFAController.regenerateBackupCodes));

  // Phone verification
  router.post('/phone/send-otp',        wrap(RecoveryController.sendPhoneOTP));
  router.post('/phone/verify-otp',      wrap(RecoveryController.verifyPhoneOTP));

  return router;
}
