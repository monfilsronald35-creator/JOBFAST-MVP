// GEO + MAP + DISPATCH ENGINE (Production)

const MAX_CACHE_SIZE = 5000;
const TTL_MS = 1000 * 60 * 5;

const distanceCache = new Map<string, number>();
const scoreCache = new Map<string, number>();
const cacheTTL = new Map<string, number>();

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DriverState extends GeoPoint {
  available: boolean;
  lastSeen: number;
}

export interface Driver extends GeoPoint {
  id: string;
  rating?: number;
  acceptanceRate?: number;
  surgeZone?: boolean;
  zone?: string;
  [key: string]: unknown;
}

export interface DispatchRequest extends GeoPoint {
  id: string;
  zone?: string;
  [key: string]: unknown;
}

export interface ScoredDriver extends Driver {
  distanceKm: number;
  etaMinutes: number;
  score: number;
}

export interface DispatchResult {
  request: DispatchRequest;
  bestDriver: ScoredDriver | null;
}

export interface SurgeData {
  demand: number;
  supply: number;
  ratio: number;
  surgeMultiplier: number;
}

export interface HeatmapPoint extends GeoPoint {
  weight?: number;
}

export interface HeatmapCell {
  id: string;
  intensity: number;
  lat: number;
  lng: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}

function safeCacheSet<T>(
  map: Map<string, T>,
  ttlMap: Map<string, number>,
  key: string,
  value: T,
): void {
  if (map.size >= MAX_CACHE_SIZE) {
    const firstKey = map.keys().next().value as string | undefined;
    if (firstKey !== undefined) {
      map.delete(firstKey);
      ttlMap.delete(firstKey);
    }
  }
  map.set(key, value);
  ttlMap.set(key, Date.now());
}

function isExpired(key: string): boolean {
  const time = cacheTTL.get(key);
  return time !== undefined && Date.now() - time > TTL_MS;
}

function cacheKey(a: number, b: number, c: number, d: number): string {
  return `${a.toFixed(5)}_${b.toFixed(5)}_${c.toFixed(5)}_${d.toFixed(5)}`;
}

// ── Validation ─────────────────────────────────────────────────────────────

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const la = normalizeNumber(lat);
  const ln = normalizeNumber(lng);
  return la !== null && ln !== null && la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
}

// ── Distance (Haversine) ───────────────────────────────────────────────────

export function getDistanceKm(lat1: unknown, lng1: unknown, lat2: unknown, lng2: unknown): number {
  if (!isValidLatLng(lat1, lng1) || !isValidLatLng(lat2, lng2)) return Infinity;

  const a1 = normalizeNumber(lat1)!;
  const b1 = normalizeNumber(lng1)!;
  const a2 = normalizeNumber(lat2)!;
  const b2 = normalizeNumber(lng2)!;

  const key = cacheKey(a1, b1, a2, b2);
  const cached = distanceCache.get(key);
  if (cached !== undefined && !isExpired(key)) return cached;

  const R = 6371;
  const dLat = toRad(a2 - a1);
  const dLng = toRad(b2 - b1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) ** 2;
  const result = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  safeCacheSet(distanceCache, cacheTTL, key, result);
  return result;
}

// ── Driver state engine ────────────────────────────────────────────────────

const driverState = new Map<string, DriverState>();

export function updateDriverHeartbeat(driverId: string, location: Partial<DriverState>): void {
  if (!driverId || !isValidLatLng(location?.lat, location?.lng)) return;
  driverState.set(driverId, {
    lat: location.lat!,
    lng: location.lng!,
    available: location.available ?? true,
    lastSeen: Date.now(),
  });
}

export function isDriverOnline(driver: Pick<Driver, 'id'>): boolean {
  const d = driverState.get(driver.id);
  return !!d && Date.now() - d.lastSeen < 15000;
}

export function getActiveDrivers(): Array<DriverState & { id: string }> {
  const now = Date.now();
  return Array.from(driverState.entries())
    .filter(([, d]) => now - d.lastSeen < 15000 && d.available)
    .map(([id, d]) => ({ id, ...d }));
}

export function setDriverAvailability(driverId: string, available: boolean): void {
  const d = driverState.get(driverId);
  if (!d) return;
  driverState.set(driverId, { ...d, available });
}

// ── Zone & score engine ───────────────────────────────────────────────────

