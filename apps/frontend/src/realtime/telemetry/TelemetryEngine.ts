/**
 * Enterprise telemetry: structured logging, metrics, distributed tracing.
 * Batches data and exports to a configurable endpoint.
 */

import type { LogEntry, LogLevel, MetricPoint, Span } from '../types';

interface TelemetryConfig {
  readonly enabled: boolean;
  readonly sampleRate: number; // 0–1
  readonly endpoint?: string;
  readonly flushIntervalMs?: number;
  readonly maxBatchSize?: number;
}

const DEFAULTS = {
  sampleRate: 1,
  flushIntervalMs: 10_000,
  maxBatchSize: 100,
};

export class TelemetryEngine {
  readonly #config: Required<TelemetryConfig>;
  #logs:    LogEntry[]   = [];
  #metrics: MetricPoint[] = [];
  #spans:   Span[]        = [];
  #flushTimer: ReturnType<typeof setInterval> | null = null;
  #activeSpans = new Map<string, Span>();

  // Counters available for direct read by RealtimeEngine
  readonly counters = {
    messagesReceived: 0,
    messagesSent:     0,
    bytesReceived:    0,
    bytesSent:        0,
    errors:           0,
    reconnects:       0,
    droppedMessages:  0,
  };

  readonly latency = { samples: [] as number[], p50: 0, p95: 0, p99: 0 };

  constructor(config: TelemetryConfig) {
    this.#config = { ...DEFAULTS, ...config };
    if (this.#config.enabled && this.#config.endpoint) {
      this.#flushTimer = setInterval(() => { void this.flush(); }, this.#config.flushIntervalMs);
    }
  }

  // ── Logging ──────────────────────────────────────────────────────────────────

  log(level: LogLevel, message: string, data?: Record<string, unknown>, traceId?: string): void {
    if (!this.#config.enabled) return;
    if (level === 'debug' && Math.random() > this.#config.sampleRate) return;

    const entry: LogEntry = {
      level, message, timestamp: Date.now(), traceId, data,
    };

    this.#logs.push(entry);
    if (this.#logs.length > this.#config.maxBatchSize) this.#logs.shift();

    if (level === 'error' || level === 'fatal') {
      console.error(`[JFRT] ${message}`, data ?? '');
    } else if (level === 'warn') {
      console.warn(`[JFRT] ${message}`, data ?? '');
    } else if (import.meta.env.DEV && level === 'debug') {
      console.debug(`[JFRT] ${message}`, data ?? '');
    }
  }

  debug(msg: string, data?: Record<string, unknown>): void { this.log('debug', msg, data); }
  info(msg: string, data?: Record<string, unknown>):  void { this.log('info',  msg, data); }
  warn(msg: string, data?: Record<string, unknown>):  void { this.log('warn',  msg, data); }
  error(msg: string, data?: Record<string, unknown>): void {
    this.counters.errors++;
    this.log('error', msg, data);
  }

  // ── Metrics ───────────────────────────────────────────────────────────────────

  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.#config.enabled) return;
    this.#metrics.push({ name, value, timestamp: Date.now(), labels });
    if (this.#metrics.length > this.#config.maxBatchSize * 2) this.#metrics.shift();
  }

  increment(name: string, labels: Record<string, string> = {}): void {
    this.gauge(name, 1, labels);
  }

  recordLatency(ms: number): void {
    this.latency.samples.push(ms);
    if (this.latency.samples.length > 200) this.latency.samples.shift();
    this.#updatePercentiles();
    this.gauge('realtime.latency_ms', ms, { transport: 'ws' });
  }

  // ── Tracing ───────────────────────────────────────────────────────────────────

  startSpan(name: string, parentSpanId?: string): Span {
    const span: Span = {
      traceId:      crypto.randomUUID(),
      spanId:       crypto.randomUUID().slice(0, 16),
      parentSpanId,
      name,
      startTime:    performance.now(),
      attributes:   {},
      status:       'ok',
    };
    this.#activeSpans.set(span.spanId, span);
    return span;
  }

  endSpan(span: Span, error?: string): void {
    const ended = { ...span, endTime: performance.now() };
    if (error) { ended.status = 'error'; (ended as { error?: string }).error = error; }
    this.#spans.push(ended as Span & { endTime: number });
    this.#activeSpans.delete(span.spanId);
    if (this.#spans.length > this.#config.maxBatchSize) this.#spans.shift();
  }

  // ── Flushing ──────────────────────────────────────────────────────────────────

  async flush(): Promise<void> {
    if (!this.#config.endpoint || (
      this.#logs.length === 0 && this.#metrics.length === 0 && this.#spans.length === 0
    )) return;

    const batch = {
      logs:    this.#logs.splice(0),
      metrics: this.#metrics.splice(0),
      spans:   this.#spans.splice(0),
      counters: { ...this.counters },
    };

    try {
      await fetch(this.#config.endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(batch),
        keepalive: true,
      });
    } catch {
      // Re-add failed entries (up to limit)
      this.#logs    = [...batch.logs.slice(-20),    ...this.#logs];
      this.#metrics = [...batch.metrics.slice(-50), ...this.#metrics];
    }
  }

  destroy(): void {
    if (this.#flushTimer) clearInterval(this.#flushTimer);
    void this.flush();
  }

  #updatePercentiles(): void {
    const sorted = [...this.latency.samples].sort((a, b) => a - b);
    const p = (pct: number) => sorted[Math.floor(sorted.length * pct)] ?? 0;
    this.latency.p50 = p(0.50);
    this.latency.p95 = p(0.95);
    this.latency.p99 = p(0.99);
  }
}