/**
 * AvailabilityRealtimeService
 * Singleton service for broadcasting and receiving availability events.
 * Uses an in-memory event emitter + BroadcastChannel for cross-tab sync.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

class AvailabilityRealtimeServiceClass {
  #handlers = new Map();
  #state = { availabilityVersion: 0 };
  #channel = null;
  #socket = null;

  constructor() {
    // BroadcastChannel for cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.#channel = new BroadcastChannel('jobfast_availability');
        this.#channel.onmessage = (e) => {
          if (e.data?.type === 'availability:changed') {
            this.#emit('availability:changed', e.data.payload);
          }
        };
      } catch {
        // BroadcastChannel not available in all environments
      }
    }
  }

  #emit(event, payload) {
    const listeners = this.#handlers.get(event) ?? [];
    for (const fn of listeners) {
      try { fn(payload); } catch { /* listener errors are isolated */ }
    }
  }

  on(event, handler) {
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, new Set());
    }
    this.#handlers.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    this.#handlers.get(event)?.delete(handler);
    return this;
  }

  getState() {
    return { ...this.#state };
  }

  /**
   * Publish an availability event locally and via BroadcastChannel.
   * @param {object} payload - { availability, availabilityUntil, geo, presence, version }
   * @returns {Promise<{ eventId: string, timestamp: number }>}
   */
  async publishAvailabilityEvent(payload) {
    const eventId = crypto.randomUUID();
    const timestamp = Date.now();

    this.#state.availabilityVersion = Math.max(
      this.#state.availabilityVersion,
      payload.version ?? this.#state.availabilityVersion + 1,
    );

    const event = { ...payload, eventId, timestamp };

    // Broadcast to other tabs
    try {
      this.#channel?.postMessage({ type: 'availability:changed', payload: event });
    } catch {
      // Channel closed or unavailable
    }

    // Emit locally
    this.#emit('availability:changed', event);

    return { eventId, timestamp };
  }

  /**
   * Connect to Socket.io for real-time availability updates.
   * Called once the user is authenticated.
   */
  connectSocket(token) {
    if (this.#socket || !SOCKET_URL) return;

    this.#socket = io(`${SOCKET_URL}/availability`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 2000,
    });

    this.#socket.on('availability:changed', (data) => {
      this.#state.availabilityVersion = Math.max(
        this.#state.availabilityVersion,
        data.version ?? 0,
      );
      this.#emit('availability:changed', data);
    });
  }

  disconnectSocket() {
    this.#socket?.disconnect();
    this.#socket = null;
  }
}

export const AvailabilityRealtimeService = new AvailabilityRealtimeServiceClass();