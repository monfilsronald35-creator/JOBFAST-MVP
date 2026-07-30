import 'dotenv/config';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { createApp } from './app.js';

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

  io.on('connection', socket => {
    socket.on('auth:join',  ({ userId, role }: { userId?: string; role?: string } = {}) => {
      if (userId) socket.join(`user:${userId}`);
      if (role)   socket.join(`role:${role}`);
    });

    socket.on('auth:logout', ({ userId }: { userId?: string } = {}) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    socket.on('conversation:join',  ({ conversationId }: { conversationId?: string } = {}) => {
      if (conversationId) socket.join(conversationId);
    });

    socket.on('conversation:leave', ({ conversationId }: { conversationId?: string } = {}) => {
      if (conversationId) socket.leave(conversationId);
    });

    socket.on('message:send', (data: { conversationId?: string } = {}) => {
      if (data.conversationId) socket.to(data.conversationId).emit('message:receive', data);
    });
  });

  // Make io available to modules that need to push real-time updates
  app.set('io', io);

  // ——— Start ————————————————————————————————————————————————————————————————
  httpServer.listen(PORT, () => {
    console.log(`[JOBFAST] Server running on port ${PORT} (${process.env['NODE_ENV'] ?? 'development'})`);
    console.log(`[JOBFAST] Modular Monolith — 18 domain modules loaded`);
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
