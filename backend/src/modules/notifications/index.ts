import type { Express } from 'express';
import { Router } from 'express';
import { NotificationController } from './controllers/NotificationController.js';
import { NotificationService } from './services/NotificationService.js';
import { registerNotificationHandlers } from './handlers/NotificationHandlers.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';

export function registerNotificationsModule(app: Express): void {
  const service    = new NotificationService();
  const controller = new NotificationController(service);
  const router     = Router();

  router.get('/',         requireAuth, controller.list);
  router.get('/unread',   requireAuth, controller.unreadCount);
  router.post('/:id/read',requireAuth, controller.markRead);
  router.post('/read-all',requireAuth, controller.markAllRead);

  app.use('/api/notifications', router);

  // Register event handlers (this is what makes it event-driven)
  registerNotificationHandlers();
}

export { NotificationService } from './services/NotificationService.js';
export { registerNotificationHandlers } from './handlers/NotificationHandlers.js';
