/**
 * Travel Module (Backend)
 * Owns: Hotel, Flight, Bus, Taxi (GPS), Tour Guide, Vacation Rental (Airbnb-style),
 *       Events, Travel Insurance, Reservation Engine (QR Code), AI Concierge,
 *       Travel Maps (GPS POI), Travel Analytics
 * Tables: trv_hotels, trv_hotel_rooms, trv_flights, trv_bus_companies, trv_bus_routes,
 *         trv_taxi_drivers, trv_taxi_rides, trv_tour_guides, trv_rentals, trv_events,
 *         trv_insurance, trv_bookings, trv_reviews
 * Prefix: trv_
 * Migration: 021_travel_platform.sql (run manually in Supabase SQL Editor)
 */
import type { Express } from 'express';
import { travelRouter } from './routes/travel.routes.js';

export function registerTravelModule(app: Express): void {
  app.use('/api/travel', travelRouter);
}