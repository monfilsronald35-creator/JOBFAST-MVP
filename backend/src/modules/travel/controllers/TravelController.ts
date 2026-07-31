import type { Request, Response, NextFunction } from 'express';
import { HotelService }           from '../services/HotelService.js';
import { FlightService }          from '../services/FlightService.js';
import { BusService }             from '../services/BusService.js';
import { TaxiService }            from '../services/TaxiService.js';
import { TourGuideService }       from '../services/TourGuideService.js';
import { VacationRentalService }  from '../services/VacationRentalService.js';
import { EventsService }          from '../services/EventsService.js';
import { InsuranceService }       from '../services/InsuranceService.js';
import { ReservationEngine }      from '../services/ReservationEngine.js';
import { TravelAIService }        from '../services/TravelAIService.js';
import { TravelMapsService }      from '../services/TravelMapsService.js';
import { TravelAnalyticsService } from '../services/TravelAnalyticsService.js';
import type { TravelCategory, TravelInsurance, TravelEvent, VacationRental, Flight } from '../types/travel.types.js';

function bv(req: Request): Record<string, unknown>  { return req.body as Record<string, unknown>; }
function qv(req: Request): Record<string, unknown>  { return req.query as Record<string, unknown>; }
function uid(req: Request): string                   { return req.user!.sub; }
function pid(req: Request, k: string): string        { return String(req.params[k] ?? ''); }

