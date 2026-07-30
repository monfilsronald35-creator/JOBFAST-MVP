import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { env } from '../../config/env.js';
import { PUBLIC_EXACT_PATHS } from '../../config/routes.config.js';

export interface JWTPayload {
  userId: string;
  email:  string;
  role:   string;
  plan?:  string;
  iat?:   number;
  exp?:   number;
}

function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

function isAPIKey(key: string): boolean {
  return key.startsWith(env.API_KEY_PREFIX);
}

function resolveUserPlan(role?: string): GatewayRequest['ctx']['plan'] {
  if (!role) return 'anonymous';
  if (role === 'internal' || role === 'service') return 'internal';
  if (role === 'enterprise' || role === 'admin' || role === 'superadmin') return 'enterprise';
  if (role === 'premium') return 'premium';
  return 'user';
}

export const TokenVerifier: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  // Internal service token (service-to-service)
  const internalToken = req.headers['x-internal-token'];
  if (typeof internalToken === 'string' && env.INTERNAL_TOKEN && internalToken === env.INTERNAL_TOKEN) {
    gReq.ctx.userId = 'internal-service';
    gReq.ctx.role   = 'internal';
    gReq.ctx.plan   = 'internal';
    return next();
  }

  // API Key auth
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && isAPIKey(apiKey)) {
    // In production: look up API key in DB/cache to get associated user
    // For now: treat as authenticated user-level
    gReq.ctx.apiKey = apiKey;
    gReq.ctx.plan   = 'user';
    return next();
  }

  // JWT Bearer token
  const token = extractBearerToken(req.headers['authorization']);
  if (token) {
    const payload = verifyJWT(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
      return;
    }
    gReq.ctx.userId = payload.userId;
    gReq.ctx.role   = payload.role;
    gReq.ctx.plan   = resolveUserPlan(payload.role);
    return next();
  }

  // No credentials — check if path is public
  const isPublic = PUBLIC_EXACT_PATHS.has(req.path) || PUBLIC_EXACT_PATHS.has(req.originalUrl.split('?')[0] ?? '');
  if (isPublic) {
    gReq.ctx.plan = 'anonymous';
    return next();
  }

  // Will be resolved by RBAC based on route config
  gReq.ctx.plan = 'anonymous';
  next();
};
