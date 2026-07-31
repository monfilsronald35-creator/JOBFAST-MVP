/**
 * Healthcare Module (Backend)
 * Owns: Facilities (13 types), Patient Management, Doctor Management,
 *       Appointment Engine, Electronic Medical Records, Prescription Engine,
 *       Laboratory Service, Pharmacy Service, Insurance Engine,
 *       Emergency Service (GPS dispatch), Telemedicine (video/voice/chat),
 *       AI Healthcare (triage, reminders, schedule optimization),
 *       Healthcare Analytics & Dashboard
 * Tables: hc_facilities, hc_patients, hc_doctors, hc_doctor_schedules,
 *         hc_appointments, hc_medical_records, hc_prescriptions,
 *         hc_lab_orders, hc_pharmacy_orders, hc_insurance_policies,
 *         hc_insurance_claims, hc_emergencies, hc_tele_sessions
 * Prefix: hc_
 * Migration: 022_healthcare_platform.sql (run manually in Supabase SQL Editor)
 * Disclaimer: All AI outputs include NO_DIAGNOSIS_DISCLAIMER
 */
import type { Express } from 'express';
import { healthcareRouter } from './routes/healthcare.routes.js';

export function registerHealthModule(app: Express): void {
  app.use('/api/health', healthcareRouter);
}