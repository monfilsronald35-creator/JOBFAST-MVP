export interface Env {
  NODE_ENV:          'development' | 'staging' | 'production';
  GATEWAY_PORT:      number;
  BACKEND_URL:       string;
  JWT_SECRET:        string;
  INTERNAL_TOKEN?:   string;
  REDIS_URL:         string;
  ALLOWED_ORIGINS:   string;
  API_KEY_PREFIX:    string;
  LOG_LEVEL:         'debug' | 'info' | 'warn' | 'error';
  BLOCKED_IPS:       string;
  BLOCKED_COUNTRIES: string;
  MAX_BODY_SIZE_MB:  number;
  DDOS_WINDOW_MS:    number;
  DDOS_THRESHOLD:    number;
  CACHE_DEFAULT_TTL: number;
}

function get(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`[GATEWAY] Missing required env var: ${key}`);
  return v;
}

function getNum(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? Number(v) : fallback;
}

function loadEnv(): Env {
  const jwtSecret = get('JWT_SECRET', '');
  if (jwtSecret.length < 32) {
    throw new Error('[GATEWAY] JWT_SECRET must be at least 32 characters');
  }

  const nodeEnv = (get('NODE_ENV', 'development')) as Env['NODE_ENV'];
  const logLevel = (get('LOG_LEVEL', 'info')) as Env['LOG_LEVEL'];

  return {
    NODE_ENV:          nodeEnv,
    GATEWAY_PORT:      getNum('GATEWAY_PORT', 8080),
    BACKEND_URL:       get('BACKEND_URL', 'http://localhost:5000'),
    JWT_SECRET:        jwtSecret,
    INTERNAL_TOKEN:    process.env['INTERNAL_TOKEN'],
    REDIS_URL:         get('REDIS_URL', 'redis://localhost:6379'),
    ALLOWED_ORIGINS:   get('ALLOWED_ORIGINS', 'http://localhost:5173'),
    API_KEY_PREFIX:    get('API_KEY_PREFIX', 'jf_v1_'),
    LOG_LEVEL:         logLevel,
    BLOCKED_IPS:       get('BLOCKED_IPS', ''),
    BLOCKED_COUNTRIES: get('BLOCKED_COUNTRIES', ''),
    MAX_BODY_SIZE_MB:  getNum('MAX_BODY_SIZE_MB', 10),
    DDOS_WINDOW_MS:    getNum('DDOS_WINDOW_MS', 60_000),
    DDOS_THRESHOLD:    getNum('DDOS_THRESHOLD', 2_000),
    CACHE_DEFAULT_TTL: getNum('CACHE_DEFAULT_TTL', 30),
  };
}

export const env = loadEnv();
