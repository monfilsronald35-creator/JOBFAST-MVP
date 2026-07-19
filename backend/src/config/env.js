import dotenv from 'dotenv';

dotenv.config();

function normalize(value) {
  return (value ?? '').toString().trim();
}

function required(name, fallback) {
  const value = normalize(process.env[name]);

  if (!value) {
    if (process.env.APP_STAGE === 'production') {
      throw new Error(`Missing env: ${name}`);
    }
    return fallback;
  }

  return value;
}

function number(name, fallback = 0) {
  const raw = normalize(process.env[name]);
  if (!raw) return fallback;

  const val = Number(raw);
  return Number.isFinite(val) ? val : fallback;
}

function bool(name, fallback = false) {
  const raw = normalize(process.env[name]);
  if (!raw) return fallback;
  return raw.toLowerCase() === 'true';
}

function list(name, fallback = []) {
  const raw = normalize(process.env[name]);
  if (!raw) return fallback;

  return raw
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  APP_NAME: required('APP_NAME', 'JOBFAST'),
  APP_VERSION: required('APP_VERSION', '1.0.0'),
  APP_STAGE: required('APP_STAGE', 'development'),

  PORT: number('PORT', 5000),
  API_PREFIX: required('API_PREFIX', '/api/v1'),

  JWT_SECRET: required('JWT_SECRET', 'jobfast-secret-key-development-only'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  BCRYPT_SALT_ROUNDS: number('BCRYPT_SALT_ROUNDS', 12),

  CORS_ORIGIN: list('CORS_ORIGIN', ['*']),

  // Admin emails — comma-separated list of emails that receive admin role
  ADMIN_EMAILS: list('ADMIN_EMAILS', []),

  FEATURE_MARKETPLACE: bool('FEATURE_MARKETPLACE', true),
  FEATURE_SERVICES: bool('FEATURE_SERVICES', true),

  RATE_LIMIT_MAX: number('RATE_LIMIT_MAX', 100),
  MAX_RADIUS_KM: number('MAX_RADIUS_KM', 50),

  // ── Stripe (optional until payments go live — won't crash when absent) ───
  STRIPE_SECRET_KEY:      process.env.STRIPE_SECRET_KEY      || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET:  process.env.STRIPE_WEBHOOK_SECRET  || '',

  // ── Supabase ──────────────────────────────────────────────────────────────
  // SUPABASE_URL: your project URL  (e.g. https://xyz.supabase.co)
  // SUPABASE_SERVICE_ROLE_KEY: secret key — NEVER expose to frontend
  // SUPABASE_ANON_KEY: public key safe for browser
  // SUPABASE_JWT_SECRET: found in Supabase → Settings → API → JWT Secret
  SUPABASE_URL:              required('SUPABASE_URL', ''),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY', ''),
  SUPABASE_ANON_KEY:         required('SUPABASE_ANON_KEY', ''),
  SUPABASE_JWT_SECRET:       required('SUPABASE_JWT_SECRET', ''),

});
