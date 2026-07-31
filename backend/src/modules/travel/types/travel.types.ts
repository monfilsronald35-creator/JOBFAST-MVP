// ── Shared ────────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'refunded';
export type TravelCategory = 'hotel' | 'flight' | 'bus' | 'taxi' | 'tour' | 'rental' | 'event' | 'insurance';

export interface TravelBooking {
  id:           string;
  userId:       string;
  category:     TravelCategory;
  refId:        string;
  status:       BookingStatus;
  totalAmount:  number;
  currency:     string;
  qrCode:       string;
  notes?:       string | undefined;
  checkinAt?:   string | undefined;
  checkoutAt?:  string | undefined;
  createdAt:    string;
}

// ── Hotel ─────────────────────────────────────────────────────────────────────
export interface Hotel {
  id:          string;
  ownerId:     string;
  name:        string;
  description: string;
  country:     string;
  city:        string;
  address:     string;
  lat?:        number | undefined;
  lng?:        number | undefined;
  stars:       number;
  amenities:   string[];
  images:      string[];
  checkInTime: string;
  checkOutTime: string;
  currency:    string;
  rating:      number;
  reviewCount: number;
  isActive:    boolean;
  createdAt:   string;
}

export interface HotelRoom {
  id:          string;
  hotelId:     string;
  name:        string;
  type:        RoomType;
  capacity:    number;
  pricePerNight: number;
  currency:    string;
  amenities:   string[];
  images:      string[];
  isAvailable: boolean;
  createdAt:   string;
}

export type RoomType = 'single' | 'double' | 'twin' | 'suite' | 'deluxe' | 'family' | 'presidential';

// ── Flight ────────────────────────────────────────────────────────────────────
export interface Flight {
  id:           string;
  airline:      string;
  flightNumber: string;
  origin:       string;
  destination:  string;
  departureAt:  string;
  arrivalAt:    string;
  duration:     number;
  travelClass:  TravelClass;
  price:        number;
  currency:     string;
  seatsAvailable: number;
  baggage:      string;
  stops:        number;
  isActive:     boolean;
  createdAt:    string;
}

export type TravelClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface FlightBooking extends TravelBooking {
  flightId:    string;
  passengers:  number;
  seatNumbers: string[];
  boardingPass?: string | undefined;
}

