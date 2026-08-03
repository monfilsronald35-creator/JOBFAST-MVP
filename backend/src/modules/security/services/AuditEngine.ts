import { db } from '../../../core/database/SupabaseClient.js';
import type { AuditAction, AuditResult, AuditEntry, RiskScore } from '../types/security.types.js';

// In-memory write-behind buffer (loss-tolerant, same pattern as analytics)
const _queue: Array<Record<string, unknown>> = [];
let _timer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (!_queue.length) return;
  const batch = _queue.splice(0);
  try {
    await db.client().from('sec_audit_log').insert(batch);
  } catch { /* audit loss acceptable — never block request path */ }
}

export const AuditEngine = {
  // Fire-and-forget — NEVER await this in middleware
  log(entry: {
    action:     AuditAction | string;
    result:     AuditResult;
    ip:         string;
    country:    string;
    deviceId:   string;
    userAgent:  string;
    riskScore?: RiskScore;
    userId?:    string;
    sessionId?: string;
    targetId?:  string;
    targetType?: string;
    metadata?:  Record<string, unknown>;
  }): void {
    const row: Record<string, unknown> = {
      action:     entry.action,
      result:     entry.result,
      ip:         entry.ip,
      country:    entry.country,
      device_id:  entry.deviceId,
      user_agent: entry.userAgent,
      risk_score: entry.riskScore ?? 0,
      metadata:   entry.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    if (entry.userId)    row['user_id']    = entry.userId;
    if (entry.sessionId) row['session_id'] = entry.sessionId;
    if (entry.targetId)  row['target_id']  = entry.targetId;
    if (entry.targetType) row['target_type'] = entry.targetType;

    _queue.push(row);
    if (_queue.length >= 100) {
      if (_timer) { clearTimeout(_timer); _timer = null; }
      void flush();
      return;
    }
    if (!_timer) _timer = setTimeout(() => { _timer = null; void flush(); }, 5_000);
  },

  async search(opts: {
    userId?:   string;
    action?:   string;
    ip?:       string;
    result?:   AuditResult;
    fromDate?: string;
    toDate?:   string;
    minRisk?:  number;
    page?:     number;
    limit?:    number;
  }): Promise<AuditEntry[]> {
    let q = db.client().from('sec_audit_log').select('*').order('created_at', { ascending: false });
    if (opts.userId)   q = q.eq('user_id', opts.userId);
    if (opts.action)   q = q.eq('action', opts.action);
    if (opts.ip)       q = q.eq('ip', opts.ip);
    if (opts.result)   q = q.eq('result', opts.result);
    if (opts.fromDate) q = q.gte('created_at', opts.fromDate);
    if (opts.toDate)   q = q.lte('created_at', opts.toDate);
    if (opts.minRisk)  q = q.gte('risk_score', opts.minRisk);
    const page  = opts.page  ?? 1;
    const limit = opts.limit ?? 50;
    const { data } = await q.range((page - 1) * limit, page * limit - 1);

    return ((data ?? []) as Record<string, unknown>[]).map(r => {
      const e: AuditEntry = {
        id: String(r['id']), action: String(r['action']),
        result: String(r['result']) as AuditResult,
        ip: String(r['ip']), country: String(r['country']),
        deviceId: String(r['device_id']), userAgent: String(r['user_agent']),
        riskScore: Number(r['risk_score']),
        metadata: (r['metadata'] as Record<string, unknown>) ?? {},
        createdAt: String(r['created_at']),
      };
      if (r['user_id'])    e.userId    = String(r['user_id']);
      if (r['session_id']) e.sessionId = String(r['session_id']);
      if (r['target_id'])  e.targetId  = String(r['target_id']);
      if (r['target_type']) e.targetType = String(r['target_type']);
      return e;
    });
  },

  async countUserActions(userId: string, action: string, withinMinutes: number): Promise<number> {
    const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
    const { count } = await db.client().from('sec_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('action', action).gte('created_at', since);
    return count ?? 0;
  },
};