/**
 * Global Monetization & Revenue Platform (FAZ 22)
 * Owns: Revenue Engine, Fee Rules, Free Tier, Billing, Founder Dashboard,
 *       Monetization Announcements, AI Revenue Intelligence
 *
 * Tables: mon_config, mon_service_config, mon_fee_rules, mon_free_tier_strategies,
 *         mon_revenue_events, mon_invoices, mon_announcements, mon_user_modal_seen
 * Migration: 035_monetization_platform.sql (run manually in Supabase SQL Editor)
 *
 * Monetization starts OFF — admin activates when ready (Roadmap Etap 3).
 *
 * Public routes (no auth):
 *   GET /api/monetization/fees?service=marketplace&amount=1000&currency=HTG&country=HT
 *
 * Authenticated routes:
 *   GET  /api/monetization/status          — globalEnabled + per-service map
 *   GET  /api/monetization/my-invoices     — user's invoices (cursor paginated)
 *   GET  /api/monetization/my-invoices/:id
 *   POST /api/monetization/modal-seen      — mark welcome modal seen
 *   GET  /api/monetization/modal-status
 *   GET  /api/monetization/free-tier-check?service=marketplace
 *
 * Admin routes:
 *   GET    /api/monetization/config
 *   PATCH  /api/monetization/config/global                — { enabled: true/false }
 *   PATCH  /api/monetization/config/services/:service     — { enabled: true/false }
 *   GET    /api/monetization/rules
 *   POST   /api/monetization/rules                        — upsert fee rule
 *   DELETE /api/monetization/rules/:id
 *   GET    /api/monetization/free-tiers
 *   POST   /api/monetization/free-tiers                   — upsert strategy
 *   DELETE /api/monetization/free-tiers/:id
 *   GET    /api/monetization/dashboard                    — founder revenue dashboard
 *   GET    /api/monetization/ai-insights
 *   POST   /api/monetization/announce                     — push monetization announcement
 *   GET    /api/monetization/announcements
 *   GET    /api/monetization/reports/commissions?from=&to=&service=
 *
 * Cross-module integration:
 *   - Other services call RevenueEngine.calculateFee() before charging users
 *   - Other services call RevenueEngine.recordEvent() after collecting payment
 *   - TypedEventBus fires 'monetization.announcement' → NotificationPlatform picks up
 */
import type { Express } from 'express';
import { monetizationRouter } from './routes/monetization.routes.js';

export function registerMonetizationModule(app: Express): void {
  app.use('/api/monetization', monetizationRouter);
}

export { MonetizationConfigService }       from './services/MonetizationConfigService.js';
export { RevenueEngine }                   from './services/RevenueEngine.js';
export { FreeTierEngine }                  from './services/FreeTierEngine.js';
export { BillingEngine }                   from './services/BillingEngine.js';
export { RevenueAnalyticsService }         from './services/RevenueAnalyticsService.js';
export { MonetizationAnnouncementService } from './services/MonetizationAnnouncementService.js';
export type {
  MonetizationService, FeeCalculation, FeeRule, FreeTierStrategy,
  Invoice, RevenueDashboard, RevenueInsight, MonetizationAnnouncement,
} from './types/monetization.types.js';