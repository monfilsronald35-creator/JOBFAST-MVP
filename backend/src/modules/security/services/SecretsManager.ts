// Secrets Manager — validates required secrets at startup, never exposes them in logs.
// In production: replace getSecret() with calls to AWS Secrets Manager / GCP Secret Manager.

type SecretKey =
  | 'JWT_SECRET' | 'ENCRYPTION_KEY' | 'FIELD_HASH_SECRET'
  | 'SUPABASE_URL' | 'SUPABASE_SERVICE_KEY'
  | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'
  | 'OPENAI_API_KEY'
  | 'SMTP_PASS'
  | 'GOOGLE_MAPS_API_KEY' | 'MAPBOX_TOKEN'
  | 'ALLOWED_ORIGINS';

const REQUIRED: SecretKey[] = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

export const SecretsManager = {
  get(key: SecretKey): string | undefined {
    return process.env[key];
  },

  require(key: SecretKey): string {
    const val = process.env[key];
    if (!val) throw new Error(`[SecretsManager] Required secret ${key} is not set. Check your .env file.`);
    return val;
  },

  // Call during bootstrap — logs which optional secrets are missing (no values)
  validateOnStartup(): void {
    const missing: SecretKey[] = [];
    for (const key of REQUIRED) {
      if (!process.env[key]) missing.push(key);
    }
    if (missing.length > 0) {
      console.error(`[SecretsManager] CRITICAL: Missing required secrets: ${missing.join(', ')}`);
      // Don't exit in dev — warn and continue
      if (process.env['NODE_ENV'] === 'production') process.exit(1);
    }

    const optional: SecretKey[] = ['STRIPE_SECRET_KEY', 'OPENAI_API_KEY', 'GOOGLE_MAPS_API_KEY', 'ENCRYPTION_KEY'];
    const missingOpt = optional.filter(k => !process.env[k]);
    if (missingOpt.length > 0) {
      console.warn(`[SecretsManager] Optional secrets not set (some features may be limited): ${missingOpt.join(', ')}`);
    }
  },

  // Redact secrets from objects before logging
  redact<T extends Record<string, unknown>>(obj: T): T {
    const SENSITIVE = ['password', 'token', 'secret', 'key', 'hash', 'stripe', 'auth'];
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const lower = k.toLowerCase();
        const isSensitive = SENSITIVE.some(s => lower.includes(s));
        return [k, isSensitive ? '[REDACTED]' : v];
      }),
    ) as T;
  },
};