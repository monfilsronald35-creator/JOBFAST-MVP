import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

// ================= CONNECT =================
export async function connectDatabase() {
  if (!env.DB_URL) {
    console.warn('No DB_URL provided');
    return;
  }

  try {
    if (isConnected || mongoose.connection.readyState === 1) return;

    await mongoose.connect(env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      autoIndex: env.APP_STAGE !== 'production',
    });

    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('DB CONNECTION ERROR:', error.message);

    if (env.APP_STAGE === 'production') {
      process.exit(1);
    }
  }
}

// ================= DISCONNECT =================
export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState === 0) return;

    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('DB DISCONNECT ERROR:', error.message);
  }
}

// ================= STATUS =================
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ================= EVENTS =================
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🟢 MongoDB reconnected');
});