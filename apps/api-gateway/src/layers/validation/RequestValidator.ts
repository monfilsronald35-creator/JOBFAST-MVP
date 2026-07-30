import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { ROUTE_MAP } from '../../config/routes.config.js';
import { env } from '../../config/env.js';

const ALLOWED_CONTENT_TYPES = new Set([
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);

function parseContentType(header?: string): string {
  if (!header) return '';
  return header.split(';')[0]?.trim() ?? '';
}

function resolveRouteKey(path: string): string | null {
  const stripped = path.replace(/^\/api\/v\d+/, '');
  let match: string | null = null;
  for (const key of Object.keys(ROUTE_MAP)) {
    if (stripped.startsWith(key) && (match === null || key.length > match.length)) match = key;
  }
  return match;
}

export const RequestValidator: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  // Max body size check (after express.json has already parsed, Content-Length is the signal)
  const routeKey   = resolveRouteKey(req.path);
  const route      = routeKey ? ROUTE_MAP[routeKey] : null;
  const maxMB      = route?.maxBodySize ?? env.MAX_BODY_SIZE_MB;
  const contentLen = Number(req.headers['content-length'] ?? 0);

  if (contentLen > maxMB * 1024 * 1024) {
    res.status(413).json({ error: `Request body too large (max ${maxMB}MB)`, code: 'BODY_TOO_LARGE' });
    return;
  }

  // Content-Type validation for write operations
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = parseContentType(req.headers['content-type']);
    if (ct && !ALLOWED_CONTENT_TYPES.has(ct)) {
      res.status(415).json({ error: 'Unsupported Media Type', code: 'UNSUPPORTED_MEDIA_TYPE', allowed: [...ALLOWED_CONTENT_TYPES] });
      return;
    }
  }

  // Path traversal check on URL itself
  if (/\.\.(\/|\\|%2f|%5c)/i.test(req.url)) {
    res.status(400).json({ error: 'Invalid request path', code: 'INVALID_PATH' });
    return;
  }

  // Block excessively long URLs
  if (req.url.length > 4096) {
    res.status(414).json({ error: 'URI too long', code: 'URI_TOO_LONG' });
    return;
  }

  // Required headers for non-anonymous requests
  if (gReq.ctx.plan !== 'anonymous' && gReq.ctx.plan !== 'internal') {
    if (!req.headers['accept']) {
      // Soft enforcement — add to flags
      gReq.ctx.flags['missing_accept'] = true;
    }
  }

  next();
};
