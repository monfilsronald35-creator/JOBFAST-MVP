import type { Express } from 'express';
import { buildIdentityRouter } from './routes/identity.routes.js';

export function registerIdentityModule(app: Express): void {
  app.use('/api/identity', buildIdentityRouter());
  console.log('[Identity] Module registered → /api/identity');
}

export { IdentityService }  from './services/IdentityService.js';
export { SessionService }   from './services/SessionService.js';
export { DeviceService }    from './services/DeviceService.js';
export { MFAService }       from './services/MFAService.js';
export { TokenService }     from './services/TokenService.js';
export { RiskEngine }       from './services/RiskEngine.js';
export { RecoveryService }  from './services/RecoveryService.js';
export { OAuthService }     from './services/OAuthService.js';
export * from './types/identity.types.js';
