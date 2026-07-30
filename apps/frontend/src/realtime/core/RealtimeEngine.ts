/**
 * JOBFAST Enterprise Realtime Engine — Singleton Orchestrator
 *
 * Transport stack (in priority order):
 *   1. Socket.io WebSocket (primary)
 *   2. Socket.io long-polling (automatic fallback via socket.io-client)
 *   3. Server-Sent Events (manual fallback when socket.io unavailable)
 *
 * Single connection shared across all domain channels.
 * BroadcastChannel used for cross-tab event distribution.
 */

import { io, Socket } from 'socket.io-client';
import { ReconnectStrategy }  from './ReconnectStrategy';
import { RateLimiter }        from './RateLimiter';
import { EncryptionLayer }    from './EncryptionLayer';
import { NetworkDetector }    from './NetworkDetector';
import { MessageQueue }       from './MessageQueue';
import { Compressor }         from './Compressor';
import { TelemetryEngine }    from '../telemetry/TelemetryEngine';
import type {
  RealtimeConfig, ConnectionState, TransportType,
  EngineMetrics, QueuedMessage,
} from '../types';

const DEFAULT_CONFIG: RealtimeConfig = {
  url: import.meta.env.VITE_SOCKET_URL as string | undefined
    ?? (import.meta.env.PROD ? 'https://jobfast-backend.onrender.com' : 'http://localhost:5000'),
  transports: ['websocket', 'polling'],
  reconnect: {
    maxAttempts:     15,
    initialDelayMs:  1_000,
    maxDelayMs:      30_000,
    jitterFactor:    0.5,
  },
  heartbeat: {
    intervalMs: 25_000,
    timeoutMs:  10_000,
  },
  rateLimit: {
    eventsPerSecond: 30,
    burstSize:       60,
  },
  encryption:  { enabled: false },
  compression: { enabled: true, minBytes: 512 },
  telemetry:   { enabled: true, sampleRate: 1 },
};

