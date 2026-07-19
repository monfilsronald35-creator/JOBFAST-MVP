import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketIO } from 'socket.io';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { setIO } from './src/utils/io.js';

const PORT = env.PORT || 5000;

// ── Socket.io server ──────────────────────────────────────────────────────────
// Wrap Express app in a plain http.Server so socket.io can share the port.
const httpServer = http.createServer(app);

const io = new SocketIO(httpServer, {
  cors: {
    // Allow any origin — Vercel domains, local dev, ngrok, etc.
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // Attach to /socket.io path (socket.io-client default)
  path: '/socket.io',
});

io.on('connection', (socket) => {
  // Auth: user joins their personal room (receives targeted events)
  socket.on('auth:join', ({ userId, role } = {}) => {
    if (userId) socket.join(`user:${userId}`);
    if (role)   socket.join(`role:${role}`);
  });

  // Auth: user leaves their room on logout
  socket.on('auth:logout', ({ userId } = {}) => {
    if (userId) socket.leave(`user:${userId}`);
  });

  // Presence: broadcast status change to everyone
  socket.on('user:status_change', ({ userId, status } = {}) => {
    if (userId) socket.broadcast.emit('user:status_change', { userId, status });
  });

  // Chat: join/leave a conversation room
  socket.on('conversation:join',  ({ conversationId } = {}) => {
    if (conversationId) socket.join(conversationId);
  });
  socket.on('conversation:leave', ({ conversationId } = {}) => {
    if (conversationId) socket.leave(conversationId);
  });

  // Chat: relay a message to everyone else in the conversation
  socket.on('message:send', (data = {}) => {
    if (data.conversationId) {
      socket.to(data.conversationId).emit('message:receive', data);
    }
  });

  // Typing indicators
  socket.on('typing:start', ({ conversationId, userId } = {}) => {
    if (conversationId) socket.to(conversationId).emit('typing:start', { userId });
  });
  socket.on('typing:stop',  ({ conversationId, userId } = {}) => {
    if (conversationId) socket.to(conversationId).emit('typing:stop',  { userId });
  });
});

// Export io so routes can push events (e.g. notifications, payment webhooks)
setIO(io);
export { io };

async function start() {
  try {
    httpServer.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 JOBFAST BACKEND LIVE ON PORT: ${PORT}`);
      console.log(`🔌 Socket.io ready on /socket.io`);
      console.log('=================================');
    });

    // ── Keep-alive: prevent Render free-tier cold starts ──────────────────
    // Render sets RENDER_EXTERNAL_URL automatically. On every other platform
    // (local, Railway, Fly) this block is simply skipped.
    const SELF_URL = process.env.RENDER_EXTERNAL_URL
      || (process.env.RENDER_EXTERNAL_HOSTNAME
          ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
          : null);

    if (SELF_URL) {
      const PING_MS = 9 * 60 * 1000; // every 9 min (Render sleeps after 15 min)
      setInterval(() => {
        fetch(`${SELF_URL}/health`, { signal: AbortSignal.timeout(8000) })
          .then(() => console.log('♻️  Keep-alive ping OK'))
          .catch(() => {}); // silent — never crash the server
      }, PING_MS);
      console.log(`♻️  Keep-alive aktif → ${SELF_URL}/health (chak 9 min)`);
    }

    console.log('🗄️  Supabase PostgreSQL aktif kòm baz done prensipal');

    const shutdown = async (signal) => {
      console.log(`⚠️ ${signal} received. Stopping gracefully...`);
      httpServer.close(() => {
        console.log('🛑 Server stopped.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

start();
