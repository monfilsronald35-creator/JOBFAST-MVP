/**
 * Maps & Location Intelligence Module (Backend)
 * Owns: Geocoding (DB-cached), Reverse geocoding, Route/ETA, Live tracking,
 *       Nearby workers, Service area management
 * Tables: maps_geocache, maps_service_areas, maps_tracking
 * Prefix: maps_
 * Migration: 028_maps_platform.sql (run manually in Supabase SQL Editor)
 */
import type { Express } from 'express';
import { mapsRouter } from './routes/maps.routes.js';

export function registerMapsModule(app: Express): void {
  app.use('/api/maps', mapsRouter);
}