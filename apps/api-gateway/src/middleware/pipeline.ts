import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../types/gateway.types.js';

// Security
import { HeaderSecurity, CORSHandler } from '../layers/security/HeaderSecurity.js';
import { WAF }              from '../layers/security/WAF.js';
import { DDoSProtection }   from '../layers/security/DDoSProtection.js';
import { IPReputation }     from '../layers/security/IPReputation.js';
import { BotDetection }     from '../layers/security/BotDetection.js';

// Auth + AuthZ
import { TokenVerifier }       from '../layers/auth/TokenVerifier.js';
import { RBAC }                from '../layers/authorization/RBAC.js';

// Traffic
import { TieredRateLimiter } from '../layers/rateLimit/TieredRateLimiter.js';
import { RequestValidator }  from '../layers/validation/RequestValidator.js';

// Observability
import { RequestLogger }     from '../layers/logging/RequestLogger.js';
import { MonitoringMiddleware } from '../layers/monitoring/Metrics.js';

// Cache + Routing + Proxy
import { GatewayCache }  from '../layers/cache/GatewayCache.js';
import { RoutingEngine } from '../routing/RoutingEngine.js';
import { ServiceProxy }  from '../proxy/ServiceProxy.js';

// Step 0 — Inject request context (runs before all other middleware)
export const InjectContext: RequestHandler = (req, _res, next) => {
  const gReq = req as GatewayRequest;

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? (req.socket.remoteAddress ?? '127.0.0.1');

  gReq.ctx = {
    requestId:  randomUUID(),
    traceId:    (req.headers['x-trace-id'] as string | undefined) ?? randomUUID(),
    startTime:  Date.now(),
    plan:       'anonymous',
    ip,
    country:    req.headers['cf-ipcountry'] as string | undefined
                ?? req.headers['x-country'] as string | undefined,
    language:   req.headers['accept-language']?.split(',')[0]?.trim(),
    device:     req.headers['x-device-id'] as string | undefined,
    platform:   req.headers['x-platform'] as string | undefined,
    appVersion: req.headers['x-app-version'] as string | undefined,
    apiVersion: 'v1',
    flags:      {},
  };

  _res.setHeader('X-Request-ID', gReq.ctx.requestId);
  _res.setHeader('X-Trace-ID',   gReq.ctx.traceId);

  next();
};

// Ordered middleware pipeline
export const PIPELINE: RequestHandler[] = [
  InjectContext,
  HeaderSecurity,
  CORSHandler,
  DDoSProtection,
  IPReputation,
  BotDetection,
  WAF,
  TokenVerifier,
  RBAC,
  TieredRateLimiter,
  RequestValidator,
  RequestLogger,
  MonitoringMiddleware,
  GatewayCache,
  RoutingEngine,
  ServiceProxy,
];
