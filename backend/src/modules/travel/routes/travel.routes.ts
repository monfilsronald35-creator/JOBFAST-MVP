import { Router }           from 'express';
import { requireAuth }      from '../../../core/middleware/auth.middleware.js';
import { TravelController } from '../controllers/TravelController.js';

export const travelRouter = Router();
const R = requireAuth;
const C = TravelController;

// ── Hotels ────────────────────────────────────────────────────────────────────
travelRouter.post  ('/hotels',                                  R, C.registerHotel);
travelRouter.get   ('/hotels',                                  R, C.listHotels);
travelRouter.get   ('/hotels/:hotelId',                         R, C.getHotel);
travelRouter.post  ('/hotels/:hotelId/rooms',                   R, C.addRoom);
travelRouter.get   ('/hotels/:hotelId/rooms',                   R, C.listRooms);
travelRouter.post  ('/hotels/:hotelId/rooms/:roomId/checkin',   R, C.checkIn);
travelRouter.post  ('/hotels/:hotelId/rooms/:roomId/checkout',  R, C.checkOut);

// ── Flights ───────────────────────────────────────────────────────────────────
travelRouter.post  ('/flights',                                 R, C.addFlight);
travelRouter.get   ('/flights/search',                          R, C.searchFlights);
travelRouter.get   ('/flights/:flightId',                       R, C.getFlight);

// ── Bus ───────────────────────────────────────────────────────────────────────
travelRouter.post  ('/bus/companies',                           R, C.registerBusCompany);
travelRouter.get   ('/bus/companies',                           R, C.listBusCompanies);
travelRouter.post  ('/bus/companies/:companyId/routes',         R, C.addBusRoute);
travelRouter.get   ('/bus/routes/search',                       R, C.searchBusRoutes);

// ── Taxi ──────────────────────────────────────────────────────────────────────
travelRouter.post  ('/taxi/drivers',                            R, C.registerDriver);
travelRouter.patch ('/taxi/drivers/:driverId/location',         R, C.updateDriverLocation);
travelRouter.post  ('/taxi/rides',                              R, C.requestRide);
travelRouter.get   ('/taxi/rides',                              R, C.listRides);
travelRouter.get   ('/taxi/fare-estimate',                      R, C.estimateFare);
travelRouter.post  ('/taxi/rides/:rideId/start',                R, C.startRide);
travelRouter.post  ('/taxi/rides/:rideId/complete',             R, C.completeRide);
travelRouter.post  ('/taxi/rides/:rideId/cancel',               R, C.cancelRide);
travelRouter.post  ('/taxi/rides/:rideId/rate',                 R, C.rateRide);

// ── Tour Guides ───────────────────────────────────────────────────────────────
travelRouter.post  ('/guides',                                  R, C.registerGuide);
travelRouter.get   ('/guides',                                  R, C.listGuides);
travelRouter.get   ('/guides/:guideId',                         R, C.getGuide);

// ── Vacation Rentals ──────────────────────────────────────────────────────────
travelRouter.post  ('/rentals',                                 R, C.registerRental);
travelRouter.get   ('/rentals',                                 R, C.listRentals);
travelRouter.get   ('/rentals/:rentalId',                       R, C.getRental);

// ── Events ────────────────────────────────────────────────────────────────────
travelRouter.post  ('/events',                                  R, C.createEvent);
travelRouter.get   ('/events',                                  R, C.listEvents);
travelRouter.get   ('/events/:eventId',                         R, C.getEvent);

// ── Insurance ─────────────────────────────────────────────────────────────────
travelRouter.post  ('/insurance',                               R, C.purchaseInsurance);
travelRouter.get   ('/insurance',                               R, C.listInsurance);
travelRouter.get   ('/insurance/quote',                         R, C.getInsurancePremium);
travelRouter.post  ('/insurance/:insuranceId/claim',            R, C.claimInsurance);

// ── Reservation Engine ────────────────────────────────────────────────────────
travelRouter.post  ('/bookings',                                R, C.book);
travelRouter.get   ('/bookings',                                R, C.listBookings);
travelRouter.get   ('/bookings/:bookingId',                     R, C.getBooking);
travelRouter.post  ('/bookings/:bookingId/cancel',              R, C.cancelBooking);
travelRouter.post  ('/reviews',                                 R, C.addReview);
travelRouter.get   ('/reviews',                                 R, C.listReviews);

// ── AI Travel Concierge ───────────────────────────────────────────────────────
travelRouter.post  ('/ai/itinerary',                            R, C.planItinerary);
travelRouter.get   ('/ai/destinations/:destination',            R, C.getDestinationInsights);
travelRouter.get   ('/ai/recommend',                            R, C.recommendDestinations);

// ── Travel Maps ───────────────────────────────────────────────────────────────
travelRouter.get   ('/maps/nearby',                             R, C.getNearbyPOIs);
travelRouter.get   ('/maps/city/:city',                         R, C.getPOIsByCity);
travelRouter.get   ('/maps/route',                              R, C.getRouteInfo);
travelRouter.get   ('/maps/search',                             R, C.searchPOIs);

// ── Analytics ─────────────────────────────────────────────────────────────────
travelRouter.get   ('/analytics',                               R, C.getAnalytics);
travelRouter.get   ('/analytics/dashboard',                     R, C.getDashboard);
travelRouter.get   ('/analytics/forecast',                      R, C.getDemandForecast);
travelRouter.get   ('/analytics/seasons',                       R, C.getSeasonalTrends);