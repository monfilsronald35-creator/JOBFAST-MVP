import { db }         from '../../../core/database/SupabaseClient.js';
import type { NotifPreference, NotifChannel } from '../types/notification.types.js';

function toPref(r: Record<string, unknown>): NotifPreference {
  return {
    userId:         String(r['user_id'] ?? ''),
    channel:        r['channel'] as NotifChannel,
    category:       String(r['category'] ?? ''),
    enabled:        Boolean(r['enabled'] ?? true),
    quietHoursFrom: r['quiet_hours_from'] ? String(r['quiet_hours_from']) : undefined,
    quietHoursTo:   r['quiet_hours_to']   ? String(r['quiet_hours_to'])   : undefined,
    timezone:       r['timezone']         ? String(r['timezone'])          : undefined,
    updatedAt:      String(r['updated_at'] ?? ''),
  };
}

export const PreferenceRepository = {
  async listForUser(userId: string): Promise<NotifPreference[]> {
    const { data } = await db.client()
      .from('notif_preferences')
      .select('*')
      .eq('user_id', userId);
    return (data ?? []).map(r => toPref(r as Record<string, unknown>));
  },

  async get(userId: string, channel: NotifChannel, category: string): Promise<NotifPreference | null> {
    const { data } = await db.client()
      .from('notif_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', channel)
      .eq('category', category)
      .single();
    return data ? toPref(data as Record<string, unknown>) : null;
  },

  async upsert(pref: {
    userId: string; channel: NotifChannel; category: string; enabled: boolean;
    quietHoursFrom?: string | undefined; quietHoursTo?: string | undefined; timezone?: string | undefined;
  }): Promise<NotifPreference> {
    const row: Record<string, unknown> = {
      user_id:  pref.userId,
      channel:  pref.channel,
      category: pref.category,
      enabled:  pref.enabled,
    };
    if (pref.quietHoursFrom) row['quiet_hours_from'] = pref.quietHoursFrom;
    if (pref.quietHoursTo)   row['quiet_hours_to']   = pref.quietHoursTo;
    if (pref.timezone)       row['timezone']          = pref.timezone;
    const { data, error } = await db.client()
      .from('notif_preferences')
      .upsert(row, { onConflict: 'user_id,channel,category' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toPref(data as Record<string, unknown>);
  },

  async isEnabled(userId: string, channel: NotifChannel, category: string): Promise<boolean> {
    const pref = await PreferenceRepository.get(userId, channel, category);
    return pref ? pref.enabled : true;
  },

  async isQuietHour(userId: string): Promise<boolean> {
    const prefs = await PreferenceRepository.listForUser(userId);
    const tz = prefs.find(p => p.timezone)?.timezone ?? 'America/Port-au-Prince';
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: tz });
    const pref = prefs.find(p => p.quietHoursFrom && p.quietHoursTo);
    if (!pref?.quietHoursFrom || !pref?.quietHoursTo) return false;
    return now >= pref.quietHoursFrom && now <= pref.quietHoursTo;
  },
};