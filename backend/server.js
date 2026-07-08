import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { env } from './src/config/env.js';

const PORT = env.PORT || 5000;

async function start() {
  try {
    // Start HTTP server immediately — don't block on DB
    const server = app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 JOBFAST BACKEND LIVE ON PORT: ${PORT}`);
      console.log('=================================');
    });

    // MongoDB is optional for MVP — in-memory storage works without it
    const dbUrl = env.DB_URL;
    const isLocalMongo = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

    if (!isLocalMongo) {
      try {
        await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 10000 });
        console.log('🍃 MongoDB konekte ak siksè');
      } catch (dbErr) {
        console.warn('⚠️ MongoDB koneksyon echwe — in-memory mode aktif:', dbErr.message);
      }
    } else {
      console.log('ℹ️ In-memory mode aktif (DB_URL pa konfigire pou pwodiksyon)');
    }

    const shutdown = async (signal) => {
      console.log(`⚠️ ${signal} received. Stopping gracefully...`);
      server.close(async () => {
        try { await mongoose.disconnect(); } catch (_) {}
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
