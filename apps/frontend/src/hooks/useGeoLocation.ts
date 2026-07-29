/**
 * useGeoLocation — Enterprise geolocation with reverse geocoding.
 * Wraps the existing useGPS hook, adds:
 *   - Reverse geocoding (coords → human-readable label)
 *   - Manual location override
 *   - 10-min in-memory cache per coordinate pair
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import useGPS from './useGPS';
import API from '../api/axios';
import type { GeoLocation } from '../types';

// ─── In-memory geocode cache (TTL: 10 min) ────────────────────────────────────
const geocodeCache = new Map<string, { full: GeoLocation; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60_000;

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function buildGeoLocation(
  lat: number,
  lng: number,
  label: string,
  city?: string,
  country?: string,
  countryCode?: string,
): GeoLocation {
  return {
    lat,
    lng,
    label,
    ...(city !== undefined ? { city } : {}),
    ...(country !== undefined ? { country } : {}),
    ...(countryCode !== undefined ? { countryCode } : {}),
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation> {
  const key = cacheKey(lat, lng);
  const cached = geocodeCache.get(key);
  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.full;
  }

  // ── Try backend geocoding first ──────────────────────────────────────────
  try {
    const res = await API.get<{
      data: {
        label: string;
        city?: string;
        country?: string;
        countryCode?: string;
        lat: number;
        lng: number;
      };
    }>('/geo/reverse', { params: { lat, lng } });
    const d = res.data.data;
    const result = buildGeoLocation(lat, lng, d.label, d.city, d.country, d.countryCode);
    geocodeCache.set(key, { full: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    // fall through to Nominatim
  }

  // ── Fallback: Nominatim open API (no key required) ───────────────────────
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'fr,ht,en' } },
    );
    const data = (await response.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
        country_code?: string;
      };
    };
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village;
    const country = addr.country;
    const countryCode = addr.country_code;
    const labelParts = [city, country].filter((v): v is string => v !== undefined);
    const label =
      labelParts.length > 0
        ? labelParts.join(', ')
        : (data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    const result = buildGeoLocation(lat, lng, label, city, country, countryCode);
    geocodeCache.set(key, { full: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return buildGeoLocation(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  }
}

// ─── Coordinate extraction (useGPS may return { lat, lng } or GeolocationCoordinates) ─
function extractCoords(
  coords: unknown,
): { lat: number; lng: number } | null {
  if (coords == null || typeof coords !== 'object') return null;
  const c = coords as Record<string, unknown>;
  const lat = typeof c['lat'] === 'number' ? c['lat'] : typeof c['latitude'] === 'number' ? c['latitude'] : null;
  const lng = typeof c['lng'] === 'number' ? c['lng'] : typeof c['longitude'] === 'number' ? c['longitude'] : null;
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface GeoLocationReturn {
  readonly locationLabel: string;
  readonly fullLocation: GeoLocation | null;
  readonly setManualLocation: (label: string, geo?: Partial<GeoLocation>) => void;
  readonly gpsLoading: boolean;
  readonly gpsError: string | null;
  readonly clearLocation: () => void;
}

export function useGeoLocation(): GeoLocationReturn {
  const gps = useGPS();
  const [locationLabel, setLocationLabel] = useState('');
  const [fullLocation, setFullLocation] = useState<GeoLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const geocodingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Reverse-geocode when GPS coords arrive ────────────────────────────────
  useEffect(() => {
    const parsed = extractCoords(gps.coords);
    if (parsed === null || geocodingRef.current) return;

    const { lat, lng } = parsed;
    geocodingRef.current = true;
    setGpsLoading(true);
    setGpsError(null);

    reverseGeocode(lat, lng)
      .then((geo) => {
        if (!mountedRef.current) return;
        setLocationLabel(geo.label);
        setFullLocation(geo);
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setGpsError(err instanceof Error ? err.message : 'Geocoding failed');
      })
      .finally(() => {
        geocodingRef.current = false;
        if (mountedRef.current) setGpsLoading(false);
      });
  }, [gps.coords]);

  // ── Propagate GPS hook errors ─────────────────────────────────────────────
  useEffect(() => {
    if (gps.error) setGpsError(gps.error);
  }, [gps.error]);

  const setManualLocation = useCallback(
    (label: string, geo?: Partial<GeoLocation>): void => {
      setLocationLabel(label);
      setFullLocation(
        geo !== undefined
          ? buildGeoLocation(geo.lat ?? 0, geo.lng ?? 0, label, geo.city, geo.country, geo.countryCode)
          : null,
      );
      setGpsError(null);
    },
    [],
  );

  const clearLocation = useCallback((): void => {
    setLocationLabel('');
    setFullLocation(null);
    setGpsError(null);
  }, []);

  return {
    locationLabel,
    fullLocation,
    setManualLocation,
    gpsLoading: gpsLoading || gps.gpsState === 'acquiring',
    gpsError,
    clearLocation,
  };
}