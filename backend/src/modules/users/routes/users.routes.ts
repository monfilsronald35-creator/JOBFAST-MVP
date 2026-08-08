import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { SettingsController } from '../controllers/SettingsController.js';
import { UserService } from '../services/UserService.js';
import { SupabaseUserRepository } from '../repositories/SupabaseUserRepository.js';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { validateBody, validateQuery, schemas } from '../../../core/middleware/validate.middleware.js';
import { UpdateUserDTO, UserFilterDTO } from '../dto/index.js';

export function createUsersRouter(): Router {
  const router     = Router();
  const repo       = new SupabaseUserRepository();
  const service    = new UserService(repo);
  const controller = new UserController(service);

  router.get('/me',         requireAuth,                                          controller.getMe);
  router.patch('/me',       requireAuth, validateBody(UpdateUserDTO),             controller.updateMe);
  router.delete('/me',      requireAuth,                                          controller.deleteMe);

  router.get('/',           requireAuth, requireRole('admin', 'superadmin'),
                            validateQuery(UserFilterDTO),                         controller.listUsers);
  router.get('/:id',        requireAuth, validateQuery(schemas.id),               controller.getById);

  router.post('/:id/suspend',  requireAuth, requireRole('admin', 'superadmin'),   controller.suspend);
  router.post('/:id/activate', requireAuth, requireRole('admin', 'superadmin'),   controller.activate);

  // ── Settings ──────────────────────────────────────────────────────────────────
  router.get(   '/settings',                requireAuth, SettingsController.getSettings);
  router.patch( '/settings',                requireAuth, SettingsController.updateSettings);
  router.get(   '/sessions',                requireAuth, SettingsController.getSessions);
  router.delete('/sessions/:sessionId',     requireAuth, SettingsController.revokeSession);
  router.get(   '/devices',                 requireAuth, SettingsController.getDevices);
  router.delete('/devices/:deviceId',       requireAuth, SettingsController.revokeDevice);
  router.post(  '/delete-account',          requireAuth, SettingsController.deleteAccount);

  return router;
}
