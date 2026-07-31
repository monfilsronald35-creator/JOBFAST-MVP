import { db } from '../../../core/database/SupabaseClient.js';
import type {
  Hotel, HotelRoom, Flight, BusCompany, BusRoute,
  TaxiDriver, TaxiRide, TourGuide, VacationRental, TravelEvent,
  TravelInsurance, TravelBooking, TravelReview,
} from '../types/travel.types.js';

// ── Mappers ───────────────────────────────────────────────────────────────────
function mapHotel(r: Record<string, unknown>): Hotel {
  return {
    id: String(r['id']), ownerId: String(r['owner_id']), name: String(r['name']),
    description: String(r['description'] ?? ''), country: String(r['country']),
    city: String(r['city']), address: String(r['address']),
    lat: r['lat'] != null ? Number(r['lat']) : undefined,
    lng: r['lng'] != null ? Number(r['lng']) : undefined,
    stars: Number(r['stars']), amenities: (r['amenities'] as string[]) ?? [],
    images: (r['images'] as string[]) ?? [],
    checkInTime: String(r['check_in_time'] ?? '14:00'),
    checkOutTime: String(r['check_out_time'] ?? '12:00'),
    currency: String(r['currency']), rating: Number(r['rating']),
    reviewCount: Number(r['review_count']), isActive: Boolean(r['is_active']),
    createdAt: String(r['created_at']),
  };
}

function mapRoom(r: Record<string, unknown>): HotelRoom {
  return {
    id: String(r['id']), hotelId: String(r['hotel_id']), name: String(r['name']),
    type: r['type'] as HotelRoom['type'], capacity: Number(r['capacity']),
    pricePerNight: Number(r['price_per_night']), currency: String(r['currency']),
    amenities: (r['amenities'] as string[]) ?? [], images: (r['images'] as string[]) ?? [],
    isAvailable: Boolean(r['is_available']), createdAt: String(r['created_at']),
  };
}

function mapFlight(r: Record<string, unknown>): Flight {
  return {
    id: String(r['id']), airline: String(r['airline']), flightNumber: String(r['flight_number']),
    origin: String(r['origin']), destination: String(r['destination']),
    departureAt: String(r['departure_at']), arrivalAt: String(r['arrival_at']),
    duration: Number(r['duration']), travelClass: r['travel_class'] as Flight['travelClass'],
    price: Number(r['price']), currency: String(r['currency']),
    seatsAvailable: Number(r['seats_available']), baggage: String(r['baggage']),
    stops: Number(r['stops']), isActive: Boolean(r['is_active']),
    createdAt: String(r['created_at']),
  };
}

function mapBusCompany(r: Record<string, unknown>): BusCompany {
  return {
    id: String(r['id']), ownerId: String(r['owner_id']), name: String(r['name']),
    country: String(r['country']), currency: String(r['currency']),
    isActive: Boolean(r['is_active']), createdAt: String(r['created_at']),
  };
}

function mapBusRoute(r: Record<string, unknown>): BusRoute {
  return {
    id: String(r['id']), companyId: String(r['company_id']),
    origin: String(r['origin']), destination: String(r['destination']),
    departureAt: String(r['departure_at']), arrivalAt: String(r['arrival_at']),
    price: Number(r['price']), currency: String(r['currency']),
    totalSeats: Number(r['total_seats']), seatsLeft: Number(r['seats_left']),
    isActive: Boolean(r['is_active']), createdAt: String(r['created_at']),
  };
}

function mapDriver(r: Record<string, unknown>): TaxiDriver {
  return {
    id: String(r['id']), userId: String(r['user_id']), name: String(r['name']),
    phone: String(r['phone']), vehicle: String(r['vehicle']), plate: String(r['plate']),
    country: String(r['country']), city: String(r['city']),
    lat: r['lat'] != null ? Number(r['lat']) : undefined,
    lng: r['lng'] != null ? Number(r['lng']) : undefined,
    status: r['status'] as TaxiDriver['status'], rating: Number(r['rating']),
    rides: Number(r['rides']), currency: String(r['currency']),
    isVerified: Boolean(r['is_verified']), createdAt: String(r['created_at']),
  };
}

