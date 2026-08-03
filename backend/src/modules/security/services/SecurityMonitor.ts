import { db }                   from '../../../core/database/SupabaseClient.js';
import type { SecurityStats }   from '../types/security.types.js';

export const SecurityMonitor = {
  async getStats(): Promise<SecurityStats> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [incidentsOpen, incidentsToday, blockedIPs, riskUsers, auditToday, avgRisk, topThreat] = await Promise.all([
      db.client().from('sec_incidents').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      db.client().from('sec_incidents').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
      db.client().from('sec_blocked_entities').select('*', { count: 'exact', head: true }).eq('type', 'ip'),
      db.client().from('sec_audit_log').select('user_id', { count: 'exact', head: true }).gte('risk_score', 70).gte('created_at', todayStr),
      db.client().from('sec_audit_log').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
      db.client().from('sec_audit_log').select('risk_score').gte('created_at', todayStr).limit(1000),
      db.client().from('sec_incidents').select('type').eq('status', 'open').order('created_at', { ascending: false }).limit(100),
    ]);

    const scores = (avgRisk.data ?? []) as { risk_score: number }[];
    const avg    = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + r.risk_score, 0) / scores.length) : 0;

    const typeCounts: Record<string, number> = {};
    ((topThreat.data ?? []) as { type: string }[]).forEach(r => { typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1; });
    const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      incidentsOpen:    incidentsOpen.count    ?? 0,
      incidentsToday:   incidentsToday.count   ?? 0,
      blockedIPs:       blockedIPs.count       ?? 0,
      riskUsersHigh:    riskUsers.count        ?? 0,
      auditLogsToday:   auditToday.count       ?? 0,
      avgRiskScore:     avg,
      topThreatType:    topType ? String(topType[0]) : 'none',
      generatedAt:      new Date().toISOString(),
    };
  },

  async listBlockedEntities(type?: string) {
    let q = db.client().from('sec_blocked_entities').select('*').order('created_at', { ascending: false });
    if (type) q = q.eq('type', type);
    const { data } = await q;
    return (data ?? []) as Record<string, unknown>[];
  },

  async blockEntity(type: 'ip' | 'device' | 'user', value: string, reason: string, blockedBy: string, blockedUntil?: string): Promise<void> {
    const row: Record<string, unknown> = { type, value, reason, created_by: blockedBy };
    if (blockedUntil) row['blocked_until'] = blockedUntil;
    await db.client().from('sec_blocked_entities').upsert(row, { onConflict: 'type,value' });
  },

  async unblockEntity(type: string, value: string): Promise<void> {
    await db.client().from('sec_blocked_entities').delete().eq('type', type).eq('value', value);
  },

  // In-memory blocked IP cache (refreshed on first check per minute)
  _blockedIPCache: new Set<string>(),
  _cacheLoadedAt:  0,

  async isBlocked(ip: string): Promise<boolean> {
    const now = Date.now();
    if (now - SecurityMonitor._cacheLoadedAt > 60_000) {
      const { data } = await db.client().from('sec_blocked_entities').select('value').eq('type', 'ip');
      SecurityMonitor._blockedIPCache = new Set(((data ?? []) as { value: string }[]).map(r => r.value));
      SecurityMonitor._cacheLoadedAt  = now;
    }
    return SecurityMonitor._blockedIPCache.has(ip);
  },
};