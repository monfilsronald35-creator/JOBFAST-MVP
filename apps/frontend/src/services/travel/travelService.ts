import { supabase } from '../../lib/supabase';
import type {
  HotelInventoryYieldControl,
  AiOptimizationStatus,
  VacationRentalAmenitiesMatrix,
  TravelDestinationSeasonalForecast,
  SeasonName,
  HotelStaffOperation,
  HotelDepartment,
  ShiftStatus,
  PropertySmartIotTelemetry,
  IotDeviceType,
  Airport,
  Flight,
  FlightCategory,
  FlightStatus,
  TransportService,
  ServiceType,
  VehicleInventory,
  VehicleCategory,
  MaintenanceStatus,
  TransportRoute,
  FlightSeatAllocation,
  CabinTier,
  AirportGateSchedule,
  GateStatus,
  VehicleAutonomousTelemetry,
  LidarStatus,
  TransportDynamicSurgePricing,
  AiSurgeStatus,
  IntermodalTransitConnection,
  ConnectionStatus,
  TourGuide,
  VerificationStatus,
  Tour,
  TourCategory,
  TravelEvent,
  EventCategory,
  Attraction,
  AttractionCategory,
  TravelEscrowHub,
  EscrowStatus,
  TravelInsurancePolicy,
  CoverageTier,
  ClaimStatus,
  TravelWallet,
  WalletStatus,
  TravelConciergeChat,
  TravelAnalyticsSingularity,
  CrossBorderSettlement,
  SettlementStatus,
  QuantumCardTransaction,
  CardAuthStatus,
  DisputeArbitration,
  RulingStatus,
  SovereignNeuralNode,
  SynchronizationStatus,
} from '../../types/travel';

// Backend-only fields (never queried from frontend):
//   travel_destination_seasonal_forecasts: price_fluctuation_index — internal pricing
//                                          engine multiplier, NEVER expose to clients
//   property_smart_iot_telemetry:          currentStatus must never contain access
//                                          credentials (application-level invariant)
//
// IoT device state (currentStatus) is written exclusively by backend IoT pipelines.
// Frontend reads for dashboard display only — no write operations.
//
// NOTE: Migration 017 Part 1.1 base tables (hotels, rooms, vacation_rentals,
// travel_destinations) were not received. Service functions for those entities
// will be prepended here when Part 1.1 SQL is sent.

// ── Column constants ───────────────────────────────────────────────────────

const YIELD_COLS =
  'id, hotel_id, room_id, target_date, alloted_inventory_count, reserved_inventory_count, dynamic_surge_multiplier, minimum_stay_requirement, is_blackout_date, ai_optimization_status, created_at, updated_at';

const FORECAST_COLS =
  'id, destination_id, season_name, start_month, end_month, average_temperature_celsius, tourist_crowd_index, ai_recommended_travel_probability, created_at';
// price_fluctuation_index excluded — internal pricing engine multiplier

const STAFF_COLS =
  'id, hotel_id, staff_user_id, department, shift_status, assigned_zone_or_floor, performance_score, created_at, updated_at';

const IOT_COLS =
  'id, hotel_id, vacation_rental_id, device_identifier, device_type, battery_level_percentage, current_status, is_online, last_ping_at, created_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type YieldControlRow = {
  id: string; hotel_id: string; room_id: string | null; target_date: string;
  alloted_inventory_count: number; reserved_inventory_count: number;
  dynamic_surge_multiplier: number; minimum_stay_requirement: number;
  is_blackout_date: boolean; ai_optimization_status: string;
  created_at: string; updated_at: string;
};

type AmenitiesRow = {
  id: string; vacation_rental_id: string; has_high_speed_fiber: boolean;
  has_private_pool: boolean; has_heliport_access: boolean;
  has_ev_charging_station: boolean; has_biometric_security: boolean;
  noise_monitoring_sensor_active: boolean; pet_friendly: boolean;
  smoking_allowed: boolean; custom_amenities_json: Record<string, unknown>;
  created_at: string;
};

type ForecastRow = {
  id: string; destination_id: string; season_name: string;
  start_month: number | null; end_month: number | null;
  average_temperature_celsius: number; tourist_crowd_index: number;
  ai_recommended_travel_probability: number; created_at: string;
};

type StaffRow = {
  id: string; hotel_id: string; staff_user_id: string; department: string;
  shift_status: string; assigned_zone_or_floor: string | null;
  performance_score: number; created_at: string; updated_at: string;
};

