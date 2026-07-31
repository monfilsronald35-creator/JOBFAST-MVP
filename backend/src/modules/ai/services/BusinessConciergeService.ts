import { db }           from '../../../core/database/SupabaseClient.js';
import type { BusinessKPIs } from '../types/ai.types.js';

export const BusinessConciergeService = {
  async getKPIs(userId: string, currency = 'HTG'): Promise<BusinessKPIs> {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    // Revenue today
    const { data: todayTx } = await db.client()
      .from('wlt_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', `${today}T00:00:00Z`);

    const revenueToday = (todayTx ?? []).reduce(
      (s, r) => s + Number((r as Record<string, unknown>)['amount'] ?? 0), 0,
    );

    // Revenue MTD
    const { data: mtdTx } = await db.client()
      .from('wlt_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .gte('created_at', `${monthStart}T00:00:00Z`);

    const revenueMTD = (mtdTx ?? []).reduce(
      (s, r) => s + Number((r as Record<string, unknown>)['amount'] ?? 0), 0,
    );

    // Sales count (job completions this month)
    const { count: salesCount } = await db.client()
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', `${monthStart}T00:00:00Z`);

    // Open hiring positions
    const { count: openPositions } = await db.client()
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'open');

    // Notifications as risk alerts (fraud/payment_failed type)
    const { data: alerts } = await db.client()
      .from('notif_notifications')
      .select('title')
      .eq('user_id', userId)
      .in('event_type', ['fraud.alert', 'payment.failed'])
      .eq('is_read', false)
      .limit(5);

    const riskAlerts = (alerts ?? []).map(r => String((r as Record<string, unknown>)['title'] ?? ''));

    const growthRate = revenueMTD > 0 && revenueToday > 0
      ? Math.round((revenueToday / (revenueMTD / new Date().getDate())) * 100 - 100)
      : 0;

    return {
      revenueToday,
      revenueMTD,
      salesCount:    salesCount ?? 0,
      topCustomers:  [],
      riskAlerts,
      inventoryAlert: [],
      openPositions:  openPositions ?? 0,
      demandForecast: 'Demand pwojte ↑ 12% semèn pwochen',
      growthRate,
      currency,
    };
  },
};