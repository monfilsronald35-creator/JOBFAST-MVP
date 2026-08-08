import { db } from '../../../core/database/SupabaseClient.js';
import type { UsageLog, PartnerUsageStats } from '../types/integration.types.js';

export const IntegrationMonitoringService = {
  async logRequest(params: {
    endpoint:   string;
    method:     string;
    statusCode: number;
    latencyMs:  number;
    apiKeyId?:  string;
    partnerId?: string;
    ipAddress?: string;
  }): Promise<void> {
    const payload: Record<string, unknown> = {
      endpoint:    params.endpoint,
      method:      params.method,
      status_code: params.statusCode,
      latency_ms:  params.latencyMs,
    };
    if (params.apiKeyId)  payload['api_key_id']  = params.apiKeyId;
    if (params.partnerId) payload['partner_id']  = params.partnerId;
    if (params.ipAddress) payload['ip_address']  = params.ipAddress;

    await db.client().from('int_usage_logs').insert(payload);
  },

  async getPartnerStats(partnerId: string): Promise<PartnerUsageStats> {
    const { data: partner } = await db.client()
      .from('int_partners').select('name').eq('id', partnerId).single();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayRes, totalRes, endpointRes] = await Promise.all([
      db.client()
        .from('int_usage_logs')
        .select('id, latency_ms, status_code', { count: 'exact' })
        .eq('partner_id', partnerId)
        .gte('created_at', todayStart.toISOString()),
      db.client()
        .from('int_usage_logs')
        .select('id, latency_ms, status_code', { count: 'exact' })
        .eq('partner_id', partnerId),
      db.client()
        .from('int_usage_logs')
        .select('endpoint')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const todayRows  = (todayRes.data  ?? []) as Record<string, unknown>[];
    const totalRows  = (totalRes.data  ?? []) as Record<string, unknown>[];
    const epRows     = (endpointRes.data ?? []) as Record<string, unknown>[];

    const avgLatency = totalRows.length
      ? totalRows.reduce((s, r) => s + ((r['latency_ms'] as number) ?? 0), 0) / totalRows.length
      : 0;

    const errors     = totalRows.filter(r => (r['status_code'] as number) >= 500).length;
    const errorRate  = totalRows.length ? errors / totalRows.length : 0;

    // Count top endpoints
    const epCounts: Record<string, number> = {};
    for (const r of epRows) {
      const ep = r['endpoint'] as string;
      epCounts[ep] = (epCounts[ep] ?? 0) + 1;
    }
    const topEndpoints = Object.entries(epCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));

    const lastLog = epRows[0];

    const stats: PartnerUsageStats = {
      partnerId,
      partnerName:    (partner as Record<string, unknown> | null)?.['name'] as string ?? '',
      requestsToday:  todayRows.length,
      requestsTotal:  totalRows.length,
      avgLatencyMs:   Math.round(avgLatency),
      errorRate:      Math.round(errorRate * 1000) / 1000,
      topEndpoints,
    };
    if (lastLog) {
      // get actual timestamp from a separate query
      const { data: lastLogData } = await db.client()
        .from('int_usage_logs')
        .select('created_at')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (lastLogData) {
        const row = lastLogData as Record<string, unknown>;
        stats.lastActive = new Date(row['created_at'] as string).getTime();
      }
    }
    return stats;
  },

  async getAllPartnersStats(): Promise<PartnerUsageStats[]> {
    const { data: partners } = await db.client()
      .from('int_partners')
      .select('id')
      .eq('status', 'active');

    const partnerIds = ((partners ?? []) as Record<string, unknown>[]).map(p => p['id'] as string);
    const results = await Promise.allSettled(partnerIds.map(id => IntegrationMonitoringService.getPartnerStats(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<PartnerUsageStats> => r.status === 'fulfilled')
      .map(r => r.value);
  },

  async getRecentLogs(params?: { partnerId?: string; limit?: number }): Promise<UsageLog[]> {
    let q = db.client()
      .from('int_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params?.limit ?? 100);
    if (params?.partnerId) q = q.eq('partner_id', params.partnerId);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapLog);
  },

  async getErrorLogs(partnerId?: string): Promise<UsageLog[]> {
    let q = db.client()
      .from('int_usage_logs')
      .select('*')
      .gte('status_code', 500)
      .order('created_at', { ascending: false })
      .limit(50);
    if (partnerId) q = q.eq('partner_id', partnerId);
    const { data } = await q;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapLog);
  },
};

function _mapLog(row: Record<string, unknown>): UsageLog {
  const l: UsageLog = {
    id:        row['id']       as string,
    endpoint:  row['endpoint'] as string,
    method:    row['method']   as string,
    createdAt: new Date(row['created_at'] as string).getTime(),
  };
  if (row['api_key_id'])  l.apiKeyId   = row['api_key_id']  as string;
  if (row['partner_id'])  l.partnerId  = row['partner_id']  as string;
  if (row['status_code']) l.statusCode = row['status_code'] as number;
  if (row['latency_ms'])  l.latencyMs  = row['latency_ms']  as number;
  return l;
}
