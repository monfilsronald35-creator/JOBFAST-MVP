/**
 * DashboardChannel — live KPIs, sales, revenue, visitors, analytics, alerts.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type { KPIPayload, LiveAnalyticsPayload, LiveAlertPayload } from '../types';

export class DashboardChannel extends BaseChannel {
  #subscribed = false;

  constructor(engine: RealtimeEngine) {
    super(engine, 'dashboard');
  }

  // ── Subscribe ───────────────────────────────────────────────────────────────

  subscribe(scope?: 'global' | 'admin' | string): void {
    if (this.#subscribed) return;
    this.#subscribed = true;
    this.engine.emit('dashboard:subscribe', { scope: scope ?? 'global' }, 'normal');
    this.joinRoom(`dashboard:${scope ?? 'global'}`);
  }

  unsubscribe(scope?: string): void {
    this.#subscribed = false;
    this.engine.emit('dashboard:unsubscribe', { scope: scope ?? 'global' }, 'normal');
    this.leaveRoom(`dashboard:${scope ?? 'global'}`);
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────

  onKPIUpdate(handler: (kpi: KPIPayload) => void): () => void {
    return this.onGlobal('dashboard:kpi:update', handler);
  }

  onKPIBatch(handler: (kpis: KPIPayload[]) => void): () => void {
    return this.onGlobal('dashboard:kpi:batch', handler);
  }

  // ── Analytics ───────────────────────────────────────────────────────────────

  onAnalyticsUpdate(handler: (data: LiveAnalyticsPayload) => void): () => void {
    return this.onGlobal('dashboard:analytics:update', handler);
  }

  onVisitorCountUpdate(handler: (data: { count: number; delta: number }) => void): () => void {
    return this.onGlobal('dashboard:visitors:update', handler);
  }

  onRevenueUpdate(handler: (data: { totalMinorUnits: number; currency: string; periodMinorUnits: number }) => void): () => void {
    return this.onGlobal('dashboard:revenue:update', handler);
  }

  onSalesUpdate(handler: (data: { count: number; totalMinorUnits: number; currency: string }) => void): () => void {
    return this.onGlobal('dashboard:sales:update', handler);
  }

  // ── Alerts ──────────────────────────────────────────────────────────────────

  onAlert(handler: (alert: LiveAlertPayload) => void): () => void {
    return this.onGlobal('dashboard:alert:new', handler);
  }

  onCriticalAlert(handler: (alert: LiveAlertPayload) => void): () => void {
    return this.onGlobal<LiveAlertPayload>('dashboard:alert:new', a => {
      if (a.severity === 'critical' || a.severity === 'error') handler(a);
    });
  }

  acknowledgeAlert(alertId: string, userId: string): void {
    this.engine.emit('dashboard:alert:ack', { alertId, userId }, 'normal');
  }

  onAlertAcknowledged(handler: (data: { alertId: string; userId: string }) => void): () => void {
    return this.onGlobal('dashboard:alert:acked', handler);
  }

  // ── Request snapshots ────────────────────────────────────────────────────────

  requestSnapshot(): void {
    this.engine.emit('dashboard:snapshot:request', {}, 'normal');
  }

  onSnapshot(handler: (data: { kpis: KPIPayload[]; analytics: LiveAnalyticsPayload; alerts: LiveAlertPayload[] }) => void): () => void {
    return this.onGlobal('dashboard:snapshot', handler);
  }

  protected override onDestroy(): void {
    if (this.#subscribed) this.unsubscribe();
  }
}