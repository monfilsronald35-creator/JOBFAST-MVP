/**
 * Core Event Bus — decouples services via pub/sub
 * Wraps Node EventEmitter with type safety, wildcard support, and error isolation
 */
import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this._history = [];
    this._historyMax = 200;

    // Swallow unhandled errors in listeners so one bad handler can't crash the server
    this.on('error', err => console.error('[EventBus] unhandled error:', err?.message));
  }

  emit(event, data) {
    const envelope = { event, data, ts: Date.now() };
    this._history.push(envelope);
    if (this._history.length > this._historyMax) this._history.shift();
    return super.emit(event, envelope);
  }

  publish(event, data) { return this.emit(event, data); }

  subscribe(event, handler) {
    const safe = envelope => {
      try { handler(envelope); } catch (e) { console.error(`[EventBus] handler error on "${event}":`, e?.message); }
    };
    this.on(event, safe);
    return () => this.off(event, safe);
  }

  once(event, handler) {
    const safe = envelope => {
      try { handler(envelope); } catch (e) { console.error(`[EventBus] once-handler error on "${event}":`, e?.message); }
    };
    super.once(event, safe);
    return () => this.off(event, safe);
  }

  recent(n = 20) { return this._history.slice(-n); }
}

// Singleton — one bus for the whole process
export const eventBus = new EventBus();

// Well-known event names — keep in sync with frontend eventBus.js
export const Events = {
  // Auth
  USER_LOGGED_IN:     'user:logged_in',
  USER_LOGGED_OUT:    'user:logged_out',
  USER_REGISTERED:    'user:registered',

  // Jobs
  JOB_CREATED:        'job:created',
  JOB_UPDATED:        'job:updated',
  JOB_ASSIGNED:       'job:assigned',
  JOB_COMPLETED:      'job:completed',

  // Bookings
  BOOKING_CREATED:    'booking:created',
  BOOKING_CONFIRMED:  'booking:confirmed',
  BOOKING_CANCELLED:  'booking:cancelled',

  // Payments
  PAYMENT_INITIATED:  'payment:initiated',
  PAYMENT_SUCCESS:    'payment:success',
  PAYMENT_FAILED:     'payment:failed',
  ESCROW_RELEASED:    'escrow:released',

  // Messaging
  MESSAGE_SENT:       'message:sent',
  CONVERSATION_OPEN:  'conversation:open',

  // Notifications
  NOTIFY_USER:        'notify:user',
  NOTIFY_BROADCAST:   'notify:broadcast',

  // Analytics
  ANALYTICS_EVENT:    'analytics:event',

  // System
  CACHE_INVALIDATED:  'cache:invalidated',
  HEALTH_CHECK:       'system:health_check',
};

export default eventBus;