// ── Bus ───────────────────────────────────────────────────────────────────────
export interface BusCompany {
  id:       string;
  ownerId:  string;
  name:     string;
  country:  string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface BusRoute {
  id:          string;
  companyId:   string;
  origin:      string;
  destination: string;
  departureAt: string;
  arrivalAt:   string;
  price:       number;
  currency:    string;
  totalSeats:  number;
  seatsLeft:   number;
  isActive:    boolean;
  createdAt:   string;
}

// ── Taxi ──────────────────────────────────────────────────────────────────────
export interface TaxiDriver {
  id:         string;
  userId:     string;
  name:       string;
  phone:      string;
  vehicle:    string;
  plate:      string;
  country:    string;
  city:       string;
  lat?:       number | undefined;
  lng?:       number | undefined;
  status:     DriverStatus;
  rating:     number;
  rides:      number;
  currency:   string;
  isVerified: boolean;
  createdAt:  string;
}

export type DriverStatus = 'offline' | 'available' | 'busy' | 'on_trip';

export interface TaxiRide {
  id:          string;
  driverId?:   string | undefined;
  passengerId: string;
  origin:      string;
  destination: string;
  originLat:   number;
  originLng:   number;
  destLat:     number;
  destLng:     number;
  fareEstimate: number;
  fareActual?:  number | undefined;
  currency:    string;
  status:      RideStatus;
  driverRating?: number | undefined;
  passengerRating?: number | undefined;
  distanceKm?: number | undefined;
  startedAt?:  string | undefined;
  completedAt?: string | undefined;
  createdAt:   string;
}

export type RideStatus = 'searching' | 'accepted' | 'arriving' | 'on_trip' | 'completed' | 'cancelled';

// ── Tour Guide ────────────────────────────────────────────────────────────────
export interface TourGuide {
  id:          string;
  userId:      string;
  name:        string;
  bio:         string;
  country:     string;
  city:        string;
  languages:   string[];
  specialties: string[];
  pricePerDay: number;
  currency:    string;
  rating:      number;
  reviewCount: number;
  images:      string[];
  isVerified:  boolean;
  isActive:    boolean;
  createdAt:   string;
}

// ── Vacation Rental ───────────────────────────────────────────────────────────
export interface VacationRental {
  id:           string;
  ownerId:      string;
  name:         string;
  type:         RentalType;
  description:  string;
  country:      string;
  city:         string;
  address:      string;
  lat?:         number | undefined;
  lng?:         number | undefined;
  capacity:     number;
  bedrooms:     number;
  bathrooms:    number;
  pricePerNight: number;
  currency:     string;
  amenities:    string[];
  images:       string[];
  minStay:      number;
  maxStay:      number;
  rating:       number;
  isActive:     boolean;
  createdAt:    string;
}

export type RentalType = 'apartment' | 'villa' | 'house' | 'cabin' | 'room' | 'farm' | 'beach_house' | 'luxury_villa';

// ── Events ────────────────────────────────────────────────────────────────────
export interface TravelEvent {
  id:          string;
  organizerId: string;
  name:        string;
  type:        EventType;
  description: string;
  country:     string;
  city:        string;
  venue:       string;
  lat?:        number | undefined;
  lng?:        number | undefined;
  startAt:     string;
  endAt:       string;
  price:       number;
  currency:    string;
  capacity:    number;
  ticketsSold: number;
  images:      string[];
  isActive:    boolean;
  createdAt:   string;
}

export type EventType = 'concert' | 'festival' | 'museum' | 'sport' | 'nightlife' | 'conference' | 'wedding' | 'other';

// ── Insurance ─────────────────────────────────────────────────────────────────
export interface TravelInsurance {
  id:           string;
  userId:       string;
  type:         InsuranceType;
  coverage:     number;
  currency:     string;
  premium:      number;
  startDate:    string;
  endDate:      string;
  destination:  string;
  status:       'active' | 'expired' | 'claimed' | 'cancelled';
  claimDetails?: string | undefined;
  createdAt:    string;
}

export type InsuranceType = 'medical' | 'flight_delay' | 'cancellation' | 'lost_luggage' | 'accident' | 'comprehensive';

// ── Review ────────────────────────────────────────────────────────────────────
export interface TravelReview {
  id:         string;
  userId:     string;
  category:   TravelCategory;
  refId:      string;
  rating:     number;
  comment:    string;
  createdAt:  string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface TravelAnalytics {
  entityId:       string;
  category:       TravelCategory;
  period:         string;
  totalBookings:  number;
  revenue:        number;
  currency:       string;
  occupancyRate:  number;
  avgStayNights:  number;
  cancellationRate: number;
  topCountries:   Array<{ country: string; count: number }>;
  topCities:      Array<{ city: string; count: number }>;
  peakSeason:     string;
  satisfactionScore: number;
  generatedAt:    string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface TravelDashboard {
  ownerId:        string;
  period:         string;
  totalRevenue:   number;
  currency:       string;
  bookings:       number;
  guests:         number;
  occupancyRate:  number;
  avgRating:      number;
  pendingCheckIns: number;
  reviews:        number;
  cancellations:  number;
  generatedAt:    string;
}

// ── Maps POI ──────────────────────────────────────────────────────────────────
export interface MapPOI {
  id:       string;
  name:     string;
  type:     POIType;
  lat:      number;
  lng:      number;
  city:     string;
  country:  string;
  address?: string | undefined;
  phone?:   string | undefined;
  rating?:  number | undefined;
  isOpen?:  boolean | undefined;
}

export type POIType = 'hotel' | 'beach' | 'restaurant' | 'hospital' | 'atm' | 'gas_station' | 'store' | 'event' | 'taxi' | 'rental';