import { TravelRepository } from '../repositories/TravelRepository.js';
import type { TourGuide } from '../types/travel.types.js';

export const TourGuideService = {
  async register(userId: string, input: {
    name: string; bio?: string; city: string; country?: string;
    languages?: string[]; specialties?: string[];
    pricePerDay: number; currency?: string; images?: string[];
  }): Promise<TourGuide> {
    return TravelRepository.createGuide({
      user_id:      userId,
      name:         input.name,
      bio:          input.bio         ?? '',
      city:         input.city,
      country:      input.country     ?? 'HT',
      languages:    input.languages   ?? ['ht'],
      specialties:  input.specialties ?? [],
      price_per_day:input.pricePerDay,
      currency:     input.currency    ?? 'HTG',
      images:       input.images      ?? [],
    });
  },

  async list(city?: string, language?: string): Promise<TourGuide[]> {
    return TravelRepository.listGuides(city, language);
  },

  async get(id: string): Promise<TourGuide | null> {
    return TravelRepository.getGuide(id);
  },

  calculateTotal(pricePerDay: number, days: number): number {
    return pricePerDay * Math.max(1, days);
  },
};