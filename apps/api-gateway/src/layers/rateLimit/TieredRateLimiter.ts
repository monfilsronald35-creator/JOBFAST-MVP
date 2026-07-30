import type { RequestHandler } from 'express';
import type { GatewayRequest, RateLimitTier } from '../../types/gateway.types.js';

const WINDOW_MS = 60_000; // 1 minute

const DEFAULT_LIMITS: RateLimitTier = {
  anonymous:  30,
  user:       300,
  premium:    1_000,
  enterprise: 10_000,
  internal:   Infinity,
};

// Auth endpoints get tighter limits regardless of tier
const AUTH_LIMITS: RateLimitTier = {
  anonymous:  10,
  user:       20,
  premium:    40,
  enterprise: 100,
  internal:   Infinity,
};

interface BucketEntry {
  count:       number;
  windowStart: number;
}

const buckets = new Map<string, BucketEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of buckets) {
    if (now - entry.windowStart > WINDOW_MS * 2) buckets.delete(k);
  }
}, 5 * 60_000).unref();

function getLimit(path: string, plan: GatewayRequest['ctx']['plan']): number {
  const isAuth = path.includes('/auth/');
  const tiers  = isAuth ? AUTH_LIMITS : DEFAULT_LIMITS;
  return tiers[plan] ?? tiers.anonymous;
}

export const TieredRateLimiter: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;
  const { plan, userId, ip } = gReq.ctx;

  if (plan === 'internal') return next();

  const key    = `rl:${plan}:${userId ?? ip}`;
  const limit  = getLimit(req.path, plan);
  const now    = Date.now();

  let entry = buckets.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    buckets.set(key, entry);
  } else {
    entry.count++;
  }

  const remaining = Math.max(0, limit - entry.count);
  const resetAt   = entry.windowStart + WINDOW_MS;

  res.setHeader('X-RateLimit-Limit',     String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset',     String(Math.ceil(resetAt / 1000)));

  if (entry.count > limit) {
    res.status(429).json({
      error:      'Rate limit exceeded',
      code:       'RATE_LIMIT_EXCEEDED',
      limit,
      plan,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    });
    return;
  }

  next();
};

export function getRateLimitStats(): { buckets: number } {
  return { buckets: buckets.size };
}
