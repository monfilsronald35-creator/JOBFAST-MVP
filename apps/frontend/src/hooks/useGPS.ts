import { useState, useCallback, useRef } from 'react';
import { GPS_CACHE_TTL_MS, GPS_THROTTLE_MS, GPS_STATES, type GpsState } from '../config/gpsConfig';

const CACHE_KEY = 'jobfast_gps_cache';

export interface Coords { lat: number; lng: number; }

interface CacheEntry { coords: Coords; timestamp: number; }

function readCache(): Coords | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { coords, timestamp } = JSON.parse(raw) as CacheEntry;
    if (Date.now() - timestamp > GPS_CACHE_TTL_MS) return null;
    return coords;
  } catch { return null; }
}

function writeCache(coords: Coords): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ coords, timestamp: Date.now() }));
  } catch {}
}

export function clearGPSCache(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export { GPS_STATES };

export interface AcquireOptions {
  force?:     boolean;
  onSuccess?: (c: Coords) => void;
  onError?:   (state: GpsState) => void;
}

export default function useGPS() {
  const [coords,   setCoords]   = useState<Coords | null>(() => readCache());
  const [gpsState, setGpsState] = useState<GpsState>(() =>
    readCache() ? GPS_STATES.cached : GPS_STATES.idle
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const lastAcquireRef          = useRef<number>(0);

  const acquire = useCallback(({ force = false, onSuccess, onError }: AcquireOptions = {}) => {
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

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c); setAccuracy(pos.coords.accuracy);
        setGpsState(GPS_STATES.ready); setError(null);
        writeCache(c); onSuccess?.(c);
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(c); setAccuracy(pos.coords.accuracy);
            setGpsState(GPS_STATES.low_accuracy);
            setError('Lokasyon presizon ba — GPS fasil');
            writeCache(c); onSuccess?.(c);
          },
          (err) => {
            const state: GpsState =
              err.code === 1 ? GPS_STATES.denied
              : err.code === 2 ? GPS_STATES.disabled
              : GPS_STATES.unavailable;

            const msg = err.code === 1
              ? 'GPS refize — itilize lokasyon manyèl'
              : 'GPS pa ka jwenn lokasyon';

            setGpsState(state); setError(msg);

            const cached = readCache();
            if (cached) { setCoords(cached); setGpsState(GPS_STATES.cached); }
            onError?.(state);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  const setManual = useCallback((c: Coords) => {
    setCoords(c); setGpsState(GPS_STATES.offline);
    setAccuracy(null); setError(null); writeCache(c);
  }, []);

  return { coords, gpsState, accuracy, error, acquire, setManual, clearCache: clearGPSCache };
}