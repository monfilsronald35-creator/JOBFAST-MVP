import 'dotenv/config';
import http from 'http';
import { createGateway } from './app.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app    = createGateway();
  const server = http.createServer(app);

  server.listen(env.GATEWAY_PORT, () => {
    console.log(`[GATEWAY] API Gateway running on port ${env.GATEWAY_PORT} (${env.NODE_ENV})`);
    console.log(`[GATEWAY] Proxying → ${env.BACKEND_URL}`);
    console.log(`[GATEWAY] Security layers: WAF · DDoS · IPReputation · BotDetection`);
    console.log(`[GATEWAY] Auth layers: JWT · APIKey · InternalToken`);
    console.log(`[GATEWAY] Rate limits: Anonymous=30 · User=300 · Premium=1000 · Enterprise=10000/min`);
  });

  const shutdown = (): void => {
    console.log('[GATEWAY] Shutdown signal received — draining connections');
    server.close(() => {
      console.log('[GATEWAY] Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);

  process.on('uncaughtException', err => {
    console.error('[GATEWAY] Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', reason => {
    console.error('[GATEWAY] Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap().catch(err => {
  console.error('[GATEWAY] Bootstrap failed:', err);
  process.exit(1);
});
