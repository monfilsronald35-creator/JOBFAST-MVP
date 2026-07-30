import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { SupabaseAuthRepository } from '../repositories/SupabaseAuthRepository.js';
import { requireAuth } from '../../../core/middleware/auth.middleware.js';
import { validateBody } from '../../../core/middleware/validate.middleware.js';
import { LoginDTO, RegisterDTO, RefreshTokenDTO, ChangePasswordDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../dto/index.js';

export function createAuthRouter(): Router {
  const router     = Router();
  const repo       = new SupabaseAuthRepository();
  const service    = new AuthService(repo);
  const controller = new AuthController(service);

  router.post('/login',          validateBody(LoginDTO),          controller.login);
  router.post('/register',       validateBody(RegisterDTO),       controller.register);
  router.post('/refresh',        validateBody(RefreshTokenDTO),   controller.refresh);
  router.get( '/me',             requireAuth,                     controller.me);
  router.post('/change-password',requireAuth, validateBody(ChangePasswordDTO), controller.changePassword);
  router.post('/forgot-password',validateBody(ForgotPasswordDTO), controller.forgotPassword);
  router.post('/reset-password', validateBody(ResetPasswordDTO),  controller.resetPassword);

  return router;
}
