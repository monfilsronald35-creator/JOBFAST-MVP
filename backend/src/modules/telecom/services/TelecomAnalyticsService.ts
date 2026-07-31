import { TelecomRepository }  from '../repositories/TelecomRepository.js';
import { getAPIStatus }        from './TelecomAPIConnector.js';
import type { TelecomAnalytics, TelecomDashboard } from '../types/telecom.types.js';

export const TelecomAnalyticsService = {
  async generate(operatorId: string, period: string): Promise<TelecomAnalytics> {
    const [recharges, bundles, dealers, fraudEvents] = await Promise.all([
      TelecomRepository.listRecharges({ operatorId, limit: 5000 }),
      TelecomRepository.listBundles(operatorId),
      TelecomRepository.listDealers(operatorId),
      TelecomRepository.listFraudEvents(operatorId, 100),
    ]);

    const periodRecharges = recharges.filter(r => r.createdAt.startsWith(period));
    const completed       = periodRecharges.filter(r => r.status === 'completed');
    const failed          = periodRecharges.filter(r => r.status === 'failed');

    const totalRevenue  = completed.reduce((s, r) => s + r.amount, 0);
    const successRate   = periodRecharges.length > 0
      ? Math.round((completed.length / periodRecharges.length) * 100)
      : 0;

    // Top bundles
    const bundleMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const r of completed) {
      if (!r.bundleId) continue;
      if (!bundleMap[r.bundleId]) {
        const b = bundles.find(bn => bn.id === r.bundleId);
        bundleMap[r.bundleId] = { name: b?.name ?? r.bundleId, count: 0, revenue: 0 };
      }
      bundleMap[r.bundleId]!.count   += 1;
      bundleMap[r.bundleId]!.revenue += r.amount;
    }
    const topBundles = Object.entries(bundleMap)
      .map(([bundleId, v]) => ({ bundleId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top countries (from dealers)
    const countryMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of completed) {
      const d = dealers.find(dl => dl.id === r.dealerId);
      const country = d?.country ?? 'HT';
      if (!countryMap[country]) countryMap[country] = { count: 0, revenue: 0 };
      countryMap[country]!.count   += 1;
      countryMap[country]!.revenue += r.amount;
    }
    const topCountries = Object.entries(countryMap)
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Peak hour
    const hourCounts = new Array<number>(24).fill(0);
    for (const r of completed) {
      const h = new Date(r.createdAt).getUTCHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const peakHour = hourCounts.reduce((best, cnt, h) => cnt > (hourCounts[best] ?? 0) ? h : best, 0);

    const commissions = await TelecomRepository.listCommissions(dealers[0]?.id ?? '', 'paid');
    const commissionPaid = commissions.reduce((s, c) => s + c.amount, 0);

    const op = await TelecomRepository.getOperator(operatorId);

    return {
      operatorId, period,
      totalRecharges: completed.length,
      totalRevenue,
      currency:       op?.currency ?? 'HTG',
      successRate,
      topBundles,
      topCountries,
      peakHour,
      failedCount:    failed.length,
      newDealers:     dealers.filter(d => d.createdAt.startsWith(period)).length,
      commissionPaid,
      generatedAt:    new Date().toISOString(),
    };
  },

  async getDashboard(operatorId: string): Promise<TelecomDashboard> {
    const today = new Date().toISOString().slice(0, 10);
    const op    = await TelecomRepository.getOperator(operatorId);
    if (!op) throw new Error('Operator not found');

    const [recharges, dealers, sims, fraudEvents] = await Promise.all([
      TelecomRepository.listRecharges({ operatorId, limit: 5000 }),
      TelecomRepository.listDealers(operatorId),
      TelecomRepository.listBundles(operatorId),
      TelecomRepository.listFraudEvents(operatorId, 100),
    ]);

    const todayRecharges = recharges.filter(r => r.createdAt.startsWith(today));
    const completed      = todayRecharges.filter(r => r.status === 'completed');
    const bundleRecharges= completed.filter(r => r.bundleId);

    const revenueToday = completed.reduce((s, r) => s + r.amount, 0);

    const allDealerCommissions = await Promise.all(
      dealers.slice(0, 20).map(d => TelecomRepository.listCommissions(d.id, 'approved')),
    );
    const commissionDue = allDealerCommissions.flat().reduce((s, c) => s + c.amount, 0);

    const fraudAlerts = fraudEvents.filter(f => f.action === 'flagged' || f.action === 'blocked').length;

    return {
      operatorId, operatorName: op.name,
      revenueToday,
      salesToday:     completed.length,
      rechargeCount:  todayRecharges.length,
      bundleCount:    bundleRecharges.length,
      simActivations: sims.filter(b => b.isActive).length,
      commissionDue,
      dealerCount:    dealers.length,
      customerCount:  new Set(recharges.map(r => r.userId)).size,
      fraudAlerts,
      apiStatus:      getAPIStatus(operatorId),
      currency:       op.currency,
      generatedAt:    new Date().toISOString(),
    };
  },
};