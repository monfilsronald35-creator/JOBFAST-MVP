import { ProfileRepository } from '../repositories/ProfileRepository.js';

export const ProfileAnalyticsService = {
  async trackView(profileUserId: string, viewerUserId?: string, source?: string): Promise<void> {
    await ProfileRepository.recordView(profileUserId, viewerUserId, source);
  },

  async getAnalytics(userId: string): Promise<Record<string, unknown>> {
    return ProfileRepository.getAnalytics(userId);
  },
};
