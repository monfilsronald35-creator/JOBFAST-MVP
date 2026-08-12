// ── Travel & Tourism Platform ─────────────────────────────────────────────
//
// NOTE: Migration 017 Part 1.1 (hotels, rooms, vacation_rentals,
// travel_destinations base tables) was not received. Types for those
// entities will be prepended here when Part 1.1 SQL is sent.
// Part 1.2 types below reference those entities via string UUID fields.

// ── Hotel Inventory Yield Controls ────────────────────────────────────────

export const AI_OPTIMIZATION_STATUSES = [
  'active', 'locked_by_admin', 'surge_mode', 'clearance',
] as const;
export type AiOptimizationStatus = typeof AI_OPTIMIZATION_STATUSES[number];

export interface HotelInventoryYieldControl {
  id: string;
  hotelId: string;
  roomId: string | null;
  targetDate: string;
  allotedInventoryCount: number;
  reservedInventoryCount: number;
  dynamicSurgeMultiplier: number;
  minimumStayRequirement: number;
  isBlackoutDate: boolean;
  aiOptimizationStatus: AiOptimizationStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Vacation Rental Amenities Matrix ──────────────────────────────────────

export interface VacationRentalAmenitiesMatrix {
  id: string;
  vacationRentalId: string;
  hasHighSpeedFiber: boolean;
  hasPrivatePool: boolean;
  hasHeliportAccess: boolean;
  hasEvChargingStation: boolean;
  hasBiometricSecurity: boolean;
  noiseMonitoringSensorActive: boolean;
  petFriendly: boolean;
  smokingAllowed: boolean;
  customAmenitiesJson: Record<string, unknown>;
  createdAt: string;
}

// ── Travel Destination Seasonal Forecasts ─────────────────────────────────

export const SEASON_NAMES = [
  'Spring Peak', 'Summer High', 'Autumn Retreat', 'Winter Holiday', 'Quantum Off-Season',
] as const;
export type SeasonName = typeof SEASON_NAMES[number];

export interface TravelDestinationSeasonalForecast {
  id: string;
  destinationId: string;
  seasonName: SeasonName;
  startMonth: number | null;
  endMonth: number | null;
  averageTemperatureCelsius: number;
  touristCrowdIndex: number;
  aiRecommendedTravelProbability: number;
  createdAt: string;
  // price_fluctuation_index excluded — internal pricing engine multiplier (never expose)
}

// ── Hotel Staff Operations ────────────────────────────────────────────────

export const HOTEL_DEPARTMENTS = [
  'housekeeping', 'front_desk', 'security', 'maintenance', 'concierge', 'quantum_admin',
] as const;
export type HotelDepartment = typeof HOTEL_DEPARTMENTS[number];

export const SHIFT_STATUSES = [
  'on_duty', 'off_duty', 'on_call', 'emergency_response',
] as const;
export type ShiftStatus = typeof SHIFT_STATUSES[number];

export interface HotelStaffOperation {
  id: string;
  hotelId: string;
  staffUserId: string;
  department: HotelDepartment;
  shiftStatus: ShiftStatus;
  assignedZoneOrFloor: string | null;
  performanceScore: number;
  createdAt: string;
  updatedAt: string;
}

// ── Property Smart IoT Telemetry ──────────────────────────────────────────

export const IOT_DEVICE_TYPES = [
  'smart_lock', 'thermostat', 'energy_meter', 'smoke_detector', 'water_valve_controller',
] as const;
export type IotDeviceType = typeof IOT_DEVICE_TYPES[number];

export interface PropertySmartIotTelemetry {
  id: string;
  hotelId: string | null;
  vacationRentalId: string | null;
  deviceIdentifier: string;
  deviceType: IotDeviceType;
  batteryLevelPercentage: number;
  currentStatus: Record<string, unknown>; // device state (must never contain access credentials)
  isOnline: boolean;
  lastPingAt: string;
  createdAt: string;
}

// ── Part 2: Transportation ────────────────────────────────────────────────

// ── Airports ──────────────────────────────────────────────────────────────

export interface Airport {
  id: string;
  airportCodeIata: string;
  airportCodeIcao: string;
  airportName: string;
  city: string;
  country: string;
  timezone: string;
  gpsLatitude: number;
  gpsLongitude: number;
  runwaysMetadata: Record<string, unknown>[];
  loungesMetadata: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Flights ───────────────────────────────────────────────────────────────

export const FLIGHT_CATEGORIES = [
  'Domestic', 'International', 'Charter', 'Private Jet', 'Helicopter', 'Quantum Sub-Orbital',
] as const;
export type FlightCategory = typeof FLIGHT_CATEGORIES[number];

export const FLIGHT_STATUSES = [
  'scheduled', 'boarding', 'in_flight', 'landed', 'delayed', 'diverted', 'cancelled',
] as const;
export type FlightStatus = typeof FLIGHT_STATUSES[number];

export interface Flight {
  id: string;
  organizationId: string;
  airlineName: string;
  flightNumber: string;
  flightCategory: FlightCategory;
  originAirportId: string;
  destinationAirportId: string;
  departureTime: string;
  arrivalTime: string;
  aircraftModel: string;
  gateNumber: string | null;
  terminal: string | null;
  seatMapConfig: Record<string, unknown>;
  cabinClasses: Record<string, unknown>[];
  basePrice: number;
  currency: string;
  delayMinutes: number;
  liveStatus: FlightStatus;
  carbonFootprintKg: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_price_prediction_matrix excluded — internal pricing AI matrix (NEVER expose)
}

// ── Transport Services ────────────────────────────────────────────────────

export const SERVICE_TYPES = [
  'Taxi', 'Uber', 'Moto', 'Bus', 'Metro', 'Train', 'Ferry', 'Boat',
  'Private Driver', 'Luxury Chauffeur', 'Limousine', 'Rental Car',
  'Shuttle', 'Electric Scooter', 'Bike', 'Quantum Pod',
] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

export interface TransportService {
  id: string;
  organizationId: string;
  providerName: string;
  serviceType: ServiceType;
  country: string;
  city: string;
  operationalRadiusKm: number;
  pricingPerKm: number;
  baseFare: number;
  currency: string;
  aiDispatchEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // fleet_management_config excluded — internal operational config
}

// ── Vehicle Inventory ─────────────────────────────────────────────────────

export const VEHICLE_CATEGORIES = [
  'Economy', 'Sedan', 'SUV', 'Luxury', 'Van', 'Bus', 'Electric', 'Supercar', 'Helicopter',
] as const;
export type VehicleCategory = typeof VEHICLE_CATEGORIES[number];

export const MAINTENANCE_STATUSES = [
  'operational', 'service_due', 'repairing', 'quantum_checked',
] as const;
export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[number];

export interface VehicleInventory {
  id: string;
  transportServiceId: string;
  vehicleModel: string;
  licensePlate: string;
  vehicleCategory: VehicleCategory;
  maximumCapacity: number;
  currentGpsLatitude: number | null;
  currentGpsLongitude: number | null;
  batteryOrFuelLevelPercentage: number;
  maintenanceStatus: MaintenanceStatus;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Transport Routes ──────────────────────────────────────────────────────

export interface TransportRoute {
  id: string;
  transportServiceId: string | null;
  routeName: string;
  originCoordinates: string;      // PostgreSQL POINT returned as "(lng,lat)"
  destinationCoordinates: string; // PostgreSQL POINT returned as "(lng,lat)"
  waypointsJson: Record<string, unknown>[];
  estimatedDurationMinutes: number;
  trafficCongestionFactor: number;
  aiOptimizedPath: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Part 2.2: Transport Expansion ────────────────────────────────────────

// ── Flight Seat Allocations ───────────────────────────────────────────────

export const CABIN_TIERS = [
  'Economy', 'Premium Economy', 'Business', 'First Class', 'Private Suite', 'Quantum Pod',
] as const;
export type CabinTier = typeof CABIN_TIERS[number];

export interface FlightSeatAllocation {
  id: string;
  flightId: string;
  seatNumber: string;
  cabinTier: CabinTier;
  isOccupied: boolean;
  passengerUserId: string | null;
  seatAmenitiesStatus: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // biometric_boarding_hash excluded — biometric data (NEVER)
}

// ── Airport Gate Schedule Matrix ──────────────────────────────────────────

export const GATE_STATUSES = [
  'assigned', 'boarding', 'cleared', 'delayed', 'emergency_reassigned',
] as const;
export type GateStatus = typeof GATE_STATUSES[number];

export interface AirportGateSchedule {
  id: string;
  airportId: string;
  flightId: string;
  terminalDesignation: string;
  gateDesignation: string;
  scheduledDockTime: string;
  scheduledUndockTime: string;
  gateStatus: GateStatus;
  createdAt: string;
  // ai_turnaround_optimization excluded — internal AI operational intelligence
}

// ── Vehicle Autonomous Telemetry ──────────────────────────────────────────

export const LIDAR_STATUSES = [
  'optimal', 'degraded', 'offline', 'quantum_calibrated',
] as const;
export type LidarStatus = typeof LIDAR_STATUSES[number];

export interface VehicleAutonomousTelemetry {
  id: string;
  vehicleId: string;
  currentSpeedKmh: number;
  headingAngleDegrees: number;
  autonomousDriveEngaged: boolean;
  lidarSensorStatus: LidarStatus;
  cabinTemperatureCelsius: number;
  recordedAt: string;
  // diagnostic_payload excluded — proprietary sensor calibration / AI model state
}

// ── Transport Dynamic Surge Pricing ───────────────────────────────────────

export const AI_SURGE_STATUSES = [
  'normal', 'elevated', 'extreme_surge', 'quantum_lock',
] as const;
export type AiSurgeStatus = typeof AI_SURGE_STATUSES[number];

export interface TransportDynamicSurgePricing {
  id: string;
  transportServiceId: string;
  zonePolygonName: string;
  currentMultiplier: number;
  trafficDensityIndex: number;
  aiSurgeStatus: AiSurgeStatus;
  updatedAt: string;
  // weather_impact_factor excluded — internal pricing algorithm weight (NEVER)
}

// ── Intermodal Transit Connections ────────────────────────────────────────

export const CONNECTION_STATUSES = [
  'synchronized', 'rerouting_due_to_delay', 'completed', 'failed',
] as const;
export type ConnectionStatus = typeof CONNECTION_STATUSES[number];

export interface IntermodalTransitConnection {
  id: string;
  masterTripReference: string;
  passengerUserId: string;
  segmentSequenceJson: Record<string, unknown>[];
  totalTransitDurationMinutes: number;
  connectionStatus: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Part 3: Tourism & Experiences ────────────────────────────────────────

// ── Tour Guides ───────────────────────────────────────────────────────────

export const VERIFICATION_STATUSES = [
  'pending', 'verified', 'suspended', 'quantum_certified',
] as const;
export type VerificationStatus = typeof VERIFICATION_STATUSES[number];

export interface TourGuide {
  id: string;
  organizationId: string;
  guideUserId: string;
  fullName: string;
  languagesSpoken: string[];
  certificationsMetadata: Record<string, unknown>[];
  availabilitySchedule: Record<string, unknown>;
  averageRating: number;
  totalReviews: number;
  verificationStatus: VerificationStatus;
  videoIntroductionUrl: string | null;
  portfolioGallery: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // insurance_policy_details excluded — sensitive business/financial data
  // emergency_contact_info excluded — guide PII (NEVER expose to users)
  // gps_latitude, gps_longitude excluded — real-time personal location (privacy)
}

// ── Tours ─────────────────────────────────────────────────────────────────

export const TOUR_CATEGORIES = [
  'Daily Tours', 'Luxury Tours', 'Adventure', 'Cultural', 'Food Tours',
  'Safari', 'Cruise', 'Historical', 'Nightlife', 'Helicopter',
  'Island', 'Diving', 'Hiking', 'Fishing', 'VIP Tours', 'Quantum Expedition',
] as const;
export type TourCategory = typeof TOUR_CATEGORIES[number];

export interface Tour {
  id: string;
  organizationId: string;
  guideId: string | null;
  tourTitle: string;
  tourCategory: TourCategory;
  country: string;
  city: string;
  durationHours: number;
  maxParticipants: number;
  basePrice: number;
  currency: string;
  itineraryDetails: Record<string, unknown>[];
  includedAmenities: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_recommendation_boost excluded — internal ranking algorithm weight (NEVER)
}

// ── Events ────────────────────────────────────────────────────────────────

export const EVENT_CATEGORIES = [
  'Concerts', 'Festival', 'Sports', 'Conference', 'Business',
  'Wedding', 'Carnival', 'Night Club', 'Religious', 'Community',
  'Training', 'Quantum Showcase',
] as const;
export type EventCategory = typeof EVENT_CATEGORIES[number];

export interface TravelEvent {
  id: string;
  organizationId: string;
  eventTitle: string;
  eventCategory: EventCategory;
  country: string;
  city: string;
  venueName: string;
  gpsLatitude: number;
  gpsLongitude: number;
  startTime: string;
  endTime: string;
  ticketTiers: Record<string, unknown>[];
  totalCapacity: number;
  availableTickets: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_demand_multiplier excluded — internal demand pricing factor (NEVER)
}

// ── Attractions ───────────────────────────────────────────────────────────

export const ATTRACTION_CATEGORIES = [
  'Monuments', 'Museums', 'Parks', 'Historical Sites', 'Zoo',
  'Aquarium', 'Beach', 'Water Park', 'Quantum Wonder',
] as const;
export type AttractionCategory = typeof ATTRACTION_CATEGORIES[number];

export interface Attraction {
  id: string;
  attractionName: string;
  attractionCategory: AttractionCategory;
  country: string;
  city: string;
  address: string;
  gpsLatitude: number;
  gpsLongitude: number;
  operatingHours: Record<string, unknown>;
  admissionFee: number;
  currency: string;
  photos: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_popularity_score excluded — internal recommendation algorithm score (NEVER)
}

// ── Part 4: Payments, Escrow & Singularity ───────────────────────────────

// ── Travel Escrow Hubs ────────────────────────────────────────────────────

export const ESCROW_STATUSES = [
  'locked_in_vault', 'released_to_vendor', 'refunded_to_payer',
  'dispute_arbitration', 'quantum_autonomous_split',
] as const;
export type EscrowStatus = typeof ESCROW_STATUSES[number];

export interface TravelEscrowHub {
  id: string;
  bookingReference: string;
  payerUserId: string;
  payeeOrganizationId: string | null;
  totalAmount: number;
  currency: string;
  escrowStatus: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  // smart_release_conditions excluded — internal smart contract configuration
}

// ── Global Travel Insurance ───────────────────────────────────────────────

export const COVERAGE_TIERS = [
  'Standard Basic', 'Comprehensive Explorer', 'Quantum Platinum', 'Sovereign VIP',
] as const;
export type CoverageTier = typeof COVERAGE_TIERS[number];

export const CLAIM_STATUSES = [
  'active', 'claim_filed', 'auto_payout_completed', 'expired',
] as const;
export type ClaimStatus = typeof CLAIM_STATUSES[number];

export interface TravelInsurancePolicy {
  id: string;
  policyNumber: string;
  insuredUserId: string;
  masterTripReference: string;
  coverageTier: CoverageTier;
  medicalCoverageLimit: number;
  flightDelayAutomaticPayout: boolean;
  baggageLossInsured: boolean;
  policyCost: number;
  currency: string;
  claimStatus: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Travel Multi-Currency Wallets ─────────────────────────────────────────

export const WALLET_STATUSES = [
  'secure', 'frozen_by_security', 'quantum_locked',
] as const;
export type WalletStatus = typeof WALLET_STATUSES[number];

export interface TravelWallet {
  id: string;
  userId: string;
  fiatCurrencyBalances: Record<string, number>;
  cryptoStablecoinBalances: Record<string, number>;
  virtualDebitCardEnabled: boolean;
  cardSpendingLimitDaily: number;
  walletStatus: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

// ── AI Travel Concierge Chats ─────────────────────────────────────────────

export interface TravelConciergeChat {
  id: string;
  userId: string;
  sessionToken: string;
  conversationHistory: Record<string, unknown>[];
  isActiveSession: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_confidence_score excluded — internal AI metric
  // active_intent_detected excluded — internal AI intent classification
}

// ── Global Travel Analytics Singularity ───────────────────────────────────

export interface TravelAnalyticsSingularity {
  id: string;
  metricCategory: string;
  aggregationInterval: string;
  metricsPayload: Record<string, unknown>;
  recordedAt: string;
  // neural_trend_prediction excluded — internal ML model prediction
}

// ── Part 4.2: Financial Expansion ────────────────────────────────────────
//
// autonomous_fraud_shield_ledger → ENTIRE TABLE BACKEND ONLY
//   threat_signature_hash  — reveals detection pattern (enables fraud evasion, NEVER)
//   risk_score_evaluated   — reveals scoring algorithm (NEVER)
//   ip_geolocation_metadata — IP address + location PII (NEVER)
//
// NOTE: travel_multi_currency_wallets (referenced by quantum_debit_card_transactions)
// was not received (Part 4.1 missing). walletId typed as string UUID.

// ── Cross-Border Settlement ───────────────────────────────────────────────

export const SETTLEMENT_STATUSES = [
  'pending', 'instant_settled', 'quantum_routed', 'failed',
] as const;
export type SettlementStatus = typeof SETTLEMENT_STATUSES[number];

export interface CrossBorderSettlement {
  id: string;
  transactionReference: string;
  sourceCurrency: string;
  targetCurrency: string;
  amountSent: number;
  amountReceived: number;
  fxConversionRate: number; // settled rate on user's own transaction — legitimate to display
  settlementStatus: SettlementStatus;
  aiSlippageProtectionActive: boolean;
  createdAt: string;
}

// ── Quantum Debit Card Transactions ───────────────────────────────────────

export const CARD_AUTH_STATUSES = [
  'approved', 'declined_insufficient_funds', 'declined_fraud_risk', 'quantum_approved',
] as const;
export type CardAuthStatus = typeof CARD_AUTH_STATUSES[number];

export interface QuantumCardTransaction {
  id: string;
  walletId: string; // → travel_multi_currency_wallets (Part 4.1, not yet received)
  merchantName: string;
  merchantCategoryCode: string;
  chargedAmount: number;
  currency: string;
  cardAuthStatus: CardAuthStatus;
  processedAt: string;
}

// ── Dispute Arbitration ───────────────────────────────────────────────────

export const RULING_STATUSES = [
  'under_investigation', 'auto_resolved_refund', 'vendor_vindicated', 'quantum_jury_review',
] as const;
export type RulingStatus = typeof RULING_STATUSES[number];

export interface DisputeArbitration {
  id: string;
  disputeCaseNumber: string;
  complainantUserId: string;
  respondentOrganizationId: string | null;
  disputeReason: string;
  aiArbitrationRuling: string | null;
  rulingStatus: RulingStatus;
  resolvedAt: string | null;
  createdAt: string;
}

// ── Sovereign Neural Node ─────────────────────────────────────────────────

export const SYNCHRONIZATION_STATUSES = [
  'fully_synchronized', 'calibrating', 'sovereign_lock',
] as const;
export type SynchronizationStatus = typeof SYNCHRONIZATION_STATUSES[number];

export interface SovereignNeuralNode {
  id: string;
  systemNodeName: string;
  globalSynergyIndex: number;
  quantumSynchronizationStatus: SynchronizationStatus;
  lastPulseAt: string;
  // active_protocols_json excluded — internal system configuration
}
