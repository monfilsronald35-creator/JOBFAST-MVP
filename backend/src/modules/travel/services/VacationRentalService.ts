import { TravelRepository } from '../repositories/TravelRepository.js';
import type { VacationRental } from '../types/travel.types.js';

export const VacationRentalService = {
  async list(input: { city?: string; type?: string; minCapacity?: number } = {}): Promise<VacationRental[]> {
    return TravelRepository.listRentals(input);
  },

  async get(id: string): Promise<VacationRental | null> {
    return TravelRepository.getRental(id);
  },

  async register(ownerId: string, input: {
    name: string; type?: VacationRental['type']; description?: string;
    city: string; address: string; country?: string;
    lat?: number; lng?: number;
    capacity?: number; bedrooms?: number; bathrooms?: number;
    pricePerNight: number; currency?: string;
    amenities?: string[]; images?: string[];
    minStay?: number; maxStay?: number;
  }): Promise<VacationRental> {
    const row: Record<string, unknown> = {
      owner_id:        ownerId,
      name:            input.name,
      type:            input.type        ?? 'apartment',
      description:     input.description ?? '',
      city:            input.city,
      address:         input.address,
      country:         input.country     ?? 'HT',
      capacity:        input.capacity    ?? 2,
      bedrooms:        input.bedrooms    ?? 1,
      bathrooms:       input.bathrooms   ?? 1,
      price_per_night: input.pricePerNight,
      currency:        input.currency    ?? 'HTG',
      amenities:       input.amenities   ?? [],
      images:          input.images      ?? [],
      min_stay:        input.minStay     ?? 1,
      max_stay:        input.maxStay     ?? 30,
    };
    if (input.lat != null) row['lat'] = input.lat;
    if (input.lng != null) row['lng'] = input.lng;
    return TravelRepository.createRental(row);
  },

  calculateTotal(pricePerNight: number, nights: number): number {
    return pricePerNight * Math.max(1, nights);
  },
};