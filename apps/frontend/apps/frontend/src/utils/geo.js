//////////////////////////////////////////////////////
// 🌍 GEO + MAP + DISPATCH ENGINE V7.2 (PRODUCTION FINAL)
//////////////////////////////////////////////////////

/* ======================================================
   📌 UTILITIES
====================================================== */

const normalizeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const isValidLatLng = (lat, lng) => {
  const la = normalizeNumber(lat);
  const ln = normalizeNumber(lng);

  return (
    la !== null &&
    ln !== null &&
    la >= -90 &&
    la <= 90 &&
    ln >= -180 &&
    ln <= 180
  );
};

const toRad = (v) => (v * Math.PI) / 180;

/* ======================================================
   ⚡ CACHE SYSTEM (HIGH PERFORMANCE + TTL)
====================================================== */

const MAX_CACHE_SIZE = 5000;
const TTL_MS = 1000 * 60 * 5;

const distanceCache = new Map();
const scoreCache = new Map();
const cacheTTL = new Map();

const safeCacheSet = (map, ttlMap, key, value) => {
  if (map.size >= MAX_CACHE_SIZE) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
    ttlMap?.delete(firstKey);
  }

  map.set(key, value);
  ttlMap?.set(key, Date.now());
};

const isExpired = (key) => {
  const time = cacheTTL.get(key);
  return time && Date.now() - time > TTL_MS;
};

/* ======================================================
   📏 DISTANCE ENGINE (HAVERSINE OPTIMIZED)
====================================================== */

const cacheKey = (a, b, c, d) =>
  `${a.toFixed(5)}_${b.toFixed(5)}_${c.toFixed(5)}_${d.toFixed(5)}`;

