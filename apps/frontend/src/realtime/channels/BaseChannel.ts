/**
 * Abstract base for all realtime domain channels.
 * Channels wrap the shared RealtimeEngine and provide typed, domain-specific APIs.
 */

import type { RealtimeEngine } from '../core/RealtimeEngine';

export type ChannelHandler<T> = (data: T) => void;

export abstract class BaseChannel {
  protected readonly engine: RealtimeEngine;
  protected readonly namespace: string;
  readonly #teardowns: Array<() => void> = [];

  constructor(engine: RealtimeEngine, namespace: string) {
    this.engine    = engine;
    this.namespace = namespace;
  }

  // Subscribe to a namespaced event
  protected on<T>(event: string, handler: ChannelHandler<T>): () => void {
    const full = this.#qualify(event);
    const off  = this.engine.on(full, handler as (d: unknown) => void);
    this.#teardowns.push(off);
    return () => {
      off();
      const idx = this.#teardowns.indexOf(off);
      if (idx >= 0) this.#teardowns.splice(idx, 1);
    };
  }

  // Subscribe to an unnamespaced event (e.g., shared events like 'presence:update')
  protected onGlobal<T>(event: string, handler: ChannelHandler<T>): () => void {
    const off = this.engine.on(event, handler as (d: unknown) => void);
    this.#teardowns.push(off);
    return () => {
      off();
      const idx = this.#teardowns.indexOf(off);
      if (idx >= 0) this.#teardowns.splice(idx, 1);
    };
  }

  // Emit through the engine
  protected emit(event: string, payload: unknown, priority?: Parameters<RealtimeEngine['emit']>[2]): void {
    this.engine.emit(this.#qualify(event), payload, priority);
  }

  protected emitGlobal(event: string, payload: unknown): void {
    this.engine.emit(event, payload);
  }

  // Join a socket.io room
  protected joinRoom(room: string): void {
    this.engine.emit('room:join', { room });
  }

  // Leave a socket.io room
  protected leaveRoom(room: string): void {
    this.engine.emit('room:leave', { room });
  }

  // Remove all listeners registered by this channel
  destroy(): void {
    this.#teardowns.forEach(fn => { try { fn(); } catch {} });
    this.#teardowns.length = 0;
    this.onDestroy();
  }

  protected onDestroy(): void {}

  #qualify(event: string): string {
    if (event.includes(':')) return event; // Already namespaced
    return `${this.namespace}:${event}`;
  }
}