import 'dotenv/config';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { createApp }     from './app.js';
import { ChatGateway }   from './modules/chat/gateway/ChatGateway.js';

const PORT = Number(process.env['PORT'] ?? 5000);

async function bootstrap(): Promise<void> {
  const app        = createApp();
  const httpServer = http.createServer(app);

  // ——— Socket.io ————————————————————————————————————————————————————————————
  const io = new SocketIO(httpServer, {
    cors: {
      origin:  (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173').split(','),
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    path:       '/socket.io',
  });

  // Chat real-time gateway (replaces stub socket handlers)
  ChatGateway.init(io);

  // Make io available to modules that need to push real-time updates
  app.set('io', io);

  // ——— Start ————————————————————————————————————————————————————————————————
  httpServer.listen(PORT, () => {
    console.log(`[JOBFAST] Server running on port ${PORT} (${process.env['NODE_ENV'] ?? 'development'})`);
    console.log(`[JOBFAST] Modular Monolith — 22 domain modules loaded`);
  });

  process.on('SIGTERM', () => {
    console.log('[JOBFAST] SIGTERM received — graceful shutdown');
    httpServer.close(() => process.exit(0));
  });
}

bootstrap().catch(err => {
  console.error('[JOBFAST] Bootstrap failed:', err);
  process.exit(1);
});
