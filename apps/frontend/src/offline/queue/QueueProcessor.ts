/**
 * QueueProcessor — Drains the offline queue when connectivity is restored.
 * Reads from jobfast_db via DomainQueues. Integrates with FAZ 5 realtimeEngine.
 * Backoff is handled by indexedDb.ts incrementRetry (exponential, capped at 60s).
 */

import {
  getDueItems, sortByPriority, removeOfflineItem, markRetry,
  type QueueItem, type QueueDomain,
} from './DomainQueues';
import { realtimeEngine } from '../../realtime/core/RealtimeEngine';

export interface ProcessorConfig {
  concurrency?:    number;
  onSuccess?:      (itemId: string, response: unknown) => void;
  onFailure?:      (itemId: string, error: Error, retries: number) => void;
  onDrained?:      () => void;
  getAuthHeader?:  () => string | null;
}

export interface ProcessorStats {
  isRunning:    boolean;
  lastRunAt:    number | null;
  successCount: number;
  failureCount: number;
  pendingCount: number;
}

export class QueueProcessor {
  private static _instance: QueueProcessor | null = null;

  private running = false;
  private stats: ProcessorStats = {
    isRunning: false, lastRunAt: null, successCount: 0, failureCount: 0, pendingCount: 0,
  };

  private cfg: Required<ProcessorConfig>;
  private unsubscribeEngine: (() => void) | null = null;
  private drainTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(config: ProcessorConfig = {}) {
    this.cfg = {
      concurrency:   config.concurrency   ?? 3,
      onSuccess:     config.onSuccess     ?? (() => undefined),
      onFailure:     config.onFailure     ?? (() => undefined),
      onDrained:     config.onDrained     ?? (() => undefined),
      getAuthHeader: config.getAuthHeader ?? (() => {
        try {
          const raw = localStorage.getItem('jobfast_user');
          if (!raw) return null;
          const u = JSON.parse(raw) as { token?: string };
          return u.token ? `Bearer ${u.token}` : null;
        } catch { return null; }
      }),
    };
  }

  static getInstance(config?: ProcessorConfig): QueueProcessor {
    if (!QueueProcessor._instance) QueueProcessor._instance = new QueueProcessor(config);
    return QueueProcessor._instance;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  start(): void {
    if (this.unsubscribeEngine) return;

    this.unsubscribeEngine = realtimeEngine.onStateChange(state => {
      if (state === 'connected') this.scheduleDrain(500);
    });

    window.addEventListener('online', this.onOnline);
    if (navigator.onLine) this.scheduleDrain(1000);
  }

  stop(): void {
    this.unsubscribeEngine?.();
    this.unsubscribeEngine = null;
    if (this.drainTimer) clearTimeout(this.drainTimer);
    this.drainTimer = null;
    window.removeEventListener('online', this.onOnline);
  }

  private onOnline = (): void => { this.scheduleDrain(300); };

  private scheduleDrain(delayMs: number): void {
    if (this.drainTimer) clearTimeout(this.drainTimer);
    this.drainTimer = setTimeout(() => { void this.drain(); }, delayMs);
  }

  // ─── Drain ──────────────────────────────────────────────────────────────────

  async drain(domains?: QueueDomain[]): Promise<ProcessorStats> {
    if (this.running || !navigator.onLine) return this.getStats();

    this.running         = true;
    this.stats.isRunning = true;
    this.stats.lastRunAt = Date.now();

    try {
      const raw   = await getDueItems(domains);
      const items = sortByPriority(raw);
      this.stats.pendingCount = items.length;

      for (let i = 0; i < items.length; i += this.cfg.concurrency) {
        const batch = items.slice(i, i + this.cfg.concurrency);
        await Promise.all(batch.map(item => this.processOne(item)));
        if (!navigator.onLine) break;
      }

      if (this.stats.pendingCount === 0) this.cfg.onDrained();
    } finally {
      this.running         = false;
      this.stats.isRunning = false;
    }

    return this.getStats();
  }

  // ─── Process single item ───────────────────────────────────────────────────

  private async processOne(item: QueueItem): Promise<void> {
    const { endpoint, method, body, headers } = item.payload;

    const auth = this.cfg.getAuthHeader();
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
      ...(headers ?? {}),
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: reqHeaders,
        ...(body != null ? { body } : {}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = await res.json().catch(() => null);
      await removeOfflineItem(item.id);
      this.stats.successCount++;
      this.stats.pendingCount = Math.max(0, this.stats.pendingCount - 1);
      this.cfg.onSuccess(item.id, json);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const retries = item.retryCount;
      const max     = item.maxRetries;

      if (retries >= max) {
        await removeOfflineItem(item.id);
      } else {
        await markRetry(item.id, error.message);
      }

      this.stats.failureCount++;
      this.stats.pendingCount = Math.max(0, this.stats.pendingCount - 1);
      this.cfg.onFailure(item.id, error, retries);
    }
  }

  getStats(): ProcessorStats { return { ...this.stats }; }
}

export const queueProcessor = QueueProcessor.getInstance();