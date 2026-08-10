import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[ENV] Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = Object.freeze({
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: Number(process.env['PORT'] ?? 5000),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
});
