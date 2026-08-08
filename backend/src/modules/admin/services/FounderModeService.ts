import { db } from '../../../core/database/SupabaseClient.js';

export interface ExecutiveDashboard {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
    byCountry: Record<string, number>;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    currency: string;
    mrr: number;
    arr: number;
    growthRateWeekly: number;
  };
  ai: {
    requestsToday: number;
    estimatedCostUsd: number;
    topModels: Array<{ model: string; count: number }>;
  };
  services: Array<{ name: string; status: 'green' | 'yellow' | 'red' }>;
  kpis: {
    dau: number;
    wau: number;
    mau: number;
    retentionRate: number;
    conversionRate: number;
  };
  securityAlerts: Array<{ level: string; message: string; at: number }>;
  generatedAt: number;
}

export const FounderModeService = {
  async getExecutiveDashboard(): Promise<ExecutiveDashboard> {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7  * 86_400_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsersRes,
      activeUsersRes,
      newWeekRes,
      revenueYearRes,
      prevWeekRevenueRes,
    ] = await Promise.all([
      db.client().from('profiles').select('id', { count: 'exact', head: true }),
      db.client().from('profiles').select('id', { count: 'exact', head: true })
        .eq('status', 'active').gte('updated_at', weekStart.toISOString()),
      db.client().from('profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),
      db.client().from('mon_revenue_events').select('fee_amount, created_at')
        .eq('status', 'collected').gte('created_at', yearStart.toISOString()),
      db.client().from('mon_revenue_events').select('fee_amount')
        .eq('status', 'collected')
        .gte('created_at', new Date(weekStart.getTime() - 7 * 86_400_000).toISOString())
        .lt('created_at', weekStart.toISOString()),
    ]);

    const revenueRows = (revenueYearRes.data ?? []) as Array<Record<string, unknown>>;
    let todayRev = 0, weekRev = 0, monthRev = 0, yearRev = 0;
    for (const r of revenueRows) {
      const fee = (r['fee_amount'] as number) ?? 0;
      const ts  = new Date(r['created_at'] as string);
      yearRev  += fee;
      if (ts >= monthStart) monthRev += fee;
      if (ts >= weekStart)  weekRev  += fee;
      if (ts >= todayStart) todayRev += fee;
    }

    const prevWeekRev = ((prevWeekRevenueRes.data ?? []) as Array<Record<string, unknown>>)
      .reduce((s, r) => s + ((r['fee_amount'] as number) ?? 0), 0);
    const growthRate  = prevWeekRev > 0
      ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 10000) / 100
      : 0;

    const totalUsers  = totalUsersRes.count  ?? 0;
    const activeUsers = activeUsersRes.count ?? 0;

    return {
      users: {
        total:       totalUsers,
        active:      activeUsers,
        newThisWeek: newWeekRes.count ?? 0,
        byCountry:   {},
      },
      revenue: {
        today:            todayRev,
        week:             weekRev,
        month:            monthRev,
        year:             yearRev,
        currency:         'HTG',
        mrr:              monthRev,
        arr:              monthRev * 12,
        growthRateWeekly: growthRate,
      },
      ai: {
        requestsToday:    0,
        estimatedCostUsd: 0,
        topModels:        [],
      },
      services: [
        { name: 'API',          status: 'green' },
        { name: 'Database',     status: 'green' },
        { name: 'Wallet',       status: 'green' },
        { name: 'Realtime',     status: 'green' },
        { name: 'AI Platform',  status: 'green' },
        { name: 'Notifications',status: 'green' },
        { name: 'Storage',      status: 'green' },
        { name: 'Maps',         status: 'green' },
      ],
      kpis: {
        dau:            activeUsers,
        wau:            newWeekRes.count ?? 0,
        mau:            totalUsers,
        retentionRate:  totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        conversionRate: 0,
      },
      securityAlerts: [],
      generatedAt:    Date.now(),
    };
  },

  async recordFounderSession(userId: string, meta: { deviceFingerprint?: string; ipAddress?: string; country?: string }): Promise<void> {
    const payload: Record<string, unknown> = { user_id: userId };
    if (meta.deviceFingerprint) payload['device_fingerprint'] = meta.deviceFingerprint;
    if (meta.ipAddress)         payload['ip_address']         = meta.ipAddress;
    if (meta.country)           payload['country']            = meta.country;
    await db.client().from('adm_founder_sessions').insert(payload);
  },
};
