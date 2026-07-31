import { TelecomRepository }       from '../repositories/TelecomRepository.js';
import { TelecomAnalyticsService }  from './TelecomAnalyticsService.js';

interface AIInsight { type: string; message: string; confidence: number; action?: string }

export const TelecomAIService = {
  async getInsights(operatorId: string, lang = 'ht'): Promise<AIInsight[]> {
    const period    = new Date().toISOString().slice(0, 7);
    const analytics = await TelecomAnalyticsService.generate(operatorId, period);
    const insights: AIInsight[] = [];

    // Demand prediction
    const avgDaily = analytics.totalRevenue / new Date().getDate();
    insights.push({
      type:       'demand_forecast',
      message:    lang === 'en'
        ? `Projected monthly revenue: ${Math.round(avgDaily * 30 / 100).toLocaleString()} ${analytics.currency}`
        : `Revni pwojte pou mwa a: ${Math.round(avgDaily * 30 / 100).toLocaleString()} ${analytics.currency}`,
      confidence: 72,
      action:     lang === 'en' ? 'Increase bundle promotions this weekend' : 'Ogmante pwomosyon pakè finde semèn',
    });

    // Top bundle recommendation
    const topBundle = analytics.topBundles[0];
    if (topBundle) {
      insights.push({
        type:       'bundle_recommendation',
        message:    lang === 'en'
          ? `${topBundle.name} is your best-selling bundle (${topBundle.count} sales)`
          : `${topBundle.name} se pakè ou vann plis a (${topBundle.count} vant)`,
        confidence: 88,
        action:     lang === 'en' ? 'Consider creating a similar bundle at a lower price point' : 'Konsidere kreye yon pakè similè ak yon pri pi ba',
      });
    }

    // Fraud alert
    if (analytics.failedCount > analytics.totalRecharges * 0.1) {
      insights.push({
        type:       'fraud_alert',
        message:    lang === 'en'
          ? `High failure rate detected: ${analytics.failedCount} failed recharges`
          : `To echèk wo: ${analytics.failedCount} recharge echwe`,
        confidence: 85,
        action:     lang === 'en' ? 'Review API connector and fraud rules' : 'Revize konektè API ak règ fwod',
      });
    }

    // Peak hour optimization
    insights.push({
      type:       'peak_optimization',
      message:    lang === 'en'
        ? `Peak activity at ${analytics.peakHour}:00 UTC — schedule promotions accordingly`
        : `Aktivite maksimòm nan ${analytics.peakHour}:00 UTC — planifye pwomosyon selon sa`,
      confidence: 79,
    });

    // Commission optimization
    if (analytics.commissionPaid > analytics.totalRevenue * 0.15) {
      insights.push({
        type:       'commission_optimization',
        message:    lang === 'en'
          ? 'Commission costs exceed 15% of revenue — review dealer tier rates'
          : 'Depans komisyon depase 15% revni — revize to pa nivo revandè',
        confidence: 66,
        action:     lang === 'en' ? 'Adjust commission rules for bronze/agent tiers' : 'Ajiste règ komisyon pou nivo bronze/ajan',
      });
    }

    return insights;
  },

  async recommendBundles(operatorId: string, userId: string): Promise<Array<{ bundleId: string; name: string; reason: string }>> {
    const recharges = await TelecomRepository.listRecharges({ userId, status: 'completed', limit: 20 });
    const bundles   = await TelecomRepository.listBundles(operatorId);

    const usedBundleIds = new Set(recharges.map(r => r.bundleId).filter(Boolean));
    const avgAmount     = recharges.length > 0 ? recharges.reduce((s, r) => s + r.amount, 0) / recharges.length : 0;

    return bundles
      .filter(b => !usedBundleIds.has(b.id))
      .filter(b => b.price <= avgAmount * 1.5)
      .slice(0, 3)
      .map(b => ({
        bundleId: b.id,
        name:     b.name,
        reason:   `${b.dataGb ? b.dataGb + 'GB' : ''} ${b.minutesMins ? b.minutesMins + 'min' : ''} — ${b.validityDays} jou`.trim(),
      }));
  },

  async detectAnomalies(operatorId: string): Promise<string[]> {
    const fraudEvents = await TelecomRepository.listFraudEvents(operatorId, 20);
    const recharges   = await TelecomRepository.listRecharges({ operatorId, status: 'failed', limit: 50 });
    const anomalies: string[] = [];

    if (fraudEvents.filter(f => f.action === 'blocked').length > 5) {
      anomalies.push('Enòm tantativ fwod bloke nan 24 dènye è yo');
    }
    if (recharges.length > 20) {
      anomalies.push(`${recharges.length} recharge echwe — verifye koneksyon API`);
    }

    return anomalies;
  },
};