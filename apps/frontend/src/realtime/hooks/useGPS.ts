/**
 * useGPS — live location tracking, ETA, route updates, geofencing.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { LocationPayload, ETAPayload, RouteUpdatePayload, GeofenceEvent } from '../types';

export interface UseGPSOptions {
  readonly trackUserIds?: ReadonlyArray<{ userId: string; role: LocationPayload['role'] }>;
  readonly publishAs?:   { userId: string; role: LocationPayload['role'] };
}

export interface UseGPSReturn {
  readonly locations:     Readonly<Record<string, LocationPayload>>;
  readonly etas:          Readonly<Record<string, ETAPayload>>;
  readonly routes:        Readonly<Record<string, RouteUpdatePayload>>;
  readonly geofenceEvents: readonly GeofenceEvent[];
  readonly startPublishing: () => () => void;
  readonly requestETA:    (trackingId: string) => void;
  readonly registerGeofence: typeof import('../channels/GPSChannel').GPSChannel.prototype.registerGeofence;
}

export function useGPS({ trackUserIds, publishAs }: UseGPSOptions = {}): UseGPSReturn {
  const { gps } = useRealtimeContext();
  const [locations, setLocations] = useState<Record<string, LocationPayload>>({});
  const [etas,      setETAs]      = useState<Record<string, ETAPayload>>({});
  const [routes,    setRoutes]    = useState<Record<string, RouteUpdatePayload>>({});
  const [geofences, setGeofences] = useState<GeofenceEvent[]>([]);

  useEffect(() => {
    const offLoc  = gps.onLocationUpdate(p =>
      setLocations(prev => ({ ...prev, [p.userId]: p }))
    );
    const offETA  = gps.onETAUpdate(e =>
      setETAs(prev => ({ ...prev, [e.trackingId]: e }))
    );
    const offRoute = gps.onRouteUpdate(r =>
      setRoutes(prev => ({ ...prev, [r.trackingId]: r }))
    );
    const offGeo  = gps.onGeofenceEvent(e =>
      setGeofences(prev => [e, ...prev].slice(0, 50))
    );

    // Start tracking subscriptions
    trackUserIds?.forEach(({ userId, role }) => gps.trackUser(userId, role));

    return () => {
      offLoc(); offETA(); offRoute(); offGeo();
      trackUserIds?.forEach(({ userId, role }) => gps.stopTrackingUser(userId, role));
    };
  }, [gps, trackUserIds?.map(t => `${t.userId}:${t.role}`).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPublishing = useCallback(() => {
    if (!publishAs) return () => {};
    return gps.startTracking(publishAs.userId, publishAs.role);
  }, [gps, publishAs?.userId, publishAs?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestETA = useCallback((trackingId: string) =>
    gps.requestETA(trackingId), [gps]);

  const registerGeofence = useCallback(
    gps.registerGeofence.bind(gps),
    [gps],
  );

  return { locations, etas, routes, geofenceEvents: geofences, startPublishing, requestETA, registerGeofence };
}