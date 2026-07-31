import { TravelRepository } from '../repositories/TravelRepository.js';
import type { TaxiDriver, TaxiRide } from '../types/travel.types.js';

const BASE_FARE  = 500;   // HTG minor units per km
const FLAG_FALL  = 2000;  // HTG flat start fee

function estimateFare(distanceKm: number): number {
  return FLAG_FALL + Math.round(distanceKm * BASE_FARE);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dG = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const TaxiService = {
  async registerDriver(userId: string, input: {
    name: string; phone: string; vehicle: string; plate: string;
    city: string; country?: string; currency?: string;
  }): Promise<TaxiDriver> {
    return TravelRepository.registerDriver({
      user_id:  userId,
      name:     input.name,
      phone:    input.phone,
      vehicle:  input.vehicle,
      plate:    input.plate,
      city:     input.city,
      country:  input.country  ?? 'HT',
      currency: input.currency ?? 'HTG',
    });
  },

  async updateLocation(driverId: string, lat: number, lng: number, status?: TaxiDriver['status']): Promise<void> {
    await TravelRepository.updateDriverStatus(driverId, status ?? 'available', lat, lng);
  },

  async setDriverStatus(driverId: string, status: TaxiDriver['status']): Promise<void> {
    await TravelRepository.updateDriverStatus(driverId, status);
  },

  async requestRide(passengerId: string, input: {
    origin: string; destination: string;
    originLat: number; originLng: number; destLat: number; destLng: number;
    currency?: string;
  }): Promise<TaxiRide> {
    const distanceKm  = haversineKm(input.originLat, input.originLng, input.destLat, input.destLng);
    const fareEstimate = estimateFare(distanceKm);

    const ride = await TravelRepository.createRide({
      passenger_id:  passengerId,
      origin:        input.origin,
      destination:   input.destination,
      origin_lat:    input.originLat,
      origin_lng:    input.originLng,
      dest_lat:      input.destLat,
      dest_lng:      input.destLng,
      fare_estimate: fareEstimate,
      currency:      input.currency ?? 'HTG',
      distance_km:   Math.round(distanceKm * 10) / 10,
      status:        'searching',
    });

    // Auto-assign nearest available driver in same city (sandbox)
    void TaxiService.assignNearestDriver(ride.id, input.originLat, input.originLng, input.currency ?? 'HTG');
    return ride;
  },

  async assignNearestDriver(rideId: string, lat: number, lng: number, _currency: string): Promise<void> {
    const ride = await TravelRepository.getRide(rideId);
    if (!ride || ride.status !== 'searching') return;
    const drivers = await TravelRepository.findAvailableDrivers('Port-au-Prince');
    if (drivers.length === 0) return;
    const nearest = drivers
      .filter(d => d.lat != null && d.lng != null)
      .sort((a, b) => haversineKm(lat, lng, a.lat!, a.lng!) - haversineKm(lat, lng, b.lat!, b.lng!));
    const driver = nearest[0] ?? drivers[0];
    if (!driver) return;
    await TravelRepository.updateRide(rideId, { driver_id: driver.id, status: 'accepted' });
    await TravelRepository.updateDriverStatus(driver.id, 'busy');
  },

  async startRide(rideId: string): Promise<void> {
    await TravelRepository.updateRide(rideId, { status: 'on_trip', started_at: new Date().toISOString() });
  },

  async completeRide(rideId: string): Promise<TaxiRide> {
    const ride = await TravelRepository.getRide(rideId);
    if (!ride) throw new Error('RIDE_NOT_FOUND');
    await TravelRepository.updateRide(rideId, {
      status:       'completed',
      completed_at: new Date().toISOString(),
      fare_actual:  ride.fareEstimate,
    });
    if (ride.driverId) {
      const driver = await TravelRepository.getDriver(ride.driverId);
      if (driver) await TravelRepository.updateDriverStatus(ride.driverId, 'available');
    }
    return (await TravelRepository.getRide(rideId))!;
  },

  async cancelRide(rideId: string): Promise<void> {
    const ride = await TravelRepository.getRide(rideId);
    if (!ride) return;
    await TravelRepository.updateRide(rideId, { status: 'cancelled' });
    if (ride.driverId) await TravelRepository.updateDriverStatus(ride.driverId, 'available');
  },

  async rateRide(rideId: string, raterRole: 'passenger' | 'driver', rating: number): Promise<void> {
    const col = raterRole === 'passenger' ? 'driver_rating' : 'passenger_rating';
    await TravelRepository.updateRide(rideId, { [col]: rating });
  },

  async listRides(userId: string, role: 'passenger' | 'driver'): Promise<TaxiRide[]> {
    return TravelRepository.listRides(userId, role);
  },

  estimateFare,
};