import { TravelRepository } from '../repositories/TravelRepository.js';
import type { BusCompany, BusRoute } from '../types/travel.types.js';

export const BusService = {
  async registerCompany(ownerId: string, input: {
    name: string; country?: string; currency?: string;
  }): Promise<BusCompany> {
    return TravelRepository.createBusCompany({
      owner_id: ownerId,
      name:     input.name,
      country:  input.country  ?? 'HT',
      currency: input.currency ?? 'HTG',
    });
  },

  async listCompanies(country?: string): Promise<BusCompany[]> {
    return TravelRepository.listBusCompanies(country);
  },

  async addRoute(companyId: string, input: {
    origin: string; destination: string; departureAt: string; arrivalAt: string;
    price: number; currency?: string; totalSeats?: number;
  }): Promise<BusRoute> {
    const seats = input.totalSeats ?? 40;
    return TravelRepository.createBusRoute({
      company_id:  companyId,
      origin:      input.origin,
      destination: input.destination,
      departure_at:input.departureAt,
      arrival_at:  input.arrivalAt,
      price:       input.price,
      currency:    input.currency ?? 'HTG',
      total_seats: seats,
      seats_left:  seats,
    });
  },

  async search(origin: string, destination: string): Promise<BusRoute[]> {
    return TravelRepository.searchBusRoutes(origin, destination);
  },

  async reserveSeat(routeId: string): Promise<void> {
    await TravelRepository.decrementBusSeats(routeId);
  },

  generateQRTicket(routeId: string, userId: string): string {
    const ts = Date.now().toString(36).toUpperCase();
    return `BUS-${routeId.slice(0, 8).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}-${ts}`;
  },
};