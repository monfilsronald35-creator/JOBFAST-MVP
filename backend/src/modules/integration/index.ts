import type { Express } from 'express';
import { integrationRouter }     from './routes/integration.routes.js';
import { EventRouterService }    from './services/EventRouterService.js';

export { PartnerService }               from './services/PartnerService.js';
export { APIKeyService }                from './services/APIKeyService.js';
export { WebhookService }               from './services/WebhookService.js';
export { OAuthService }                 from './services/OAuthService.js';
export { IntegrationMonitoringService } from './services/IntegrationMonitoringService.js';
export { EventRouterService }           from './services/EventRouterService.js';
export * from './types/integration.types.js';

export function registerIntegrationModule(app: Express): void {
  // Subscribe to all domain events and route them to partner webhooks
  EventRouterService.init();

  app.use('/api/integration', integrationRouter);
}
