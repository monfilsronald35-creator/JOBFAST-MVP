import type { Express } from 'express';
import { createMarketplaceRouter } from './routes/marketplace.routes.js';

export function registerMarketplaceModule(app: Express): void {
  app.use('/api/marketplace', createMarketplaceRouter());
}
