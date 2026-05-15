import dotenv from 'dotenv';
dotenv.config();

function normalize(value) {
  return (value || '').trim();
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
  const val = Number(process.env[name]);
  return Number.isFinite(val) ? val : fallback;
}

function bool(name, fallback = false) {
  const val = normalize(process.env[name]);
  return val ? val === 'true' : fallback;
}

function list(name, fallback = []) {
  const val = normalize(process.env[name]);
  return val ? val.split(',').map(v => v.trim()).filter(Boolean) : fallback;
}

export const env = Object.freeze({
  // APP
  APP_NAME: required('APP_NAME', 'JOBFAST'),
  APP_VERSION: required('APP_VERSION', '1.0.0'),
  APP_STAGE: required('APP_STAGE', 'development'),

  // SERVER
  PORT: number('PORT', 5000),
  API_PREFIX: required('API_PREFIX', '/api/v1'),

  // SECURITY
  JWT_SECRET: required('JWT_SECRET'),
  ENCRYPTION_KEY: required('ENCRYPTION_KEY', ''),
  BCRYPT_SALT_ROUNDS: number('BCRYPT_SALT_ROUNDS', 10),

  // DB
  DB_URL: required('DB_URL'),

  // CORS
  CORS_ORIGIN: list('CORS_ORIGIN', ['*']),

  // FEATURES
  FEATURE_MARKETPLACE: bool('FEATURE_MARKETPLACE', true),
  FEATURE_SERVICES: bool('FEATURE_SERVICES', true),

  // LIMITS
  RATE_LIMIT_MAX: number('RATE_LIMIT_MAX', 100),
  MAX_RADIUS_KM: number('MAX_RADIUS_KM', 50),
});