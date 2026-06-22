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
  ENCRYPTION_KEY: required('ENCRYPTION_KEY', ''),
  BCRYPT_SALT_ROUNDS: number('BCRYPT_SALT_ROUNDS', 10),

  DB_URL: required('DB_URL', 'mongodb://localhost:27017/jobfast'),

  CORS_ORIGIN: list('CORS_ORIGIN', ['*']),

  FEATURE_MARKETPLACE: bool('FEATURE_MARKETPLACE', true),
  FEATURE_SERVICES: bool('FEATURE_SERVICES', true),

  RATE_LIMIT_MAX: number('RATE_LIMIT_MAX', 100),
  MAX_RADIUS_KM: number('MAX_RADIUS_KM', 50),
});