export function zoneBoost(driver: Driver, request: DispatchRequest): number {
  if (!driver?.zone || !request?.zone) return 1;
  return driver.zone === request.zone ? 1.3 : 1;
}

export function scoreDriver(driver: Driver, request: DispatchRequest, distanceKm: number): number {
  const key = `${driver.id}_${request.id}_${distanceKm}`;
  const cached = scoreCache.get(key);
  if (cached !== undefined && !isExpired(key)) return cached;

  const rating = Number(driver.rating ?? 4.5);
  const acceptance = Number(driver.acceptanceRate ?? 0.8);
  const distanceScore = Math.max(0, 100 - distanceKm * 8);
  const ratingScore = rating * 12;
  const acceptanceScore = acceptance * 15;
  const surgeBoost = driver.surgeZone ? 1.25 : 1;
  const zoneMultiplier = zoneBoost(driver, request);
  const score = (distanceScore + ratingScore + acceptanceScore) * surgeBoost * zoneMultiplier;

  safeCacheSet(scoreCache, cacheTTL, key, score);
  return score;
}

// ── Dispatch engine ────────────────────────────────────────────────────────

export function assignBestDriver({
  request,
  drivers = [],
  maxPickupKm = 15,
}: {
  request: DispatchRequest;
  drivers?: Driver[];
  maxPickupKm?: number;
}): ScoredDriver | null {
  if (!request || !isValidLatLng(request.lat, request.lng)) return null;

  const scored = drivers
    .filter((d) => isValidLatLng(d.lat, d.lng) && isDriverOnline(d))
    .map((driver) => {
      const distanceKm = getDistanceKm(request.lat, request.lng, driver.lat, driver.lng);
      if (distanceKm > maxPickupKm) return null;
      return {
        ...driver,
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes: Math.max(2, Math.round(distanceKm * 2)),
        score: Number(scoreDriver(driver, request, distanceKm).toFixed(2)),
      } satisfies ScoredDriver;
    })
    .filter((d): d is ScoredDriver => d !== null)
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

export function getDriversInRadius(center: GeoPoint, radiusKm = 5, drivers: Driver[] = []): Driver[] {
  return drivers.filter((d) => {
    if (!isValidLatLng(d.lat, d.lng)) return false;
    return getDistanceKm(center.lat, center.lng, d.lat, d.lng) <= radiusKm;
  });
}

export function createDispatchQueue(
  requests: DispatchRequest[] = [],
  drivers: Driver[] = [],
): DispatchResult[] {
  const activeDrivers = drivers.filter(isDriverOnline);
  return requests.map((request) => ({
    request,
    bestDriver: assignBestDriver({ request, drivers: activeDrivers }),
  }));
}

// ── Surge engine ───────────────────────────────────────────────────────────

export function calculateSurge(requests: unknown[] = [], drivers: unknown[] = []): SurgeData {
  const demand = requests.length;
  const supply = drivers.length || 1;
  const ratio = demand / supply;
  return {
    demand,
    supply,
    ratio: Number(ratio.toFixed(2)),
    surgeMultiplier:
      ratio > 3 ? 2.3 : ratio > 2 ? 1.7 : ratio > 1 ? 1.3 : 1.0,
  };
}

// ── Heatmap engine ─────────────────────────────────────────────────────────

export function buildHeatmapGrid(points: HeatmapPoint[] = [], cellSize = 1): HeatmapCell[] {
  const grid = new Map<string, HeatmapCell>();
  for (const p of points) {
    if (!isValidLatLng(p.lat, p.lng)) continue;
    const x = Math.floor(p.lat / cellSize);
    const y = Math.floor(p.lng / cellSize);
    const key = `${x}:${y}`;
    const cell = grid.get(key) ?? { id: key, intensity: 0, lat: x * cellSize, lng: y * cellSize };
    cell.intensity += p.weight ?? 1;
    grid.set(key, cell);
  }
  return [...grid.values()].sort((a, b) => b.intensity - a.intensity);
}

const geo = {
  getDistanceKm,
  isValidLatLng,
  assignBestDriver,
  createDispatchQueue,
  calculateSurge,
  buildHeatmapGrid,
  getDriversInRadius,
  updateDriverHeartbeat,
  getActiveDrivers,
  setDriverAvailability,
} as const;

export default geo;