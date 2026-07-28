/**
 * API Gateway — Single entry point for all requests
 * Handles: rate limiting, security headers, versioning, circuit breaker
 */
import crypto from 'crypto';

const BIN_SIZE_MS = 60_000;

function createRateLimiter({ windowMs = 60_000, max = 100, keyFn = req => req.ip } = {}) {
  const bins = new Map();

  const sweep = () => {
    const now = Date.now();
    for (const [key, bin] of bins) {
      if (now - bin.ts > windowMs * 2) bins.delete(key);
    }
  };

  setInterval(sweep, windowMs).unref();

  return (req, res, next) => {
    const key  = keyFn(req);
    const now  = Date.now();
    const bin  = bins.get(key) || { ts: now, count: 0 };

    if (now - bin.ts > windowMs) { bin.ts = now; bin.count = 0; }
    bin.count++;
    bins.set(key, bin);

    res.setHeader('X-RateLimit-Limit',     max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bin.count));
    res.setHeader('X-RateLimit-Reset',     Math.ceil((bin.ts + windowMs) / 1000));

    if (bin.count > max) {
      return res.status(429).json({
        success: false,
        error:   'Too many requests',
        retryAfter: Math.ceil((bin.ts + windowMs - now) / 1000),
      });
    }
    next();
  };
}

// Per-route rate limits
export const rateLimiters = {
  // Auth routes — tighter limits to prevent brute force
  auth: createRateLimiter({
    windowMs: 15 * 60_000,
    max: 20,
    keyFn: req => `auth:${req.ip}`,
  }),

  // Public search — generous
  search: createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyFn: req => `search:${req.ip}`,
  }),

  // Financial ops — very tight
  financial: createRateLimiter({
    windowMs: 60_000,
    max: 30,
    keyFn: req => `fin:${req.user?.id || req.ip}`,
  }),

  // General API
  general: createRateLimiter({
    windowMs: 60_000,
    max: 200,
    keyFn: req => `api:${req.ip}`,
  }),

  // Upload / heavy ops
  upload: createRateLimiter({
    windowMs: 60_000,
    max: 10,
    keyFn: req => `upload:${req.user?.id || req.ip}`,
  }),
};

// Security headers beyond Helmet defaults
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options',  'nosniff');
  res.setHeader('X-Frame-Options',         'DENY');
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',      'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('X-Request-Id',            req.id || crypto.randomUUID());
  next();
}

// API version check — warns on unsupported versions
export function apiVersioning(req, res, next) {
  const version = req.headers['x-api-version'] || 'v1';
  const supported = ['v1'];
  if (!supported.includes(version)) {
    res.setHeader('X-API-Version-Warning', `Version ${version} not supported. Use: v1`);
  }
  req.apiVersion = version;
  next();
}

// Simple circuit breaker state (per-service)
const circuits = new Map();

export function circuitBreaker(serviceName, { threshold = 5, timeout = 30_000 } = {}) {
  return (req, res, next) => {
    const c = circuits.get(serviceName) || { failures: 0, openAt: null };
    if (c.openAt && Date.now() - c.openAt < timeout) {
      return res.status(503).json({
        success: false,
        error:   `Service ${serviceName} temporarily unavailable`,
        retryAfter: Math.ceil((c.openAt + timeout - Date.now()) / 1000),
      });
    }
    if (c.openAt) { c.failures = 0; c.openAt = null; }
    circuits.set(serviceName, c);

    res.on('finish', () => {
      if (res.statusCode >= 500) {
        c.failures++;
        if (c.failures >= threshold) c.openAt = Date.now();
      } else {
        c.failures = 0;
      }
    });
    next();
  };
}

// Compose gateway middleware for the API prefix
export function gateway() {
  return [securityHeaders, apiVersioning, rateLimiters.general];
}

export default { gateway, rateLimiters, circuitBreaker, securityHeaders, apiVersioning };
