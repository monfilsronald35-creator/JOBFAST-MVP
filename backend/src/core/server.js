import app from './app.js';
import { appConfig } from '../config/env.js';
import { disconnectDatabase } from '../config/database.js';

const PORT = process.env.PORT || 5000;

let isShuttingDown = false;

// ================= START SERVER =================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${appConfig.stage}`);
});

// ================= SHUTDOWN =================
const shutdown = async (signal, error) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`⚠️ Received ${signal}. Shutting down...`);

  if (error) console.error('❌ Error:', error);

  server.close(async () => {
    try {
      await disconnectDatabase();
      console.log('🧹 Database disconnected');
    } catch (e) {
      console.error('❌ DB disconnect error:', e.message);
    }

    console.log('✅ Server closed');
    process.exit(error ? 1 : 0);
  });

  setTimeout(() => {
    console.error('❌ Forced shutdown (timeout)');
    process.exit(1);
  }, 10000);
};

// ================= ERROR HANDLING =================
server.on('error', (err) => shutdown('SERVER_ERROR', err));

process.on('unhandledRejection', (err) =>
  shutdown('UNHANDLED_REJECTION', err)
);

process.on('uncaughtException', (err) =>
  shutdown('UNCAUGHT_EXCEPTION', err)
);

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));