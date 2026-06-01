import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';

let bootstrapped = false;

export async function bootstrap() {
  if (bootstrapped) return;

  console.log('⚙️ Bootstrapping application...');

  try {
    if (!env.DB_URL) {
      throw new Error('DB_URL_MISSING');
    }

    await connectDatabase();

    console.log('🟢 Database connected successfully');

    bootstrapped = true;
    console.log('🚀 App fully ready');
  } catch (error) {
    console.error('❌ Bootstrap failed:', error.message);

    if (env.APP_STAGE === 'production') {
      process.exit(1);
    }

    throw error;
  }
}
