import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env['VITE_SOCKET_URL'] ?? '';

interface AvailabilityPayload {
  availability?:      unknown;
  availabilityUntil?: unknown;
  geo?:               unknown;
  presence?:          unknown;
  version?:           number;
  [key: string]:      unknown;
}

interface AvailabilityEvent extends AvailabilityPayload {
  eventId:   string;
  timestamp: number;
}

type AvailabilityHandler = (payload: AvailabilityEvent) => void;

interface ServiceState { availabilityVersion: number; }

class AvailabilityRealtimeServiceClass {
  readonly #handlers = new Map<string, Set<AvailabilityHandler>>();
  readonly #state: ServiceState = { availabilityVersion: 0 };
  #channel: BroadcastChannel | null = null;
  #socket:  Socket | null = null;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.#channel = new BroadcastChannel('jobfast_availability');
        this.#channel.onmessage = (e: MessageEvent<{ type: string; payload: AvailabilityEvent }>) => {
          if (e.data?.type === 'availability:changed') {
            this.#emit('availability:changed', e.data.payload);
          }
        };
      } catch {}
    }
  }

  #emit(event: string, payload: AvailabilityEvent): void {
    const listeners = this.#handlers.get(event) ?? new Set();
    for (const fn of listeners) {
      try { fn(payload); } catch {}
    }
  }

  on(event: string, handler: AvailabilityHandler): this {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: AvailabilityHandler): this {
    this.#handlers.get(event)?.delete(handler);
    return this;
  }

  getState(): ServiceState { return { ...this.#state }; }

  async publishAvailabilityEvent(payload: AvailabilityPayload): Promise<{ eventId: string; timestamp: number }> {
    const eventId   = crypto.randomUUID();
    const timestamp = Date.now();

    this.#state.availabilityVersion = Math.max(
      this.#state.availabilityVersion,
      (payload['version'] as number | undefined) ?? this.#state.availabilityVersion + 1
    );

    const event: AvailabilityEvent = { ...payload, eventId, timestamp };

    try { this.#channel?.postMessage({ type: 'availability:changed', payload: event }); } catch {}

    this.#emit('availability:changed', event);
    return { eventId, timestamp };
  }

  connectSocket(token: string): void {
    if (this.#socket || !SOCKET_URL) return;

    this.#socket = io(`${SOCKET_URL}/availability`, {
      auth:              { token },
      transports:        ['websocket'],
      reconnectionDelay: 2000,
    });

    this.#socket.on('availability:changed', (data: AvailabilityEvent) => {
      this.#state.availabilityVersion = Math.max(
        this.#state.availabilityVersion,
        data['version'] as number ?? 0
      );
      this.#emit('availability:changed', data);
    });
  }

  disconnectSocket(): void {
    this.#socket?.disconnect();
    this.#socket = null;
  }
}

export const AvailabilityRealtimeService = new AvailabilityRealtimeServiceClass();