function mapRide(r: Record<string, unknown>): TaxiRide {
  return {
    id: String(r['id']),
    driverId:    r['driver_id']   != null ? String(r['driver_id'])   : undefined,
    passengerId: String(r['passenger_id']),
    origin: String(r['origin']), destination: String(r['destination']),
    originLat: Number(r['origin_lat']), originLng: Number(r['origin_lng']),
    destLat: Number(r['dest_lat']), destLng: Number(r['dest_lng']),
    fareEstimate: Number(r['fare_estimate']),
    fareActual:   r['fare_actual']        != null ? Number(r['fare_actual'])        : undefined,
    currency: String(r['currency']),
    status: r['status'] as TaxiRide['status'],
    driverRating:    r['driver_rating']    != null ? Number(r['driver_rating'])    : undefined,
    passengerRating: r['passenger_rating'] != null ? Number(r['passenger_rating']) : undefined,
    distanceKm:  r['distance_km']         != null ? Number(r['distance_km'])       : undefined,
    startedAt:   r['started_at']          != null ? String(r['started_at'])        : undefined,
    completedAt: r['completed_at']        != null ? String(r['completed_at'])      : undefined,
    createdAt: String(r['created_at']),
  };
}

function mapGuide(r: Record<string, unknown>): TourGuide {
  return {
    id: String(r['id']), userId: String(r['user_id']), name: String(r['name']),
    bio: String(r['bio'] ?? ''), country: String(r['country']), city: String(r['city']),
    languages: (r['languages'] as string[]) ?? [], specialties: (r['specialties'] as string[]) ?? [],
    pricePerDay: Number(r['price_per_day']), currency: String(r['currency']),
    rating: Number(r['rating']), reviewCount: Number(r['review_count']),
    images: (r['images'] as string[]) ?? [],
    isVerified: Boolean(r['is_verified']), isActive: Boolean(r['is_active']),
    createdAt: String(r['created_at']),
  };
}

function mapRental(r: Record<string, unknown>): VacationRental {
  return {
    id: String(r['id']), ownerId: String(r['owner_id']), name: String(r['name']),
    type: r['type'] as VacationRental['type'], description: String(r['description'] ?? ''),
    country: String(r['country']), city: String(r['city']), address: String(r['address']),
    lat: r['lat'] != null ? Number(r['lat']) : undefined,
    lng: r['lng'] != null ? Number(r['lng']) : undefined,
    capacity: Number(r['capacity']), bedrooms: Number(r['bedrooms']),
    bathrooms: Number(r['bathrooms']), pricePerNight: Number(r['price_per_night']),
    currency: String(r['currency']),
    amenities: (r['amenities'] as string[]) ?? [], images: (r['images'] as string[]) ?? [],
    minStay: Number(r['min_stay']), maxStay: Number(r['max_stay']),
    rating: Number(r['rating']), isActive: Boolean(r['is_active']),
    createdAt: String(r['created_at']),
  };
}

function mapEvent(r: Record<string, unknown>): TravelEvent {
  return {
    id: String(r['id']), organizerId: String(r['organizer_id']), name: String(r['name']),
    type: r['type'] as TravelEvent['type'], description: String(r['description'] ?? ''),
    country: String(r['country']), city: String(r['city']), venue: String(r['venue']),
    lat: r['lat'] != null ? Number(r['lat']) : undefined,
    lng: r['lng'] != null ? Number(r['lng']) : undefined,
    startAt: String(r['start_at']), endAt: String(r['end_at']),
    price: Number(r['price']), currency: String(r['currency']),
    capacity: Number(r['capacity']), ticketsSold: Number(r['tickets_sold']),
    images: (r['images'] as string[]) ?? [],
    isActive: Boolean(r['is_active']), createdAt: String(r['created_at']),
  };
}

function mapInsurance(r: Record<string, unknown>): TravelInsurance {
  return {
    id: String(r['id']), userId: String(r['user_id']),
    type: r['type'] as TravelInsurance['type'],
    coverage: Number(r['coverage']), currency: String(r['currency']),
    premium: Number(r['premium']), startDate: String(r['start_date']),
    endDate: String(r['end_date']), destination: String(r['destination']),
    status: r['status'] as TravelInsurance['status'],
    claimDetails: r['claim_details'] != null ? String(r['claim_details']) : undefined,
    createdAt: String(r['created_at']),
  };
}

function mapBooking(r: Record<string, unknown>): TravelBooking {
  return {
    id: String(r['id']), userId: String(r['user_id']),
    category: r['category'] as TravelBooking['category'], refId: String(r['ref_id']),
    status: r['status'] as TravelBooking['status'],
    totalAmount: Number(r['total_amount']), currency: String(r['currency']),
    qrCode: String(r['qr_code']),
    notes:      r['notes']       != null ? String(r['notes'])       : undefined,
    checkinAt:  r['checkin_at']  != null ? String(r['checkin_at'])  : undefined,
    checkoutAt: r['checkout_at'] != null ? String(r['checkout_at']) : undefined,
    createdAt: String(r['created_at']),
  };
}

