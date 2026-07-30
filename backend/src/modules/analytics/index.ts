/**
 * Analytics Module
 * Owns: event log, user behavior, revenue metrics, platform KPIs
 * Write path: batched inserts (high volume, low latency needed)
 * Read path: aggregated via Supabase views or materialized tables
 * Listens to: all domain events via wildcard subscription
 * Emits: nothing
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware.js';
import { TypedEventBus } from '../../core/events/TypedEventBus.js';
import { generateId } from '@shared-utils';

const _eventQueue: Array<{ id: string; event_name: string; payload: unknown; occurred_at: string }> = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents(): Promise<void> {
  if (!_eventQueue.length) return;
  const batch = _eventQueue.splice(0, _eventQueue.length);
  try {
    await db.client().from('analytics_events').insert(batch);
  } catch { /* non-fatal — analytics loss acceptable */ }
}

function enqueueEvent(eventName: string, payload: unknown): void {
  _eventQueue.push({ id: generateId(), event_name: eventName, payload, occurred_at: new Date().toISOString() });
  if (_eventQueue.length >= 50) {
    if (_flushTimer) { clearTimeout(_flushTimer); _flushTimer = null; }
    void flushEvents();
    return;
  }
  if (!_flushTimer) {
    _flushTimer = setTimeout(() => { _flushTimer = null; void flushEvents(); }, 10_000);
  }
}

export function registerAnalyticsModule(app: Express): void {
  const router = Router();

  // Track client-side events
  router.post('/events',  async (req, res) => {
    const events = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    for (const ev of events) enqueueEvent(ev.type ?? 'client_event', ev);
    res.status(202).end();
  });

  // Dashboard metrics (admin only)
  router.get('/dashboard', requireAuth, requireRole('admin', 'superadmin'), async (_req, res, next) => {
    try {
      const [users, jobs, revenue] = await Promise.all([
        db.client().from('profiles').select('id', { count: 'exact', head: true }),
        db.client().from('jobs').select('id', { count: 'exact', head: true }),
        db.client().from('payment_intents').select('amount').eq('status', 'completed'),
      ]);
      const totalRevenue = (revenue.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);
      res.json({ success: true, data: { users: users.count, jobs: jobs.count, revenue: totalRevenue } });
    } catch (err) { next(err); }
  });

  router.get('/media/stats/:id', requireAuth, async (req, res, next) => {
    try {
      const { data } = await db.client().from('analytics_events')
        .select('event_name, count:id')
        .eq('payload->>mediaId', req.params['id']);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  // Batch media analytics events from frontend
  router.post('/batch', async (req, res) => {
    const { events } = req.body as { events?: unknown[] };
    if (Array.isArray(events)) events.forEach(e => enqueueEvent('media_event', e));
    res.status(202).end();
  });

  app.use('/api/analytics', router);

  // Listen to all domain events and pipe them into the analytics log
  TypedEventBus.subscribeAll(envelope => {
    enqueueEvent(envelope.eventName, envelope.payload);
  });
}
