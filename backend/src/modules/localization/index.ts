/**
 * Global Localization & Country Intelligence Platform (FAZ 21)
 * Owns: CountryContext, Smart Detection, Country Config, Feature Flags per country,
 *       Dynamic App Identity, Cross-Border Experience, Country Analytics
 *
 * Tables: loc_countries, loc_country_features, loc_user_context, loc_cross_border_events
 * Migration: 034_localization_platform.sql (run manually in Supabase SQL Editor)
 *
 * Middleware: localizationMiddleware — attaches req.locCtx to all requests
 *   (wired in app.ts after securityMiddleware, before domain modules)
 *
 * Public routes (no auth):
 *   GET  /api/localization/countries          — all active countries + features
 *   GET  /api/localization/countries/:code    — single country config
 *   GET  /api/localization/countries/:code/format — format examples
 *   POST /api/localization/detect             — detect country from request signals
 *
 * Authenticated routes:
 *   GET  /api/localization/context            — current user's country context
 *   POST /api/localization/context/confirm    — confirm country (user-selected)
 *   PATCH /api/localization/context           — update language/city preferences
 *   POST /api/localization/cross-border/confirm — confirm cross-border transition
 *   POST /api/localization/cross-border/dismiss — dismiss cross-border prompt
 *
 * Admin routes:
 *   PATCH /api/localization/countries/:code/features — toggle per-country features
 *   GET   /api/localization/analytics                — platform stats by country
 *   GET   /api/localization/analytics/:code/trend    — 30-day trend for one country
 *
 * Cross-module integration:
 *   - req.locCtx available in every route handler
 *   - FeatureFlagService respects country from locCtx (via /api/flags?country=)
 *   - RealtimeGateway pushes 'rt:localization:cross_border' events
 */
import type { Express } from 'express';
import { localizationRouter }    from './routes/localization.routes.js';
import { localizationMiddleware } from './middleware/localizationMiddleware.js';

export function registerLocalizationModule(app: Express): void {
  app.use('/api/localization', localizationRouter);
}

// Middleware exported separately — wired in app.ts
export { localizationMiddleware }   from './middleware/localizationMiddleware.js';
export { CountryConfigService }     from './services/CountryConfigService.js';
export { CountryContextEngine }     from './services/CountryContextEngine.js';
export { CountryDetectionService }  from './services/CountryDetectionService.js';
export { LocalizationService }      from './services/LocalizationService.js';
export { CrossBorderService }       from './services/CrossBorderService.js';
export { CountryAnalyticsService }  from './services/CountryAnalyticsService.js';