type IotRow = {
  id: string; hotel_id: string | null; vacation_rental_id: string | null;
  device_identifier: string; device_type: string; battery_level_percentage: number;
  current_status: Record<string, unknown>; is_online: boolean;
  last_ping_at: string; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapYieldControl(r: YieldControlRow): HotelInventoryYieldControl {
  return {
    id: r.id, hotelId: r.hotel_id, roomId: r.room_id, targetDate: r.target_date,
    allotedInventoryCount: r.alloted_inventory_count,
    reservedInventoryCount: r.reserved_inventory_count,
    dynamicSurgeMultiplier: r.dynamic_surge_multiplier,
    minimumStayRequirement: r.minimum_stay_requirement,
    isBlackoutDate: r.is_blackout_date,
    aiOptimizationStatus: r.ai_optimization_status as AiOptimizationStatus,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAmenities(r: AmenitiesRow): VacationRentalAmenitiesMatrix {
  return {
    id: r.id, vacationRentalId: r.vacation_rental_id,
    hasHighSpeedFiber: r.has_high_speed_fiber, hasPrivatePool: r.has_private_pool,
    hasHeliportAccess: r.has_heliport_access, hasEvChargingStation: r.has_ev_charging_station,
    hasBiometricSecurity: r.has_biometric_security,
    noiseMonitoringSensorActive: r.noise_monitoring_sensor_active,
    petFriendly: r.pet_friendly, smokingAllowed: r.smoking_allowed,
    customAmenitiesJson: r.custom_amenities_json, createdAt: r.created_at,
  };
}

function mapForecast(r: ForecastRow): TravelDestinationSeasonalForecast {
  return {
    id: r.id, destinationId: r.destination_id, seasonName: r.season_name as SeasonName,
    startMonth: r.start_month, endMonth: r.end_month,
    averageTemperatureCelsius: r.average_temperature_celsius,
    touristCrowdIndex: r.tourist_crowd_index,
    aiRecommendedTravelProbability: r.ai_recommended_travel_probability,
    createdAt: r.created_at,
  };
}

function mapStaff(r: StaffRow): HotelStaffOperation {
  return {
    id: r.id, hotelId: r.hotel_id, staffUserId: r.staff_user_id,
    department: r.department as HotelDepartment,
    shiftStatus: r.shift_status as ShiftStatus,
    assignedZoneOrFloor: r.assigned_zone_or_floor,
    performanceScore: r.performance_score,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapIot(r: IotRow): PropertySmartIotTelemetry {
  return {
    id: r.id, hotelId: r.hotel_id, vacationRentalId: r.vacation_rental_id,
    deviceIdentifier: r.device_identifier, deviceType: r.device_type as IotDeviceType,
    batteryLevelPercentage: r.battery_level_percentage, currentStatus: r.current_status,
    isOnline: r.is_online, lastPingAt: r.last_ping_at, createdAt: r.created_at,
  };
}

// ================================================================
// === Hotel Inventory Yield Controls
// ================================================================

export async function getHotelYieldControls(
  hotelId: string,
  options: {
    from?: string;
    to?: string;
    roomId?: string;
    status?: AiOptimizationStatus;
    blackoutOnly?: boolean;
  } = {}
): Promise<HotelInventoryYieldControl[]> {
  let q = supabase
    .from('hotel_inventory_yield_controls')
    .select(YIELD_COLS)
    .eq('hotel_id', hotelId);

  if (options.from) q = q.gte('target_date', options.from);
  if (options.to) q = q.lte('target_date', options.to);
  if (options.roomId) q = q.eq('room_id', options.roomId);
  if (options.status) q = q.eq('ai_optimization_status', options.status);
  if (options.blackoutOnly) q = q.eq('is_blackout_date', true);

  const { data, error } = await q.order('target_date', { ascending: true });
  if (error) throw error;
  return (data as YieldControlRow[]).map(mapYieldControl);
}

export async function getRoomYieldControl(
  hotelId: string,
  roomId: string,
  targetDate: string
): Promise<HotelInventoryYieldControl | null> {
  const { data, error } = await supabase
    .from('hotel_inventory_yield_controls')
    .select(YIELD_COLS)
    .eq('hotel_id', hotelId)
    .eq('room_id', roomId)
    .eq('target_date', targetDate)
    .maybeSingle();
  if (error) throw error;
  return data ? mapYieldControl(data as YieldControlRow) : null;
}

export async function getBlackoutDates(
  hotelId: string,
  from: string,
  to: string
): Promise<HotelInventoryYieldControl[]> {
  const { data, error } = await supabase
    .from('hotel_inventory_yield_controls')
    .select(YIELD_COLS)
    .eq('hotel_id', hotelId)
    .eq('is_blackout_date', true)
    .gte('target_date', from)
    .lte('target_date', to)
    .order('target_date', { ascending: true });
  if (error) throw error;
  return (data as YieldControlRow[]).map(mapYieldControl);
}

export async function getSurgeModeControls(
  hotelId: string
): Promise<HotelInventoryYieldControl[]> {
  const { data, error } = await supabase
    .from('hotel_inventory_yield_controls')
    .select(YIELD_COLS)
    .eq('hotel_id', hotelId)
    .eq('ai_optimization_status', 'surge_mode')
    .gte('target_date', new Date().toISOString().slice(0, 10))
    .order('target_date', { ascending: true });
  if (error) throw error;
  return (data as YieldControlRow[]).map(mapYieldControl);
}

// ================================================================
// === Vacation Rental Amenities
// ================================================================

export async function getRentalAmenities(
  vacationRentalId: string
): Promise<VacationRentalAmenitiesMatrix | null> {
  const { data, error } = await supabase
    .from('vacation_rental_amenities_matrix')
    .select('*')
    .eq('vacation_rental_id', vacationRentalId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAmenities(data as AmenitiesRow) : null;
}

export async function getRentalsWithAmenity(
  amenityField: keyof Pick<
    VacationRentalAmenitiesMatrix,
    | 'hasHighSpeedFiber' | 'hasPrivatePool' | 'hasHeliportAccess'
    | 'hasEvChargingStation' | 'hasBiometricSecurity' | 'petFriendly'
  >
): Promise<VacationRentalAmenitiesMatrix[]> {
  const colMap: Record<string, string> = {
    hasHighSpeedFiber: 'has_high_speed_fiber',
    hasPrivatePool: 'has_private_pool',
    hasHeliportAccess: 'has_heliport_access',
    hasEvChargingStation: 'has_ev_charging_station',
    hasBiometricSecurity: 'has_biometric_security',
    petFriendly: 'pet_friendly',
  };

  const col = colMap[amenityField] as string;
  const { data, error } = await supabase
    .from('vacation_rental_amenities_matrix')
    .select('*')
    .eq(col, true);
  if (error) throw error;
  return (data as AmenitiesRow[]).map(mapAmenities);
}

// ================================================================
// === Destination Seasonal Forecasts
// ================================================================

export async function getDestinationForecasts(
  destinationId: string
): Promise<TravelDestinationSeasonalForecast[]> {
  const { data, error } = await supabase
    .from('travel_destination_seasonal_forecasts')
    .select(FORECAST_COLS)
    .eq('destination_id', destinationId)
    .order('start_month', { ascending: true });
  if (error) throw error;
  return (data as ForecastRow[]).map(mapForecast);
}

export async function getSeasonForecast(
  destinationId: string,
  seasonName: SeasonName
): Promise<TravelDestinationSeasonalForecast | null> {
  const { data, error } = await supabase
    .from('travel_destination_seasonal_forecasts')
    .select(FORECAST_COLS)
    .eq('destination_id', destinationId)
    .eq('season_name', seasonName)
    .maybeSingle();
  if (error) throw error;
  return data ? mapForecast(data as ForecastRow) : null;
}

export async function getBestTravelSeasons(
  destinationId: string,
  minProbability: number = 0.8
): Promise<TravelDestinationSeasonalForecast[]> {
  const { data, error } = await supabase
    .from('travel_destination_seasonal_forecasts')
    .select(FORECAST_COLS)
    .eq('destination_id', destinationId)
    .gte('ai_recommended_travel_probability', minProbability)
    .order('ai_recommended_travel_probability', { ascending: false });
  if (error) throw error;
  return (data as ForecastRow[]).map(mapForecast);
}

// ================================================================
// === Hotel Staff Operations
// ================================================================

export async function getHotelStaff(
  hotelId: string,
  options: { department?: HotelDepartment; shiftStatus?: ShiftStatus } = {}
): Promise<HotelStaffOperation[]> {
  let q = supabase
    .from('hotel_staff_operations')
    .select(STAFF_COLS)
    .eq('hotel_id', hotelId);

  if (options.department) q = q.eq('department', options.department);
  if (options.shiftStatus) q = q.eq('shift_status', options.shiftStatus);

  const { data, error } = await q.order('department', { ascending: true });
  if (error) throw error;
  return (data as StaffRow[]).map(mapStaff);
}

export async function getStaffOnDuty(
  hotelId: string,
  department?: HotelDepartment
): Promise<HotelStaffOperation[]> {
  let q = supabase
    .from('hotel_staff_operations')
    .select(STAFF_COLS)
    .eq('hotel_id', hotelId)
    .in('shift_status', ['on_duty', 'emergency_response']);

  if (department) q = q.eq('department', department);

  const { data, error } = await q.order('department', { ascending: true });
  if (error) throw error;
  return (data as StaffRow[]).map(mapStaff);
}

export async function getMyShiftStatus(
  hotelId: string
): Promise<HotelStaffOperation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('hotel_staff_operations')
    .select(STAFF_COLS)
    .eq('hotel_id', hotelId)
    .eq('staff_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStaff(data as StaffRow) : null;
}

// ================================================================
// === Property Smart IoT Telemetry (READ ONLY — device state is
// written exclusively by backend IoT pipelines)
// ================================================================

export async function getPropertyIotDevices(
  options: {
    hotelId?: string;
    vacationRentalId?: string;
    deviceType?: IotDeviceType;
    onlineOnly?: boolean;
  } = {}
): Promise<PropertySmartIotTelemetry[]> {
  let q = supabase
    .from('property_smart_iot_telemetry')
    .select(IOT_COLS);

  if (options.hotelId) q = q.eq('hotel_id', options.hotelId);
  if (options.vacationRentalId) q = q.eq('vacation_rental_id', options.vacationRentalId);
  if (options.deviceType) q = q.eq('device_type', options.deviceType);
  if (options.onlineOnly) q = q.eq('is_online', true);

  const { data, error } = await q.order('device_type', { ascending: true });
  if (error) throw error;
  return (data as IotRow[]).map(mapIot);
}

export async function getIotDevice(
  deviceIdentifier: string
): Promise<PropertySmartIotTelemetry | null> {
  const { data, error } = await supabase
    .from('property_smart_iot_telemetry')
    .select(IOT_COLS)
    .eq('device_identifier', deviceIdentifier)
    .maybeSingle();
  if (error) throw error;
  return data ? mapIot(data as IotRow) : null;
}

export async function getLowBatteryDevices(
  hotelId: string,
  threshold: number = 20
): Promise<PropertySmartIotTelemetry[]> {
  const { data, error } = await supabase
    .from('property_smart_iot_telemetry')
    .select(IOT_COLS)
    .eq('hotel_id', hotelId)
    .lte('battery_level_percentage', threshold)
    .order('battery_level_percentage', { ascending: true });
  if (error) throw error;
  return (data as IotRow[]).map(mapIot);
}

export async function getOfflineDevices(
  options: { hotelId?: string; vacationRentalId?: string } = {}
): Promise<PropertySmartIotTelemetry[]> {
  let q = supabase
    .from('property_smart_iot_telemetry')
    .select(IOT_COLS)
    .eq('is_online', false);

  if (options.hotelId) q = q.eq('hotel_id', options.hotelId);
  if (options.vacationRentalId) q = q.eq('vacation_rental_id', options.vacationRentalId);

  const { data, error } = await q.order('last_ping_at', { ascending: true });
  if (error) throw error;
  return (data as IotRow[]).map(mapIot);
}

// ================================================================
// === Part 2: Transportation
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const AIRPORT_COLS =
  'id, airport_code_iata, airport_code_icao, airport_name, city, country, timezone, gps_latitude, gps_longitude, runways_metadata, lounges_metadata, is_active, created_at, updated_at';

const FLIGHT_COLS =
  'id, organization_id, airline_name, flight_number, flight_category, origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_model, gate_number, terminal, seat_map_config, cabin_classes, base_price, currency, delay_minutes, live_status, carbon_footprint_kg, is_active, created_at, updated_at';
// ai_price_prediction_matrix excluded — internal pricing AI matrix (NEVER expose)

const TRANSPORT_SERVICE_COLS =
  'id, organization_id, provider_name, service_type, country, city, operational_radius_km, pricing_per_km, base_fare, currency, ai_dispatch_enabled, is_active, created_at, updated_at';
// fleet_management_config excluded — internal operational config

const VEHICLE_COLS =
  'id, transport_service_id, vehicle_model, license_plate, vehicle_category, maximum_capacity, current_gps_latitude, current_gps_longitude, battery_or_fuel_level_percentage, maintenance_status, is_available, created_at, updated_at';

const ROUTE_COLS =
  'id, transport_service_id, route_name, origin_coordinates, destination_coordinates, waypoints_json, estimated_duration_minutes, traffic_congestion_factor, ai_optimized_path, created_at, updated_at';

// ── Row types ──────────────────────────────────────────────────────────────

type AirportRow = {
  id: string; airport_code_iata: string; airport_code_icao: string;
  airport_name: string; city: string; country: string; timezone: string;
  gps_latitude: number; gps_longitude: number;
  runways_metadata: Record<string, unknown>[]; lounges_metadata: Record<string, unknown>[];
  is_active: boolean; created_at: string; updated_at: string;
};

type FlightRow = {
  id: string; organization_id: string; airline_name: string; flight_number: string;
  flight_category: string; origin_airport_id: string; destination_airport_id: string;
  departure_time: string; arrival_time: string; aircraft_model: string;
  gate_number: string | null; terminal: string | null;
  seat_map_config: Record<string, unknown>; cabin_classes: Record<string, unknown>[];
  base_price: number; currency: string; delay_minutes: number; live_status: string;
  carbon_footprint_kg: number; is_active: boolean; created_at: string; updated_at: string;
};

type TransportServiceRow = {
  id: string; organization_id: string; provider_name: string; service_type: string;
  country: string; city: string; operational_radius_km: number;
  pricing_per_km: number; base_fare: number; currency: string;
  ai_dispatch_enabled: boolean; is_active: boolean; created_at: string; updated_at: string;
};

type VehicleRow = {
  id: string; transport_service_id: string; vehicle_model: string;
  license_plate: string; vehicle_category: string; maximum_capacity: number;
  current_gps_latitude: number | null; current_gps_longitude: number | null;
  battery_or_fuel_level_percentage: number; maintenance_status: string;
  is_available: boolean; created_at: string; updated_at: string;
};

type RouteRow = {
  id: string; transport_service_id: string | null; route_name: string;
  origin_coordinates: string; destination_coordinates: string;
  waypoints_json: Record<string, unknown>[]; estimated_duration_minutes: number;
  traffic_congestion_factor: number; ai_optimized_path: boolean;
  created_at: string; updated_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapAirport(r: AirportRow): Airport {
  return {
    id: r.id, airportCodeIata: r.airport_code_iata, airportCodeIcao: r.airport_code_icao,
    airportName: r.airport_name, city: r.city, country: r.country, timezone: r.timezone,
    gpsLatitude: r.gps_latitude, gpsLongitude: r.gps_longitude,
    runwaysMetadata: r.runways_metadata, loungesMetadata: r.lounges_metadata,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapFlight(r: FlightRow): Flight {
  return {
    id: r.id, organizationId: r.organization_id, airlineName: r.airline_name,
    flightNumber: r.flight_number, flightCategory: r.flight_category as FlightCategory,
    originAirportId: r.origin_airport_id, destinationAirportId: r.destination_airport_id,
    departureTime: r.departure_time, arrivalTime: r.arrival_time,
    aircraftModel: r.aircraft_model, gateNumber: r.gate_number, terminal: r.terminal,
    seatMapConfig: r.seat_map_config, cabinClasses: r.cabin_classes,
    basePrice: r.base_price, currency: r.currency, delayMinutes: r.delay_minutes,
    liveStatus: r.live_status as FlightStatus, carbonFootprintKg: r.carbon_footprint_kg,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTransportService(r: TransportServiceRow): TransportService {
  return {
    id: r.id, organizationId: r.organization_id, providerName: r.provider_name,
    serviceType: r.service_type as ServiceType, country: r.country, city: r.city,
    operationalRadiusKm: r.operational_radius_km, pricingPerKm: r.pricing_per_km,
    baseFare: r.base_fare, currency: r.currency, aiDispatchEnabled: r.ai_dispatch_enabled,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapVehicle(r: VehicleRow): VehicleInventory {
  return {
    id: r.id, transportServiceId: r.transport_service_id, vehicleModel: r.vehicle_model,
    licensePlate: r.license_plate, vehicleCategory: r.vehicle_category as VehicleCategory,
    maximumCapacity: r.maximum_capacity, currentGpsLatitude: r.current_gps_latitude,
    currentGpsLongitude: r.current_gps_longitude,
    batteryOrFuelLevelPercentage: r.battery_or_fuel_level_percentage,
    maintenanceStatus: r.maintenance_status as MaintenanceStatus,
    isAvailable: r.is_available, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapRoute(r: RouteRow): TransportRoute {
  return {
    id: r.id, transportServiceId: r.transport_service_id, routeName: r.route_name,
    originCoordinates: r.origin_coordinates, destinationCoordinates: r.destination_coordinates,
    waypointsJson: r.waypoints_json, estimatedDurationMinutes: r.estimated_duration_minutes,
    trafficCongestionFactor: r.traffic_congestion_factor, aiOptimizedPath: r.ai_optimized_path,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// ================================================================
// === Airports
// ================================================================

export async function getAirports(
  options: { country?: string; city?: string; activeOnly?: boolean } = {}
): Promise<Airport[]> {
  let q = supabase.from('airports').select(AIRPORT_COLS);

  if (options.country) q = q.eq('country', options.country);
  if (options.city) q = q.ilike('city', `%${options.city}%`);
  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q.order('airport_name', { ascending: true });
  if (error) throw error;
  return (data as AirportRow[]).map(mapAirport);
}

export async function getAirport(id: string): Promise<Airport | null> {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAirport(data as AirportRow) : null;
}

export async function getAirportByIata(iataCode: string): Promise<Airport | null> {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLS)
    .eq('airport_code_iata', iataCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapAirport(data as AirportRow) : null;
}

export async function getAirportByIcao(icaoCode: string): Promise<Airport | null> {
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLS)
    .eq('airport_code_icao', icaoCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapAirport(data as AirportRow) : null;
}

export async function searchAirports(query: string): Promise<Airport[]> {
  const q = query.trim();
  const { data, error } = await supabase
    .from('airports')
    .select(AIRPORT_COLS)
    .or(
      `airport_name.ilike.%${q}%,city.ilike.%${q}%,airport_code_iata.ilike.%${q}%,airport_code_icao.ilike.%${q}%`
    )
    .eq('is_active', true)
    .order('airport_name', { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data as AirportRow[]).map(mapAirport);
}

// ================================================================
// === Flights (READ ONLY — booking creation goes through backend)
// ================================================================

export async function searchFlights(
  originAirportId: string,
  destinationAirportId: string,
  departureDateFrom: string,
  options: {
    departureDateTo?: string;
    category?: FlightCategory;
    status?: FlightStatus;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<Flight[]> {
  let q = supabase
    .from('flights')
    .select(FLIGHT_COLS)
    .eq('origin_airport_id', originAirportId)
    .eq('destination_airport_id', destinationAirportId)
    .eq('is_active', true)
    .gte('departure_time', departureDateFrom);

  if (options.departureDateTo) q = q.lte('departure_time', options.departureDateTo);
  if (options.category) q = q.eq('flight_category', options.category);
  if (options.status) q = q.eq('live_status', options.status);
  if (options.cursor) q = q.gt('departure_time', options.cursor);

  const { data, error } = await q
    .order('departure_time', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FlightRow[]).map(mapFlight);
}

export async function getFlight(id: string): Promise<Flight | null> {
  const { data, error } = await supabase
    .from('flights')
    .select(FLIGHT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFlight(data as FlightRow) : null;
}

export async function getFlightByNumber(
  flightNumber: string,
  departureDate: string
): Promise<Flight | null> {
  const { data, error } = await supabase
    .from('flights')
    .select(FLIGHT_COLS)
    .eq('flight_number', flightNumber)
    .gte('departure_time', departureDate)
    .lt('departure_time', new Date(new Date(departureDate).getTime() + 86400000).toISOString())
    .maybeSingle();
  if (error) throw error;
  return data ? mapFlight(data as FlightRow) : null;
}

export async function getLiveFlightStatus(id: string): Promise<FlightStatus | null> {
  const { data, error } = await supabase
    .from('flights')
    .select('live_status, delay_minutes')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? (data.live_status as FlightStatus) : null;
}

export async function getOrganizationFlights(
  organizationId: string,
  options: { status?: FlightStatus; from?: string } = {}
): Promise<Flight[]> {
  let q = supabase
    .from('flights')
    .select(FLIGHT_COLS)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (options.status) q = q.eq('live_status', options.status);
  if (options.from) q = q.gte('departure_time', options.from);

  const { data, error } = await q.order('departure_time', { ascending: true });
  if (error) throw error;
  return (data as FlightRow[]).map(mapFlight);
}

// ================================================================
// === Transport Services
// ================================================================

export async function getTransportServices(
  country: string,
  city: string,
  options: { serviceType?: ServiceType; activeOnly?: boolean } = {}
): Promise<TransportService[]> {
  let q = supabase
    .from('transport_services')
    .select(TRANSPORT_SERVICE_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`);

  if (options.serviceType) q = q.eq('service_type', options.serviceType);
  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q.order('provider_name', { ascending: true });
  if (error) throw error;
  return (data as TransportServiceRow[]).map(mapTransportService);
}

export async function getTransportService(id: string): Promise<TransportService | null> {
  const { data, error } = await supabase
    .from('transport_services')
    .select(TRANSPORT_SERVICE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTransportService(data as TransportServiceRow) : null;
}

export async function getServicesByType(
  serviceType: ServiceType,
  country: string,
  city?: string
): Promise<TransportService[]> {
  let q = supabase
    .from('transport_services')
    .select(TRANSPORT_SERVICE_COLS)
    .eq('service_type', serviceType)
    .eq('country', country)
    .eq('is_active', true);

  if (city) q = q.ilike('city', `%${city}%`);

  const { data, error } = await q.order('base_fare', { ascending: true });
  if (error) throw error;
  return (data as TransportServiceRow[]).map(mapTransportService);
}

// ================================================================
// === Vehicle Inventory (READ ONLY — dispatch goes through backend)
// ================================================================

export async function getAvailableVehicles(
  transportServiceId: string,
  options: { category?: VehicleCategory; minCapacity?: number } = {}
): Promise<VehicleInventory[]> {
  let q = supabase
    .from('vehicle_inventory')
    .select(VEHICLE_COLS)
    .eq('transport_service_id', transportServiceId)
    .eq('is_available', true)
    .eq('maintenance_status', 'operational');

  if (options.category) q = q.eq('vehicle_category', options.category);
  if (options.minCapacity) q = q.gte('maximum_capacity', options.minCapacity);

  const { data, error } = await q.order('vehicle_category', { ascending: true });
  if (error) throw error;
  return (data as VehicleRow[]).map(mapVehicle);
}

export async function getVehicle(id: string): Promise<VehicleInventory | null> {
  const { data, error } = await supabase
    .from('vehicle_inventory')
    .select(VEHICLE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVehicle(data as VehicleRow) : null;
}

export async function getVehicleByPlate(licensePlate: string): Promise<VehicleInventory | null> {
  const { data, error } = await supabase
    .from('vehicle_inventory')
    .select(VEHICLE_COLS)
    .eq('license_plate', licensePlate)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVehicle(data as VehicleRow) : null;
}

export async function getServiceFleet(
  transportServiceId: string,
  options: { maintenanceStatus?: MaintenanceStatus } = {}
): Promise<VehicleInventory[]> {
  let q = supabase
    .from('vehicle_inventory')
    .select(VEHICLE_COLS)
    .eq('transport_service_id', transportServiceId);

  if (options.maintenanceStatus) q = q.eq('maintenance_status', options.maintenanceStatus);

  const { data, error } = await q.order('vehicle_category', { ascending: true });
  if (error) throw error;
  return (data as VehicleRow[]).map(mapVehicle);
}

// ================================================================
// === Transport Routes
// ================================================================

export async function getServiceRoutes(
  transportServiceId: string,
  optimizedOnly?: boolean
): Promise<TransportRoute[]> {
  let q = supabase
    .from('transport_routes')
    .select(ROUTE_COLS)
    .eq('transport_service_id', transportServiceId);

  if (optimizedOnly) q = q.eq('ai_optimized_path', true);

  const { data, error } = await q.order('route_name', { ascending: true });
  if (error) throw error;
  return (data as RouteRow[]).map(mapRoute);
}

export async function getRoute(id: string): Promise<TransportRoute | null> {
  const { data, error } = await supabase
    .from('transport_routes')
    .select(ROUTE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoute(data as RouteRow) : null;
}

export async function getOptimizedRoutes(
  transportServiceId: string
): Promise<TransportRoute[]> {
  const { data, error } = await supabase
    .from('transport_routes')
    .select(ROUTE_COLS)
    .eq('transport_service_id', transportServiceId)
    .eq('ai_optimized_path', true)
    .order('traffic_congestion_factor', { ascending: true });
  if (error) throw error;
  return (data as RouteRow[]).map(mapRoute);
}

// ================================================================
// === Part 2.2: Transport Expansion
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const SEAT_COLS =
  'id, flight_id, seat_number, cabin_tier, is_occupied, passenger_user_id, seat_amenities_status, created_at, updated_at';
// biometric_boarding_hash excluded — NEVER (biometric data)

const GATE_COLS =
  'id, airport_id, flight_id, terminal_designation, gate_designation, scheduled_dock_time, scheduled_undock_time, gate_status, created_at';
// ai_turnaround_optimization excluded — internal AI operational intelligence

const TELEMETRY_COLS =
  'id, vehicle_id, current_speed_kmh, heading_angle_degrees, autonomous_drive_engaged, lidar_sensor_status, cabin_temperature_celsius, recorded_at';
// diagnostic_payload excluded — proprietary sensor calibration / AI model state

const SURGE_COLS =
  'id, transport_service_id, zone_polygon_name, current_multiplier, traffic_density_index, ai_surge_status, updated_at';
// weather_impact_factor excluded — internal pricing algorithm weight (NEVER)

const TRANSIT_COLS =
  'id, master_trip_reference, passenger_user_id, segment_sequence_json, total_transit_duration_minutes, connection_status, created_at, updated_at';

// ── Row types ──────────────────────────────────────────────────────────────

type SeatRow = {
  id: string; flight_id: string; seat_number: string; cabin_tier: string;
  is_occupied: boolean; passenger_user_id: string | null;
  seat_amenities_status: Record<string, unknown>; created_at: string; updated_at: string;
};

type GateRow = {
  id: string; airport_id: string; flight_id: string; terminal_designation: string;
  gate_designation: string; scheduled_dock_time: string; scheduled_undock_time: string;
  gate_status: string; created_at: string;
};

type TelemetryRow = {
  id: string; vehicle_id: string; current_speed_kmh: number; heading_angle_degrees: number;
  autonomous_drive_engaged: boolean; lidar_sensor_status: string;
  cabin_temperature_celsius: number; recorded_at: string;
};

type SurgeRow = {
  id: string; transport_service_id: string; zone_polygon_name: string;
  current_multiplier: number; traffic_density_index: number;
  ai_surge_status: string; updated_at: string;
};

type TransitRow = {
  id: string; master_trip_reference: string; passenger_user_id: string;
  segment_sequence_json: Record<string, unknown>[]; total_transit_duration_minutes: number;
  connection_status: string; created_at: string; updated_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapSeat(r: SeatRow): FlightSeatAllocation {
  return {
    id: r.id, flightId: r.flight_id, seatNumber: r.seat_number,
    cabinTier: r.cabin_tier as CabinTier, isOccupied: r.is_occupied,
    passengerUserId: r.passenger_user_id, seatAmenitiesStatus: r.seat_amenities_status,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapGate(r: GateRow): AirportGateSchedule {
  return {
    id: r.id, airportId: r.airport_id, flightId: r.flight_id,
    terminalDesignation: r.terminal_designation, gateDesignation: r.gate_designation,
    scheduledDockTime: r.scheduled_dock_time, scheduledUndockTime: r.scheduled_undock_time,
    gateStatus: r.gate_status as GateStatus, createdAt: r.created_at,
  };
}

function mapTelemetry(r: TelemetryRow): VehicleAutonomousTelemetry {
  return {
    id: r.id, vehicleId: r.vehicle_id, currentSpeedKmh: r.current_speed_kmh,
    headingAngleDegrees: r.heading_angle_degrees,
    autonomousDriveEngaged: r.autonomous_drive_engaged,
    lidarSensorStatus: r.lidar_sensor_status as LidarStatus,
    cabinTemperatureCelsius: r.cabin_temperature_celsius, recordedAt: r.recorded_at,
  };
}

function mapSurge(r: SurgeRow): TransportDynamicSurgePricing {
  return {
    id: r.id, transportServiceId: r.transport_service_id,
    zonePolygonName: r.zone_polygon_name, currentMultiplier: r.current_multiplier,
    trafficDensityIndex: r.traffic_density_index,
    aiSurgeStatus: r.ai_surge_status as AiSurgeStatus, updatedAt: r.updated_at,
  };
}

function mapTransit(r: TransitRow): IntermodalTransitConnection {
  return {
    id: r.id, masterTripReference: r.master_trip_reference,
    passengerUserId: r.passenger_user_id, segmentSequenceJson: r.segment_sequence_json,
    totalTransitDurationMinutes: r.total_transit_duration_minutes,
    connectionStatus: r.connection_status as ConnectionStatus,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// ================================================================
// === Flight Seat Allocations
// ================================================================

export async function getFlightSeatMap(
  flightId: string
): Promise<FlightSeatAllocation[]> {
  const { data, error } = await supabase
    .from('flight_seat_allocations')
    .select(SEAT_COLS)
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true });
  if (error) throw error;
  return (data as SeatRow[]).map(mapSeat);
}

export async function getAvailableSeats(
  flightId: string,
  cabinTier?: CabinTier
): Promise<FlightSeatAllocation[]> {
  let q = supabase
    .from('flight_seat_allocations')
    .select(SEAT_COLS)
    .eq('flight_id', flightId)
    .eq('is_occupied', false);

  if (cabinTier) q = q.eq('cabin_tier', cabinTier);

  const { data, error } = await q.order('seat_number', { ascending: true });
  if (error) throw error;
  return (data as SeatRow[]).map(mapSeat);
}

export async function getMyFlightSeat(
  flightId: string
): Promise<FlightSeatAllocation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('flight_seat_allocations')
    .select(SEAT_COLS)
    .eq('flight_id', flightId)
    .eq('passenger_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSeat(data as SeatRow) : null;
}

// ================================================================
// === Airport Gate Schedule Matrix
// ================================================================

export async function getAirportGateSchedule(
  airportId: string,
  options: { gateStatus?: GateStatus; from?: string; to?: string } = {}
): Promise<AirportGateSchedule[]> {
  let q = supabase
    .from('airport_gate_schedule_matrix')
    .select(GATE_COLS)
    .eq('airport_id', airportId);

  if (options.gateStatus) q = q.eq('gate_status', options.gateStatus);
  if (options.from) q = q.gte('scheduled_dock_time', options.from);
  if (options.to) q = q.lte('scheduled_undock_time', options.to);

  const { data, error } = await q.order('scheduled_dock_time', { ascending: true });
  if (error) throw error;
  return (data as GateRow[]).map(mapGate);
}

export async function getFlightGate(flightId: string): Promise<AirportGateSchedule | null> {
  const { data, error } = await supabase
    .from('airport_gate_schedule_matrix')
    .select(GATE_COLS)
    .eq('flight_id', flightId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGate(data as GateRow) : null;
}

export async function getActiveBoardingGates(airportId: string): Promise<AirportGateSchedule[]> {
  const { data, error } = await supabase
    .from('airport_gate_schedule_matrix')
    .select(GATE_COLS)
    .eq('airport_id', airportId)
    .eq('gate_status', 'boarding')
    .order('scheduled_dock_time', { ascending: true });
  if (error) throw error;
  return (data as GateRow[]).map(mapGate);
}

// ================================================================
// === Vehicle Autonomous Telemetry (READ ONLY — written by vehicle
// firmware pipeline; frontend used for fleet ops dashboard only)
// ================================================================

export async function getVehicleTelemetry(
  vehicleId: string,
  from: string,
  limit: number = 100
): Promise<VehicleAutonomousTelemetry[]> {
  const { data, error } = await supabase
    .from('vehicle_autonomous_telemetry')
    .select(TELEMETRY_COLS)
    .eq('vehicle_id', vehicleId)
    .gte('recorded_at', from)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as TelemetryRow[]).map(mapTelemetry);
}

export async function getLatestVehicleTelemetry(
  vehicleId: string
): Promise<VehicleAutonomousTelemetry | null> {
  const { data, error } = await supabase
    .from('vehicle_autonomous_telemetry')
    .select(TELEMETRY_COLS)
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTelemetry(data as TelemetryRow) : null;
}

export async function getOfflineSensorVehicles(
  vehicleIds: string[]
): Promise<VehicleAutonomousTelemetry[]> {
  if (vehicleIds.length === 0) return [];
  const { data, error } = await supabase
    .from('vehicle_autonomous_telemetry')
    .select(TELEMETRY_COLS)
    .in('vehicle_id', vehicleIds)
    .eq('lidar_sensor_status', 'offline')
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return (data as TelemetryRow[]).map(mapTelemetry);
}

// ================================================================
// === Transport Dynamic Surge Pricing
// ================================================================

export async function getZoneSurgePricing(
  transportServiceId: string
): Promise<TransportDynamicSurgePricing[]> {
  const { data, error } = await supabase
    .from('transport_dynamic_surge_pricing')
    .select(SURGE_COLS)
    .eq('transport_service_id', transportServiceId)
    .order('zone_polygon_name', { ascending: true });
  if (error) throw error;
  return (data as SurgeRow[]).map(mapSurge);
}

export async function getActiveSurges(
  transportServiceId: string
): Promise<TransportDynamicSurgePricing[]> {
  const { data, error } = await supabase
    .from('transport_dynamic_surge_pricing')
    .select(SURGE_COLS)
    .eq('transport_service_id', transportServiceId)
    .in('ai_surge_status', ['elevated', 'extreme_surge', 'quantum_lock'])
    .order('current_multiplier', { ascending: false });
  if (error) throw error;
  return (data as SurgeRow[]).map(mapSurge);
}

export async function getZoneSurge(
  transportServiceId: string,
  zonePolygonName: string
): Promise<TransportDynamicSurgePricing | null> {
  const { data, error } = await supabase
    .from('transport_dynamic_surge_pricing')
    .select(SURGE_COLS)
    .eq('transport_service_id', transportServiceId)
    .eq('zone_polygon_name', zonePolygonName)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSurge(data as SurgeRow) : null;
}

// ================================================================
// === Intermodal Transit Connections
// ================================================================

export async function getMyTrips(
  options: { status?: ConnectionStatus; limit?: number; cursor?: string } = {}
): Promise<IntermodalTransitConnection[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('intermodal_transit_connections')
    .select(TRANSIT_COLS)
    .eq('passenger_user_id', user.id);

  if (options.status) q = q.eq('connection_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as TransitRow[]).map(mapTransit);
}

export async function getTrip(id: string): Promise<IntermodalTransitConnection | null> {
  const { data, error } = await supabase
    .from('intermodal_transit_connections')
    .select(TRANSIT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTransit(data as TransitRow) : null;
}

export async function getTripByReference(
  masterTripReference: string
): Promise<IntermodalTransitConnection | null> {
  const { data, error } = await supabase
    .from('intermodal_transit_connections')
    .select(TRANSIT_COLS)
    .eq('master_trip_reference', masterTripReference)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTransit(data as TransitRow) : null;
}

// ================================================================
// === Part 3: Tourism & Experiences
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const GUIDE_COLS =
  'id, organization_id, guide_user_id, full_name, languages_spoken, certifications_metadata, availability_schedule, average_rating, total_reviews, verification_status, video_introduction_url, portfolio_gallery, is_active, created_at, updated_at';
// insurance_policy_details excluded — sensitive business/financial data
// emergency_contact_info excluded — guide PII (NEVER)
// gps_latitude, gps_longitude excluded — real-time personal location (privacy)

const TOUR_COLS =
  'id, organization_id, guide_id, tour_title, tour_category, country, city, duration_hours, max_participants, base_price, currency, itinerary_details, included_amenities, is_active, created_at, updated_at';
// ai_recommendation_boost excluded — internal ranking algorithm weight (NEVER)

const EVENT_COLS =
  'id, organization_id, event_title, event_category, country, city, venue_name, gps_latitude, gps_longitude, start_time, end_time, ticket_tiers, total_capacity, available_tickets, is_active, created_at, updated_at';
// ai_demand_multiplier excluded — internal demand pricing factor (NEVER)

const ATTRACTION_COLS =
  'id, attraction_name, attraction_category, country, city, address, gps_latitude, gps_longitude, operating_hours, admission_fee, currency, photos, is_active, created_at, updated_at';
// ai_popularity_score excluded — internal recommendation algorithm score (NEVER)

// ── Row types ──────────────────────────────────────────────────────────────

type GuideRow = {
  id: string; organization_id: string; guide_user_id: string; full_name: string;
  languages_spoken: string[]; certifications_metadata: Record<string, unknown>[];
  availability_schedule: Record<string, unknown>; average_rating: number; total_reviews: number;
  verification_status: string; video_introduction_url: string | null;
  portfolio_gallery: string[]; is_active: boolean; created_at: string; updated_at: string;
};

type TourRow = {
  id: string; organization_id: string; guide_id: string | null; tour_title: string;
  tour_category: string; country: string; city: string; duration_hours: number;
  max_participants: number; base_price: number; currency: string;
  itinerary_details: Record<string, unknown>[]; included_amenities: Record<string, unknown>[];
  is_active: boolean; created_at: string; updated_at: string;
};

type EventRow = {
  id: string; organization_id: string; event_title: string; event_category: string;
  country: string; city: string; venue_name: string; gps_latitude: number; gps_longitude: number;
  start_time: string; end_time: string; ticket_tiers: Record<string, unknown>[];
  total_capacity: number; available_tickets: number; is_active: boolean;
  created_at: string; updated_at: string;
};

type AttractionRow = {
  id: string; attraction_name: string; attraction_category: string; country: string;
  city: string; address: string; gps_latitude: number; gps_longitude: number;
  operating_hours: Record<string, unknown>; admission_fee: number; currency: string;
  photos: string[]; is_active: boolean; created_at: string; updated_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapGuide(r: GuideRow): TourGuide {
  return {
    id: r.id, organizationId: r.organization_id, guideUserId: r.guide_user_id,
    fullName: r.full_name, languagesSpoken: r.languages_spoken,
    certificationsMetadata: r.certifications_metadata,
    availabilitySchedule: r.availability_schedule, averageRating: r.average_rating,
    totalReviews: r.total_reviews, verificationStatus: r.verification_status as VerificationStatus,
    videoIntroductionUrl: r.video_introduction_url, portfolioGallery: r.portfolio_gallery,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTour(r: TourRow): Tour {
  return {
    id: r.id, organizationId: r.organization_id, guideId: r.guide_id,
    tourTitle: r.tour_title, tourCategory: r.tour_category as TourCategory,
    country: r.country, city: r.city, durationHours: r.duration_hours,
    maxParticipants: r.max_participants, basePrice: r.base_price, currency: r.currency,
    itineraryDetails: r.itinerary_details, includedAmenities: r.included_amenities,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapEvent(r: EventRow): TravelEvent {
  return {
    id: r.id, organizationId: r.organization_id, eventTitle: r.event_title,
    eventCategory: r.event_category as EventCategory, country: r.country, city: r.city,
    venueName: r.venue_name, gpsLatitude: r.gps_latitude, gpsLongitude: r.gps_longitude,
    startTime: r.start_time, endTime: r.end_time, ticketTiers: r.ticket_tiers,
    totalCapacity: r.total_capacity, availableTickets: r.available_tickets,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAttraction(r: AttractionRow): Attraction {
  return {
    id: r.id, attractionName: r.attraction_name,
    attractionCategory: r.attraction_category as AttractionCategory,
    country: r.country, city: r.city, address: r.address,
    gpsLatitude: r.gps_latitude, gpsLongitude: r.gps_longitude,
    operatingHours: r.operating_hours, admissionFee: r.admission_fee, currency: r.currency,
    photos: r.photos, isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// ================================================================
// === Tour Guides
// ================================================================

export async function getTourGuides(
  options: { verificationStatus?: VerificationStatus; language?: string } = {}
): Promise<TourGuide[]> {
  let q = supabase
    .from('tour_guides')
    .select(GUIDE_COLS)
    .eq('is_active', true);

  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);
  if (options.language) q = q.contains('languages_spoken', [options.language]);

  const { data, error } = await q.order('average_rating', { ascending: false });
  if (error) throw error;
  return (data as GuideRow[]).map(mapGuide);
}

export async function getTourGuide(id: string): Promise<TourGuide | null> {
  const { data, error } = await supabase
    .from('tour_guides')
    .select(GUIDE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGuide(data as GuideRow) : null;
}

export async function getOrganizationGuides(
  organizationId: string,
  activeOnly: boolean = true
): Promise<TourGuide[]> {
  let q = supabase
    .from('tour_guides')
    .select(GUIDE_COLS)
    .eq('organization_id', organizationId);

  if (activeOnly) q = q.eq('is_active', true);

  const { data, error } = await q.order('average_rating', { ascending: false });
  if (error) throw error;
  return (data as GuideRow[]).map(mapGuide);
}

// ================================================================
// === Tours
// ================================================================

export async function getTours(
  country: string,
  city: string,
  options: { category?: TourCategory; maxPrice?: number; maxDuration?: number } = {}
): Promise<Tour[]> {
  let q = supabase
    .from('tours')
    .select(TOUR_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.category) q = q.eq('tour_category', options.category);
  if (options.maxPrice !== undefined) q = q.lte('base_price', options.maxPrice);
  if (options.maxDuration !== undefined) q = q.lte('duration_hours', options.maxDuration);

  const { data, error } = await q.order('base_price', { ascending: true });
  if (error) throw error;
  return (data as TourRow[]).map(mapTour);
}

export async function getTour(id: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTour(data as TourRow) : null;
}

export async function getGuideTours(guideId: string): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select(TOUR_COLS)
    .eq('guide_id', guideId)
    .eq('is_active', true)
    .order('tour_title', { ascending: true });
  if (error) throw error;
  return (data as TourRow[]).map(mapTour);
}

export async function getToursByCategory(
  category: TourCategory,
  country: string,
  city?: string
): Promise<Tour[]> {
  let q = supabase
    .from('tours')
    .select(TOUR_COLS)
    .eq('tour_category', category)
    .eq('country', country)
    .eq('is_active', true);

  if (city) q = q.ilike('city', `%${city}%`);

  const { data, error } = await q.order('base_price', { ascending: true });
  if (error) throw error;
  return (data as TourRow[]).map(mapTour);
}

// ================================================================
// === Events
// ================================================================

export async function getEvents(
  country: string,
  city: string,
  options: { category?: EventCategory; from?: string; to?: string } = {}
): Promise<TravelEvent[]> {
  let q = supabase
    .from('events')
    .select(EVENT_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.category) q = q.eq('event_category', options.category);
  if (options.from) q = q.gte('start_time', options.from);
  if (options.to) q = q.lte('start_time', options.to);

  const { data, error } = await q.order('start_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export async function getEvent(id: string): Promise<TravelEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as EventRow) : null;
}

export async function getUpcomingEvents(
  country: string,
  city: string,
  from: string = new Date().toISOString()
): Promise<TravelEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`)
    .eq('is_active', true)
    .gte('start_time', from)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export async function getAvailableEvents(
  country: string,
  city: string
): Promise<TravelEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`)
    .eq('is_active', true)
    .gt('available_tickets', 0)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

// ================================================================
// === Attractions
// ================================================================

export async function getAttractions(
  country: string,
  city: string,
  options: { category?: AttractionCategory; freeOnly?: boolean } = {}
): Promise<Attraction[]> {
  let q = supabase
    .from('attractions')
    .select(ATTRACTION_COLS)
    .eq('country', country)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.category) q = q.eq('attraction_category', options.category);
  if (options.freeOnly) q = q.eq('admission_fee', 0);

  const { data, error } = await q.order('attraction_name', { ascending: true });
  if (error) throw error;
  return (data as AttractionRow[]).map(mapAttraction);
}

export async function getAttraction(id: string): Promise<Attraction | null> {
  const { data, error } = await supabase
    .from('attractions')
    .select(ATTRACTION_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAttraction(data as AttractionRow) : null;
}

export async function getAttractionsByCategory(
  category: AttractionCategory,
  country: string,
  city?: string
): Promise<Attraction[]> {
  let q = supabase
    .from('attractions')
    .select(ATTRACTION_COLS)
    .eq('attraction_category', category)
    .eq('country', country)
    .eq('is_active', true);

  if (city) q = q.ilike('city', `%${city}%`);

  const { data, error } = await q.order('attraction_name', { ascending: true });
  if (error) throw error;
  return (data as AttractionRow[]).map(mapAttraction);
}

// ================================================================
// === Part 4.2: Financial Expansion
// ================================================================
// autonomous_fraud_shield_ledger → ENTIRE TABLE BACKEND ONLY
//   (threat_signature_hash, risk_score_evaluated, ip_geolocation_metadata
//    all enable fraud evasion if exposed — zero frontend access)

// ── Column constants ───────────────────────────────────────────────────────

const SETTLEMENT_COLS =
  'id, transaction_reference, source_currency, target_currency, amount_sent, amount_received, fx_conversion_rate, settlement_status, ai_slippage_protection_active, created_at';

const CARD_TXN_COLS =
  'id, wallet_id, merchant_name, merchant_category_code, charged_amount, currency, card_auth_status, processed_at';

const DISPUTE_COLS =
  'id, dispute_case_number, complainant_user_id, respondent_organization_id, dispute_reason, ai_arbitration_ruling, ruling_status, resolved_at, created_at';

const NEURAL_NODE_COLS =
  'id, system_node_name, global_synergy_index, quantum_synchronization_status, last_pulse_at';
// active_protocols_json excluded — internal system configuration

// ── Row types ──────────────────────────────────────────────────────────────

type SettlementRow = {
  id: string; transaction_reference: string; source_currency: string; target_currency: string;
  amount_sent: number; amount_received: number; fx_conversion_rate: number;
  settlement_status: string; ai_slippage_protection_active: boolean; created_at: string;
};

type CardTxnRow = {
  id: string; wallet_id: string; merchant_name: string; merchant_category_code: string;
  charged_amount: number; currency: string; card_auth_status: string; processed_at: string;
};

type DisputeRow = {
  id: string; dispute_case_number: string; complainant_user_id: string;
  respondent_organization_id: string | null; dispute_reason: string;
  ai_arbitration_ruling: string | null; ruling_status: string;
  resolved_at: string | null; created_at: string;
};

type NeuralNodeRow = {
  id: string; system_node_name: string; global_synergy_index: number;
  quantum_synchronization_status: string; last_pulse_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapSettlement(r: SettlementRow): CrossBorderSettlement {
  return {
    id: r.id, transactionReference: r.transaction_reference,
    sourceCurrency: r.source_currency, targetCurrency: r.target_currency,
    amountSent: r.amount_sent, amountReceived: r.amount_received,
    fxConversionRate: r.fx_conversion_rate,
    settlementStatus: r.settlement_status as SettlementStatus,
    aiSlippageProtectionActive: r.ai_slippage_protection_active, createdAt: r.created_at,
  };
}

function mapCardTxn(r: CardTxnRow): QuantumCardTransaction {
  return {
    id: r.id, walletId: r.wallet_id, merchantName: r.merchant_name,
    merchantCategoryCode: r.merchant_category_code, chargedAmount: r.charged_amount,
    currency: r.currency, cardAuthStatus: r.card_auth_status as CardAuthStatus,
    processedAt: r.processed_at,
  };
}

function mapDispute(r: DisputeRow): DisputeArbitration {
  return {
    id: r.id, disputeCaseNumber: r.dispute_case_number,
    complainantUserId: r.complainant_user_id,
    respondentOrganizationId: r.respondent_organization_id,
    disputeReason: r.dispute_reason, aiArbitrationRuling: r.ai_arbitration_ruling,
    rulingStatus: r.ruling_status as RulingStatus,
    resolvedAt: r.resolved_at, createdAt: r.created_at,
  };
}

function mapNeuralNode(r: NeuralNodeRow): SovereignNeuralNode {
  return {
    id: r.id, systemNodeName: r.system_node_name,
    globalSynergyIndex: r.global_synergy_index,
    quantumSynchronizationStatus: r.quantum_synchronization_status as SynchronizationStatus,
    lastPulseAt: r.last_pulse_at,
  };
}

// ================================================================
// === Cross-Border Settlements (READ ONLY — creation is backend-only
// atomic operation; settled rate is user's own transaction data)
// ================================================================

export async function getMySettlements(
  options: { status?: SettlementStatus; limit?: number; cursor?: string } = {}
): Promise<CrossBorderSettlement[]> {
  // RLS restricts to own records
  let q = supabase
    .from('quantum_liquidity_cross_border_settlement')
    .select(SETTLEMENT_COLS);

  if (options.status) q = q.eq('settlement_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as SettlementRow[]).map(mapSettlement);
}

export async function getSettlement(id: string): Promise<CrossBorderSettlement | null> {
  const { data, error } = await supabase
    .from('quantum_liquidity_cross_border_settlement')
    .select(SETTLEMENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettlement(data as SettlementRow) : null;
}

export async function getSettlementByReference(
  transactionReference: string
): Promise<CrossBorderSettlement | null> {
  const { data, error } = await supabase
    .from('quantum_liquidity_cross_border_settlement')
    .select(SETTLEMENT_COLS)
    .eq('transaction_reference', transactionReference)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettlement(data as SettlementRow) : null;
}

// ================================================================
// === Quantum Debit Card Transactions (READ ONLY — card processing
// is a backend atomic operation)
// ================================================================

export async function getWalletCardTransactions(
  walletId: string,
  options: { status?: CardAuthStatus; limit?: number; cursor?: string } = {}
): Promise<QuantumCardTransaction[]> {
  let q = supabase
    .from('quantum_debit_card_transactions')
    .select(CARD_TXN_COLS)
    .eq('wallet_id', walletId);

  if (options.status) q = q.eq('card_auth_status', options.status);
  if (options.cursor) q = q.lt('processed_at', options.cursor);

  const { data, error } = await q
    .order('processed_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CardTxnRow[]).map(mapCardTxn);
}

export async function getCardTransaction(id: string): Promise<QuantumCardTransaction | null> {
  const { data, error } = await supabase
    .from('quantum_debit_card_transactions')
    .select(CARD_TXN_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCardTxn(data as CardTxnRow) : null;
}

// ================================================================
// === Dispute Arbitration (READ ONLY — submission goes through
// backend for legal audit trail and proper validation)
// ================================================================

export async function getMyDisputes(
  options: { status?: RulingStatus; limit?: number; cursor?: string } = {}
): Promise<DisputeArbitration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('decentralized_dispute_arbitration_tribunal')
    .select(DISPUTE_COLS)
    .eq('complainant_user_id', user.id);

  if (options.status) q = q.eq('ruling_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as DisputeRow[]).map(mapDispute);
}

export async function getDispute(id: string): Promise<DisputeArbitration | null> {
  const { data, error } = await supabase
    .from('decentralized_dispute_arbitration_tribunal')
    .select(DISPUTE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDispute(data as DisputeRow) : null;
}

export async function getDisputeByCaseNumber(
  caseNumber: string
): Promise<DisputeArbitration | null> {
  const { data, error } = await supabase
    .from('decentralized_dispute_arbitration_tribunal')
    .select(DISPUTE_COLS)
    .eq('dispute_case_number', caseNumber)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDispute(data as DisputeRow) : null;
}

export async function getOrganizationDisputes(
  organizationId: string,
  options: { status?: RulingStatus } = {}
): Promise<DisputeArbitration[]> {
  let q = supabase
    .from('decentralized_dispute_arbitration_tribunal')
    .select(DISPUTE_COLS)
    .eq('respondent_organization_id', organizationId);

  if (options.status) q = q.eq('ruling_status', options.status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DisputeRow[]).map(mapDispute);
}

// ================================================================
// === Sovereign Neural Nodes (READ ONLY — system health dashboard)
// ================================================================

export async function getNeuralNodes(): Promise<SovereignNeuralNode[]> {
  const { data, error } = await supabase
    .from('global_sovereign_neural_singularity_matrix')
    .select(NEURAL_NODE_COLS)
    .order('system_node_name', { ascending: true });
  if (error) throw error;
  return (data as NeuralNodeRow[]).map(mapNeuralNode);
}

export async function getNeuralNode(id: string): Promise<SovereignNeuralNode | null> {
  const { data, error } = await supabase
    .from('global_sovereign_neural_singularity_matrix')
    .select(NEURAL_NODE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapNeuralNode(data as NeuralNodeRow) : null;
}

export async function getSynchronizedNodes(): Promise<SovereignNeuralNode[]> {
  const { data, error } = await supabase
    .from('global_sovereign_neural_singularity_matrix')
    .select(NEURAL_NODE_COLS)
    .eq('quantum_synchronization_status', 'fully_synchronized')
    .order('last_pulse_at', { ascending: false });
  if (error) throw error;
  return (data as NeuralNodeRow[]).map(mapNeuralNode);
}

// ================================================================
// === Part 4: Payments, Escrow & Singularity
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const ESCROW_COLS =
  'id, booking_reference, payer_user_id, payee_organization_id, total_amount, currency, escrow_status, created_at, updated_at';
// smart_release_conditions excluded — internal smart contract configuration

const INSURANCE_COLS =
  'id, policy_number, insured_user_id, master_trip_reference, coverage_tier, medical_coverage_limit, flight_delay_automatic_payout, baggage_loss_insured, policy_cost, currency, claim_status, created_at, updated_at';

const WALLET_COLS =
  'id, user_id, fiat_currency_balances, crypto_stablecoin_balances, virtual_debit_card_enabled, card_spending_limit_daily, wallet_status, created_at, updated_at';

const CONCIERGE_COLS =
  'id, user_id, session_token, conversation_history, is_active_session, created_at, updated_at';
// ai_confidence_score excluded — internal AI metric
// active_intent_detected excluded — internal AI intent classification

const ANALYTICS_COLS =
  'id, metric_category, aggregation_interval, metrics_payload, recorded_at';
// neural_trend_prediction excluded — internal ML model prediction

// ── Row types ──────────────────────────────────────────────────────────────

type EscrowRow = {
  id: string; booking_reference: string; payer_user_id: string;
  payee_organization_id: string | null; total_amount: number; currency: string;
  escrow_status: string; created_at: string; updated_at: string;
};

type InsuranceRow = {
  id: string; policy_number: string; insured_user_id: string; master_trip_reference: string;
  coverage_tier: string; medical_coverage_limit: number; flight_delay_automatic_payout: boolean;
  baggage_loss_insured: boolean; policy_cost: number; currency: string;
  claim_status: string; created_at: string; updated_at: string;
};

type WalletRow = {
  id: string; user_id: string; fiat_currency_balances: Record<string, number>;
  crypto_stablecoin_balances: Record<string, number>; virtual_debit_card_enabled: boolean;
  card_spending_limit_daily: number; wallet_status: string; created_at: string; updated_at: string;
};

type ConciergeRow = {
  id: string; user_id: string; session_token: string;
  conversation_history: Record<string, unknown>[]; is_active_session: boolean;
  created_at: string; updated_at: string;
};

type AnalyticsRow = {
  id: string; metric_category: string; aggregation_interval: string;
  metrics_payload: Record<string, unknown>; recorded_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapEscrow(r: EscrowRow): TravelEscrowHub {
  return {
    id: r.id, bookingReference: r.booking_reference, payerUserId: r.payer_user_id,
    payeeOrganizationId: r.payee_organization_id, totalAmount: r.total_amount,
    currency: r.currency, escrowStatus: r.escrow_status as EscrowStatus,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapInsurance(r: InsuranceRow): TravelInsurancePolicy {
  return {
    id: r.id, policyNumber: r.policy_number, insuredUserId: r.insured_user_id,
    masterTripReference: r.master_trip_reference, coverageTier: r.coverage_tier as CoverageTier,
    medicalCoverageLimit: r.medical_coverage_limit,
    flightDelayAutomaticPayout: r.flight_delay_automatic_payout,
    baggageLossInsured: r.baggage_loss_insured, policyCost: r.policy_cost,
    currency: r.currency, claimStatus: r.claim_status as ClaimStatus,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapWallet(r: WalletRow): TravelWallet {
  return {
    id: r.id, userId: r.user_id, fiatCurrencyBalances: r.fiat_currency_balances,
    cryptoStablecoinBalances: r.crypto_stablecoin_balances,
    virtualDebitCardEnabled: r.virtual_debit_card_enabled,
    cardSpendingLimitDaily: r.card_spending_limit_daily,
    walletStatus: r.wallet_status as WalletStatus,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapConcierge(r: ConciergeRow): TravelConciergeChat {
  return {
    id: r.id, userId: r.user_id, sessionToken: r.session_token,
    conversationHistory: r.conversation_history, isActiveSession: r.is_active_session,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAnalytics(r: AnalyticsRow): TravelAnalyticsSingularity {
  return {
    id: r.id, metricCategory: r.metric_category, aggregationInterval: r.aggregation_interval,
    metricsPayload: r.metrics_payload, recordedAt: r.recorded_at,
  };
}

// ================================================================
// === Travel Escrow Hubs (READ ONLY — all writes are backend-only
// ACID operations; lock/release/refund must be server-side)
// ================================================================

export async function getMyEscrows(
  options: { status?: EscrowStatus; limit?: number; cursor?: string } = {}
): Promise<TravelEscrowHub[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('travel_escrow_hubs')
    .select(ESCROW_COLS)
    .eq('payer_user_id', user.id);

  if (options.status) q = q.eq('escrow_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as EscrowRow[]).map(mapEscrow);
}

export async function getEscrow(id: string): Promise<TravelEscrowHub | null> {
  const { data, error } = await supabase
    .from('travel_escrow_hubs')
    .select(ESCROW_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEscrow(data as EscrowRow) : null;
}

export async function getEscrowByBooking(
  bookingReference: string
): Promise<TravelEscrowHub | null> {
  const { data, error } = await supabase
    .from('travel_escrow_hubs')
    .select(ESCROW_COLS)
    .eq('booking_reference', bookingReference)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEscrow(data as EscrowRow) : null;
}

export async function getOrganizationEscrows(
  organizationId: string,
  options: { status?: EscrowStatus } = {}
): Promise<TravelEscrowHub[]> {
  let q = supabase
    .from('travel_escrow_hubs')
    .select(ESCROW_COLS)
    .eq('payee_organization_id', organizationId);

  if (options.status) q = q.eq('escrow_status', options.status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowRow[]).map(mapEscrow);
}

// ================================================================
// === Global Travel Insurance (READ ONLY — policy purchase goes
// through backend as a financial transaction)
// ================================================================

export async function getMyPolicies(
  options: { claimStatus?: ClaimStatus; coverageTier?: CoverageTier } = {}
): Promise<TravelInsurancePolicy[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('global_travel_insurance')
    .select(INSURANCE_COLS)
    .eq('insured_user_id', user.id);

  if (options.claimStatus) q = q.eq('claim_status', options.claimStatus);
  if (options.coverageTier) q = q.eq('coverage_tier', options.coverageTier);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as InsuranceRow[]).map(mapInsurance);
}

export async function getPolicy(id: string): Promise<TravelInsurancePolicy | null> {
  const { data, error } = await supabase
    .from('global_travel_insurance')
    .select(INSURANCE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInsurance(data as InsuranceRow) : null;
}

export async function getPolicyByNumber(policyNumber: string): Promise<TravelInsurancePolicy | null> {
  const { data, error } = await supabase
    .from('global_travel_insurance')
    .select(INSURANCE_COLS)
    .eq('policy_number', policyNumber)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInsurance(data as InsuranceRow) : null;
}

export async function getTripInsurance(
  masterTripReference: string
): Promise<TravelInsurancePolicy[]> {
  const { data, error } = await supabase
    .from('global_travel_insurance')
    .select(INSURANCE_COLS)
    .eq('master_trip_reference', masterTripReference)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as InsuranceRow[]).map(mapInsurance);
}

// ================================================================
// === Travel Multi-Currency Wallets (READ ONLY — all writes go
// through backend; deposit/withdrawal/transfer are ACID operations)
// ================================================================

export async function getMyWallet(): Promise<TravelWallet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('travel_multi_currency_wallets')
    .select(WALLET_COLS)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data as WalletRow) : null;
}

export async function getWallet(id: string): Promise<TravelWallet | null> {
  const { data, error } = await supabase
    .from('travel_multi_currency_wallets')
    .select(WALLET_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data as WalletRow) : null;
}

// ================================================================
// === AI Travel Concierge Chats (session creation goes through
// backend; frontend reads history and active session state)
// ================================================================

export async function getMyActiveSessions(): Promise<TravelConciergeChat[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ai_travel_concierge_chats')
    .select(CONCIERGE_COLS)
    .eq('user_id', user.id)
    .eq('is_active_session', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as ConciergeRow[]).map(mapConcierge);
}

export async function getChatSession(id: string): Promise<TravelConciergeChat | null> {
  const { data, error } = await supabase
    .from('ai_travel_concierge_chats')
    .select(CONCIERGE_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConcierge(data as ConciergeRow) : null;
}

export async function getSessionByToken(
  sessionToken: string
): Promise<TravelConciergeChat | null> {
  const { data, error } = await supabase
    .from('ai_travel_concierge_chats')
    .select(CONCIERGE_COLS)
    .eq('session_token', sessionToken)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConcierge(data as ConciergeRow) : null;
}

// ================================================================
// === Global Travel Analytics Singularity (READ ONLY — internal
// aggregate BI; admin dashboard only, RLS enforced)
// ================================================================

export async function getAnalytics(
  options: { metricCategory?: string; from?: string; limit?: number } = {}
): Promise<TravelAnalyticsSingularity[]> {
  let q = supabase
    .from('global_travel_analytics_singularity')
    .select(ANALYTICS_COLS);

  if (options.metricCategory) q = q.eq('metric_category', options.metricCategory);
  if (options.from) q = q.gte('recorded_at', options.from);

  const { data, error } = await q
    .order('recorded_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AnalyticsRow[]).map(mapAnalytics);
}

export async function getLatestMetric(
  metricCategory: string
): Promise<TravelAnalyticsSingularity | null> {
  const { data, error } = await supabase
    .from('global_travel_analytics_singularity')
    .select(ANALYTICS_COLS)
    .eq('metric_category', metricCategory)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAnalytics(data as AnalyticsRow) : null;
}
