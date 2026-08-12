import { db } from '../../../core/database/SupabaseClient.js';
import type { Timezone, DstRule } from '../types/localization.types.js';

export const TimezoneService = {
  async listActive(): Promise<Timezone[]> {
    const { data, error } = await db.client()
      .from('timezones')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('utc_offset_minutes');
    if (error) throw error;
    return (data ?? []) as Timezone[];
  },

  async getById(id: string): Promise<Timezone | null> {
    const { data, error } = await db.client()
      .from('timezones')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    return data as Timezone | null;
  },

  async getByZoneName(zoneName: string): Promise<Timezone | null> {
    const { data, error } = await db.client()
      .from('timezones')
      .select('*')
      .eq('zone_name', zoneName)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    return data as Timezone | null;
  },

  async listByCountry(countryId: string): Promise<Timezone[]> {
    const { data, error } = await db.client()
      .from('timezones')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('utc_offset_minutes');
    if (error) throw error;
    return (data ?? []) as Timezone[];
  },

  async getDstRules(timezoneId: string, year?: number): Promise<DstRule[]> {
    let q = db.client()
      .from('dst_rules')
      .select('*')
      .eq('timezone_id', timezoneId)
      .eq('is_deleted', false)
      .order('year', { ascending: false });

    if (year != null) q = q.eq('year', year);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DstRule[];
  },
};
