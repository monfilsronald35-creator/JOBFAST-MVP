import { db } from '../../../core/database/SupabaseClient.js';

export interface GlobalStats {
  onlineUsers: number;
  totalUsers: number;
  newUsersToday: number;
  activeJobs: number;
  newJobsToday: number;
  transactionsToday: number;
  revenueToday: number;
  messagesTotal: number;
  ordersToday: number;
  bookingsToday: number;
  aiRequestsToday: number;
  fraudAlertsOpen: number;
  errorsToday: number;
  pendingModeration: number;
  generatedAt: number;
}

export interface LiveMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: 'ok' | 'warn' | 'critical';
  updatedAt: number;
}

export const AdminDashboardService = {
  async getGlobalStats(): Promise<GlobalStats> {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const onlineAt   = new Date(Date.now() - 15 * 60 * 1000);

    const [
      onlineRes,
      totalUsersRes,
      newUsersRes,
      activeJobsRes,
      newJobsRes,
      txTodayRes,
      pendingModRes,
    ] = await Promise.all([
      db.client().from('profiles').select('id', { count: 'exact', head: true })
        .gte('updated_at', onlineAt.toISOString()).eq('status', 'active'),
      db.client().from('profiles').select('id', { count: 'exact', head: true }),
      db.client().from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      db.client().from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.client().from('jobs').select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      db.client().from('mon_revenue_events').select('id,fee_amount', { count: 'exact' })
        .gte('created_at', todayStart.toISOString()).eq('status', 'collected'),
      db.client().from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const txRows = (txTodayRes.data ?? []) as Array<Record<string, unknown>>;
    const revenueToday = txRows.reduce((s, r) => s + ((r['fee_amount'] as number) ?? 0), 0);

    return {
      onlineUsers:        onlineRes.count        ?? 0,
      totalUsers:         totalUsersRes.count     ?? 0,
      newUsersToday:      newUsersRes.count       ?? 0,
      activeJobs:         activeJobsRes.count     ?? 0,
      newJobsToday:       newJobsRes.count        ?? 0,
      transactionsToday:  txTodayRes.count        ?? 0,
      revenueToday,
      messagesTotal:      0,
      ordersToday:        0,
      bookingsToday:      0,
      aiRequestsToday:    0,
      fraudAlertsOpen:    0,
      errorsToday:        0,
      pendingModeration:  pendingModRes.count     ?? 0,
      generatedAt:        Date.now(),
    };
  },

  async getLiveMetrics(): Promise<LiveMetric[]> {
    const stats = await AdminDashboardService.getGlobalStats();
    const now   = Date.now();
    return [
      { name: 'Online Users',       value: stats.onlineUsers,       unit: 'users',  status: 'ok',   updatedAt: now },
      { name: 'New Users Today',    value: stats.newUsersToday,     unit: 'users',  status: 'ok',   updatedAt: now },
      { name: 'Transactions Today', value: stats.transactionsToday, unit: 'tx',     status: 'ok',   updatedAt: now },
      { name: 'Revenue Today',      value: stats.revenueToday,      unit: 'HTG',    status: 'ok',   updatedAt: now },
      { name: 'Active Jobs',        value: stats.activeJobs,        unit: 'jobs',   status: 'ok',   updatedAt: now },
      { name: 'Pending Moderation', value: stats.pendingModeration, unit: 'items',
        status: stats.pendingModeration > 50 ? 'warn' : 'ok', updatedAt: now },
      { name: 'Fraud Alerts',       value: stats.fraudAlertsOpen,   unit: 'alerts',
        status: stats.fraudAlertsOpen > 0 ? 'critical' : 'ok', updatedAt: now },
    ];
  },
};
