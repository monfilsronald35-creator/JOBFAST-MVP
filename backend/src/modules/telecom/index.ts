/**
 * Telecom Module (Backend)
 * Owns: Operator Registry, Recharge Engine (8 types), Bundle Engine (13 types),
 *       SIM Management (physical/eSIM + KYC), Bill Payment, Dealer Management,
 *       Commission Engine, API Connector (circuit breaker + retry queue),
 *       Fraud Protection, Analytics, AI Insights
 * Tables: tel_operators, tel_operator_configs, tel_bundles, tel_recharges, tel_sims,
 *         tel_bills, tel_dealers, tel_commissions, tel_commission_rules,
 *         tel_fraud_events, tel_retry_queue
 * Prefix: tel_
 * Migration: 020_telecom_service.sql (run manually in Supabase SQL Editor)
 * Supports: Digicel, Claro, Altice, Orange, Vodafone, MTN, Safaricom + any operator
 */
import type { Express } from 'express';
import { telecomRouter } from './routes/telecom.routes.js';

export function registerTelecomModule(app: Express): void {
  app.use('/api/telecom', telecomRouter);
}