export const TravelController = {
  // ── Hotels ────────────────────────────────────────────────────────────────────
  async registerHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const hotel = await HotelService.register(uid(req), {
        name:        String(b['name']        ?? ''),
        city:        String(b['city']        ?? ''),
        address:     String(b['address']     ?? ''),
        description: b['description'] ? String(b['description']) : undefined,
        country:     b['country']     ? String(b['country'])     : undefined,
        stars:       b['stars']       ? Number(b['stars'])       : undefined,
        amenities:   b['amenities']   as string[] | undefined,
        images:      b['images']      as string[] | undefined,
        lat:         b['lat']         ? Number(b['lat'])         : undefined,
        lng:         b['lng']         ? Number(b['lng'])         : undefined,
        currency:    b['currency']    ? String(b['currency'])    : undefined,
        checkInTime: b['checkInTime'] ? String(b['checkInTime']) : undefined,
        checkOutTime:b['checkOutTime']? String(b['checkOutTime']): undefined,
      });
      res.status(201).json({ data: hotel });
    } catch (err) { next(err); }
  },

  async listHotels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await HotelService.list({
        city:    q['city']    ? String(q['city'])    : undefined,
        country: q['country'] ? String(q['country']) : undefined,
        stars:   q['stars']   ? Number(q['stars'])   : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotel = await HotelService.get(pid(req, 'hotelId'));
      if (!hotel) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: hotel });
    } catch (err) { next(err); }
  },

  async addRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const room = await HotelService.addRoom(pid(req, 'hotelId'), {
        name:          String(b['name']     ?? ''),
        pricePerNight: Number(b['pricePerNight'] ?? 0),
        capacity:      b['capacity'] ? Number(b['capacity']) : undefined,
        currency:      b['currency'] ? String(b['currency']) : undefined,
        amenities:     b['amenities'] as string[] | undefined,
        images:        b['images']    as string[] | undefined,
      });
      res.status(201).json({ data: room });
    } catch (err) { next(err); }
  },

  async listRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const available = q['available'] != null ? q['available'] === 'true' : false;
      res.json({ data: await HotelService.listRooms(pid(req, 'hotelId'), available) });
    } catch (err) { next(err); }
  },

  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await HotelService.checkIn(pid(req, 'roomId')); res.json({ success: true }); } catch (err) { next(err); }
  },

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await HotelService.checkOut(pid(req, 'roomId')); res.json({ success: true }); } catch (err) { next(err); }
  },

  // ── Flights ────────────────────────────────────────────────────────────────────
  async addFlight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const flight = await FlightService.addFlight({
        airline:        String(b['airline']       ?? ''),
        flightNumber:   String(b['flightNumber']  ?? ''),
        origin:         String(b['origin']        ?? ''),
        destination:    String(b['destination']   ?? ''),
        departureAt:    String(b['departureAt']   ?? ''),
        arrivalAt:      String(b['arrivalAt']     ?? ''),
        price:          Number(b['price']         ?? 0),
        seatsAvailable: Number(b['seatsAvailable']?? 0),
        travelClass:    b['travelClass'] as Flight['travelClass'] | undefined,
        currency:       b['currency']   ? String(b['currency'])  : undefined,
        baggage:        b['baggage']    ? String(b['baggage'])   : undefined,
        stops:          b['stops']      ? Number(b['stops'])     : undefined,
      });
      res.status(201).json({ data: flight });
    } catch (err) { next(err); }
  },

  async searchFlights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await FlightService.search(
        String(q['origin'] ?? ''), String(q['destination'] ?? ''),
        q['date']        ? String(q['date'])        : undefined,
        q['travelClass'] ? String(q['travelClass']) : undefined,
      ) });
    } catch (err) { next(err); }
  },

  async getFlight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fl = await FlightService.get(pid(req, 'flightId'));
      if (!fl) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: fl });
    } catch (err) { next(err); }
  },

  // ── Bus ───────────────────────────────────────────────────────────────────────
  async registerBusCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const co = await BusService.registerCompany(uid(req), {
        name:     String(b['name']     ?? ''),
        country:  b['country']  ? String(b['country'])  : undefined,
        currency: b['currency'] ? String(b['currency']) : undefined,
      });
      res.status(201).json({ data: co });
    } catch (err) { next(err); }
  },

  async listBusCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await BusService.listCompanies(q['country'] ? String(q['country']) : undefined) });
    } catch (err) { next(err); }
  },

  async addBusRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const route = await BusService.addRoute(pid(req, 'companyId'), {
        origin:      String(b['origin']      ?? ''),
        destination: String(b['destination'] ?? ''),
        departureAt: String(b['departureAt'] ?? ''),
        arrivalAt:   String(b['arrivalAt']   ?? ''),
        price:       Number(b['price']       ?? 0),
        currency:    b['currency']   ? String(b['currency'])  : undefined,
        totalSeats:  b['totalSeats'] ? Number(b['totalSeats']): undefined,
      });
      res.status(201).json({ data: route });
    } catch (err) { next(err); }
  },

  async searchBusRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await BusService.search(String(q['origin'] ?? ''), String(q['destination'] ?? '')) });
    } catch (err) { next(err); }
  },

  // ── Taxi ──────────────────────────────────────────────────────────────────────
  async registerDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const driver = await TaxiService.registerDriver(uid(req), {
        name:     String(b['name']    ?? ''),
        phone:    String(b['phone']   ?? ''),
        vehicle:  String(b['vehicle'] ?? ''),
        plate:    String(b['plate']   ?? ''),
        city:     String(b['city']    ?? ''),
        country:  b['country']  ? String(b['country'])  : undefined,
        currency: b['currency'] ? String(b['currency']) : undefined,
      });
      res.status(201).json({ data: driver });
    } catch (err) { next(err); }
  },

  async updateDriverLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      await TaxiService.updateLocation(pid(req, 'driverId'), Number(b['lat'] ?? 0), Number(b['lng'] ?? 0));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async requestRide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const ride = await TaxiService.requestRide(uid(req), {
        origin:      String(b['origin']      ?? ''),
        destination: String(b['destination'] ?? ''),
        originLat:   Number(b['originLat']   ?? 0),
        originLng:   Number(b['originLng']   ?? 0),
        destLat:     Number(b['destLat']     ?? 0),
        destLng:     Number(b['destLng']     ?? 0),
        currency:    b['currency'] ? String(b['currency']) : undefined,
      });
      res.status(201).json({ data: ride });
    } catch (err) { next(err); }
  },

  async estimateFare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const info = await TravelMapsService.getRouteInfo(Number(q['originLat'] ?? 0), Number(q['originLng'] ?? 0), Number(q['destLat'] ?? 0), Number(q['destLng'] ?? 0));
      const fare = TaxiService.estimateFare(info.distanceKm);
      res.json({ data: { ...info, fareEstimate: fare, currency: 'HTG' } });
    } catch (err) { next(err); }
  },

  async startRide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await TaxiService.startRide(pid(req, 'rideId')); res.json({ success: true }); } catch (err) { next(err); }
  },

  async completeRide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await TaxiService.completeRide(pid(req, 'rideId')) }); } catch (err) { next(err); }
  },

  async cancelRide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await TaxiService.cancelRide(pid(req, 'rideId')); res.json({ success: true }); } catch (err) { next(err); }
  },

  async rateRide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      await TaxiService.rateRide(pid(req, 'rideId'), String(b['role'] ?? 'passenger') as 'passenger' | 'driver', Number(b['rating'] ?? 5));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async listRides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const role = (q['role'] === 'driver' ? 'driver' : 'passenger') as 'driver' | 'passenger';
      res.json({ data: await TaxiService.listRides(uid(req), role) });
    } catch (err) { next(err); }
  },

  // ── Tour Guides ────────────────────────────────────────────────────────────────
  async registerGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const guide = await TourGuideService.register(uid(req), {
        name:        String(b['name']       ?? ''),
        city:        String(b['city']       ?? ''),
        pricePerDay: Number(b['pricePerDay']?? 0),
        bio:         b['bio']         ? String(b['bio'])            : undefined,
        country:     b['country']     ? String(b['country'])        : undefined,
        languages:   b['languages']   as string[] | undefined,
        specialties: b['specialties'] as string[] | undefined,
        currency:    b['currency']    ? String(b['currency'])       : undefined,
        images:      b['images']      as string[] | undefined,
      });
      res.status(201).json({ data: guide });
    } catch (err) { next(err); }
  },

  async listGuides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await TourGuideService.list(
        q['city']     ? String(q['city'])     : undefined,
        q['language'] ? String(q['language']) : undefined,
      ) });
    } catch (err) { next(err); }
  },

  async getGuide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const g = await TourGuideService.get(pid(req, 'guideId'));
      if (!g) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: g });
    } catch (err) { next(err); }
  },

  // ── Vacation Rentals ───────────────────────────────────────────────────────────
  async registerRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const rental = await VacationRentalService.register(uid(req), {
        name:           String(b['name']    ?? ''),
        city:           String(b['city']    ?? ''),
        address:        String(b['address'] ?? ''),
        pricePerNight:  Number(b['pricePerNight'] ?? 0),
        type:           b['type']      as VacationRental['type'] | undefined,
        description:    b['description']? String(b['description']): undefined,
        country:        b['country']   ? String(b['country'])     : undefined,
        lat:            b['lat']       ? Number(b['lat'])         : undefined,
        lng:            b['lng']       ? Number(b['lng'])         : undefined,
        capacity:       b['capacity']  ? Number(b['capacity'])    : undefined,
        bedrooms:       b['bedrooms']  ? Number(b['bedrooms'])    : undefined,
        bathrooms:      b['bathrooms'] ? Number(b['bathrooms'])   : undefined,
        currency:       b['currency']  ? String(b['currency'])    : undefined,
        amenities:      b['amenities'] as string[] | undefined,
        images:         b['images']    as string[] | undefined,
        minStay:        b['minStay']   ? Number(b['minStay'])     : undefined,
        maxStay:        b['maxStay']   ? Number(b['maxStay'])     : undefined,
      });
      res.status(201).json({ data: rental });
    } catch (err) { next(err); }
  },

  async listRentals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await VacationRentalService.list({
        city:        q['city']        ? String(q['city'])        : undefined,
        type:        q['type']        ? String(q['type'])        : undefined,
        minCapacity: q['minCapacity'] ? Number(q['minCapacity']) : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await VacationRentalService.get(pid(req, 'rentalId'));
      if (!r) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: r });
    } catch (err) { next(err); }
  },

  // ── Events ────────────────────────────────────────────────────────────────────
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const ev = await EventsService.create(uid(req), {
        name:        String(b['name']    ?? ''),
        city:        String(b['city']    ?? ''),
        venue:       String(b['venue']   ?? ''),
        startAt:     String(b['startAt'] ?? ''),
        endAt:       String(b['endAt']   ?? ''),
        price:       Number(b['price']   ?? 0),
        type:        b['type']       as TravelEvent['type'] | undefined,
        description: b['description']? String(b['description']): undefined,
        country:     b['country']    ? String(b['country'])    : undefined,
        lat:         b['lat']        ? Number(b['lat'])        : undefined,
        lng:         b['lng']        ? Number(b['lng'])        : undefined,
        currency:    b['currency']   ? String(b['currency'])   : undefined,
        capacity:    b['capacity']   ? Number(b['capacity'])   : undefined,
        images:      b['images']     as string[] | undefined,
      });
      res.status(201).json({ data: ev });
    } catch (err) { next(err); }
  },

  async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await EventsService.list({
        city: q['city'] ? String(q['city']) : undefined,
        type: q['type'] ? String(q['type']) : undefined,
        from: q['from'] ? String(q['from']) : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ev = await EventsService.get(pid(req, 'eventId'));
      if (!ev) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: ev });
    } catch (err) { next(err); }
  },

  // ── Insurance ─────────────────────────────────────────────────────────────────
  async purchaseInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const ins = await InsuranceService.purchase(uid(req), {
        type:        String(b['type']        ?? 'medical') as TravelInsurance['type'],
        coverage:    Number(b['coverage']    ?? 0),
        startDate:   String(b['startDate']   ?? ''),
        endDate:     String(b['endDate']     ?? ''),
        destination: String(b['destination'] ?? ''),
        currency:    b['currency'] ? String(b['currency']) : undefined,
      });
      res.status(201).json({ data: ins });
    } catch (err) { next(err); }
  },

  async listInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await InsuranceService.listMine(uid(req)) }); } catch (err) { next(err); }
  },

  async claimInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InsuranceService.claim(pid(req, 'insuranceId'), String(bv(req)['details'] ?? ''));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async getInsurancePremium(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const type     = String(q['type'] ?? 'medical') as TravelInsurance['type'];
      const coverage = Number(q['coverage'] ?? 100000);
      const days     = Number(q['days'] ?? 7);
      const premium  = InsuranceService.calculatePremium(type, coverage, days);
      res.json({ data: { type, coverage, days, premium, currency: String(q['currency'] ?? 'USD') } });
    } catch (err) { next(err); }
  },

  // ── Reservation Engine ─────────────────────────────────────────────────────────
  async book(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const booking = await ReservationEngine.book({
        userId:      uid(req),
        category:    String(b['category'] ?? 'hotel') as TravelCategory,
        refId:       String(b['refId']       ?? ''),
        totalAmount: Number(b['totalAmount'] ?? 0),
        currency:    String(b['currency']    ?? 'HTG'),
        notes:       b['notes']      ? String(b['notes'])      : undefined,
        checkinAt:   b['checkinAt']  ? String(b['checkinAt'])  : undefined,
        checkoutAt:  b['checkoutAt'] ? String(b['checkoutAt']) : undefined,
        passengers:  b['passengers'] ? Number(b['passengers']) : undefined,
        seatNumbers: b['seatNumbers']as string[] | undefined,
        ticketCount: b['ticketCount']? Number(b['ticketCount']): undefined,
        nights:      b['nights']     ? Number(b['nights'])     : undefined,
        roomId:      b['roomId']     ? String(b['roomId'])     : undefined,
      });
      res.status(201).json({ data: booking });
    } catch (err) { next(err); }
  },

  async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await ReservationEngine.listBookings(uid(req), q['category'] as TravelCategory | undefined) });
    } catch (err) { next(err); }
  },

  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = await ReservationEngine.getBooking(pid(req, 'bookingId'));
      if (!b) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: b });
    } catch (err) { next(err); }
  },

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ReservationEngine.cancel(pid(req, 'bookingId'), uid(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const review = await ReservationEngine.addReview(
        uid(req),
        String(b['category'] ?? 'hotel') as TravelCategory,
        String(b['refId']    ?? ''),
        Number(b['rating']   ?? 5),
        String(b['comment']  ?? ''),
      );
      res.status(201).json({ data: review });
    } catch (err) { next(err); }
  },

  async listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await ReservationEngine.listReviews(String(q['refId'] ?? ''), String(q['category'] ?? 'hotel') as TravelCategory) });
    } catch (err) { next(err); }
  },

  // ── AI Concierge ──────────────────────────────────────────────────────────────
  async planItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const plan = await TravelAIService.planItinerary(uid(req), {
        destination: String(b['destination'] ?? 'Port-au-Prince'),
        days:        Number(b['days']        ?? 3),
        startDate:   String(b['startDate']   ?? new Date().toISOString().slice(0, 10)),
        budgetPerDay:b['budgetPerDay'] ? Number(b['budgetPerDay']) : undefined,
        currency:    b['currency']     ? String(b['currency'])     : undefined,
        interests:   b['interests']    as string[] | undefined,
      });
      res.json({ data: plan });
    } catch (err) { next(err); }
  },

  async getDestinationInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await TravelAIService.getDestinationInsights(pid(req, 'destination')) });
    } catch (err) { next(err); }
  },

  async recommendDestinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await TravelAIService.recommendDestinations(uid(req)) }); } catch (err) { next(err); }
  },

  // ── Maps ──────────────────────────────────────────────────────────────────────
  async getNearbyPOIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const types = q['types'] ? String(q['types']).split(',') as never[] : undefined;
      res.json({ data: await TravelMapsService.getNearbyPOIs(Number(q['lat'] ?? 0), Number(q['lng'] ?? 0), Number(q['radius'] ?? 5), types) });
    } catch (err) { next(err); }
  },

  async getPOIsByCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await TravelMapsService.getPOIsByCity(pid(req, 'city'), q['type'] as never) });
    } catch (err) { next(err); }
  },

  async getRouteInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await TravelMapsService.getRouteInfo(Number(q['originLat'] ?? 0), Number(q['originLng'] ?? 0), Number(q['destLat'] ?? 0), Number(q['destLng'] ?? 0)) });
    } catch (err) { next(err); }
  },

  async searchPOIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await TravelMapsService.searchPOIs(String(q['q'] ?? ''), q['city'] ? String(q['city']) : undefined) });
    } catch (err) { next(err); }
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const period = q['period'] ? String(q['period']) : new Date().toISOString().slice(0, 7);
      const category = (q['category'] ?? 'hotel') as TravelCategory;
      res.json({ data: await TravelAnalyticsService.generate(uid(req), category, period) });
    } catch (err) { next(err); }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      res.json({ data: await TravelAnalyticsService.getDashboard(uid(req), q['period'] ? String(q['period']) : undefined) });
    } catch (err) { next(err); }
  },

  async getDemandForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const category = (q['category'] ?? 'hotel') as TravelCategory;
      const months   = q['months'] ? Number(q['months']) : 3;
      res.json({ data: await TravelAnalyticsService.getDemandForecast(category, months) });
    } catch (err) { next(err); }
  },

  async getSeasonalTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await TravelAnalyticsService.getSeasonalTrends() }); } catch (err) { next(err); }
  },
};