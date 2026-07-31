import { randomUUID } from 'crypto';
import { TravelRepository } from '../repositories/TravelRepository.js';
import { HotelService }         from './HotelService.js';
import { FlightService }        from './FlightService.js';
import { BusService }           from './BusService.js';
import { EventsService }        from './EventsService.js';
import type { TravelBooking, TravelCategory } from '../types/travel.types.js';

function generateQR(category: TravelCategory, refId: string, userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const code = `${category.toUpperCase()}-${refId.slice(0, 8).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}-${ts}`;
  return `JOBFAST-QR:${code}`;
}

export interface BookingRequest {
  userId:     string;
  category:   TravelCategory;
  refId:      string;
  totalAmount: number;
  currency:    string;
  notes?:      string;
  checkinAt?:  string;
  checkoutAt?: string;
  // category-specific extras
  passengers?: number;
  seatNumbers?: string[];
  ticketCount?: number;
  nights?:     number;
  roomId?:     string;
}

export const ReservationEngine = {
  // Full booking flow: Validate → Reserve inventory → Create booking with QR Code → Return
  async book(req: BookingRequest): Promise<TravelBooking> {
    await ReservationEngine.validateAndReserve(req);

    const qrCode = generateQR(req.category, req.refId, req.userId);
    const bookingId = randomUUID();

    const row: Record<string, unknown> = {
      id:           bookingId,
      user_id:      req.userId,
      category:     req.category,
      ref_id:       req.refId,
      status:       'confirmed',
      total_amount: req.totalAmount,
      currency:     req.currency,
      qr_code:      qrCode,
    };
    if (req.notes)      row['notes']       = req.notes;
    if (req.checkinAt)  row['checkin_at']  = req.checkinAt;
    if (req.checkoutAt) row['checkout_at'] = req.checkoutAt;

    return TravelRepository.createBooking(row);
  },

  async validateAndReserve(req: BookingRequest): Promise<void> {
    switch (req.category) {
      case 'hotel': {
        const hotel = await HotelService.get(req.refId);
        if (!hotel || !hotel.isActive) throw new Error('HOTEL_NOT_FOUND');
        if (req.roomId) await HotelService.checkIn(req.roomId);
        break;
      }
      case 'flight': {
        const count = req.passengers ?? 1;
        await FlightService.reserveSeats(req.refId, count);
        break;
      }
      case 'bus': {
        await BusService.reserveSeat(req.refId);
        break;
      }
      case 'event': {
        const count = req.ticketCount ?? 1;
        await EventsService.buyTickets(req.refId, count);
        break;
      }
      // tour, rental, taxi, insurance: no seat inventory to decrement
    }
  },

  async cancel(bookingId: string, userId: string): Promise<void> {
    const booking = await TravelRepository.getBooking(bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (booking.userId !== userId) throw new Error('FORBIDDEN');
    if (['completed', 'cancelled', 'refunded'].includes(booking.status)) {
      throw new Error('CANNOT_CANCEL');
    }
    // Release inventory
    if (booking.category === 'hotel') {
      // room stays occupied until actual checkout; just mark cancelled
    }
    await TravelRepository.updateBookingStatus(bookingId, 'cancelled');
  },

  async complete(bookingId: string): Promise<void> {
    await TravelRepository.updateBookingStatus(bookingId, 'completed');
  },

  async listBookings(userId: string, category?: TravelCategory): Promise<TravelBooking[]> {
    return TravelRepository.listBookings(userId, category);
  },

  async getBooking(id: string): Promise<TravelBooking | null> {
    return TravelRepository.getBooking(id);
  },

  async addReview(userId: string, category: TravelCategory, refId: string, rating: number, comment: string) {
    if (rating < 1 || rating > 5) throw new Error('INVALID_RATING');
    const review = await TravelRepository.createReview({ user_id: userId, category, ref_id: refId, rating, comment });
    const avgRating = await TravelRepository.getAvgRating(refId, category);
    // Update rating on entity
    const table = {
      hotel: 'trv_hotels', flight: 'trv_flights', tour: 'trv_tour_guides',
      rental: 'trv_rentals', event: 'trv_events',
    }[category];
    if (table) {
      const reviews = await TravelRepository.listReviews(refId, category);
      const patch: Record<string, unknown> = { rating: avgRating, review_count: reviews.length };
      await (await import('../../../core/database/SupabaseClient.js')).db.client().from(table).update(patch).eq('id', refId);
    }
    return review;
  },

  async listReviews(refId: string, category: TravelCategory) {
    return TravelRepository.listReviews(refId, category);
  },
};