import { db }         from '../../../core/database/SupabaseClient.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import type { PlatformStats, AuditAction, ModerationStatus } from '../types/admin.types.js';

async function audit(actorId: string, action: AuditAction, targetId?: string, targetType?: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const row: Record<string, unknown> = { action, actor_id: actorId, metadata, created_at: new Date().toISOString() };
  if (targetId)   row['target_id']   = targetId;
  if (targetType) row['target_type'] = targetType;
  await db.client().from('adm_audit_log').insert(row);
}

export const AdminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [users, activeUsers, jobs, activeJobs, revenue, revenueToday, pendingMod, openDisputes] = await Promise.all([
      db.client().from('profiles').select('id', { count: 'exact', head: true }),
      db.client().from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.client().from('jobs').select('id', { count: 'exact', head: true }),
      db.client().from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
      db.client().from('payment_intents').select('amount').eq('status', 'completed'),
      db.client().from('payment_intents').select('amount').eq('status', 'completed').gte('created_at', todayStart.toISOString()),
      db.client().from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.client().from('payment_intents').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    ]);

    const sumAmount = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);

    return {
      totalUsers:        users.count          ?? 0,
      activeUsers:       activeUsers.count     ?? 0,
      totalJobs:         jobs.count            ?? 0,
      activeJobs:        activeJobs.count      ?? 0,
      totalRevenue:      sumAmount((revenue.data ?? []) as { amount: number }[]),
      revenueToday:      sumAmount((revenueToday.data ?? []) as { amount: number }[]),
      pendingModeration: pendingMod.count      ?? 0,
      openDisputes:      openDisputes.count    ?? 0,
    };
  },

  async listUsers(page: number, limit: number, search?: string, status?: string) {
    let q = db.client().from('profiles').select('id, name, email, role, status, created_at, last_login_at').order('created_at', { ascending: false });
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (status) q = q.eq('status', status);
    const { data } = await q.range((page - 1) * limit, page * limit - 1);
    return (data ?? []) as Record<string, unknown>[];
  },

  async suspendUser(actorId: string, userId: string, reason: string): Promise<void> {
    await db.client().from('profiles').update({ status: 'suspended' }).eq('id', userId);
    TypedEventBus.publish({ eventName: 'user.suspended', payload: { userId, reason } });
    await audit(actorId, 'user.suspended', userId, 'profile', { reason });
  },

  async activateUser(actorId: string, userId: string): Promise<void> {
    await db.client().from('profiles').update({ status: 'active' }).eq('id', userId);
    TypedEventBus.publish({ eventName: 'user.activated', payload: { userId } });
    await audit(actorId, 'user.activated', userId, 'profile');
  },

  async banUser(actorId: string, userId: string, reason: string): Promise<void> {
    await db.client().from('profiles').update({ status: 'banned' }).eq('id', userId);
    await audit(actorId, 'user.banned', userId, 'profile', { reason });
  },

  async changeUserRole(actorId: string, userId: string, newRole: string): Promise<void> {
    await db.client().from('profiles').update({ role: newRole }).eq('id', userId);
    await audit(actorId, 'user.role_changed', userId, 'profile', { newRole });
  },

  // ── Moderation ──────────────────────────────────────────────────────────────
  async getModerationQueue(status: ModerationStatus = 'pending') {
    const { data } = await db.client()
      .from('moderation_queue').select('*')
      .eq('status', status).order('created_at');
    return (data ?? []) as Record<string, unknown>[];
  },

  async resolveModeration(actorId: string, itemId: string, action: 'approve' | 'reject', resolution?: string): Promise<void> {
    const status: ModerationStatus = action === 'approve' ? 'approved' : 'rejected';
    const row: Record<string, unknown> = { status, resolver_id: actorId, resolved_at: new Date().toISOString() };
    if (resolution) row['resolution'] = resolution;
    await db.client().from('moderation_queue').update(row).eq('id', itemId);
    await audit(actorId, 'moderation.resolved', itemId, 'moderation_queue', { action, resolution });
  },

  // ── Feature flags ────────────────────────────────────────────────────────────
  async getFeatureFlags() {
    const { data } = await db.client().from('feature_flags').select('*').order('key');
    return (data ?? []) as Record<string, unknown>[];
  },

  async setFeatureFlag(actorId: string, key: string, enabled: boolean, rolloutPct?: number): Promise<void> {
    const row: Record<string, unknown> = { key, enabled, updated_by: actorId, updated_at: new Date().toISOString() };
    if (rolloutPct !== undefined) row['rollout_pct'] = rolloutPct;
    await db.client().from('feature_flags').upsert(row, { onConflict: 'key' });
    await audit(actorId, 'flag.toggled', undefined, 'feature_flags', { key, enabled, rolloutPct });
  },

  // ── System config ────────────────────────────────────────────────────────────
  async getSystemConfig() {
    const { data } = await db.client().from('system_config').select('key, value, description, is_secret, updated_at').order('key');
    const rows = (data ?? []) as Record<string, unknown>[];
    // Mask secrets
    return rows.map(r => ({ ...r, value: r['is_secret'] ? '***' : r['value'] }));
  },

  async setSystemConfig(actorId: string, key: string, value: string, description?: string): Promise<void> {
    const row: Record<string, unknown> = { key, value, updated_by: actorId, updated_at: new Date().toISOString() };
    if (description) row['description'] = description;
    await db.client().from('system_config').upsert(row, { onConflict: 'key' });
    await audit(actorId, 'config.updated', undefined, 'system_config', { key });
  },

  // ── Audit log ────────────────────────────────────────────────────────────────
  async getAuditLog(page: number, limit: number, actorId?: string, action?: string) {
    let q = db.client().from('adm_audit_log').select('*').order('created_at', { ascending: false });
    if (actorId) q = q.eq('actor_id', actorId);
    if (action)  q = q.eq('action', action);
    const { data } = await q.range((page - 1) * limit, page * limit - 1);
    return (data ?? []) as Record<string, unknown>[];
  },
};