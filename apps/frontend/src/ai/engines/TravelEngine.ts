import type { TravelRecommendation, TravelItinerary } from '../types';
import { AIGateway } from '../gateway/AIGateway';

export const TravelEngine = {
  async recommendHotels(params: {
    destination: string; checkIn: string; checkOut: string;
    guests?: number; budget?: number; currency?: string;
  }): Promise<TravelRecommendation[]> {
    try {
      const res = await fetch('/api/ai/travel/hotels', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      if (res.ok) return res.json() as Promise<TravelRecommendation[]>;
    } catch { /* AI fallback */ }

    const result = await AIGateway.json<{ hotels: TravelRecommendation[] }>(
      `Recommend 5 hotels in ${params.destination} for ${params.guests ?? 2} guests, check-in ${params.checkIn}, check-out ${params.checkOut}${params.budget ? `, budget ${params.budget} ${params.currency ?? 'USD'}` : ''}.\nReturn JSON: { hotels: Array<{ id: string, name: string, type: "hotel", description: string, rating: number, pricePerNight: number, currency: string, amenities: string[], location: string }> }`,
      { strategy: 'balanced', temperature: 0.3 },
    ).catch(() => ({ hotels: [] }));
    return result.hotels;
  },

  async buildItinerary(params: {
    destination: string; duration: number; interests: string[];
    budget?: number; currency?: string; language?: string;
  }): Promise<TravelItinerary> {
    const langInstruction = params.language === 'ht'
      ? 'Ekri an Kreyòl Ayisyen.'
      : params.language === 'fr' ? 'Répondez en français.' : '';

    const prompt = `${langInstruction}\nCreate a ${params.duration}-day travel itinerary for ${params.destination}.\nInterests: ${params.interests.join(', ')}${params.budget ? `\nBudget: ${params.budget} ${params.currency ?? 'USD'}` : ''}\n\nReturn JSON: { destination, duration, days: Array<{ day: number, theme: string, activities: Array<{ time: string, activity: string, location: string, estimatedCost: number, duration: string }> }>, estimatedTotalCost: number, currency: string, tips: string[] }`;

    return AIGateway.json<TravelItinerary>(
      prompt,
      { strategy: 'best_quality', temperature: 0.4 },
    ).catch(() => ({
      destination: params.destination, duration: params.duration,
      days: [], estimatedTotalCost: 0, currency: params.currency ?? 'USD', tips: [],
    }));
  },

  async getAttractions(destination: string, category?: string, limit = 10): Promise<TravelRecommendation[]> {
    try {
      const q = new URLSearchParams({ destination, limit: String(limit) });
      if (category) q.set('category', category);
      const res = await fetch(`/api/ai/travel/attractions?${q}`);
      if (res.ok) return res.json() as Promise<TravelRecommendation[]>;
    } catch { /* */ }
    return [];
  },

  async getWeatherForecast(destination: string, date: string): Promise<{ temp: number; condition: string; recommendation: string }> {
    try {
      const res = await fetch(`/api/ai/travel/weather?dest=${encodeURIComponent(destination)}&date=${date}`);
      if (res.ok) return res.json() as Promise<{ temp: number; condition: string; recommendation: string }>;
    } catch { /* */ }
    return { temp: 28, condition: 'sunny', recommendation: 'Great day to explore!' };
  },

  async getLocalEvents(destination: string, startDate: string, endDate: string): Promise<TravelRecommendation[]> {
    try {
      const res = await fetch(`/api/ai/travel/events?dest=${encodeURIComponent(destination)}&from=${startDate}&to=${endDate}`);
      if (res.ok) return res.json() as Promise<TravelRecommendation[]>;
    } catch { /* */ }
    return [];
  },

  async getTransportOptions(from: string, to: string, date: string): Promise<Array<{ type: string; duration: string; price: number; currency: string }>> {
    try {
      const res = await fetch('/api/ai/travel/transport', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ from, to, date }),
      });
      if (res.ok) return res.json() as Promise<Array<{ type: string; duration: string; price: number; currency: string }>>;
    } catch { /* */ }
    return [];
  },

  async getRestaurantRecommendations(destination: string, cuisine?: string, priceRange?: 'budget' | 'mid' | 'luxury'): Promise<TravelRecommendation[]> {
    const prompt = `Recommend 5 restaurants in ${destination}${cuisine ? ` serving ${cuisine} cuisine` : ''}${priceRange ? `, price range: ${priceRange}` : ''}.\nReturn JSON: { restaurants: Array<{ id: string, name: string, type: "restaurant", description: string, rating: number, priceRange: string, cuisine: string, location: string }> }`;
    const r = await AIGateway.json<{ restaurants: TravelRecommendation[] }>(
      prompt, { strategy: 'balanced', temperature: 0.3 },
    ).catch(() => ({ restaurants: [] }));
    return r.restaurants;
  },
};