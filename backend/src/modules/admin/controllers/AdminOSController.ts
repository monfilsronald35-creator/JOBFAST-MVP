import type { Request, Response } from 'express';
import { AdminDashboardService }     from '../services/AdminDashboardService.js';
import { EmergencyModeService }      from '../services/EmergencyModeService.js';
import { AdminBroadcastService }     from '../services/AdminBroadcastService.js';
import { SystemHealthService }       from '../services/SystemHealthService.js';
import { AdminRoleService }          from '../services/AdminRoleService.js';
import { FounderModeService }        from '../services/FounderModeService.js';
import { AdminAICommandService }     from '../services/AdminAICommandService.js';
import { AdminGlobalSearchService }  from '../services/AdminGlobalSearchService.js';
import { AdminMonitoringService }    from '../services/AdminMonitoringService.js';
import { RevenueAnalyticsService }   from '../../monetization/services/RevenueAnalyticsService.js';
import { BillingEngine }             from '../../monetization/services/BillingEngine.js';
import { CountryConfigService }      from '../../localization/services/CountryConfigService.js';
import { CountryContextEngine }      from '../../localization/services/CountryContextEngine.js';
import type { BroadcastTarget, BroadcastChannel } from '../services/AdminBroadcastService.js';
import type { AdminRoleType }        from '../services/AdminRoleService.js';

