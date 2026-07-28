/**
 * Core Monitoring — health checks, metrics, uptime
 */
import { supabase } from '../config/supabaseClient.js';
import { cache } from './cache.js';
import { env } from '../config/env.js';

const startTime = Date.now();

async function checkDatabase() {
  try {
    const t0 = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return { ok: !error, latencyMs: Date.now() - t0, error: error?.message };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function systemMetrics() {
  const mem = process.memoryUsage();
  return {
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    nodeVersion:   process.version,
    platform:      process.platform,
    pid:           process.pid,
    memory: {
      heapUsedMB:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB:       Math.round(mem.rss       / 1024 / 1024),
    },
    cache: cache.medium.stats(),
    env: {
      stage: env.APP_STAGE,
      app:   env.APP_NAME,
    },
  };
}

// Health check handler (mounted at /health and /api/v1/health)
export async function healthHandler(req, res) {
  try {
    const db = await checkDatabase();
    const status = db.ok ? 'healthy' : 'degraded';
    const code   = db.ok ? 200 : 503;

    return res.status(code).json({
      success: db.ok,
      status,
      timestamp: new Date().toISOString(),
      checks: { database: db },
      system: systemMetrics(),
    });
  } catch (err) {
    return res.status(503).json({ success: false, status: 'unhealthy', error: err.message });
  }
}

// Lightweight metrics (no DB call)
export function metricsHandler(req, res) {
  res.json({ success: true, ...systemMetrics() });
}

export default { healthHandler, metricsHandler };
