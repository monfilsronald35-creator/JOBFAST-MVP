/**
 * SyncChannel — multi-device sync, session sync, cache sync, background sync.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type { SyncPayload, SessionSyncPayload } from '../types';

const DEVICE_ID_KEY = 'jf_device_id';

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export class SyncChannel extends BaseChannel {
  readonly #deviceId: string;
  #sessionId: string | null = null;
  #bc: BroadcastChannel | null = null;
  #localHandlers = new Map<string, Set<(value: unknown) => void>>();

  constructor(engine: RealtimeEngine) {
    super(engine, 'sync');
    this.#deviceId = getOrCreateDeviceId();

    // Cross-tab sync via BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.#bc = new BroadcastChannel('jf_sync');
        this.#bc.onmessage = (e: MessageEvent<{ key: string; value: unknown }>) => {
          const handlers = this.#localHandlers.get(e.data?.key);
          handlers?.forEach(fn => { try { fn(e.data.value); } catch {} });
        };
      } catch {}
    }
  }

  get deviceId(): string { return this.#deviceId; }

  // ── Session ──────────────────────────────────────────────────────────────────

  initSession(userId: string): string {
    this.#sessionId = crypto.randomUUID();
    this.engine.emit('sync:session:init', {
      userId,
      sessionId:  this.#sessionId,
      deviceId:   this.#deviceId,
      deviceType: this.#detectDeviceType(),
      timestamp:  Date.now(),
    }, 'high');
    this.joinRoom(`session:${userId}`);
    return this.#sessionId;
  }

  endSession(userId: string): void {
    if (!this.#sessionId) return;
    this.engine.emit('sync:session:end', {
      userId, sessionId: this.#sessionId, deviceId: this.#deviceId,
    }, 'normal');
    this.#sessionId = null;
  }

  onSessionSync(handler: (payload: SessionSyncPayload) => void): () => void {
    return this.onGlobal('sync:session:update', handler);
  }

  // ── Multi-device key-value sync ───────────────────────────────────────────────

  set(namespace: string, key: string, value: unknown, version?: number): void {
    const payload: SyncPayload = {
      sessionId:  this.#sessionId ?? '',
      deviceId:   this.#deviceId,
      namespace,
      key,
      value,
      version:    version ?? Date.now(),
      timestamp:  Date.now(),
    };
    this.engine.emit('sync:set', payload, 'normal');

    // Cross-tab broadcast
    try { this.#bc?.postMessage({ key: `${namespace}:${key}`, value }); } catch {}
  }

  onSet(namespace: string, key: string, handler: (value: unknown) => void): () => void {
    const fullKey = `${namespace}:${key}`;
    if (!this.#localHandlers.has(fullKey)) this.#localHandlers.set(fullKey, new Set());
    this.#localHandlers.get(fullKey)!.add(handler);

    const off = this.onGlobal<SyncPayload>('sync:set', payload => {
      if (payload.namespace === namespace && payload.key === key &&
          payload.deviceId !== this.#deviceId) {
        handler(payload.value);
      }
    });

    return () => {
      off();
      this.#localHandlers.get(fullKey)?.delete(handler);
    };
  }

  // ── Cache sync ────────────────────────────────────────────────────────────────

  invalidateCache(keys: readonly string[]): void {
    this.engine.emit('sync:cache:invalidate', { keys, deviceId: this.#deviceId }, 'high');
  }

  onCacheInvalidate(handler: (keys: string[]) => void): () => void {
    return this.onGlobal<{ keys: string[] }>('sync:cache:invalidate', d => handler(d.keys));
  }

  // ── Background sync ───────────────────────────────────────────────────────────

  requestFullSync(userId: string, namespaces?: readonly string[]): void {
    this.engine.emit('sync:full:request', {
      userId, deviceId: this.#deviceId, namespaces: namespaces ?? [],
    }, 'normal');
  }

  onFullSync(handler: (data: { namespaces: Record<string, unknown> }) => void): () => void {
    return this.onGlobal('sync:full:response', handler);
  }

  #detectDeviceType(): SessionSyncPayload['deviceType'] {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua))  return 'tablet';
    if (/mobile|phone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  protected override onDestroy(): void {
    this.#bc?.close();
    this.#bc = null;
    this.#localHandlers.clear();
  }
}