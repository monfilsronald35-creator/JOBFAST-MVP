import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { env } from './src/config/env.js';

const PORT = env.PORT || 5000;

async function start() {
  try {
    if (!env.DB_URL) {
      throw new Error('DB_URL manke nan .env');
    }

    await mongoose.connect(env.DB_URL);
    console.log('🍃 MongoDB konekte ak siksè');

    const server = app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 JOBFAST BACKEND LIVE ON PORT: ${PORT}`);
      console.log('=================================');
    });

    const shutdown = async (signal) => {
      console.log(`⚠️ ${signal} received. Stopping gracefully...`);

      server.close(async () => {
        await mongoose.disconnect();
        console.log('🛑 Server and MongoDB connections stopped.');
        process.exit(0);
      });

      setTimeout(() => {
        console.log('❌ Force shutdown executed.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

start();
