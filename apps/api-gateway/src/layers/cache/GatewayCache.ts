import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { ROUTE_MAP } from '../../config/routes.config.js';

interface CacheEntry {
  statusCode:  number;
  headers:     Record<string, string>;
  body:        Buffer;
  expiresAt:   number;
}

// In-memory L1 cache (LRU eviction at 1000 entries)
const cache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 1_000;

function evictIfNeeded(): void {
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = cache.keys().next().value;
  if (oldest) cache.delete(oldest);
}

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of cache) {
    if (now > e.expiresAt) cache.delete(k);
  }
}, 60_000).unref();

function resolveRouteKey(path: string): string | null {
  const stripped = path.replace(/^\/api\/v\d+/, '');
  let match: string | null = null;
  for (const key of Object.keys(ROUTE_MAP)) {
    if (stripped.startsWith(key) && (match === null || key.length > match.length)) match = key;
  }
  return match;
}

function buildCacheKey(req: GatewayRequest): string | null {
  if (req.method !== 'GET') return null;

  const routeKey = resolveRouteKey(req.path);
  if (!routeKey) return null;

  const route = ROUTE_MAP[routeKey];
  if (!route?.cacheTtl) return null;

  const userId = req.ctx.userId ?? 'anon';
  const url    = req.originalUrl.split('?')[0] ?? req.path;
  const qs     = new URLSearchParams(req.query as Record<string, string>).toString();
  return `cache:${url}:${qs}:${userId}`;
}

export const GatewayCache: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;
  const key  = buildCacheKey(gReq);

  if (!key) return next();

  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    gReq.ctx.cacheHit = true;
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('X-Cache-Key', key.slice(0, 60));
    for (const [h, v] of Object.entries(entry.headers)) {
      if (h.toLowerCase() !== 'transfer-encoding') res.setHeader(h, v);
    }
    res.status(entry.statusCode).end(entry.body);
    return;
  }

  res.setHeader('X-Cache', 'MISS');

  // Intercept response to store in cache
  const routeKey = resolveRouteKey(req.path);
  const ttl      = routeKey ? (ROUTE_MAP[routeKey]?.cacheTtl ?? 0) : 0;

  if (ttl > 0) {
    const chunks: Buffer[] = [];
    const origWrite  = res.write.bind(res);
    const origEnd    = res.end.bind(res);

    (res as unknown as { write: (...a: unknown[]) => boolean }).write = (...args: unknown[]) => {
      const chunk = args[0];
      if (chunk instanceof Buffer) chunks.push(chunk);
      else if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
      return (origWrite as (...a: unknown[]) => boolean)(...args);
    };

    (res as unknown as { end: (...a: unknown[]) => void }).end = (...args: unknown[]) => {
      if (res.statusCode === 200) {
        const chunk = args[0];
        if (chunk instanceof Buffer) chunks.push(chunk);
        else if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));

        const body = Buffer.concat(chunks);
        const headers: Record<string, string> = {};
        for (const [h, v] of Object.entries(res.getHeaders())) {
          if (typeof v === 'string') headers[h] = v;
        }

        evictIfNeeded();
        cache.set(key, { statusCode: 200, headers, body, expiresAt: Date.now() + ttl * 1000 });
      }
      return (origEnd as (...a: unknown[]) => void)(...args);
    };
  }

  next();
};

export function getCacheStats(): { size: number; maxSize: number } {
  return { size: cache.size, maxSize: MAX_ENTRIES };
}

export function invalidateCache(prefix: string): number {
  let count = 0;
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) { cache.delete(k); count++; }
  }
  return count;
}
