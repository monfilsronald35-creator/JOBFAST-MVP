import { TravelRepository } from '../repositories/TravelRepository.js';
import type { Hotel, HotelRoom } from '../types/travel.types.js';

export const HotelService = {
  async register(ownerId: string, input: {
    name: string; description?: string; country?: string; city: string; address: string;
    lat?: number; lng?: number; stars?: number; amenities?: string[]; images?: string[];
    checkInTime?: string; checkOutTime?: string; currency?: string;
  }): Promise<Hotel> {
    const row: Record<string, unknown> = {
      owner_id: ownerId, name: input.name, city: input.city, address: input.address,
      description:   input.description  ?? '',
      country:       input.country      ?? 'HT',
      stars:         input.stars        ?? 3,
      amenities:     input.amenities    ?? [],
      images:        input.images       ?? [],
      check_in_time: input.checkInTime  ?? '14:00',
      check_out_time:input.checkOutTime ?? '12:00',
      currency:      input.currency     ?? 'HTG',
    };
    if (input.lat != null) row['lat'] = input.lat;
    if (input.lng != null) row['lng'] = input.lng;
    return TravelRepository.createHotel(row);
  },

  async list(filter: { city?: string; country?: string; stars?: number } = {}): Promise<Hotel[]> {
    return TravelRepository.listHotels(filter);
  },

  async get(id: string): Promise<Hotel | null> {
    return TravelRepository.getHotel(id);
  },

  async addRoom(hotelId: string, input: {
    name: string; type?: HotelRoom['type']; capacity?: number;
    pricePerNight: number; currency?: string; amenities?: string[]; images?: string[];
  }): Promise<HotelRoom> {
    return TravelRepository.createRoom({
      hotel_id:       hotelId,
      name:           input.name,
      type:           input.type           ?? 'double',
      capacity:       input.capacity       ?? 2,
      price_per_night:input.pricePerNight,
      currency:       input.currency       ?? 'HTG',
      amenities:      input.amenities      ?? [],
      images:         input.images         ?? [],
    });
  },

  async listRooms(hotelId: string, onlyAvailable = false): Promise<HotelRoom[]> {
    return TravelRepository.listRooms(hotelId, onlyAvailable || undefined);
  },

  async checkIn(roomId: string): Promise<void> {
    await TravelRepository.setRoomAvailability(roomId, false);
  },

  async checkOut(roomId: string): Promise<void> {
    await TravelRepository.setRoomAvailability(roomId, true);
  },

  async updateHotel(id: string, patch: Partial<{
    name: string; description: string; isActive: boolean; stars: number;
    amenities: string[]; images: string[];
  }>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name        != null) row['name']        = patch.name;
    if (patch.description != null) row['description'] = patch.description;
    if (patch.isActive    != null) row['is_active']   = patch.isActive;
    if (patch.stars       != null) row['stars']       = patch.stars;
    if (patch.amenities   != null) row['amenities']   = patch.amenities;
    if (patch.images      != null) row['images']      = patch.images;
    await TravelRepository.updateHotel(id, row);
  },
};