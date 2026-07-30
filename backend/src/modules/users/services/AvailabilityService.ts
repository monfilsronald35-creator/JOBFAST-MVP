import { ProfileRepository } from '../repositories/ProfileRepository.js';
import type { AvailabilityRecord, AvailabilityStatus } from '../types/profile.types.js';

export const AvailabilityService = {
  async get(userId: string): Promise<AvailabilityRecord> {
    const avail = await ProfileRepository.getAvailability(userId);
    if (!avail) {
      return {
        userId,
        status: 'offline',
        updatedAt: new Date().toISOString(),
      };
    }
    // Auto-expire "busy until" date
    if (avail.until && new Date(avail.until) < new Date()) {
      await ProfileRepository.setAvailability(userId, 'online');
      return { ...avail, status: 'online', until: undefined };
    }
    return avail;
  },

  async set(userId: string, status: AvailabilityStatus, opts: { message?: string; until?: Date; timezone?: string } = {}): Promise<AvailabilityRecord> {
    await ProfileRepository.setAvailability(userId, status, opts);
    return AvailabilityService.get(userId);
  },
};
