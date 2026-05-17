import app from './app.js';
import { appConfig } from '../config/env.js';
import { disconnectDatabase } from '../config/database.js';

// ========================================
// 🌍 JOBFAST — SERVER ENTRY POINT
// ========================================

const PORT = process.env.PORT || 5000;

let isShuttingDown = false;

// ========================================
// 🚀 START SERVER
// ========================================

const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${appConfig?.stage || 'development'}`);
  console.log('=================================');
});

// ========================================
// 🛑 SAFE SHUTDOWN
// ========================================

const shutdown = async (signal, error = null) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log('=================================');
  console.log(`⚠️ Received signal: ${signal}`);

  if (error) {
    console.error('❌ Error:', error.message || error);
  }

  console.log('🛑 Shutting down server...');
  console.log('=================================');

  server.close(async () => {
    try {
      // ================= DATABASE CLOSE =================
      if (typeof disconnectDatabase === 'function') {
        await disconnectDatabase();
        console.log('🧹 Database disconnected');
      }

      console.log('✅ Server closed successfully');

      process.exit(error ? 1 : 0);
    } catch (dbError) {
      console.error('❌ Database shutdown error:', dbError.message);

      process.exit(1);
    }
  });

  // ================= FORCE EXIT =================
  setTimeout(() => {
    console.error('❌ Forced shutdown timeout');

    process.exit(1);
  }, 10000);
};

// ========================================
// ❌ SERVER ERROR
// ========================================

server.on('error', (err) => {
  shutdown('SERVER_ERROR', err);
});

// ========================================
// ❌ UNHANDLED ERRORS
// ========================================

process.on('unhandledRejection', (err) => {
  shutdown('UNHANDLED_REJECTION', err);
});

process.on('uncaughtException', (err) => {
  shutdown('UNCAUGHT_EXCEPTION', err);
});

// ========================================
// 🛑 TERMINATION SIGNALS
// ========================================

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});