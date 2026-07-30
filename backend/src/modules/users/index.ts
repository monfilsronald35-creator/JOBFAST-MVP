import type { Express } from 'express';
import { createUsersRouter } from './routes/users.routes.js';
import { createProfileRouter } from './routes/profile.routes.js';

export function registerUsersModule(app: Express): void {
  app.use('/api/users', createUsersRouter());
  app.use('/api/users', createProfileRouter());
}

export { UserService }              from './services/UserService.js';
export { SupabaseUserRepository }   from './repositories/SupabaseUserRepository.js';
export { User }                     from './entities/User.js';
export { UserUpdatedEvent, UserSuspendedEvent, UserDeletedEvent, UserVerifiedEvent } from './events/UserEvents.js';
