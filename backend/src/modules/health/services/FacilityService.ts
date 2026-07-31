import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { HealthFacility } from '../types/healthcare.types.js';

export const FacilityService = {
  async register(ownerId: string, input: {
    name: string; type?: HealthFacility['type']; city: string; address?: string;
    country?: string; phone?: string; email?: string; website?: string;
    lat?: number; lng?: number; currency?: string;
  }): Promise<HealthFacility> {
    const row: Record<string, unknown> = {
      owner_id: ownerId, name: input.name, city: input.city,
      type:     input.type     ?? 'clinic',
      address:  input.address  ?? '',
      country:  input.country  ?? 'HT',
      phone:    input.phone    ?? '',
      currency: input.currency ?? 'HTG',
    };
    if (input.email)   row['email']   = input.email;
    if (input.website) row['website'] = input.website;
    if (input.lat != null) row['lat'] = input.lat;
    if (input.lng != null) row['lng'] = input.lng;
    return HealthcareRepository.createFacility(row);
  },

  async list(type?: string, city?: string): Promise<HealthFacility[]> {
    return HealthcareRepository.listFacilities(type, city);
  },

  async get(id: string): Promise<HealthFacility | null> {
    return HealthcareRepository.getFacility(id);
  },

  async findNearest(lat: number, lng: number, type?: string): Promise<HealthFacility[]> {
    return HealthcareRepository.getNearbyFacilities(lat, lng, type);
  },
};