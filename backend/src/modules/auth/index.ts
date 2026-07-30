import type { Express } from 'express';
import { createAuthRouter } from './routes/auth.routes.js';

export function registerAuthModule(app: Express): void {
  app.use('/api/auth', createAuthRouter());
}

export { AuthService }       from './services/AuthService.js';
export { SupabaseAuthRepository } from './repositories/SupabaseAuthRepository.js';
export { UserLoggedInEvent, UserRegisteredEvent, PasswordChangedEvent } from './events/AuthEvents.js';
export type { AuthenticatedUser, LoginResult, AuthTokenPair } from './types/index.js';
