/**
 * Analytics Client — Enterprise event pipeline.
 * Batches events in memory (up to 50 or 5 s), sends to backend.
 * Supports: custom dimensions, performance metrics, funnel tracking,
 * heatmap data, A/B test exposure, revenue events.
 *
 * Never throws — analytics must never break user flows.
 */
import API from '../api/axios';
import type { AnalyticsEvent, AnalyticsEventName } from '../types';

// ─── Batch buffer ─────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5_000;

let _buffer: AnalyticsEvent[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  _sessionId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return _sessionId;
}

async function flush(): Promise<void> {
  if (_buffer.length === 0) return;
  const batch = _buffer.splice(0, _buffer.length);
  try {
    await API.post('/analytics/events/batch', {
      sessionId: getSessionId(),
      events: batch,
    });
  } catch {
    // Re-queue on failure (up to one retry)
    _buffer.unshift(...batch.slice(0, 20));
  }
}

function scheduleFlush(): void {
  if (_flushTimer) return;
  _flushTimer = setTimeout(async () => {
    _flushTimer = null;
    await flush();
  }, FLUSH_INTERVAL_MS);
}

function push(event: AnalyticsEvent): void {
  _buffer.push({ ...event, timestamp: event.timestamp ?? Date.now() });
  if (_buffer.length >= BATCH_SIZE) {
    void flush();
  } else {
    scheduleFlush();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
const analyticsClient = {
  /** Track a named event with optional properties */
  track: (name: AnalyticsEventName | string, properties?: Record<string, unknown>): void => {
    push({ name, properties });
  },

  /** Track a browser performance measure (from performance.measure) */
  trackPerformanceMeasure: (measureName: string): void => {
    const entries = performance.getEntriesByName(measureName);
    const entry = entries[entries.length - 1];
    if (!entry) return;
    push({
      name: 'performance_measure',
      properties: {
        measureName,
        durationMs: Math.round(entry.duration),
        startTime: Math.round(entry.startTime),
      },
    });
  },

  /** Track a page view */
  page: (path: string, title?: string): void => {
    push({
      name: 'page_view',
      properties: { path, title: title ?? document.title },
    });
  },

  /** Track a revenue event (e.g., payment, deposit) */
  revenue: (amount: number, currency: string, productId?: string): void => {
    push({
      name: 'revenue',
      properties: { amount, currency, productId },
    });
  },

  /** Track A/B test exposure */
  exposure: (experimentId: string, variant: string): void => {
    push({
      name: 'experiment_exposure',
      properties: { experimentId, variant },
    });
  },

  /** Track heatmap click */
  heatmapClick: (x: number, y: number, elementId?: string): void => {
    push({
      name: 'heatmap_click',
      properties: { x, y, elementId, path: window.location.pathname },
    });
  },

  /** Identify a user (associate events with user ID) */
  identify: async (userId: string, traits?: Record<string, unknown>): Promise<void> => {
    try {
      await API.post('/analytics/identify', { userId, traits, sessionId: getSessionId() });
    } catch {
      // Non-blocking
    }
  },

  /** Force-flush the event buffer immediately */
  flush: async (): Promise<void> => {
    if (_flushTimer) {
      clearTimeout(_flushTimer);
      _flushTimer = null;
    }
    await flush();
  },

  /** Reset session (on logout) */
  resetSession: (): void => {
    _sessionId = null;
    _buffer = [];
    if (_flushTimer) {
      clearTimeout(_flushTimer);
      _flushTimer = null;
    }
  },
};

// Flush before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => void flush());
}

export { analyticsClient };
export default analyticsClient;