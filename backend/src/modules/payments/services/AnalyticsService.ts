import { db } from '../../../core/database/SupabaseClient.js';

interface PaymentMetrics {
  totalVolume:    number;
  totalCount:     number;
  successRate:    number;
  avgAmount:      number;
  byProvider:     Record<string, { count: number; volume: number; successRate: number }>;
  byMethod:       Record<string, { count: number; volume: number }>;
  byCurrency:     Record<string, { count: number; volume: number }>;
  byCountry:      Record<string, { count: number; volume: number }>;
  byStatus:       Record<string, number>;
}

export const AnalyticsService = {
  async getMetrics(opts: {
    userId?: string;
    from?:   string;
    to?:     string;
    country?: string;
    currency?: string;
  } = {}): Promise<PaymentMetrics> {
    const client  = db.client();
    let query     = client.from('pay_payment_intents').select('*');

    if (opts.userId)   query = query.eq('user_id', opts.userId);
    if (opts.currency) query = query.eq('currency', opts.currency);
    if (opts.from)     query = query.gte('created_at', opts.from);
    if (opts.to)       query = query.lte('created_at', opts.to);

    const { data = [], error } = await query;
    if (error) throw new Error(error.message);

    const rows = data as Array<{
      status:   string; amount: number; currency: string;
      provider?: string; method: string; metadata?: Record<string, unknown>;
    }>;

    const metrics: PaymentMetrics = {
      totalVolume: 0, totalCount: rows.length, successRate: 0, avgAmount: 0,
      byProvider: {}, byMethod: {}, byCurrency: {}, byCountry: {}, byStatus: {},
    };

    let successCount = 0;
    for (const r of rows) {
      metrics.totalVolume += r.amount;
      if (r.status === 'completed' || r.status === 'captured') successCount++;

      // By status
      metrics.byStatus[r.status] = (metrics.byStatus[r.status] ?? 0) + 1;

      // By provider
      if (r.provider) {
        const p = metrics.byProvider[r.provider] ?? { count: 0, volume: 0, successRate: 0 };
        p.count++; p.volume += r.amount;
        if (r.status === 'completed') p.successRate++;
        metrics.byProvider[r.provider] = p;
      }

      // By method
      const m = metrics.byMethod[r.method] ?? { count: 0, volume: 0 };
      m.count++; m.volume += r.amount;
      metrics.byMethod[r.method] = m;

      // By currency
      const c = metrics.byCurrency[r.currency] ?? { count: 0, volume: 0 };
      c.count++; c.volume += r.amount;
      metrics.byCurrency[r.currency] = c;

      // By country (from metadata)
      const country = String(r.metadata?.['country'] ?? 'unknown');
      const cn = metrics.byCountry[country] ?? { count: 0, volume: 0 };
      cn.count++; cn.volume += r.amount;
      metrics.byCountry[country] = cn;
    }

    metrics.successRate = rows.length > 0 ? (successCount / rows.length) * 100 : 0;
    metrics.avgAmount   = rows.length > 0 ? metrics.totalVolume / rows.length   : 0;

    // Convert provider success counts to percentages
    for (const p of Object.values(metrics.byProvider)) {
      p.successRate = p.count > 0 ? (p.successRate / p.count) * 100 : 0;
    }

    return metrics;
  },

  async getRevenue(opts: { from: string; to: string; currency?: string } = { from: '', to: '' }) {
    const client = db.client();
    let query    = client.from('pay_split_entries')
      .select('amount, currency, created_at')
      .eq('recipient', 'platform');

    if (opts.currency) query = query.eq('currency', opts.currency);
    if (opts.from)     query = query.gte('created_at', opts.from);
    if (opts.to)       query = query.lte('created_at', opts.to);

    const { data = [], error } = await query;
    if (error) throw new Error(error.message);

    const rows = data as Array<{ amount: number; currency: string; created_at: string }>;
    const total  = rows.reduce((s, r) => s + r.amount, 0);
    const byCurrency: Record<string, number> = {};
    for (const r of rows) {
      byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + r.amount;
    }
    return { total, count: rows.length, byCurrency };
  },
};