type EventHandler = (data: unknown) => void;
type EngineEventHandler = (state: ConnectionState) => void;

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('jobfast_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export class RealtimeEngine {
  static #instance: RealtimeEngine | null = null;

  static getInstance(): RealtimeEngine {
    RealtimeEngine.#instance ??= new RealtimeEngine();
    return RealtimeEngine.#instance;
  }

  static resetInstance(): void {
    RealtimeEngine.#instance?.destroy();
    RealtimeEngine.#instance = null;
  }

  // ── Core subsystems ─────────────────────────────────────────────────────────
  readonly reconnect = new ReconnectStrategy();
  readonly queue     = new MessageQueue();
  readonly network   = new NetworkDetector();
  readonly encryption = new EncryptionLayer();
  readonly compressor: Compressor;
  readonly telemetry: TelemetryEngine;
  #rateLimiter: RateLimiter;
  #config: RealtimeConfig = DEFAULT_CONFIG;

  // ── Transport ────────────────────────────────────────────────────────────────
  #socket:   Socket | null = null;
  #sse:      EventSource | null = null;
  #bc:       BroadcastChannel | null = null;
  #transport: TransportType | null = null;

  // ── State ────────────────────────────────────────────────────────────────────
  #state: ConnectionState = 'disconnected';
  #connectedAt: number | null = null;

  // ── Heartbeat ────────────────────────────────────────────────────────────────
  #heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  #heartbeatTimeout:  ReturnType<typeof setTimeout>  | null = null;
  #lastPong = 0;

  // ── Event bus ────────────────────────────────────────────────────────────────
  #handlers    = new Map<string, Set<EventHandler>>();
  #stateListeners = new Set<EngineEventHandler>();

  private constructor() {
    this.#rateLimiter = new RateLimiter({ eventsPerSecond: 30, burstSize: 60 });
    this.compressor   = new Compressor(512);
    this.telemetry    = new TelemetryEngine({ enabled: true, sampleRate: 1 });

    // Cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.#bc = new BroadcastChannel('jf_realtime');
        this.#bc.onmessage = (e: MessageEvent<{ event: string; data: unknown }>) => {
          if (e.data?.event) this.#dispatch(e.data.event, e.data.data, false);
        };
      } catch {}
    }

    // Re-queue on offline, flush on online
    this.network.onChange(q => {
      if (q === 'offline') {
        this.telemetry.warn('Network offline — queuing outbound');
      } else if (this.#state !== 'connected') {
        void this.#flushQueue();
      }
    });

    void this.queue.load();
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  get state(): ConnectionState { return this.#state; }
  get isConnected(): boolean   { return this.#state === 'connected'; }
  get socket(): Socket | null  { return this.#socket; }

  async connect(config?: Partial<RealtimeConfig>): Promise<void> {
    if (this.#state === 'connected' || this.#state === 'connecting') return;

    this.#config = { ...DEFAULT_CONFIG, ...config };
    this.#rateLimiter = new RateLimiter(
      this.#config.rateLimit ?? DEFAULT_CONFIG.rateLimit!
    );

    if (this.#config.encryption?.enabled) {
      await this.encryption.init(this.#config.encryption.sharedKey);
    }

    this.#setState('connecting');
    await this.#connectSocket();
  }

  disconnect(): void {
    this.reconnect.abort();
    this.#clearHeartbeat();
    this.#socket?.disconnect();
    this.#socket = null;
    this.#sse?.close();
    this.#sse = null;
    this.#setState('disconnected');
    this.#connectedAt = null;
    this.#transport = null;
  }

  emit(event: string, payload: unknown, priority: QueuedMessage['priority'] = 'normal'): void {
    if (!this.isConnected || !this.#socket) {
      // Queue for offline delivery
      const canQueue = priority === 'critical' || priority === 'high';
      if (canQueue) {
        void this.queue.enqueue({
          event,
          payload,
          priority,
          encrypted:  this.#config.encryption?.enabled ?? false,
          compressed: false,
          maxAttempts: priority === 'critical' ? 10 : 5,
        });
      }
      return;
    }

    const result = this.#rateLimiter.check(priority);
    if (result.action === 'drop') {
      this.telemetry.counters.droppedMessages++;
      this.telemetry.warn(`Event dropped (rate limit): ${event}`);
      return;
    }
    if (result.action === 'queue') {
      void this.queue.enqueue({
        event, payload, priority,
        encrypted: false, compressed: false,
        maxAttempts: 3,
      });
      return;
    }

    this.#sendRaw(event, payload);
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event)!.add(handler);
    return () => { this.#handlers.get(event)?.delete(handler); };
  }

  onStateChange(fn: EngineEventHandler): () => void {
    this.#stateListeners.add(fn);
    return () => { this.#stateListeners.delete(fn); };
  }

  getMetrics(): EngineMetrics {
    return {
      connectionState:  this.#state,
      transport:        this.#transport,
      latencyMs:        this.telemetry.latency.p50,
      jitterMs:         this.telemetry.latency.p99 - this.telemetry.latency.p50,
      messagesReceived: this.telemetry.counters.messagesReceived,
      messagesSent:     this.telemetry.counters.messagesSent,
      bytesReceived:    this.telemetry.counters.bytesReceived,
      bytesSent:        this.telemetry.counters.bytesSent,
      reconnectCount:   this.telemetry.counters.reconnects,
      queuedMessages:   this.queue.size,
      droppedMessages:  this.telemetry.counters.droppedMessages,
      errorCount:       this.telemetry.counters.errors,
      connectedAt:      this.#connectedAt,
      uptimeMs:         this.#connectedAt ? Date.now() - this.#connectedAt : 0,
      networkQuality:   this.network.quality,
    };
  }

  destroy(): void {
    this.disconnect();
    this.network.destroy();
    this.telemetry.destroy();
    this.#bc?.close();
    this.#bc = null;
    this.#handlers.clear();
    this.#stateListeners.clear();
  }

  // ── Socket.io connection ─────────────────────────────────────────────────────

  async #connectSocket(): Promise<void> {
    const token = await this.#resolveToken();

    const socket = io(this.#config.url, {
      path:      '/socket.io',
      transports: (this.#config.transports ?? ['websocket', 'polling']) as ('websocket' | 'polling')[],
      auth:      token ? { token } : {},
      reconnection: false, // We manage reconnection ourselves
      timeout:   10_000,
    });

    this.#socket = socket;

    socket.on('connect', () => {
      this.#transport   = (socket.io.engine as { transport?: { name?: string } }).transport?.name as TransportType ?? 'websocket';
      this.#connectedAt = Date.now();
      this.#lastPong    = Date.now();
      this.reconnect.reset();
      this.#setState('connected');
      this.#startHeartbeat();
      this.telemetry.info('Socket connected', { transport: this.#transport });
      this.telemetry.gauge('realtime.connected', 1, { transport: this.#transport });
      void this.#flushQueue();
    });

    socket.on('disconnect', (reason: string) => {
      this.#clearHeartbeat();
      const wasConnected = this.#state === 'connected';
      this.#setState('reconnecting');
      this.telemetry.warn(`Socket disconnected: ${reason}`);

      if (wasConnected && reason !== 'io client disconnect') {
        this.#scheduleReconnect();
      }
    });

    socket.on('connect_error', (err: Error) => {
      this.telemetry.error('Connection error', { message: err.message });
      if (this.#state === 'connecting') {
        this.#trySSEFallback();
      }
    });

    socket.on('pong', () => {
      const rtt = Date.now() - this.#lastPong;
      this.telemetry.recordLatency(rtt);
      this.#lastPong = Date.now();
      if (this.#heartbeatTimeout) {
        clearTimeout(this.#heartbeatTimeout);
        this.#heartbeatTimeout = null;
      }
    });

    // Route all incoming events through the engine's event bus
    socket.onAny((event: string, data: unknown) => {
      this.telemetry.counters.messagesReceived++;
      const span = this.telemetry.startSpan(`recv:${event}`);
      this.#dispatch(event, data, true);
      this.telemetry.endSpan(span);
    });
  }

  #scheduleReconnect(): void {
    this.reconnect
      .onAttempt((attempt, delay) => {
        this.telemetry.counters.reconnects++;
        this.telemetry.info(`Reconnect attempt ${attempt}`, { delay });
        this.#setState('reconnecting');
      })
      .onGiveUp(() => {
        this.#setState('failed');
        this.telemetry.error('Max reconnect attempts reached');
      });

    this.reconnect.schedule(async () => {
      if (!this.network.isOnline) {
        // Pause until back online
        const unsub = this.network.onChange(q => {
          if (q !== 'offline') { unsub(); void this.connect(); }
        });
        return;
      }
      await this.#connectSocket();
    });
  }

  #trySSEFallback(): void {
    const token = getToken();
    const url   = `${this.#config.url}/sse${token ? `?token=${token}` : ''}`;

    try {
      const sse = new EventSource(url);
      this.#sse = sse;

      sse.onopen = () => {
        this.#transport   = 'sse';
        this.#connectedAt = Date.now();
        this.#setState('degraded');
        this.telemetry.warn('Degraded: using SSE fallback');
      };

      sse.onmessage = (e: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(e.data) as { event: string; data: unknown };
          this.telemetry.counters.messagesReceived++;
          this.#dispatch(parsed.event, parsed.data, true);
        } catch {}
      };

      sse.onerror = () => {
        sse.close();
        this.#sse = null;
        this.#setState('failed');
      };
    } catch {
      this.#setState('failed');
    }
  }

  // ── Heartbeat ────────────────────────────────────────────────────────────────

  #startHeartbeat(): void {
    this.#clearHeartbeat();
    const { intervalMs, timeoutMs } = this.#config.heartbeat!;

    this.#heartbeatInterval = setInterval(() => {
      if (!this.#socket?.connected) return;

      const sent = Date.now();
      this.#lastPong = sent;
      this.#socket.emit('ping');

      this.#heartbeatTimeout = setTimeout(() => {
        this.telemetry.warn('Heartbeat timeout — forcing reconnect');
        this.#socket?.disconnect();
      }, timeoutMs);
    }, intervalMs);
  }

  #clearHeartbeat(): void {
    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
      this.#heartbeatInterval = null;
    }
    if (this.#heartbeatTimeout) {
      clearTimeout(this.#heartbeatTimeout);
      this.#heartbeatTimeout = null;
    }
  }

  // ── Queue flushing ───────────────────────────────────────────────────────────

  async #flushQueue(): Promise<void> {
    if (this.queue.isEmpty) return;

    const sent = await this.queue.flush(async (msg) => {
      if (!this.isConnected) return false;
      this.#sendRaw(msg.event, msg.payload);
      return true;
    });

    if (sent > 0) {
      this.telemetry.info(`Flushed ${sent} queued messages`);
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  #sendRaw(event: string, payload: unknown): void {
    if (!this.#socket?.connected) return;
    this.#socket.emit(event, payload);
    this.telemetry.counters.messagesSent++;
    this.telemetry.gauge('realtime.sent', 1, { event });
  }

  #dispatch(event: string, data: unknown, crossTab: boolean): void {
    const handlers = this.#handlers.get(event);
    handlers?.forEach(h => { try { h(data); } catch {} });

    // Wildcard handlers
    const wildcard = this.#handlers.get('*');
    wildcard?.forEach(h => { try { h({ event, data }); } catch {} });

    // Broadcast to other tabs (avoid re-broadcasting received cross-tab events)
    if (crossTab && this.#bc) {
      try { this.#bc.postMessage({ event, data }); } catch {}
    }
  }

  #setState(next: ConnectionState): void {
    if (next === this.#state) return;
    this.#state = next;
    this.#stateListeners.forEach(fn => { try { fn(next); } catch {} });
    this.telemetry.gauge('realtime.state', 1, { state: next });
  }

  async #resolveToken(): Promise<string | null> {
    if (this.#config.auth) {
      return await Promise.resolve(this.#config.auth());
    }
    return getToken();
  }
}

// Singleton export
export const realtimeEngine = RealtimeEngine.getInstance();