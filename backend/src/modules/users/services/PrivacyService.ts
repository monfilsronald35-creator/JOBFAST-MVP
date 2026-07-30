import { ProfileRepository } from '../repositories/ProfileRepository.js';
import type { PrivacySettings } from '../types/profile.types.js';

export const PrivacyService = {
  async get(userId: string): Promise<PrivacySettings> {
    return ProfileRepository.getPrivacy(userId);
  },

  async update(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    await ProfileRepository.setPrivacy(userId, settings);
    return ProfileRepository.getPrivacy(userId);
  },

  applyFilter(profile: Record<string, unknown>, privacy: PrivacySettings, viewerUserId?: string): Record<string, unknown> {
    const isOwner = viewerUserId === (profile['userId'] as string);
    if (isOwner) return profile;

    const filtered: Record<string, unknown> = { ...profile };

    if (!privacy.showEmail)    delete filtered['email'];
    if (!privacy.showPhone)    delete filtered['phone'];
    if (!privacy.showBirthDate) delete filtered['birthDate'];
    if (!privacy.showAddress)  delete filtered['address'];

    if (privacy.contactVisibility === 'private') {
      delete filtered['whatsapp'];
      delete filtered['website'];
    }

    return filtered;
  },
};
