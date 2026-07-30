import type { Request } from 'express';

export type AuthPlan = 'anonymous' | 'user' | 'premium' | 'enterprise' | 'internal';

export interface RequestContext {
  requestId:     string;
  traceId:       string;
  startTime:     number;
  userId?:       string;
  role?:         string;
  plan:          AuthPlan;
  apiKey?:       string;
  ip:            string;
  country?:      string;
  language?:     string;
  device?:       string;
  platform?:     string;
  appVersion?:   string;
  targetService?: string;
  targetPath?:   string;
  apiVersion:    string;
  cacheHit?:     boolean;
  flags:         Record<string, boolean>;
}

export interface GatewayRequest extends Request {
  ctx: RequestContext;
}

export interface RouteDefinition {
  backend:       string;
  public?:       boolean;
  publicMethods?: string[];
  roles?:        string[];
  cacheTtl?:     number;
  rateLimit?:    Partial<RateLimitTier>;
  maxBodySize?:  number;
}

export interface RateLimitTier {
  anonymous:  number;
  user:       number;
  premium:    number;
  enterprise: number;
  internal:   number;
}

export interface WAFMatch {
  type:    'sqli' | 'xss' | 'nosql' | 'path_traversal' | 'rce';
  pattern: string;
  field:   string;
}

export interface MetricsSnapshot {
  totalRequests:     number;
  totalErrors:       number;
  cacheHits:         number;
  blockedByWAF:      number;
  blockedByDDoS:     number;
  blockedByRateLimit: number;
  avgLatencyMs:      number;
  p95LatencyMs:      number;
  activeIPs:         number;
  byRoute:           Record<string, { count: number; errors: number }>;
  byCountry:         Record<string, number>;
  byPlan:            Record<string, number>;
  uptimeSeconds:     number;
}
