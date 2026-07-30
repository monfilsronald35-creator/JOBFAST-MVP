import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
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

  return router;
}
