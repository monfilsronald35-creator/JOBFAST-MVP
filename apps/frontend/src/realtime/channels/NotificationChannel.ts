/**
 * NotificationChannel — push, email, SMS, WhatsApp, in-app, browser push.
 * Handles registration, delivery, read tracking.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type { Notification, PushRegistrationPayload } from '../types';

export class NotificationChannel extends BaseChannel {
  #swRegistration: ServiceWorkerRegistration | null = null;

  constructor(engine: RealtimeEngine) {
    super(engine, 'notifications');
  }

  // ── Subscribe ───────────────────────────────────────────────────────────────

  subscribe(userId: string): void {
    this.engine.emit('notifications:subscribe', { userId }, 'high');
    this.joinRoom(`notifications:${userId}`);
  }

  unsubscribe(userId: string): void {
    this.engine.emit('notifications:unsubscribe', { userId }, 'normal');
    this.leaveRoom(`notifications:${userId}`);
  }

  // ── In-app notifications ────────────────────────────────────────────────────

  onNew(handler: (notification: Notification) => void): () => void {
    return this.onGlobal('notification:new', handler);
  }

  onBadgeUpdate(handler: (count: number) => void): () => void {
    return this.onGlobal<{ count: number }>('badge:update', d => handler(d.count));
  }

  markRead(notificationId: string): void {
    this.engine.emit('notification:read', { notificationId }, 'normal');
  }

  markAllRead(userId: string): void {
    this.engine.emit('notifications:read_all', { userId }, 'normal');
  }

  onRead(handler: (notificationId: string) => void): () => void {
    return this.onGlobal<{ notificationId: string }>('notification:read', d => handler(d.notificationId));
  }

  // ── Browser Push ─────────────────────────────────────────────────────────────

  async registerBrowserPush(userId: string, vapidPublicKey: string): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      this.#swRegistration = reg;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: this.#urlB64ToUint8Array(vapidPublicKey),
      });

      const json = sub.toJSON();
      const payload: PushRegistrationPayload = {
        userId,
        deviceToken: json.endpoint ?? '',
        platform:    'web',
        endpoint:    json.endpoint,
        p256dh:      (json.keys as { p256dh?: string } | undefined)?.p256dh,
        auth:        (json.keys as { auth?: string } | undefined)?.auth,
      };

      this.engine.emit('push:register', payload, 'high');
      return true;
    } catch {
      return false;
    }
  }

  async unregisterBrowserPush(userId: string): Promise<void> {
    if (!this.#swRegistration) return;
    try {
      const sub = await this.#swRegistration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        this.engine.emit('push:unregister', { userId }, 'normal');
      }
    } catch {}
  }

  // ── Channels ─────────────────────────────────────────────────────────────────

  updateChannelPreferences(userId: string, preferences: Partial<Record<
    'push' | 'email' | 'sms' | 'whatsapp' | 'in_app', boolean
  >>): void {
    this.engine.emit('notifications:preferences:update', { userId, preferences }, 'normal');
  }

  // ── Cleared ───────────────────────────────────────────────────────────────────

  onCleared(handler: () => void): () => void {
    return this.onGlobal('notifications:cleared', handler);
  }

  #urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = atob(base64);
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
}