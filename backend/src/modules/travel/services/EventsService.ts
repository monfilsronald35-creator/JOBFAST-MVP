import { TravelRepository } from '../repositories/TravelRepository.js';
import type { TravelEvent } from '../types/travel.types.js';

export const EventsService = {
  async create(organizerId: string, input: {
    name: string; type?: TravelEvent['type']; description?: string;
    city: string; venue: string; country?: string;
    lat?: number; lng?: number;
    startAt: string; endAt: string;
    price: number; currency?: string;
    capacity?: number; images?: string[];
  }): Promise<TravelEvent> {
    const row: Record<string, unknown> = {
      organizer_id: organizerId,
      name:         input.name,
      type:         input.type        ?? 'concert',
      description:  input.description ?? '',
      city:         input.city,
      venue:        input.venue,
      country:      input.country     ?? 'HT',
      start_at:     input.startAt,
      end_at:       input.endAt,
      price:        input.price,
      currency:     input.currency    ?? 'HTG',
      capacity:     input.capacity    ?? 100,
      images:       input.images      ?? [],
    };
    if (input.lat != null) row['lat'] = input.lat;
    if (input.lng != null) row['lng'] = input.lng;
    return TravelRepository.createEvent(row);
  },

  async list(filter: { city?: string; type?: string; from?: string } = {}): Promise<TravelEvent[]> {
    return TravelRepository.listEvents(filter);
  },

  async get(id: string): Promise<TravelEvent | null> {
    return TravelRepository.getEvent(id);
  },

  async buyTickets(eventId: string, count: number): Promise<void> {
    const ev = await TravelRepository.getEvent(eventId);
    if (!ev) throw new Error('EVENT_NOT_FOUND');
    if (ev.capacity - ev.ticketsSold < count) throw new Error('INSUFFICIENT_TICKETS');
    await TravelRepository.incrementTicketsSold(eventId, count);
  },
};