function mapReview(r: Record<string, unknown>): TravelReview {
  return {
    id: String(r['id']), userId: String(r['user_id']),
    category: r['category'] as TravelReview['category'], refId: String(r['ref_id']),
    rating: Number(r['rating']), comment: String(r['comment']),
    createdAt: String(r['created_at']),
  };
}

// ── Hotel Repository ──────────────────────────────────────────────────────────
export const TravelRepository = {
  // Hotels
  async createHotel(row: Record<string, unknown>): Promise<Hotel> {
    const { data, error } = await db.client().from('trv_hotels').insert(row).select().single();
    if (error) throw error;
    return mapHotel(data as Record<string, unknown>);
  },
  async listHotels(filter: { city?: string; country?: string; stars?: number }): Promise<Hotel[]> {
    let q = db.client().from('trv_hotels').select('*').eq('is_active', true);
    if (filter.city)    q = q.ilike('city', `%${filter.city}%`);
    if (filter.country) q = q.eq('country', filter.country);
    if (filter.stars)   q = q.eq('stars', filter.stars);
    const { data } = await q.order('rating', { ascending: false });
    return (data ?? []).map(r => mapHotel(r as Record<string, unknown>));
  },
  async getHotel(id: string): Promise<Hotel | null> {
    const { data } = await db.client().from('trv_hotels').select('*').eq('id', id).single();
    return data ? mapHotel(data as Record<string, unknown>) : null;
  },
  async updateHotel(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('trv_hotels').update(patch).eq('id', id);
  },

  // Rooms
  async createRoom(row: Record<string, unknown>): Promise<HotelRoom> {
    const { data, error } = await db.client().from('trv_hotel_rooms').insert(row).select().single();
    if (error) throw error;
    return mapRoom(data as Record<string, unknown>);
  },
  async listRooms(hotelId: string, available?: boolean): Promise<HotelRoom[]> {
    let q = db.client().from('trv_hotel_rooms').select('*').eq('hotel_id', hotelId);
    if (available != null) q = q.eq('is_available', available);
    const { data } = await q;
    return (data ?? []).map(r => mapRoom(r as Record<string, unknown>));
  },
  async setRoomAvailability(roomId: string, available: boolean): Promise<void> {
    await db.client().from('trv_hotel_rooms').update({ is_available: available }).eq('id', roomId);
  },

  // Flights
  async createFlight(row: Record<string, unknown>): Promise<Flight> {
    const { data, error } = await db.client().from('trv_flights').insert(row).select().single();
    if (error) throw error;
    return mapFlight(data as Record<string, unknown>);
  },
  async searchFlights(origin: string, destination: string, date?: string): Promise<Flight[]> {
    let q = db.client().from('trv_flights').select('*')
      .eq('origin', origin).eq('destination', destination)
      .eq('is_active', true).gt('seats_available', 0);
    if (date) q = q.gte('departure_at', date);
    const { data } = await q.order('price');
    return (data ?? []).map(r => mapFlight(r as Record<string, unknown>));
  },
  async getFlight(id: string): Promise<Flight | null> {
    const { data } = await db.client().from('trv_flights').select('*').eq('id', id).single();
    return data ? mapFlight(data as Record<string, unknown>) : null;
  },
  async decrementFlightSeats(id: string, count: number): Promise<void> {
    await db.client().rpc('decrement', { table: 'trv_flights', column: 'seats_available', amount: count, row_id: id });
  },

  // Bus Companies
  async createBusCompany(row: Record<string, unknown>): Promise<BusCompany> {
    const { data, error } = await db.client().from('trv_bus_companies').insert(row).select().single();
    if (error) throw error;
    return mapBusCompany(data as Record<string, unknown>);
  },
  async listBusCompanies(country?: string): Promise<BusCompany[]> {
    let q = db.client().from('trv_bus_companies').select('*').eq('is_active', true);
    if (country) q = q.eq('country', country);
    const { data } = await q;
    return (data ?? []).map(r => mapBusCompany(r as Record<string, unknown>));
  },
  async createBusRoute(row: Record<string, unknown>): Promise<BusRoute> {
    const { data, error } = await db.client().from('trv_bus_routes').insert(row).select().single();
    if (error) throw error;
    return mapBusRoute(data as Record<string, unknown>);
  },
  async searchBusRoutes(origin: string, destination: string): Promise<BusRoute[]> {
    const { data } = await db.client().from('trv_bus_routes').select('*')
      .eq('origin', origin).eq('destination', destination)
      .eq('is_active', true).gt('seats_left', 0)
      .order('departure_at');
    return (data ?? []).map(r => mapBusRoute(r as Record<string, unknown>));
  },
  async decrementBusSeats(routeId: string): Promise<void> {
    const { data } = await db.client().from('trv_bus_routes').select('seats_left').eq('id', routeId).single();
    const left = data ? Number((data as Record<string, unknown>)['seats_left']) : 0;
    await db.client().from('trv_bus_routes').update({ seats_left: Math.max(0, left - 1) }).eq('id', routeId);
  },

  // Taxi Drivers
  async registerDriver(row: Record<string, unknown>): Promise<TaxiDriver> {
    const { data, error } = await db.client().from('trv_taxi_drivers').insert(row).select().single();
    if (error) throw error;
    return mapDriver(data as Record<string, unknown>);
  },
  async getDriver(id: string): Promise<TaxiDriver | null> {
    const { data } = await db.client().from('trv_taxi_drivers').select('*').eq('id', id).single();
    return data ? mapDriver(data as Record<string, unknown>) : null;
  },
  async findAvailableDrivers(city: string): Promise<TaxiDriver[]> {
    const { data } = await db.client().from('trv_taxi_drivers').select('*')
      .eq('city', city).eq('status', 'available').eq('is_verified', true);
    return (data ?? []).map(r => mapDriver(r as Record<string, unknown>));
  },
  async updateDriverStatus(driverId: string, status: string, lat?: number, lng?: number): Promise<void> {
    const patch: Record<string, unknown> = { status };
    if (lat != null) patch['lat'] = lat;
    if (lng != null) patch['lng'] = lng;
    await db.client().from('trv_taxi_drivers').update(patch).eq('id', driverId);
  },

  // Taxi Rides
  async createRide(row: Record<string, unknown>): Promise<TaxiRide> {
    const { data, error } = await db.client().from('trv_taxi_rides').insert(row).select().single();
    if (error) throw error;
    return mapRide(data as Record<string, unknown>);
  },
  async getRide(id: string): Promise<TaxiRide | null> {
    const { data } = await db.client().from('trv_taxi_rides').select('*').eq('id', id).single();
    return data ? mapRide(data as Record<string, unknown>) : null;
  },
  async updateRide(id: string, patch: Record<string, unknown>): Promise<void> {
    await db.client().from('trv_taxi_rides').update(patch).eq('id', id);
  },
  async listRides(userId: string, role: 'passenger' | 'driver'): Promise<TaxiRide[]> {
    const col = role === 'passenger' ? 'passenger_id' : 'driver_id';
    const { data } = await db.client().from('trv_taxi_rides').select('*').eq(col, userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapRide(r as Record<string, unknown>));
  },

  // Tour Guides
  async createGuide(row: Record<string, unknown>): Promise<TourGuide> {
    const { data, error } = await db.client().from('trv_tour_guides').insert(row).select().single();
    if (error) throw error;
    return mapGuide(data as Record<string, unknown>);
  },
  async listGuides(city?: string, language?: string): Promise<TourGuide[]> {
    let q = db.client().from('trv_tour_guides').select('*').eq('is_active', true);
    if (city) q = q.ilike('city', `%${city}%`);
    const { data } = await q.order('rating', { ascending: false });
    let guides = (data ?? []).map(r => mapGuide(r as Record<string, unknown>));
    if (language) guides = guides.filter(g => g.languages.includes(language));
    return guides;
  },
  async getGuide(id: string): Promise<TourGuide | null> {
    const { data } = await db.client().from('trv_tour_guides').select('*').eq('id', id).single();
    return data ? mapGuide(data as Record<string, unknown>) : null;
  },

  // Rentals
  async createRental(row: Record<string, unknown>): Promise<VacationRental> {
    const { data, error } = await db.client().from('trv_rentals').insert(row).select().single();
    if (error) throw error;
    return mapRental(data as Record<string, unknown>);
  },
  async listRentals(filter: { city?: string; type?: string; minCapacity?: number }): Promise<VacationRental[]> {
    let q = db.client().from('trv_rentals').select('*').eq('is_active', true);
    if (filter.city) q = q.ilike('city', `%${filter.city}%`);
    if (filter.type) q = q.eq('type', filter.type);
    if (filter.minCapacity) q = q.gte('capacity', filter.minCapacity);
    const { data } = await q.order('rating', { ascending: false });
    return (data ?? []).map(r => mapRental(r as Record<string, unknown>));
  },
  async getRental(id: string): Promise<VacationRental | null> {
    const { data } = await db.client().from('trv_rentals').select('*').eq('id', id).single();
    return data ? mapRental(data as Record<string, unknown>) : null;
  },

  // Events
  async createEvent(row: Record<string, unknown>): Promise<TravelEvent> {
    const { data, error } = await db.client().from('trv_events').insert(row).select().single();
    if (error) throw error;
    return mapEvent(data as Record<string, unknown>);
  },
  async listEvents(filter: { city?: string; type?: string; from?: string }): Promise<TravelEvent[]> {
    let q = db.client().from('trv_events').select('*').eq('is_active', true);
    if (filter.city) q = q.ilike('city', `%${filter.city}%`);
    if (filter.type) q = q.eq('type', filter.type);
    if (filter.from) q = q.gte('start_at', filter.from);
    const { data } = await q.order('start_at');
    return (data ?? []).map(r => mapEvent(r as Record<string, unknown>));
  },
  async getEvent(id: string): Promise<TravelEvent | null> {
    const { data } = await db.client().from('trv_events').select('*').eq('id', id).single();
    return data ? mapEvent(data as Record<string, unknown>) : null;
  },
  async incrementTicketsSold(eventId: string, count: number): Promise<void> {
    const { data } = await db.client().from('trv_events').select('tickets_sold').eq('id', eventId).single();
    const sold = data ? Number((data as Record<string, unknown>)['tickets_sold']) : 0;
    await db.client().from('trv_events').update({ tickets_sold: sold + count }).eq('id', eventId);
  },

  // Insurance
  async createInsurance(row: Record<string, unknown>): Promise<TravelInsurance> {
    const { data, error } = await db.client().from('trv_insurance').insert(row).select().single();
    if (error) throw error;
    return mapInsurance(data as Record<string, unknown>);
  },
  async listInsurance(userId: string): Promise<TravelInsurance[]> {
    const { data } = await db.client().from('trv_insurance').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapInsurance(r as Record<string, unknown>));
  },
  async claimInsurance(id: string, details: string): Promise<void> {
    await db.client().from('trv_insurance').update({ status: 'claimed', claim_details: details }).eq('id', id);
  },

  // Bookings
  async createBooking(row: Record<string, unknown>): Promise<TravelBooking> {
    const { data, error } = await db.client().from('trv_bookings').insert(row).select().single();
    if (error) throw error;
    return mapBooking(data as Record<string, unknown>);
  },
  async getBooking(id: string): Promise<TravelBooking | null> {
    const { data } = await db.client().from('trv_bookings').select('*').eq('id', id).single();
    return data ? mapBooking(data as Record<string, unknown>) : null;
  },
  async listBookings(userId: string, category?: string): Promise<TravelBooking[]> {
    let q = db.client().from('trv_bookings').select('*').eq('user_id', userId);
    if (category) q = q.eq('category', category);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapBooking(r as Record<string, unknown>));
  },
  async updateBookingStatus(id: string, status: string, patch?: Record<string, unknown>): Promise<void> {
    await db.client().from('trv_bookings').update({ status, ...patch }).eq('id', id);
  },

  // Reviews
  async createReview(row: Record<string, unknown>): Promise<TravelReview> {
    const { data, error } = await db.client().from('trv_reviews').insert(row).select().single();
    if (error) throw error;
    return mapReview(data as Record<string, unknown>);
  },
  async listReviews(refId: string, category: string): Promise<TravelReview[]> {
    const { data } = await db.client().from('trv_reviews').select('*')
      .eq('ref_id', refId).eq('category', category).order('created_at', { ascending: false });
    return (data ?? []).map(r => mapReview(r as Record<string, unknown>));
  },
  async getAvgRating(refId: string, category: string): Promise<number> {
    const { data } = await db.client().from('trv_reviews').select('rating')
      .eq('ref_id', refId).eq('category', category);
    if (!data || data.length === 0) return 0;
    const sum = (data as Array<Record<string, unknown>>).reduce((acc, r) => acc + Number(r['rating']), 0);
    return Math.round((sum / data.length) * 10) / 10;
  },

  // Analytics helpers
  async countBookingsByCategory(category: string, period: string): Promise<number> {
    const from = `${period}-01T00:00:00Z`;
    const { count } = await db.client().from('trv_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('category', category).gte('created_at', from);
    return count ?? 0;
  },
  async sumRevenueByCategory(category: string, period: string): Promise<number> {
    const from = `${period}-01T00:00:00Z`;
    const { data } = await db.client().from('trv_bookings').select('total_amount')
      .eq('category', category).gte('created_at', from).not('status', 'eq', 'cancelled');
    return (data ?? []).reduce((acc, r) => acc + Number((r as Record<string, unknown>)['total_amount']), 0);
  },
};