import { db } from '../../../core/database/SupabaseClient.js';

export const SearchAnalyticsRepository = {
  async logQuery(input: {
    userId?:       string | undefined;
    query:         string;
    source?:       string | undefined;
    resultsCount:  number;
    tookMs:        number;
    lat?:          number | undefined;
    lng?:          number | undefined;
    country?:      string | undefined;
    lang?:         string | undefined;
    sessionId?:    string | undefined;
  }): Promise<void> {
    const row: Record<string, unknown> = {
      query:         input.query,
      results_count: input.resultsCount,
      took_ms:       input.tookMs,
    };
    if (input.userId)    row['user_id']   = input.userId;
    if (input.source)    row['source']    = input.source;
    if (input.lat)       row['lat']       = input.lat;
    if (input.lng)       row['lng']       = input.lng;
    if (input.country)   row['country']   = input.country;
    if (input.lang)      row['lang']      = input.lang;
    if (input.sessionId) row['session_id'] = input.sessionId;

    await db.client().from('srch_queries').insert(row);
  },

  async getTrending(country = 'HT', lang = 'ht', days = 7, limit = 10): Promise<Array<{ query: string; count: number }>> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const { data } = await db.client()
      .from('srch_trending')
      .select('query, count')
      .eq('country', country)
      .gte('date', from)
      .order('count', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => ({
      query: String((r as Record<string, unknown>)['query'] ?? ''),
      count: Number((r as Record<string, unknown>)['count'] ?? 0),
    }));
  },

  async getMostSearched(days = 30, limit = 10): Promise<Array<{ query: string; count: number }>> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data } = await db.client()
      .from('srch_queries')
      .select('query')
      .gte('created_at', from)
      .limit(1000);

    const counts: Record<string, number> = {};
    for (const r of data ?? []) {
      const q = String((r as Record<string, unknown>)['query'] ?? '');
      counts[q] = (counts[q] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  },

  async getZeroResultSearches(days = 7, limit = 10): Promise<Array<{ query: string; count: number }>> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data } = await db.client()
      .from('srch_queries')
      .select('query')
      .eq('results_count', 0)
      .gte('created_at', from)
      .limit(500);

    const counts: Record<string, number> = {};
    for (const r of data ?? []) {
      const q = String((r as Record<string, unknown>)['query'] ?? '');
      counts[q] = (counts[q] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  },

  async getPerformanceStats(days = 7): Promise<{ avgTookMs: number; totalSearches: number; zeroResultRate: number }> {
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data } = await db.client()
      .from('srch_queries')
      .select('took_ms, results_count')
      .gte('created_at', from)
      .limit(10000);
    const rows = data ?? [];
    const total = rows.length;
    if (total === 0) return { avgTookMs: 0, totalSearches: 0, zeroResultRate: 0 };
    const sumMs = rows.reduce((s, r) => s + Number((r as Record<string, unknown>)['took_ms'] ?? 0), 0);
    const zeros = rows.filter(r => Number((r as Record<string, unknown>)['results_count'] ?? 1) === 0).length;
    return {
      avgTookMs:      Math.round(sumMs / total),
      totalSearches:  total,
      zeroResultRate: Math.round((zeros / total) * 10000) / 100,
    };
  },
};