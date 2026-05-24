// ======================================================
// 🌍 JOBFAST — SERVER ENTRY POINT (PRODUCTION SAFE)
// ======================================================

import app from './app.js';
import { appConfig } from './config/env.js';
import { disconnectDatabase } from './config/database.js';

// ======================================================
// 🌍 CONFIG
// ======================================================

const PORT = process.env.PORT || 5000;

let server = null;
let isShuttingDown = false;

// ======================================================
// ❤️ HEALTH CHECK
// ======================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    app: 'JOBFAST',
    status: 'running',
    environment:
      appConfig?.stage || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// 🚀 START SERVER
// ======================================================

const startServer = async () => {
  try {
    server = app.listen(PORT, () => {
      console.log('=================================');
      console.log(
        `🚀 JOBFAST running on port ${PORT}`
      );
      console.log(
        `🌍 Environment: ${
          appConfig?.stage ||
          'development'
        }`
      );
      console.log('=================================');
    });

    // ========================================
    // ❌ SERVER ERROR
    // ========================================

    server.on('error', (err) => {
      console.error(
        '❌ Server error:',
        err.message
      );

      shutdown('SERVER_ERROR', err);
    });

  } catch (error) {
    console.error(
      '❌ Failed to start server'
    );

    console.error(error);

    process.exit(1);
  }
};

// ======================================================
// 🛑 SAFE SHUTDOWN
// ======================================================

const shutdown = async (
  signal,
  error = null
) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log('=================================');
  console.log(
    `⚠️ Received signal: ${signal}`
  );

  if (error) {
    console.error(
      '❌ Error:',
      error.message || error
    );
  }

  console.log(
    '🛑 Shutting down server...'
  );

  console.log('=================================');

  try {

    // ========================================
    // CLOSE HTTP SERVER
    // ========================================

    if (server) {
      await new Promise((resolve) =>
        server.close(resolve)
      );

      console.log(
        '🧹 HTTP server closed'
      );
    }

    // ========================================
    // CLOSE DATABASE
    // ========================================

    if (
      typeof disconnectDatabase ===
      'function'
    ) {
      await disconnectDatabase();

      console.log(
        '🧹 Database disconnected'
      );
    }

    console.log(
      '✅ Shutdown completed'
    );

    process.exit(error ? 1 : 0);

  } catch (shutdownError) {

    console.error(
      '❌ Shutdown error:',
      shutdownError.message
    );

    process.exit(1);
  }
};

// ======================================================
// ❌ UNHANDLED ERRORS
// ======================================================

process.on(
  'unhandledRejection',
  (err) => {
    shutdown(
      'UNHANDLED_REJECTION',
      err
    );
  }
);

process.on(
  'uncaughtException',
  (err) => {
    shutdown(
      'UNCAUGHT_EXCEPTION',
      err
    );
  }
);

// ======================================================
// 🛑 TERMINATION SIGNALS
// ======================================================

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

// ======================================================
// 🚀 BOOT SERVER
// ======================================================

startServer();

// ======================================================
// 🌍 EXPORT APP
// ======================================================

export default app;