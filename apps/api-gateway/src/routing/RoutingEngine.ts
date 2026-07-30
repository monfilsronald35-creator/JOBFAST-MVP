import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../types/gateway.types.js';
import { ROUTE_MAP, API_VERSIONS } from '../config/routes.config.js';
import { env } from '../config/env.js';

// /api/v1/jobs/123?foo=bar  →  { version: 'v1', servicePath: '/jobs', remainingPath: '/123', targetBase: '...' }
export interface RouteResolution {
  apiVersion:    string;
  servicePath:   string;
  remainingPath: string;
  targetBase:    string;
  targetUrl:     string;
}

export function resolveRoute(originalUrl: string): RouteResolution | null {
  // Normalise: strip query string for routing
  const [rawPath] = originalUrl.split('?');
  const path = rawPath ?? '/';

  // Detect version: /api/v1/... or /v1/... or bare path
  let apiVersion = 'v1';
  let stripped   = path;

  const versionMatch = path.match(/^\/(?:api\/)?(v\d+)(\/.*)?$/i);
  if (versionMatch) {
    const v = versionMatch[1]?.toLowerCase();
    if (v && (API_VERSIONS as readonly string[]).includes(v)) {
      apiVersion = v;
      stripped   = versionMatch[2] ?? '/';
    }
  } else if (path.startsWith('/api/')) {
    stripped = path.slice(4); // keep leading slash → /jobs/...
  }

  // Match route prefix
  let bestKey: string | null = null;
  for (const key of Object.keys(ROUTE_MAP)) {
    if (stripped === key || stripped.startsWith(key + '/') || stripped.startsWith(key + '?')) {
      if (bestKey === null || key.length > bestKey.length) bestKey = key;
    }
  }

  if (!bestKey) return null;

  const route         = ROUTE_MAP[bestKey]!;
  const remainingPath = stripped.slice(bestKey.length) || '';
  const qs            = originalUrl.includes('?') ? '?' + originalUrl.split('?').slice(1).join('?') : '';
  const targetUrl     = route.backend + remainingPath + qs;

  return { apiVersion, servicePath: bestKey, remainingPath, targetBase: route.backend, targetUrl };
}

export const RoutingEngine: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  // Gateway-level routes (served directly)
  if (req.path === '/health' || req.path === '/api/health') {
    res.json({ status: 'ok', service: 'api-gateway', version: '1.0.0', env: env.NODE_ENV });
    return;
  }

  const resolution = resolveRoute(req.originalUrl);
  if (!resolution) {
    res.status(404).json({ error: 'Not found', code: 'ROUTE_NOT_FOUND', path: req.path });
    return;
  }

  gReq.ctx.apiVersion    = resolution.apiVersion;
  gReq.ctx.targetService = resolution.servicePath.replace(/^\//, '');
  gReq.ctx.targetPath    = resolution.targetUrl;

  next();
};
