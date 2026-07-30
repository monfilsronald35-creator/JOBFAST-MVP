import { EventEmitter } from 'events';
import type { DomainEvent, EventEnvelope } from './DomainEvent.js';

type Handler<T extends DomainEvent> = (envelope: EventEnvelope<T>) => void | Promise<void>;

class TypedEventBusImpl {
  private readonly _emitter = new EventEmitter();
  private readonly _history: EventEnvelope[] = [];
  private readonly _historyMax = 500;

  constructor() {
    this._emitter.setMaxListeners(200);
    // Swallow unhandled errors so one bad listener can't crash the process
    this._emitter.on('error', (err: Error) =>
      console.error('[EventBus] unhandled listener error:', err?.message),
    );
  }

  publish<T extends DomainEvent>(event: T, metadata?: Record<string, unknown>): void {
    const envelope: EventEnvelope<T> = {
      eventId:   event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      version:   event.version,
      payload:   event,
      metadata,
    };

    this._history.push(envelope as EventEnvelope);
    if (this._history.length > this._historyMax) this._history.shift();

    this._emitter.emit(event.eventName, envelope);
    this._emitter.emit('*', envelope);  // wildcard listener
  }

  subscribe<T extends DomainEvent>(
    eventName: string,
    handler:   Handler<T>,
  ): () => void {
    const safe = async (envelope: EventEnvelope<T>) => {
      try {
        await handler(envelope);
      } catch (err) {
        console.error(`[EventBus] handler error for "${eventName}":`, err);
      }
    };
    this._emitter.on(eventName, safe);
    return () => this._emitter.off(eventName, safe);
  }

  subscribeAll(handler: Handler<DomainEvent>): () => void {
    return this.subscribe<DomainEvent>('*', handler);
  }

  once<T extends DomainEvent>(eventName: string, handler: Handler<T>): void {
    const safe = async (envelope: EventEnvelope<T>) => {
      try { await handler(envelope); }
      catch (err) { console.error(`[EventBus] once-handler error for "${eventName}":`, err); }
    };
    this._emitter.once(eventName, safe);
  }

  history(limit = 50): EventEnvelope[] {
    return this._history.slice(-limit);
  }

  listenerCount(eventName: string): number {
    return this._emitter.listenerCount(eventName);
  }
}

// Process-wide singleton
export const TypedEventBus = new TypedEventBusImpl();
