import { db } from '../../../core/database/SupabaseClient.js';
import type { Holiday } from '../types/localization.types.js';

export const HolidayService = {
  async listByCountry(
    countryId: string,
    opts: { year?: number; scope?: string } = {},
  ): Promise<Holiday[]> {
    let q = db.client()
      .from('holidays')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_deleted', false)
      .order('holiday_date');

    if (opts.year != null) {
      const start = `${opts.year}-01-01`;
      const end   = `${opts.year}-12-31`;
      q = q.gte('holiday_date', start).lte('holiday_date', end);
    }
    if (opts.scope) q = q.eq('holiday_scope', opts.scope);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Holiday[];
  },

  async isHoliday(countryId: string, date: string): Promise<boolean> {
    const { data, error } = await db.client()
      .from('holidays')
      .select('id')
      .eq('country_id', countryId)
      .eq('holiday_date', date)
      .eq('is_deleted', false)
      .limit(1);
    if (error) throw error;
    return (data ?? []).length > 0;
  },

  async search(countryId: string, query: string): Promise<Holiday[]> {
    const { data, error } = await db.client()
      .from('holidays')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_deleted', false)
      .textSearch('search_vector', query, { type: 'plain' })
      .order('holiday_date')
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Holiday[];
  },
};
