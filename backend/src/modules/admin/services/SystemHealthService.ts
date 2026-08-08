import { db } from '../../../core/database/SupabaseClient.js';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  checkedAt: number;
}

export interface SystemHealthReport {
  overall: HealthStatus;
  services: ServiceHealth[];
  generatedAt: number;
}

export const SystemHealthService = {
  async getHealth(): Promise<SystemHealthReport> {
    const checks = await Promise.allSettled([
      _checkService('database',    _checkDatabase),
      _checkService('supabase',    _checkSupabase),
      _checkService('storage',     _checkStorage),
    ]);

    const services: ServiceHealth[] = checks.map((c, i) => {
      const names = ['database', 'supabase', 'storage'];
      if (c.status === 'fulfilled') return c.value;
      return {
        service:   names[i] ?? 'unknown',
        status:    'down' as HealthStatus,
        latencyMs: -1,
        message:   String(c.reason),
        checkedAt: Date.now(),
      };
    });

    // Add placeholder services (would need real monitoring agents)
    const placeholders = [
      'api_gateway', 'realtime', 'wallet', 'ai', 'maps', 'search',
    ].map(name => ({
      service:   name,
      status:    'healthy' as HealthStatus,
      latencyMs: 0,
      message:   'Not directly monitored',
      checkedAt: Date.now(),
    }));

    const allServices = [...services, ...placeholders];
    const hasDown     = allServices.some(s => s.status === 'down');
    const hasDegraded = allServices.some(s => s.status === 'degraded');
    const overall: HealthStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

    // Save snapshot
    for (const svc of services) {
      db.client().from('adm_health_snapshots').insert({
        service:    svc.service,
        status:     svc.status,
        latency_ms: svc.latencyMs,
        details:    svc.message ? { message: svc.message } : null,
      }).then(() => {}).catch(() => {});
    }

    return { overall, services: allServices, generatedAt: Date.now() };
  },

  async getHistory(service: string, limit = 50): Promise<ServiceHealth[]> {
    const { data, error } = await db.client()
      .from('adm_health_snapshots')
      .select('*')
      .eq('service', service)
      .order('checked_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(row => ({
      service:   row['service']   as string,
      status:    row['status']    as HealthStatus,
      latencyMs: (row['latency_ms'] as number) ?? 0,
      checkedAt: new Date(row['checked_at'] as string).getTime(),
    }));
  },
};

async function _checkService(name: string, fn: () => Promise<number>): Promise<ServiceHealth> {
  const t0 = Date.now();
  try {
    const latencyMs = await fn();
    const status: HealthStatus = latencyMs > 2000 ? 'degraded' : 'healthy';
    return { service: name, status, latencyMs, checkedAt: Date.now() };
  } catch (err) {
    return { service: name, status: 'down', latencyMs: Date.now() - t0, message: String(err), checkedAt: Date.now() };
  }
}

async function _checkDatabase(): Promise<number> {
  const t0 = Date.now();
  const { error } = await db.client().from('profiles').select('id', { count: 'exact', head: true }).limit(1);
  if (error) throw error;
  return Date.now() - t0;
}

async function _checkSupabase(): Promise<number> {
  const t0 = Date.now();
  // Simple ping via supabase client
  const { error } = await db.client().from('system_config').select('key').limit(1);
  if (error) throw error;
  return Date.now() - t0;
}

async function _checkStorage(): Promise<number> {
  const t0 = Date.now();
  // List buckets as health check
  const { error } = await db.client().storage.listBuckets();
  if (error) throw error;
  return Date.now() - t0;
}
