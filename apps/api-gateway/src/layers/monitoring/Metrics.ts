import type { RequestHandler } from 'express';
import type { GatewayRequest, MetricsSnapshot } from '../../types/gateway.types.js';

const START_TIME = Date.now();

const counters = {
  totalRequests:      0,
  totalErrors:        0,
  cacheHits:          0,
  blockedByWAF:       0,
  blockedByDDoS:      0,
  blockedByRateLimit: 0,
};

const latencies:    number[]            = [];
const byRoute      = new Map<string, { count: number; errors: number }>();
const byCountry    = new Map<string, number>();
const byPlan       = new Map<string, number>();
const activeIPs    = new Set<string>();

const MAX_LATENCY_SAMPLES = 10_000;

export function recordRequest(
  route:     string,
  plan:      string,
  country:   string | undefined,
  latencyMs: number,
  status:    number,
  ip:        string,
  cacheHit:  boolean,
): void {
  counters.totalRequests++;
  if (cacheHit) counters.cacheHits++;
  if (status >= 500) counters.totalErrors++;
  if (status === 429) {
    // Could be DDoS or rate limit — logged separately at the middleware level
  }

  // Latency histogram
  if (latencies.length >= MAX_LATENCY_SAMPLES) latencies.shift();
  latencies.push(latencyMs);

  // By route
  const routeStat = byRoute.get(route) ?? { count: 0, errors: 0 };
  routeStat.count++;
  if (status >= 500) routeStat.errors++;
  byRoute.set(route, routeStat);

  // By country
  if (country) byCountry.set(country, (byCountry.get(country) ?? 0) + 1);

  // By plan
  byPlan.set(plan, (byPlan.get(plan) ?? 0) + 1);

  // Active IPs (rolling set — cleared every minute by interval)
  activeIPs.add(ip);
}

setInterval(() => { activeIPs.clear(); }, 60_000).unref();

export function incrementBlocked(type: 'waf' | 'ddos' | 'rateLimit'): void {
  if (type === 'waf')       counters.blockedByWAF++;
  if (type === 'ddos')      counters.blockedByDDoS++;
  if (type === 'rateLimit') counters.blockedByRateLimit++;
}

export function getSnapshot(): MetricsSnapshot {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg    = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : 0;
  const p95idx = Math.floor(sorted.length * 0.95);
  const p95    = sorted[p95idx] ?? 0;

  return {
    ...counters,
    avgLatencyMs:  Math.round(avg),
    p95LatencyMs:  Math.round(p95),
    activeIPs:     activeIPs.size,
    byRoute:       Object.fromEntries(byRoute),
    byCountry:     Object.fromEntries(byCountry),
    byPlan:        Object.fromEntries(byPlan),
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
  };
}

export const MonitoringMiddleware: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  res.on('finish', () => {
    const route     = gReq.ctx.targetService ?? req.path.replace(/^\/api\/v\d+/, '').split('/')[1] ?? 'unknown';
    const latencyMs = Date.now() - gReq.ctx.startTime;
    recordRequest(
      route,
      gReq.ctx.plan,
      gReq.ctx.country,
      latencyMs,
      res.statusCode,
      gReq.ctx.ip,
      gReq.ctx.cacheHit ?? false,
    );
  });

  next();
};
