/**
 * CountryAnalyticsService — aggregates platform metrics per country.
 * Used by the admin dashboard to make strategic decisions.
 */
import { db }                    from '../../../core/database/SupabaseClient.js';
import { CountryConfigService }  from './CountryConfigService.js';
import type { CountryStats }     from '../types/localization.types.js';

export const CountryAnalyticsService = {
  /**
   * Returns per-country stats: users, jobs, revenue, orders.
   * Heavy query — results should be cached at the HTTP layer.
   */
  async getStats(): Promise<CountryStats[]> {
    const [countries, userCtx, jobs, payments, orders] = await Promise.all([
      CountryConfigService.listActive(),
      db.client().from('loc_user_context').select('country'),
      db.client().from('jobs').select('country').not('country', 'is', null),
      db.client().from('payment_intents').select('amount, metadata').eq('status', 'completed'),
      db.client().from('marketplace_orders').select('country').not('country', 'is', null),
    ]);

    // Aggregate user counts per country
    const userMap  = new Map<string, number>();
    const jobMap   = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    const orderMap = new Map<string, number>();

    for (const r of (userCtx.data ?? []) as Record<string, unknown>[]) {
      const c = String(r['country'] ?? '');
      userMap.set(c, (userMap.get(c) ?? 0) + 1);
    }
    for (const r of (jobs.data ?? []) as Record<string, unknown>[]) {
      const c = String(r['country'] ?? '');
      jobMap.set(c, (jobMap.get(c) ?? 0) + 1);
    }
    for (const r of (payments.data ?? []) as Record<string, unknown>[]) {
      const meta = r['metadata'] as Record<string, unknown> | null;
      const c = String(meta?.['country'] ?? '');
      if (c) revenueMap.set(c, (revenueMap.get(c) ?? 0) + Number(r['amount'] ?? 0));
    }
    for (const r of (orders.data ?? []) as Record<string, unknown>[]) {
      const c = String(r['country'] ?? '');
      orderMap.set(c, (orderMap.get(c) ?? 0) + 1);
    }

    return countries.map(cfg => ({
      country:  cfg.code,
      users:    userMap.get(cfg.code)    ?? 0,
      jobs:     jobMap.get(cfg.code)     ?? 0,
      revenue:  revenueMap.get(cfg.code) ?? 0,
      orders:   orderMap.get(cfg.code)   ?? 0,
    }));
  },

  /**
   * Returns usage trend for a specific country (last 30 days).
   * Groups new users, jobs posted, revenue by day.
   */
  async getTrend(country: string): Promise<Array<{ date: string; users: number; jobs: number; revenue: number }>> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [newUsers, newJobs] = await Promise.all([
      db.client()
        .from('loc_user_context')
        .select('updated_at')
        .eq('country', country)
        .gte('updated_at', since),
      db.client()
        .from('jobs')
        .select('created_at')
        .eq('country', country)
        .gte('created_at', since),
    ]);

    // Group by date (YYYY-MM-DD)
    const byDate = new Map<string, { users: number; jobs: number; revenue: number }>();

    function day(iso: string): string { return iso.slice(0, 10); }
    function ensure(d: string): { users: number; jobs: number; revenue: number } {
      if (!byDate.has(d)) byDate.set(d, { users: 0, jobs: 0, revenue: 0 });
      return byDate.get(d)!;
    }

    for (const r of (newUsers.data ?? []) as Record<string, unknown>[]) {
      ensure(day(String(r['updated_at'] ?? ''))).users++;
    }
    for (const r of (newJobs.data ?? []) as Record<string, unknown>[]) {
      ensure(day(String(r['created_at'] ?? ''))).jobs++;
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  },

  /**
   * Top N countries by user count.
   */
  async topCountriesByUsers(limit = 10): Promise<Array<{ country: string; users: number }>> {
    const { data } = await db.client()
      .from('loc_user_context')
      .select('country');

    const map = new Map<string, number>();
    for (const r of (data ?? []) as Record<string, unknown>[]) {
      const c = String(r['country'] ?? '');
      map.set(c, (map.get(c) ?? 0) + 1);
    }

    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([country, users]) => ({ country, users }));
  },
};