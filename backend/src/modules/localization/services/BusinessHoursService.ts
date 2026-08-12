import { db } from '../../../core/database/SupabaseClient.js';
import type { BusinessHours } from '../types/localization.types.js';

export const BusinessHoursService = {
  async listByEntity(entityId: string): Promise<BusinessHours[]> {
    const { data, error } = await db.client()
      .from('business_hours')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .order('day_of_week');
    if (error) throw error;
    return (data ?? []) as BusinessHours[];
  },

  async listByCountry(countryId: string): Promise<BusinessHours[]> {
    const { data, error } = await db.client()
      .from('business_hours')
      .select('*')
      .eq('country_id', countryId)
      .is('entity_id', null)
      .eq('is_deleted', false)
      .order('day_of_week');
    if (error) throw error;
    return (data ?? []) as BusinessHours[];
  },

  async upsert(rows: Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>[]): Promise<BusinessHours[]> {
    const { data, error } = await db.client()
      .from('business_hours')
      .upsert(rows, { onConflict: 'country_id,entity_id,day_of_week,opens_at', ignoreDuplicates: false })
      .select();
    if (error) throw error;
    return (data ?? []) as BusinessHours[];
  },

  isOpenNow(hours: BusinessHours[], timezoneOffsetMinutes = 0): boolean {
    const now   = new Date(Date.now() + timezoneOffsetMinutes * 60_000);
    const dow   = now.getUTCDay() === 0 ? 7 : now.getUTCDay(); // 1=Mon, 7=Sun
    const hhmm  = now.getUTCHours() * 60 + now.getUTCMinutes();

    const entry = hours.find(h => h.day_of_week === dow);
    if (!entry || entry.is_closed) return false;
    if (entry.is_24_hours) return true;
    if (!entry.opens_at || !entry.closes_at) return false;

    const [oh, om] = entry.opens_at.split(':').map(Number);
    const [ch, cm] = entry.closes_at.split(':').map(Number);
    const open  = (oh ?? 0) * 60 + (om ?? 0);
    const close = (ch ?? 0) * 60 + (cm ?? 0);

    if (entry.crosses_midnight) return hhmm >= open || hhmm < close;
    return hhmm >= open && hhmm < close;
  },
};
