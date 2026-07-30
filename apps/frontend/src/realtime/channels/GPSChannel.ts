/**
 * GPSChannel — live driver/worker/customer tracking, ETA, routes, geofencing.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type {
  LocationPayload, ETAPayload, RouteUpdatePayload, GeofenceEvent,
} from '../types';

const PUBLISH_THROTTLE_MS = 2_000;

export class GPSChannel extends BaseChannel {
  #lastPublish = 0;
  #watchId: number | null = null;
  #activeTracking = new Set<string>();

  constructor(engine: RealtimeEngine) {
    super(engine, 'gps');
  }

  // ── Publish own location ─────────────────────────────────────────────────────

  publishLocation(payload: LocationPayload): void {
    const now = Date.now();
    if (now - this.#lastPublish < PUBLISH_THROTTLE_MS) return;
    this.#lastPublish = now;
    this.engine.emit('gps:location:update', payload, 'high');
  }

  // Start browser geolocation watch + auto-publish
  startTracking(userId: string, role: LocationPayload['role']): () => void {
    if (!('geolocation' in navigator)) return () => {};

    this.#watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.publishLocation({
          userId, role,
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading:  pos.coords.heading ?? undefined,
          speed:    pos.coords.speed   ?? undefined,
          timestamp: Date.now(),
        });
      },
      (err) => {
        this.engine.telemetry.warn('Geolocation error', { code: err.code, message: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => { this.stopTracking(); };
  }

  stopTracking(): void {
    if (this.#watchId !== null) {
      navigator.geolocation.clearWatch(this.#watchId);
      this.#watchId = null;
    }
  }

  // ── Track others ─────────────────────────────────────────────────────────────

  trackUser(userId: string, role: LocationPayload['role']): void {
    const room = `gps:${role}:${userId}`;
    if (this.#activeTracking.has(room)) return;
    this.#activeTracking.add(room);
    this.engine.emit('gps:track:start', { userId, role }, 'high');
    this.joinRoom(room);
  }

  stopTrackingUser(userId: string, role: LocationPayload['role']): void {
    const room = `gps:${role}:${userId}`;
    this.#activeTracking.delete(room);
    this.engine.emit('gps:track:stop', { userId, role }, 'normal');
    this.leaveRoom(room);
  }

  onLocationUpdate(handler: (payload: LocationPayload) => void): () => void {
    return this.onGlobal('gps:location:update', handler);
  }

  onLocationUpdateFor(userId: string, handler: (payload: LocationPayload) => void): () => void {
    return this.onGlobal<LocationPayload>('gps:location:update', p => {
      if (p.userId === userId) handler(p);
    });
  }

  // ── ETA ──────────────────────────────────────────────────────────────────────

  requestETA(trackingId: string): void {
    this.engine.emit('gps:eta:request', { trackingId }, 'normal');
  }

  onETAUpdate(handler: (eta: ETAPayload) => void): () => void {
    return this.onGlobal('gps:eta:update', handler);
  }

  // ── Routes ───────────────────────────────────────────────────────────────────

  onRouteUpdate(handler: (route: RouteUpdatePayload) => void): () => void {
    return this.onGlobal('gps:route:update', handler);
  }

  // ── Geofencing ───────────────────────────────────────────────────────────────

  registerGeofence(geofence: {
    id:       string;
    name:     string;
    lat:      number;
    lng:      number;
    radiusM:  number;
    triggers: ('enter' | 'exit' | 'dwell')[];
  }): void {
    this.engine.emit('gps:geofence:register', geofence, 'normal');
  }

  removeGeofence(geofenceId: string): void {
    this.engine.emit('gps:geofence:remove', { geofenceId }, 'normal');
  }

  onGeofenceEvent(handler: (event: GeofenceEvent) => void): () => void {
    return this.onGlobal('gps:geofence:event', handler);
  }

  onGeofenceEnter(handler: (event: GeofenceEvent) => void): () => void {
    return this.onGlobal<GeofenceEvent>('gps:geofence:event', e => {
      if (e.action === 'enter') handler(e);
    });
  }

  onGeofenceExit(handler: (event: GeofenceEvent) => void): () => void {
    return this.onGlobal<GeofenceEvent>('gps:geofence:event', e => {
      if (e.action === 'exit') handler(e);
    });
  }

  protected override onDestroy(): void {
    this.stopTracking();
    this.#activeTracking.forEach(room => this.leaveRoom(room));
    this.#activeTracking.clear();
  }
}