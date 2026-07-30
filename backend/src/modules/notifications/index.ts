import type { Express }                    from 'express';
import notificationRouter                  from './routes/notification.routes.js';
import { registerNotificationHandlers }    from './handlers/NotificationHandlers.js';

export function registerNotificationsModule(app: Express): void {
  const io = app.get('io') as unknown;

  app.use('/api/notifications', notificationRouter);

  registerNotificationHandlers(io);
}

export { NotificationOrchestratorService } from './services/NotificationOrchestratorService.js';
export { registerNotificationHandlers }    from './handlers/NotificationHandlers.js';