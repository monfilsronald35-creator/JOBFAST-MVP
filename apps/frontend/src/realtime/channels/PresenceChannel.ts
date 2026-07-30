/**
 * PresenceChannel — online/offline/away/busy status, last seen, device sync.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type { PresencePayload, SessionSyncPayload } from '../types';
import type { PresenceStatus } from '../../types';

const HEARTBEAT_MS = 30_000;

export class PresenceChannel extends BaseChannel {
  #localStatus: PresenceStatus = 'online';
  #presenceTimer: ReturnType<typeof setInterval> | null = null;
  #userId: string | null = null;

  constructor(engine: RealtimeEngine) {
    super(engine, 'presence');
  }

  // ── Self presence ───────────────────────────────────────────────────────────

  announce(userId: string, status: PresenceStatus, device?: string): void {
    this.#userId = userId;
    this.#localStatus = status;
    this.engine.emit('presence:set', {
      userId, status, device,
      lastSeen: Date.now(),
    }, 'high');
    this.#startHeartbeat(userId);
  }

  updateStatus(status: PresenceStatus): void {
    if (!this.#userId) return;
    this.#localStatus = status;
    this.engine.emit('presence:set', {
      userId: this.#userId,
      status,
      lastSeen: Date.now(),
    }, 'high');
  }

  setAway(): void    { this.updateStatus('away'); }
  setBusy(): void    { this.updateStatus('busy'); }
  setOnline(): void  { this.updateStatus('online'); }
  setOffline(): void { this.updateStatus('offline'); }

  get currentStatus(): PresenceStatus { return this.#localStatus; }

  // ── Subscribe to others ─────────────────────────────────────────────────────

  subscribe(userIds: readonly string[]): void {
    this.engine.emit('presence:subscribe', { userIds }, 'normal');
  }

  unsubscribe(userIds: readonly string[]): void {
    this.engine.emit('presence:unsubscribe', { userIds }, 'normal');
  }

  onPresenceUpdate(handler: (payload: PresencePayload) => void): () => void {
    return this.onGlobal('presence:update', handler);
  }

  onPresenceBatch(handler: (payload: PresencePayload[]) => void): () => void {
    return this.onGlobal('presence:batch', handler);
  }

  onUserOnline(handler: (userId: string) => void): () => void {
    return this.onGlobal<PresencePayload>('presence:update', p => {
      if (p.status === 'online') handler(p.userId);
    });
  }

  onUserOffline(handler: (userId: string, lastSeen: number) => void): () => void {
    return this.onGlobal<PresencePayload>('presence:update', p => {
      if (p.status === 'offline') handler(p.userId, p.lastSeen);
    });
  }

  // ── Device sync ─────────────────────────────────────────────────────────────

  onSessionSync(handler: (payload: SessionSyncPayload) => void): () => void {
    return this.onGlobal('presence:session:sync', handler);
  }

  // ── Activity detection ──────────────────────────────────────────────────────

  initActivityDetection(userId: string): () => void {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const IDLE_MS = 5 * 60_000;

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (this.#localStatus === 'away') this.setOnline();
      idleTimer = setTimeout(() => { this.setAway(); }, IDLE_MS);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));

    resetIdle();
    this.announce(userId, 'online');

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach(e => window.removeEventListener(e, resetIdle));
      this.setOffline();
    };
  }

  #startHeartbeat(userId: string): void {
    if (this.#presenceTimer) clearInterval(this.#presenceTimer);
    this.#presenceTimer = setInterval(() => {
      if (this.engine.isConnected) {
        this.engine.emit('presence:heartbeat', {
          userId,
          status: this.#localStatus,
          lastSeen: Date.now(),
        }, 'low');
      }
    }, HEARTBEAT_MS);
  }

  protected override onDestroy(): void {
    if (this.#presenceTimer) {
      clearInterval(this.#presenceTimer);
      this.#presenceTimer = null;
    }
    if (this.#userId) this.setOffline();
  }
}