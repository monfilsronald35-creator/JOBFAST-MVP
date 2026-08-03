import { db }                 from '../../../core/database/SupabaseClient.js';
import { TypedEventBus }      from '../../../core/events/TypedEventBus.js';
import type { SecurityIncident, IncidentType, IncidentSeverity, IncidentStatus } from '../types/security.types.js';

function toIncident(r: Record<string, unknown>): SecurityIncident {
  const inc: SecurityIncident = {
    id: String(r['id']), type: String(r['type']) as IncidentType,
    severity: String(r['severity']) as IncidentSeverity,
    description: String(r['description']), status: String(r['status']) as IncidentStatus,
    metadata: (r['metadata'] as Record<string, unknown>) ?? {}, createdAt: String(r['created_at']),
  };
  if (r['user_id'])    inc.userId    = String(r['user_id']);
  if (r['ip'])         inc.ip        = String(r['ip']);
  if (r['assigned_to']) inc.assignedTo = String(r['assigned_to']);
  if (r['resolved_at']) inc.resolvedAt = String(r['resolved_at']);
  if (r['resolved_by']) inc.resolvedBy = String(r['resolved_by']);
  if (r['resolution'])  inc.resolution = String(r['resolution']);
  return inc;
}

export const IncidentResponseService = {
  async create(type: IncidentType, severity: IncidentSeverity, description: string, ip?: string, userId?: string, metadata: Record<string, unknown> = {}): Promise<SecurityIncident> {
    const row: Record<string, unknown> = { type, severity, description, status: 'open', metadata };
    if (ip)     row['ip']      = ip;
    if (userId) row['user_id'] = userId;

    const { data } = await db.client().from('sec_incidents').insert(row).select().single();
    const inc = toIncident(data as Record<string, unknown>);

    TypedEventBus.publish({ eventName: 'security.incident', payload: { incidentId: inc.id, type, severity } });

    // Auto-escalate critical incidents
    if (severity === 'critical') {
      console.error(`[SECURITY] CRITICAL INCIDENT: ${type} — ${description}`);
    }
    return inc;
  },

  async list(status?: IncidentStatus, severity?: IncidentSeverity, page = 1, limit = 50): Promise<SecurityIncident[]> {
    let q = db.client().from('sec_incidents').select('*').order('created_at', { ascending: false });
    if (status)   q = q.eq('status', status);
    if (severity) q = q.eq('severity', severity);
    const { data } = await q.range((page - 1) * limit, page * limit - 1);
    return ((data ?? []) as Record<string, unknown>[]).map(toIncident);
  },

  async resolve(incidentId: string, resolvedBy: string, resolution: string): Promise<void> {
    await db.client().from('sec_incidents').update({
      status: 'resolved', resolved_by: resolvedBy, resolved_at: new Date().toISOString(), resolution,
    }).eq('id', incidentId);
  },

  async assign(incidentId: string, assignedTo: string): Promise<void> {
    await db.client().from('sec_incidents').update({ assigned_to: assignedTo, status: 'investigating' }).eq('id', incidentId);
  },

  async markFalsePositive(incidentId: string, resolvedBy: string): Promise<void> {
    await db.client().from('sec_incidents').update({
      status: 'false_positive', resolved_by: resolvedBy, resolved_at: new Date().toISOString(),
    }).eq('id', incidentId);
  },
};