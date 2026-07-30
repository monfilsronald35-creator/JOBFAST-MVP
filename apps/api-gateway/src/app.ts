import express from 'express';
import { PIPELINE } from './middleware/pipeline.js';
import { getSnapshot } from './layers/monitoring/Metrics.js';
import { getCacheStats } from './layers/cache/GatewayCache.js';
import { getDDoSStats } from './layers/security/DDoSProtection.js';
import { getRateLimitStats } from './layers/rateLimit/TieredRateLimiter.js';
import { env } from './config/env.js';

export function createGateway(): express.Application {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.disable('etag');

  // Parse JSON and URL-encoded bodies (before WAF so body is available for scanning)
  app.use(express.json({ limit: `${env.MAX_BODY_SIZE_MB}mb` }));
  app.use(express.urlencoded({ extended: true, limit: `${env.MAX_BODY_SIZE_MB}mb` }));

  // Readiness check (bypasses full pipeline)
  app.get('/readyz', (_req, res) => {
    res.json({ status: 'ready' });
  });

  // Live metrics endpoint (internal only — protect with internal token in production)
  app.get('/metrics', (req, res) => {
    const token = req.headers['x-internal-token'];
    if (env.INTERNAL_TOKEN && token !== env.INTERNAL_TOKEN) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json({
      gateway:   getSnapshot(),
      cache:     getCacheStats(),
      ddos:      getDDoSStats(),
      rateLimit: getRateLimitStats(),
    });
  });

  // Full pipeline — handles all /api/* and versioned routes
  app.use(PIPELINE);

  // Catch-all 404 (only reached if RoutingEngine called next)
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[GATEWAY] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal gateway error', code: 'GATEWAY_ERROR' });
  });

  return app;
}