export const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  if (
    !isValidLatLng(lat1, lng1) ||
    !isValidLatLng(lat2, lng2)
  ) return Infinity;

  const a1 = normalizeNumber(lat1);
  const b1 = normalizeNumber(lng1);
  const a2 = normalizeNumber(lat2);
  const b2 = normalizeNumber(lng2);

  const key = cacheKey(a1, b1, a2, b2);

  if (distanceCache.has(key) && !isExpired(key)) {
    return distanceCache.get(key);
  }

  const R = 6371;
  const dLat = toRad(a2 - a1);
  const dLng = toRad(b2 - b1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) *
    Math.cos(toRad(a2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const result = R * c;

  safeCacheSet(distanceCache, cacheTTL, key, result);

  return result;
};

/* ======================================================
   🚗 DRIVER STATE ENGINE (REAL TIME)
====================================================== */

const driverState = new Map();
const REQUESTS = new Map();

/* HEARTBEAT */
export const updateDriverHeartbeat = (driverId, location) => {
  if (!driverId || !isValidLatLng(location?.lat, location?.lng)) return;

  driverState.set(driverId, {
    ...location,
    available: location.available ?? true,
    lastSeen: Date.now(),
  });
};

/* ONLINE CHECK */
export const isDriverOnline = (driver) => {
  const d = driverState.get(driver.id);
  return !!d && Date.now() - d.lastSeen < 15000;
};

/* ACTIVE DRIVERS */
export const getActiveDrivers = () => {
  const now = Date.now();

  return Array.from(driverState.entries())
    .filter(([_, d]) => now - d.lastSeen < 15000 && d.available)
    .map(([id, d]) => ({ id, ...d }));
};

/* AVAILABILITY */
export const setDriverAvailability = (driverId, available) => {
  const d = driverState.get(driverId);
  if (!d) return;
  driverState.set(driverId, { ...d, available });
};

/* ======================================================
   🧠 ZONE SYSTEM
====================================================== */

export const zoneBoost = (driver, request) => {
  if (!driver?.zone || !request?.zone) return 1;
  return driver.zone === request.zone ? 1.3 : 1;
};

/* ======================================================
   🧠 SCORE ENGINE (UBER STYLE LOGIC)
====================================================== */

export const scoreDriver = (driver, request, distanceKm) => {
  const key = `${driver.id}_${request.id}_${distanceKm}`;

  if (scoreCache.has(key) && !isExpired(key)) {
    return scoreCache.get(key);
  }

  const rating = Number(driver.rating || 4.5);
  const acceptance = Number(driver.acceptanceRate || 0.8);

  const distanceScore = Math.max(0, 100 - distanceKm * 8);
  const ratingScore = rating * 12;
  const acceptanceScore = acceptance * 15;

  const surgeBoost = driver.surgeZone ? 1.25 : 1;
  const zoneMultiplier = zoneBoost(driver, request);

  const score =
    (distanceScore + ratingScore + acceptanceScore) *
    surgeBoost *
    zoneMultiplier;

  safeCacheSet(scoreCache, cacheTTL, key, score);

  return score;
};

/* ======================================================
   🚚 DISPATCH ENGINE (CORE MATCHING SYSTEM)
====================================================== */

export const assignBestDriver = ({
  request,
  drivers = [],
  maxPickupKm = 15,
}) => {
  if (!request || !isValidLatLng(request.lat, request.lng)) {
    return null;
  }

  const scored = drivers
    .filter(
      (d) =>
        isValidLatLng(d.lat, d.lng) &&
        isDriverOnline(d)
    )
    .map((driver) => {
      const distanceKm = getDistanceKm(
        request.lat,
        request.lng,
        driver.lat,
        driver.lng
      );

      if (distanceKm > maxPickupKm) return null;

      const score = scoreDriver(driver, request, distanceKm);

      return {
        ...driver,
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes: Math.max(2, Math.round(distanceKm * 2)),
        score: Number(score.toFixed(2)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
};

/* ======================================================
   📍 RADIUS SEARCH ENGINE
====================================================== */

export const getDriversInRadius = (center, radiusKm = 5, drivers = []) => {
  return drivers.filter((d) => {
    if (!isValidLatLng(d.lat, d.lng)) return false;

    const dist = getDistanceKm(
      center.lat,
      center.lng,
      d.lat,
      d.lng
    );

    return dist <= radiusKm;
  });
};

/* ======================================================
   🚚 DISPATCH QUEUE (BATCH PROCESSING)
====================================================== */

export const createDispatchQueue = (requests = [], drivers = []) => {
  const activeDrivers = drivers.filter(isDriverOnline);

  return requests.map((request) => ({
    request,
    bestDriver: assignBestDriver({
      request,
      drivers: activeDrivers,
    }),
  }));
};

/* ======================================================
   📊 SURGE ENGINE
====================================================== */

export const calculateSurge = (requests = [], drivers = []) => {
  const demand = requests.length;
  const supply = drivers.length || 1;

  const ratio = demand / supply;

  return {
    demand,
    supply,
    ratio: Number(ratio.toFixed(2)),
    surgeMultiplier:
      ratio > 3 ? 2.3 :
      ratio > 2 ? 1.7 :
      ratio > 1 ? 1.3 : 1.0,
  };
};

/* ======================================================
   📊 HEATMAP ENGINE
====================================================== */

export const buildHeatmapGrid = (points = [], cellSize = 1) => {
  const grid = new Map();

  for (const p of points) {
    if (!isValidLatLng(p.lat, p.lng)) continue;

    const x = Math.floor(p.lat / cellSize);
    const y = Math.floor(p.lng / cellSize);
    const key = `${x}:${y}`;

    const cell = grid.get(key) || {
      id: key,
      intensity: 0,
      lat: x * cellSize,
      lng: y * cellSize,
    };

    cell.intensity += p.weight || 1;
    grid.set(key, cell);
  }

  return Array.from(grid.values()).sort(
    (a, b) => b.intensity - a.intensity
  );
};

/* ======================================================
   🔥 EXPORT TOOLKIT (FINAL API)
====================================================== */

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
};

export default geo;