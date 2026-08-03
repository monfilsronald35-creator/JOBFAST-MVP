/**
 * Analytics & Intelligence Module (Backend)
 * Owns: Event Ingestion (batched), Platform KPIs, Realtime Metrics,
 *       User Behavior, Funnel Analysis, Cohort Retention, Report Builder
 * Tables: anlt_events (partitioned), anlt_sessions, anlt_funnels, anlt_reports
 * Prefix: anlt_
 * Migration: 027_analytics_platform.sql (run manually in Supabase SQL Editor)
 * Listens to: all domain events via TypedEventBus.subscribeAll()
 * Write path: batched flush (50 events or 10s), loss-tolerant
 */
import type { Express } from 'express';
import { analyticsRouter }  from './routes/analytics.routes.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { TypedEventBus }    from '../../core/events/TypedEventBus.js';

export function registerAnalyticsModule(app: Express): void {
  app.use('/api/analytics', analyticsRouter);

  // Pipe ALL domain events into analytics store
  TypedEventBus.subscribeAll(envelope => {
    AnalyticsService.track({
      eventName:  envelope.eventName,
      properties: envelope.payload as Record<string, unknown>,
    });
  });
}