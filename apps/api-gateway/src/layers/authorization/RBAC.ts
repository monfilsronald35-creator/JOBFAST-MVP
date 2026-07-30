import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { ROUTE_MAP, PUBLIC_EXACT_PATHS } from '../../config/routes.config.js';

function resolveRouteKey(path: string): string | null {
  // Strip version prefix: /api/v1/jobs/123 → /jobs/123
  const stripped = path.replace(/^\/api\/v\d+/, '');
  // Match longest prefix in ROUTE_MAP
  let match: string | null = null;
  for (const key of Object.keys(ROUTE_MAP)) {
    if (stripped.startsWith(key) && (match === null || key.length > match.length)) {
      match = key;
    }
  }
  return match;
}

export const RBAC: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;
  const { plan, role, userId } = gReq.ctx;

  // Fully public paths — skip check
  if (PUBLIC_EXACT_PATHS.has(req.path) || PUBLIC_EXACT_PATHS.has(req.originalUrl.split('?')[0] ?? '')) {
    return next();
  }

  const routeKey = resolveRouteKey(req.path);
  if (!routeKey) {
    res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
    return;
  }

  const route = ROUTE_MAP[routeKey];
  if (!route) {
    res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
    return;
  }

  // Fully public route
  if (route.public) return next();

  // Public for specific methods
  if (route.publicMethods?.includes(req.method)) return next();

  // Requires authentication
  if (plan === 'anonymous' || !userId) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  // Internal services bypass role checks
  if (plan === 'internal') return next();

  // Role-gated routes
  if (route.roles && route.roles.length > 0) {
    const userRole = role ?? '';
    if (!route.roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN', required: route.roles });
      return;
    }
  }

  next();
};