export const AdminOSController = {

  // ── 1. Dashboard ─────────────────────────────────────────────────────────────

  async getGlobalStats(req: Request, res: Response): Promise<void> {
    const stats = await AdminDashboardService.getGlobalStats();
    res.json({ ok: true, data: stats });
  },

  async getLiveMetrics(req: Request, res: Response): Promise<void> {
    const metrics = await AdminDashboardService.getLiveMetrics();
    res.json({ ok: true, data: metrics });
  },

  // ── 2. User Control (extended) ────────────────────────────────────────────────

  async getUserDetail(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    const { data, error } = await db.client()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
    res.json({ ok: true, data });
  },

  async getUserDevices(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    const { data } = await db.client()
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false });
    res.json({ ok: true, data: data ?? [] });
  },

  async getUserActivity(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    const limit  = Math.min(parseInt(String(req.query['limit'] ?? '50'), 10), 100);
    const { data } = await db.client()
      .from('adm_audit_log')
      .select('*')
      .or(`actor_id.eq.${userId},entity_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    res.json({ ok: true, data: data ?? [] });
  },

  async resetUserSessions(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    // Invalidate all refresh tokens by updating a session_version field
    const { error } = await db.client()
      .from('profiles')
      .update({ session_version: Date.now(), updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    res.json({ ok: true, message: 'Sesyon yo reyajiste' });
  },

  async resetUserMFA(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    const { error } = await db.client()
      .from('profiles')
      .update({ mfa_enabled: false, mfa_secret: null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    res.json({ ok: true, message: 'MFA reyajiste' });
  },

  async verifyUser(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const userId = String(req.params['userId'] ?? '');
    const { error } = await db.client()
      .from('profiles')
      .update({ verified: true, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    res.json({ ok: true, message: 'Itilizatè verifye' });
  },

  // ── 3. Country Command ────────────────────────────────────────────────────────

  async listCountriesAdmin(req: Request, res: Response): Promise<void> {
    const countries = await CountryConfigService.listAll();
    res.json({ ok: true, data: countries });
  },

  async getCountryAdmin(req: Request, res: Response): Promise<void> {
    const code   = String(req.params['code'] ?? '').toUpperCase();
    const config = await CountryConfigService.getConfig(code);
    if (!config) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
    res.json({ ok: true, data: config });
  },

  async updateCountryFeatures(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const code    = String(req.params['code'] ?? '').toUpperCase();
    const updates = req.body as Record<string, boolean>;
    await CountryConfigService.updateFeatures(code, updates, actorId);
    res.json({ ok: true });
  },

  async getUserCountryContext(req: Request, res: Response): Promise<void> {
    const userId = String(req.params['userId'] ?? '');
    const ctx    = await CountryContextEngine.getUserContext(userId);
    res.json({ ok: true, data: ctx });
  },

  // ── 5. AI Command ─────────────────────────────────────────────────────────────

  async getAIConfig(req: Request, res: Response): Promise<void> {
    const config = await AdminAICommandService.getConfig();
    res.json({ ok: true, data: config });
  },

  async updateAIModelRouting(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, string>;
    const config  = await AdminAICommandService.updateModelRouting(actorId, body);
    res.json({ ok: true, data: config });
  },

  async updateAIPromptTemplate(req: Request, res: Response): Promise<void> {
    const actorId  = String(req.user?.['id'] ?? '');
    const { key, template } = req.body as { key: string; template: string };
    await AdminAICommandService.updatePromptTemplate(actorId, key, template);
    res.json({ ok: true });
  },

  async updateAICostLimits(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const limits  = req.body as { daily_usd?: number; monthly_usd?: number };
    await AdminAICommandService.updateCostLimits(actorId, limits);
    res.json({ ok: true });
  },

  async getAICostReport(req: Request, res: Response): Promise<void> {
    const report = await AdminAICommandService.getCostReport();
    res.json({ ok: true, data: report });
  },

  async toggleAIFeature(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const { feature, enabled } = req.body as { feature: string; enabled: boolean };
    await AdminAICommandService.updateFeatureEnabled(actorId, feature, enabled);
    res.json({ ok: true });
  },

  // ── 6. Revenue Command ────────────────────────────────────────────────────────

  async getRevenueDashboard(req: Request, res: Response): Promise<void> {
    const dashboard = await RevenueAnalyticsService.getDashboard();
    res.json({ ok: true, data: dashboard });
  },

  async getRevenueAIInsights(req: Request, res: Response): Promise<void> {
    const insights = await RevenueAnalyticsService.getAIInsights();
    res.json({ ok: true, data: insights });
  },

  async getCommissionReport(req: Request, res: Response): Promise<void> {
    const defaultFrom = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const from    = new Date(String(req.query['from'] ?? defaultFrom));
    const to      = new Date(String(req.query['to']   ?? new Date().toISOString()));
    const service = req.query['service'] ? String(req.query['service']) : undefined;
    const report  = await BillingEngine.getCommissionReport(from, to, service);
    res.json({ ok: true, data: report });
  },

  // ── 7. Security Command ───────────────────────────────────────────────────────

  async getSecurityOverview(req: Request, res: Response): Promise<void> {
    // Aggregate from security module tables
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const [incidentsRes, sessionsRes] = await Promise.allSettled([
      db.client().from('sec_incidents').select('id,severity,status,created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      db.client().from('sec_sessions').select('id,user_id,ip_address,created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    res.json({
      ok: true,
      data: {
        recentIncidents: incidentsRes.status === 'fulfilled' ? (incidentsRes.value.data ?? []) : [],
        recentSessions:  sessionsRes.status  === 'fulfilled' ? (sessionsRes.value.data  ?? []) : [],
        generatedAt:     Date.now(),
      },
    });
  },

  async getAuditLogAdmin(req: Request, res: Response): Promise<void> {
    const { db } = await import('../../../core/database/SupabaseClient.js');
    const limit    = Math.min(parseInt(String(req.query['limit'] ?? '50'), 10), 200);
    const actorId  = req.query['actorId']  ? String(req.query['actorId'])  : undefined;
    const action   = req.query['action']   ? String(req.query['action'])   : undefined;
    const from     = req.query['from']     ? String(req.query['from'])     : undefined;
    const to       = req.query['to']       ? String(req.query['to'])       : undefined;

    let q = db.client().from('adm_audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
    if (actorId) q = q.eq('actor_id', actorId);
    if (action)  q = q.eq('action', action);
    if (from)    q = q.gte('created_at', from);
    if (to)      q = q.lte('created_at', to);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ ok: true, data: data ?? [] });
  },

  // ── 8. Live Monitoring ────────────────────────────────────────────────────────

  async getLiveFeed(req: Request, res: Response): Promise<void> {
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '50'), 10), 100);
    const since = req.query['since'] ? parseInt(String(req.query['since']), 10) : undefined;
    const feed  = await AdminMonitoringService.getLiveFeed(limit, since);
    res.json({ ok: true, data: feed });
  },

  async getRecentErrors(req: Request, res: Response): Promise<void> {
    const limit  = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
    const errors = await AdminMonitoringService.getRecentErrors(limit);
    res.json({ ok: true, data: errors });
  },

  // ── 9. Global Search ──────────────────────────────────────────────────────────

  async globalSearch(req: Request, res: Response): Promise<void> {
    const q     = String(req.query['q']     ?? '');
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
    const result = await AdminGlobalSearchService.search(q, limit);
    res.json({ ok: true, data: result });
  },

  // ── 10. Emergency Mode ─────────────────────────────────────────────────────────

  async getEmergencyStatus(req: Request, res: Response): Promise<void> {
    const status = await EmergencyModeService.getStatus();
    res.json({ ok: true, data: status });
  },

  async activateEmergency(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, unknown>;
    const config  = await EmergencyModeService.activate(actorId, {
      paymentsDisabled:    body['paymentsDisabled']    as boolean | undefined,
      walletReadonly:      body['walletReadonly']       as boolean | undefined,
      marketplaceReadonly: body['marketplaceReadonly']  as boolean | undefined,
      aiDisabled:          body['aiDisabled']           as boolean | undefined,
      registrationBlocked: body['registrationBlocked']  as boolean | undefined,
      externalApiBlocked:  body['externalApiBlocked']   as boolean | undefined,
      reason:              body['reason']               as string  | undefined,
    });
    res.json({ ok: true, data: config });
  },

  async deactivateEmergency(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const config  = await EmergencyModeService.deactivate(actorId);
    res.json({ ok: true, data: config });
  },

  // ── 11. Broadcast ──────────────────────────────────────────────────────────────

  async sendBroadcast(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, unknown>;
    const result  = await AdminBroadcastService.send(actorId, {
      title:       body['title']       as string,
      body:        body['body']        as string,
      targetType:  body['targetType']  as BroadcastTarget,
      targetValue: body['targetValue'] as string | undefined,
      channels:    body['channels']    as BroadcastChannel[] | undefined,
      metadata:    body['metadata']    as Record<string, unknown> | undefined,
    });
    res.json({ ok: true, data: result });
  },

  async listBroadcasts(req: Request, res: Response): Promise<void> {
    const limit  = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
    const cursor = req.query['cursor'] ? String(req.query['cursor']) : undefined;
    const result = await AdminBroadcastService.list(limit, cursor);
    res.json({ ok: true, data: result });
  },

  // ── 13. Role System ────────────────────────────────────────────────────────────

  async listAdminRoles(req: Request, res: Response): Promise<void> {
    const roles = AdminRoleService.listRoles();
    res.json({ ok: true, data: roles });
  },

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    const role = String(req.params['role'] ?? '');
    const def  = AdminRoleService.getRole(role);
    if (!def) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
    res.json({ ok: true, data: def });
  },

  async assignAdminRole(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as { userId: string; role: AdminRoleType };
    if (!body.userId || !body.role) {
      res.status(400).json({ code: 'INVALID_PARAMS', message: 'userId ak role obligatwa' });
      return;
    }
    await AdminRoleService.assignRole(actorId, body.userId, body.role);
    res.json({ ok: true });
  },

  async listAdminUsers(req: Request, res: Response): Promise<void> {
    const users = await AdminRoleService.getAdminUsers();
    res.json({ ok: true, data: users });
  },

  // ── 15. System Health ──────────────────────────────────────────────────────────

  async getSystemHealth(req: Request, res: Response): Promise<void> {
    const report = await SystemHealthService.getHealth();
    res.json({ ok: true, data: report });
  },

  async getServiceHealthHistory(req: Request, res: Response): Promise<void> {
    const service = String(req.params['service'] ?? '');
    const limit   = Math.min(parseInt(String(req.query['limit'] ?? '50'), 10), 200);
    const history = await SystemHealthService.getHistory(service, limit);
    res.json({ ok: true, data: history });
  },

  // ── 17. Founder Mode ───────────────────────────────────────────────────────────

  async getFounderDashboard(req: Request, res: Response): Promise<void> {
    const userId = String(req.user?.['id'] ?? '');
    const ip     = req.ip ?? req.socket.remoteAddress;
    FounderModeService.recordFounderSession(userId, { ipAddress: ip }).catch(() => {});
    const dashboard = await FounderModeService.getExecutiveDashboard();
    res.json({ ok: true, data: dashboard });
  },
};
