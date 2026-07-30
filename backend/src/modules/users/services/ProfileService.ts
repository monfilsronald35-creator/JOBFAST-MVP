import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { ProfileExtended } from '../types/profile.types.js';

export const ProfileService = {
  async getProfile(userId: string): Promise<ProfileExtended> {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  async getPublicProfile(identifier: string): Promise<ProfileExtended> {
    const byUsername = await ProfileRepository.findByUsername(identifier);
    if (byUsername) {
      if (!byUsername.isPublic) throw new AppError('Profile is private', 403, 'PROFILE_PRIVATE');
      return byUsername;
    }
    throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
  },

  async createOrUpdate(userId: string, data: Partial<ProfileExtended>): Promise<ProfileExtended> {
    if (data.username) {
      const existing = await ProfileRepository.findByUsername(data.username);
      if (existing && existing.userId !== userId) {
        throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
      }
    }
    return ProfileRepository.upsert(userId, data);
  },

  async search(query: { skills?: string[]; industry?: string; profileType?: string; country?: string; limit?: number; cursor?: string }): Promise<ProfileExtended[]> {
    return ProfileRepository.search(query);
  },
};
