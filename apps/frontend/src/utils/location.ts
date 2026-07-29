const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;
const MAX_CACHE_SIZE = 5000;

const distanceCache = new Map<string, number>();

export interface LatLng {
  lat: number | string | null | undefined;
  lng: number | string | null | undefined;
}

export interface NormalizedLocation {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DistanceStatistics {
  min: number | null;
  max: number | null;
  average: number | null;
  totalKm: number;
  count: number;
}

export interface CacheStatistics {
  size: number;
  maxSize: number;
  usage: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toSafeString(value: unknown): string {
  return String(value ?? '').trim();
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function createCacheKey(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const a = `${lat1}:${lng1}`;
  const b = `${lat2}:${lng2}`;
  return [a, b].sort().join('|');
}

function setCache(key: string, value: number): void {
  if (!distanceCache.has(key) && distanceCache.size >= MAX_CACHE_SIZE) {
    const firstKey = distanceCache.keys().next().value as string | undefined;
    if (firstKey !== undefined) distanceCache.delete(firstKey);
  }
  distanceCache.set(key, value);
}

// ── Validation ─────────────────────────────────────────────────────────────

export function hasValidCoordinates(location: Partial<LatLng> | null | undefined): boolean {
  if (!location) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

export function removeInvalidLocations<T extends { location?: Partial<LatLng> }>(items: T[]): T[] {
  return items.filter((item) => hasValidCoordinates(item?.location));
}

// ── Normalization ──────────────────────────────────────────────────────────

export function normalizeLocation(location: Partial<NormalizedLocation> = {}): NormalizedLocation {
  return {
    city:    toSafeString(location?.city),
    state:   toSafeString(location?.state),
    country: toSafeString(location?.country),
    lat:     toNumber(location?.lat),
    lng:     toNumber(location?.lng),
  };
}

export function formatLocation(location: Partial<NormalizedLocation> = {}): string {
  return [location?.city, location?.state, location?.country].filter(Boolean).join(', ');
}

// ── Distance (Haversine) ───────────────────────────────────────────────────

export function calculateDistanceKm(
  lat1: unknown,
  lng1: unknown,
  lat2: unknown,
  lng2: unknown,
): number | null {
  const start = { lat: toNumber(lat1), lng: toNumber(lng1) };
  const end   = { lat: toNumber(lat2), lng: toNumber(lng2) };
  if (!hasValidCoordinates(start) || !hasValidCoordinates(end)) return null;

  const key = createCacheKey(start.lat, start.lng, end.lat, end.lng);
  const cached = distanceCache.get(key);
  if (Number.isFinite(cached ?? NaN)) return cached!;

  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) *
    Math.sin(dLng / 2) ** 2;
  const distance = EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  setCache(key, distance);
  return distance;
}

export function calculateDistanceMiles(
  lat1: unknown, lng1: unknown, lat2: unknown, lng2: unknown,
): number | null {
  const km = calculateDistanceKm(lat1, lng1, lat2, lng2);
  return Number.isFinite(km ?? NaN) ? km! * KM_TO_MILES : null;
}

export function formatDistance(distanceKm: number | null | undefined): string {
  if (!Number.isFinite(distanceKm ?? NaN)) return 'Unknown';
  const d = distanceKm!;
  if (d < 1) return `${Math.round(d * 1000)} m`;
  return `${d.toFixed(1)} km`;
}

export function isWithinRadius(distanceKm: number | null | undefined, radiusKm = 10): boolean {
  return Number.isFinite(distanceKm ?? NaN) && distanceKm! <= radiusKm;
}

export function kmToMiles(km: number): number | null {
  return Number.isFinite(km) ? km * KM_TO_MILES : null;
}

export function milesToKm(miles: number): number | null {
  return Number.isFinite(miles) ? miles / KM_TO_MILES : null;
}

// ── Statistics ─────────────────────────────────────────────────────────────

export function getDistanceStatistics(
  items: Array<{ distanceKm?: number | null }>,
): DistanceStatistics {
  const distances = items.map((i) => i?.distanceKm).filter(
    (d): d is number => Number.isFinite(d ?? NaN),
  );
  if (!distances.length) return { min: null, max: null, average: null, totalKm: 0, count: 0 };

  let min = distances[0]!;
  let max = distances[0]!;
  let total = 0;
  for (const d of distances) {
    if (d < min) min = d;
    if (d > max) max = d;
    total += d;
  }
  return { min, max, average: total / distances.length, totalKm: total, count: distances.length };
}

export function attachDistance<T extends { location?: Partial<NormalizedLocation> }>(
  items: T[],
  currentLocation: Partial<NormalizedLocation> = {},
): (T & { distanceKm: number | null })[] {
  const origin = normalizeLocation(currentLocation);
  if (!hasValidCoordinates(origin)) return items.map((i) => ({ ...i, distanceKm: null }));
  return items.map((item) => {
    const loc = normalizeLocation(item?.location ?? {});
    return { ...item, distanceKm: calculateDistanceKm(origin.lat, origin.lng, loc.lat, loc.lng) };
  });
}

export function sortByDistance<T extends { distanceKm?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a?.distanceKm ?? Infinity) - (b?.distanceKm ?? Infinity));
}

export function filterNearby<T extends { distanceKm?: number | null }>(
  items: T[], radiusKm = 10,
): T[] {
  return items.filter((i) => isWithinRadius(i?.distanceKm, radiusKm));
}

export function findNearestItem<T extends { distanceKm?: number | null }>(
  items: T[],
): T | null {
  return sortByDistance(items)[0] ?? null;
}

export function findNearestItems<T extends { distanceKm?: number | null }>(
  items: T[], limit = 10,
): T[] {
  return sortByDistance(items).slice(0, limit);
}

// ── GPS ────────────────────────────────────────────────────────────────────

export interface GpsCoords {
  lat: number;
  lng: number;
}

export function getCurrentPosition(): Promise<GpsCoords> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  });
}

