import { db } from '../../../core/database/SupabaseClient.js';
import type { RevenueDashboard, RevenueInsight } from '../types/monetization.types.js';

export const RevenueAnalyticsService = {
  async getDashboard(): Promise<RevenueDashboard> {
    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7  * 86_400_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000);

    const [eventsRes, prevWeekRes, refundsRes] = await Promise.all([
      db.client()
        .from('mon_revenue_events')
        .select('fee_amount, currency, country, city, service, created_at, user_id')
        .eq('status', 'collected')
        .gte('created_at', yearStart.toISOString()),
      db.client()
        .from('mon_revenue_events')
        .select('fee_amount')
        .eq('status', 'collected')
        .gte('created_at', prevWeekStart.toISOString())
        .lt('created_at', weekStart.toISOString()),
      db.client()
        .from('mon_revenue_events')
        .select('fee_amount', { count: 'exact' })
        .eq('status', 'refunded')
        .gte('created_at', yearStart.toISOString()),
    ]);

    const rows = (eventsRes.data ?? []) as Array<Record<string, unknown>>;

    let today = 0, week = 0, month = 0, year = 0;
    const byCountry: Record<string, number>    = {};
    const byCity: Record<string, number>       = {};
    const byService: Record<string, number>    = {};
    const byCurrency: Record<string, number>   = {};
    const customerTotals: Record<string, number> = {};

    for (const row of rows) {
      const fee      = (row['fee_amount'] as number) ?? 0;
      const ts       = new Date(row['created_at'] as string);
      const currency = (row['currency'] as string) ?? 'HTG';
      const country  = row['country'] as string | null;
      const city     = row['city']    as string | null;
      const service  = row['service'] as string;
      const uid      = row['user_id'] as string | null;

      year += fee;
      if (ts >= monthStart) month += fee;
      if (ts >= weekStart)  week  += fee;
      if (ts >= todayStart) today += fee;

      if (country) byCountry[country] = (byCountry[country] ?? 0) + fee;
      if (city)    byCity[city]       = (byCity[city]       ?? 0) + fee;
      byService[service]  = (byService[service]   ?? 0) + fee;
      byCurrency[currency] = (byCurrency[currency] ?? 0) + fee;
      if (uid) customerTotals[uid] = (customerTotals[uid] ?? 0) + fee;
    }

    const topCustomers = Object.entries(customerTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, total]) => ({ userId, total }));

    const prevWeekRevenue = ((prevWeekRes.data ?? []) as Array<Record<string, unknown>>)
      .reduce((s, r) => s + ((r['fee_amount'] as number) ?? 0), 0);

    const refunds = ((refundsRes.data ?? []) as Array<Record<string, unknown>>)
      .reduce((s, r) => s + ((r['fee_amount'] as number) ?? 0), 0);

    const growthRate = prevWeekRevenue > 0
      ? Math.round(((week - prevWeekRevenue) / prevWeekRevenue) * 10000) / 100
      : 0;

    return {
      today, week, month, year,
      currency: 'HTG',
      byCountry, byCity, byService, byCurrency,
      byPaymentMethod: {},
      topCustomers,
      collectedCommissions: year,
      refunds,
      mrr: month,
      arr: month * 12,
      growthRate,
      conversionRate: 0,
      generatedAt: Date.now(),
    };
  },

  async getAIInsights(): Promise<RevenueInsight[]> {
    const dash = await RevenueAnalyticsService.getDashboard();
    const insights: RevenueInsight[] = [];

    const topServiceEntry = Object.entries(dash.byService).sort((a, b) => b[1] - a[1])[0];
    if (topServiceEntry) {
      insights.push({
        type:        'most_profitable_service',
        title:       `${topServiceEntry[0]} se sèvis ki pi pwofitab`,
        description: `${topServiceEntry[0]} jenere ${topServiceEntry[1].toLocaleString()} HTG komisyon. Konsidere envesti plis nan sèvis sa a pou ogmante revni.`,
        data:        { service: topServiceEntry[0], revenue: topServiceEntry[1] },
        confidence:  90,
      });
    }

    const topCountryEntry = Object.entries(dash.byCountry).sort((a, b) => b[1] - a[1])[0];
    if (topCountryEntry) {
      insights.push({
        type:        'fastest_growing_country',
        title:       `Peyi ${topCountryEntry[0]} se pi aktif`,
        description: `${topCountryEntry[0]} jenere ${topCountryEntry[1].toLocaleString()} HTG. Optimize eksperyans pou itilizatè peyi sa a pou grandi plis.`,
        data:        { country: topCountryEntry[0], revenue: topCountryEntry[1] },
        confidence:  85,
      });
    }

    if (dash.growthRate < -10) {
      insights.push({
        type:        'churn_risk',
        title:       'Revni an bese semèn sa a',
        description: `Revni a diminye pa ${Math.abs(dash.growthRate)}% konpare ak semèn pase a. Verifye si gen pwoblèm teknik oswa fidbak negatif itilizatè.`,
        data:        { growthRate: dash.growthRate },
        confidence:  75,
      });
    } else if (dash.growthRate > 20) {
      insights.push({
        type:        'new_opportunity',
        title:       'Kwasans rapid detekte',
        description: `Revni an monte ${dash.growthRate}% semèn sa a. Se bon moman pou elaji kapasite ak ajoute nouvo sèvis.`,
        data:        { growthRate: dash.growthRate },
        confidence:  80,
      });
    }

    if (dash.refunds > dash.year * 0.1 && dash.year > 0) {
      insights.push({
        type:        'high_commission_risk',
        title:       'To ranbousman wo detekte',
        description: `Ranbousman yo reprezante ${Math.round((dash.refunds / dash.year) * 100)}% revni total la. Revize pwosesis oswa pri yo pou diminye ranbousman.`,
        data:        { refunds: dash.refunds, refundRate: dash.refunds / dash.year },
        confidence:  70,
      });
    }

    if (insights.length === 0) {
      insights.push({
        type:        'new_opportunity',
        title:       'Platfòm lan pare pou monetizasyon',
        description: 'Aktive monetizasyon sou yon sèvis pou kòmanse jenere revni. Kòmanse ak Marketplace oswa Wallet kòm premye etap.',
        confidence:  95,
      });
    }

    return insights;
  },
};