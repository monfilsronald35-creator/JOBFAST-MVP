import { PreferenceRepository }                     from '../repositories/PreferenceRepository.js';
import type { NotifPreference, NotifChannel }        from '../types/notification.types.js';

export const PreferenceService = {
  async getAll(userId: string): Promise<NotifPreference[]> {
    return PreferenceRepository.listForUser(userId);
  },

  async update(userId: string, channel: NotifChannel, category: string, enabled: boolean, opts?: {
    quietHoursFrom?: string | undefined;
    quietHoursTo?:   string | undefined;
    timezone?:       string | undefined;
  }): Promise<NotifPreference> {
    return PreferenceRepository.upsert({
      userId, channel, category, enabled,
      quietHoursFrom: opts?.quietHoursFrom,
      quietHoursTo:   opts?.quietHoursTo,
      timezone:       opts?.timezone,
    });
  },

  async isChannelEnabled(userId: string, channel: NotifChannel, category: string): Promise<boolean> {
    return PreferenceRepository.isEnabled(userId, channel, category);
  },

  async isQuietHour(userId: string): Promise<boolean> {
    return PreferenceRepository.isQuietHour(userId);
  },

  async setQuietHours(userId: string, channel: NotifChannel, from: string, to: string, timezone: string): Promise<void> {
    const prefs = await PreferenceRepository.listForUser(userId);
    const existing = prefs.find(p => p.channel === channel);
    await PreferenceRepository.upsert({
      userId,
      channel,
      category:       existing?.category ?? 'all',
      enabled:        existing?.enabled  ?? true,
      quietHoursFrom: from,
      quietHoursTo:   to,
      timezone,
    });
  },
};