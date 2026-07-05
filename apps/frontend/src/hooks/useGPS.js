/**
 * useGPS.js
 *
 * Shared GPS hook for all JOBFAST roles.
 * Consolidates the 3-level accuracy fallback previously duplicated
 * across SearchScreen, MarketplaceCore, CompanyDashboard, and
 * EnterpriseDashboard.
 *
 * Features:
 * - Level 1: high-accuracy GPS
 * - Level 2: low-accuracy GPS fallback on failure
 * - Level 3: denied / disabled / unavailable state + offline fallback
 * - Location cached in localStorage with TTL (GPS_CACHE_TTL_MS)
 * - Throttle: skips re-acquire if a recent result exists
 * - Manual override for offline mode
 * - Returns GPS_STATES constant for consumers
 */

import { useState, useCallback, useRef } from 'react';
import { GPS_CACHE_TTL_MS, GPS_THROTTLE_MS, GPS_STATES } from '../config/gpsConfig';

const CACHE_KEY = 'jobfast_gps_cache';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { coords, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > GPS_CACHE_TTL_MS) return null;
    return coords;
  } catch {
    return null;
  }
}

function writeCache(coords) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      coords,
      timestamp: Date.now(),
    }));
  } catch { /* ignore quota errors */ }
}

export function clearGPSCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export { GPS_STATES };

/**
 * useGPS()
 *
 * Returns:
 *   coords      — { lat, lng } | null
 *   gpsState    — one of GPS_STATES values
 *   accuracy    — float (meters) | null
 *   error       — string | null
 *   acquire(opts) — trigger GPS acquisition
 *   setManual(c)  — set coords manually (offline mode)
 *   clearCache()  — remove cached location
 *
 * acquire options:
 *   force      — skip throttle check (default false)
 *   onSuccess  — callback({ lat, lng })
 *   onError    — callback(GPS_STATES value)
 */
export default function useGPS() {
  const [coords,   setCoords]   = useState(() => readCache());
  const [gpsState, setGpsState] = useState(() =>
    readCache() ? GPS_STATES.cached : GPS_STATES.idle
  );
  const [accuracy, setAccuracy] = useState(null);
  const [error,    setError]    = useState(null);
  const lastAcquireRef          = useRef(0);

  const acquire = useCallback(({ force = false, onSuccess, onError } = {}) => {
    // Throttle: return cached result if recent enough
    const now = Date.now();
    if (!force && (now - lastAcquireRef.current) < GPS_THROTTLE_MS) {
      const cached = readCache();
      if (cached) {
        setCoords(cached);
        setGpsState(GPS_STATES.cached);
        onSuccess?.(cached);
        return;
      }
    }
    lastAcquireRef.current = now;

    if (!navigator.geolocation) {
      setGpsState(GPS_STATES.unavailable);
      setError('GPS pa disponib sou aparèy sa');
      onError?.(GPS_STATES.unavailable);
      return;
    }

    setGpsState(GPS_STATES.acquiring);
    setError(null);

    // Level 1 — high accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setAccuracy(pos.coords.accuracy);
        setGpsState(GPS_STATES.ready);
        setError(null);
        writeCache(c);
        onSuccess?.(c);
      },
      () => {
        // Level 2 — low accuracy fallback
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(c);
            setAccuracy(pos.coords.accuracy);
            setGpsState(GPS_STATES.low_accuracy);
            setError('Lokasyon presizon ba — GPS fasil');
            writeCache(c);
            onSuccess?.(c);
          },
          (err) => {
            // Level 3 — denied / disabled / unavailable
            const state =
              err.code === 1 ? GPS_STATES.denied
              : err.code === 2 ? GPS_STATES.disabled
              : GPS_STATES.unavailable;

            const msg =
              err.code === 1
                ? 'GPS refize — itilize lokasyon manyèl'
                : 'GPS pa ka jwenn lokasyon';

            setGpsState(state);
            setError(msg);

            // Fall back to cached location if any
            const cached = readCache();
            if (cached) {
              setCoords(cached);
              setGpsState(GPS_STATES.cached);
            }
            onError?.(state);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  /** Set location manually (offline / city-selection mode). */
  const setManual = useCallback((c) => {
    setCoords(c);
    setGpsState(GPS_STATES.offline);
    setAccuracy(null);
    setError(null);
    writeCache(c);
  }, []);

  return {
    coords,
    gpsState,
    accuracy,
    error,
    acquire,
    setManual,
    clearCache: clearGPSCache,
  };
}