import { db } from '../../../core/database/SupabaseClient.js';
import type { WorkingDay } from '../types/localization.types.js';

export const WorkingDaysService = {
  async listByCountry(countryId: string): Promise<WorkingDay[]> {
    const { data, error } = await db.client()
      .from('working_days')
      .select('*')
      .eq('country_id', countryId)
      .is('entity_id', null)
      .eq('is_deleted', false)
      .order('day_of_week');
    if (error) throw error;
    return (data ?? []) as WorkingDay[];
  },

  async listByEntity(entityId: string): Promise<WorkingDay[]> {
    const { data, error } = await db.client()
      .from('working_days')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_deleted', false)
      .order('day_of_week');
    if (error) throw error;
    return (data ?? []) as WorkingDay[];
  },

  async upsert(rows: Omit<WorkingDay, 'id' | 'created_at' | 'updated_at'>[]): Promise<WorkingDay[]> {
    const { data, error } = await db.client()
      .from('working_days')
      .upsert(rows, { onConflict: 'country_id,entity_id,day_of_week', ignoreDuplicates: false })
      .select();
    if (error) throw error;
    return (data ?? []) as WorkingDay[];
  },
};