export function watchPosition(
  success: (coords: GpsCoords) => void,
  error?: PositionErrorCallback,
): number | null {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    error?.(new GeolocationPositionError());
    return null;
  }
  return navigator.geolocation.watchPosition(
    ({ coords }) => success({ lat: coords.latitude, lng: coords.longitude }),
    error,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
  );
}

export function stopWatchingPosition(watchId: number | null): void {
  if (typeof window !== 'undefined' && navigator.geolocation && watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export function getLocationAccuracy(coords: { accuracy?: number } = {}): number | null {
  return Number.isFinite(coords?.accuracy) ? (coords.accuracy as number) : null;
}

// ── Bounding Box ───────────────────────────────────────────────────────────

export function calculateBoundingBox(
  lat: unknown, lng: unknown, radiusKm = 10,
): Readonly<BoundingBox> | null {
  const latitude  = toNumber(lat);
  const longitude = toNumber(lng);
  if (!hasValidCoordinates({ lat: latitude, lng: longitude })) return null;

  const latDelta = radiusKm / 111;
  const cosLat = Math.cos(toRadians(latitude));
  const lngDelta = radiusKm / (111 * Math.max(cosLat, 0.001));

  return Object.freeze({
    minLat: Math.max(-90,  latitude  - latDelta),
    maxLat: Math.min(90,   latitude  + latDelta),
    minLng: Math.max(-180, longitude - lngDelta),
    maxLng: Math.min(180,  longitude + lngDelta),
  });
}

// ── Grouping ───────────────────────────────────────────────────────────────

type WithLocation = { location?: { city?: string; country?: string; state?: string } };

export function groupByCity<T extends WithLocation>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const city = item?.location?.city ?? 'Unknown';
    (groups[city] ??= []).push(item);
    return groups;
  }, {});
}

export function groupByCountry<T extends WithLocation>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const country = item?.location?.country ?? 'Unknown';
    (groups[country] ??= []).push(item);
    return groups;
  }, {});
}

export function groupByState<T extends WithLocation>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const state = item?.location?.state ?? 'Unknown';
    (groups[state] ??= []).push(item);
    return groups;
  }, {});
}

export function sortByNearestCity<T extends { distanceKm?: number | null }>(
  groups: Record<string, T[]>,
): Record<string, T[]> {
  const getMin = (items: T[]): number => {
    let min = Infinity;
    for (const item of items) {
      const d = item?.distanceKm;
      if (Number.isFinite(d ?? NaN) && d! < min) min = d!;
    }
    return min;
  };
  return Object.fromEntries(
    Object.entries(groups)
      .sort(([, a], [, b]) => getMin(a) - getMin(b)),
  );
}

// ── Cache lifecycle ────────────────────────────────────────────────────────

export function clearDistanceCache(): void { distanceCache.clear(); }
export function getCacheSize(): number { return distanceCache.size; }
export function getCacheStatistics(): CacheStatistics {
  return {
    size: distanceCache.size,
    maxSize: MAX_CACHE_SIZE,
    usage: (distanceCache.size / MAX_CACHE_SIZE) * 100,
  };
}