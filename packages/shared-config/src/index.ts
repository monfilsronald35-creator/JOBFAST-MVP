import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:                   z.enum(['development', 'test', 'production']).default('development'),
  PORT:                       z.coerce.number().default(5000),

  // Database
  SUPABASE_URL:               z.string().url(),
  SUPABASE_ANON_KEY:          z.string(),
  SUPABASE_SERVICE_ROLE_KEY:  z.string(),

  // Auth
  JWT_SECRET:                 z.string().min(32),
  JWT_REFRESH_SECRET:         z.string().min(32).optional(),
  JWT_EXPIRY:                 z.string().default('7d'),
  JWT_REFRESH_EXPIRY:         z.string().default('30d'),

  // Frontend
  FRONTEND_URL:               z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS:            z.string().default('http://localhost:5173'),

  // Payments
  STRIPE_SECRET_KEY:          z.string().optional(),
  STRIPE_WEBHOOK_SECRET:      z.string().optional(),

  // Storage
  SUPABASE_STORAGE_BUCKET:    z.string().default('media'),

  // Cache / Queue
  REDIS_URL:                  z.string().url().optional(),

  // Notifications
  VAPID_PUBLIC_KEY:           z.string().optional(),
  VAPID_PRIVATE_KEY:          z.string().optional(),
  VAPID_EMAIL:                z.string().email().optional(),

  // AI
  OPENAI_API_KEY:             z.string().optional(),
  ANTHROPIC_API_KEY:          z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS:       z.coerce.number().default(60_000),
  RATE_LIMIT_MAX:             z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (_config) return _config;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map(i => i.path.join('.')).join(', ');
    throw new Error(`[Config] Missing or invalid env vars: ${missing}`);
  }
  _config = result.data;
  return _config;
}

export const config = new Proxy({} as EnvConfig, {
  get: (_target, prop: string) => getConfig()[prop as keyof EnvConfig],
});
