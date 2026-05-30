// ======================================================
// 🌍 JOBFAST — SERVER ENTRY POINT (ENTERPRISE PRODUCTION READY)
// ======================================================

import app from './app.js';
import { appConfig } from './config/env.js';
import { disconnectDatabase } from './config/database.js';
import winston from 'winston';

// ======================================================
// 📊 ENTERPRISE LOGGING SYSTEM (WINSTON CONFIG)
// ======================================================
const logger = winston.createLogger({
  level: appConfig?.stage === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // 🔥 Captures complete stack traces automatically
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'jobfast-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level}: ${message} ${stack ? `\n💥 Stack: ${stack}` : ''}`;
        })
      )
    })
  ]
});

// ======================================================
// 🌍 CONFIGURATION
// ======================================================
const PORT = Number(appConfig?.port || process.env.PORT || 5000);

let server = null;
let isShuttingDown = false;

// 💡 INFO: Wout "/api/health" la retire isit la! Li sipoze deklare 
// nan routes/health.route.js epi konekte nan app.js pou pwoteje achitekti a.

// ======================================================
// 🚀 START SERVER FUNCTION
// ======================================================
const startServer = async () => {
  try {
    server = app.listen(PORT, () => {
      logger.info('==================================================');
      logger.info(`🚀 JOBFAST GLOBAL BACKEND LIVE ON PORT: ${PORT}`);
      logger.info(`🌍 Environment Stage: ${appConfig?.stage || process.env.NODE_ENV || 'development'}`);
      logger.info('==================================================');
    });

    // ========================================
    // ⚙️ ADVANCED CONNECTION TRACKING
    // ========================================
    // Track tout koneksyon ki aktif pou anpeche vye request pandye pande shutdown
    server.on('connection', (connection) => {
      connection.setTimeout(30000); // 30 segonn timeout pou kenbe sèvè a dinamik
    });

    // ========================================
    // ❌ CAPTURE INTERNAL SERVER ERRORS
    // ========================================
    server.on('error', (err) => {
      logger.error('Critical HTTP server error encountered: %s', err.message);
      shutdown('SERVER_ERROR', err);
    });

  } catch (error) {
    logger.error('Failed to properly initialize HTTP server layer', error);
    process.exit(1);
  }
};

// ======================================================
// 🛑 GRACEFUL SHUTDOWN (ANTI-HANG SYSTEM & EXIT CONSISTENCY)
// ======================================================
const shutdown = async (signal, error = null) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn('==================================================');
  logger.warn(`⚠️ Shutdown sequence initiated by signal: ${signal}`);
  if (error) {
    logger.error('Detailed Crash Context:', error); // Winston otomatikman fòma stack la isit la
  }
  logger.warn('==================================================');

  // 🔥 SAFETY NET: Fòse pwosesis la soti si koneksyon yo pran plis pase 10s pou yo fèmen
  const forceExitTimeout = setTimeout(() => {
    logger.error('❌ Force shutdown executed: Graceful cleanup timed out.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  // Detèmine Exit Code la ki baze sou kalite erè a (Enterprise Pattern)
  let exitCode = 0; // 0 = nòmal
  if (error) {
    if (signal === 'DATABASE_FAILURE') exitCode = 2; // 2 = DB Crash
    else exitCode = 1; // 1 = lòt fòm crash
  }

  try {
    // ========================================
    // 1. CLOSE HTTP SERVER CONNECTIONS SAFELY
    // ========================================
    if (server) {
      logger.info('🛑 Closing active HTTP connections...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info('🧹 HTTP server layers completely closed.');
    }

    // ========================================
    // 2. DISCONNECT DATABASE PIPELINES
    // ========================================
    if (typeof disconnectDatabase === 'function') {
      logger.info('🍃 Disconnecting Mongoose database pipelines...');
      await disconnectDatabase();
      logger.info('🧹 Database pipelines disconnected safely.');
    }

    logger.info('✅ Graceful shutdown completed without memory leaks.');
    clearTimeout(forceExitTimeout);
    process.exit(exitCode);

  } catch (shutdownError) {
    logger.error('❌ Failed to execute clean graceful shutdown', shutdownError);
    process.exit(1);
  }
};

// ======================================================
// ❌ UNHANDLED EXTREME EXCEPTIONS (WITH DETAILED STACK LOGS)
// ======================================================
process.on('unhandledRejection', (err) => {
  logger.error('⚠️ Unhandled Promise Rejection detected!');
  if (err instanceof Error) {
    logger.error(`Stack trace: ${err.stack}`);
  }
  shutdown('UNHANDLED_REJECTION', err);
});

process.on('uncaughtException', (err) => {
  logger.error('⚠️ Uncaught Exception crash detected!');
  logger.error(`Stack trace: ${err.stack}`);
  shutdown('UNCAUGHT_EXCEPTION', err);
});

// ======================================================
// 🛑 OS TERMINATION SIGNALS
// ======================================================
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ======================================================
// 🚀 BOOT SCRIPT ENTRY
// ======================================================
startServer();

// ======================================================
// 🌍 MICRO-EXPORT FOR TESTING LAYERS
// ======================================================
export default app;
