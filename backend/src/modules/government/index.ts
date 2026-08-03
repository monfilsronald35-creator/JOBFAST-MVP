/**
 * Government Digital Services Platform Module (Backend)
 * Owns: Identity Verification, Permits, Licenses, Tax Service, Certificates,
 *       Appointment Engine, AI Government Assistant, Agency Analytics
 * Tables: gov_agencies, gov_identity_verifications, gov_permits, gov_permit_documents,
 *         gov_licenses, gov_tax_records, gov_certificates, gov_appointments
 * Prefix: gov_
 * Migration: 030_government_platform.sql (run manually in Supabase SQL Editor)
 * Adapts to national rules per country; seeded for Haiti (HTG currency, ONI identity)
 */
import type { Express } from 'express';
import { governmentRouter } from './routes/government.routes.js';

export function registerGovernmentModule(app: Express): void {
  app.use('/api/government', governmentRouter);
}