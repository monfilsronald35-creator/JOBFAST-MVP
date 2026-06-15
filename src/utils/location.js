/* =========================================================================
   🌍 JOBFAST LOCATION ENGINE
   FILE: src/utils/location.js
   PRODUCTION READY+ (v4.4 - PREMIUM ENTERPRISE PLUS OPTIMIZED)
========================================================================= */

const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;
const MAX_CACHE_SIZE = 5000;

const distanceCache = new Map();

/* =========================================================================
   ⚙️ HELPERS
========================================================================= */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toSafeString = (value) => String(value ?? "").trim();

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Kreye yon kle kach simetrik pou asire distans ant pwen A ak B match ak B ak A.
 * Sa reduzi espas kach la nan memwa pa de (50%).
 */
const createCacheKey = (lat1, lng1, lat2, lng2) => {
  const pointA = `${lat1}:${lng1}`;
  const pointB = `${lat2}:${lng2}`;
  return [pointA, pointB].sort().join("|");
};

const setCache = (key, value) => {
  if (!distanceCache.has(key) && distanceCache.size >= MAX_CACHE_SIZE) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  distanceCache.set(key, value);
};

/* =========================================================================
   🛡️ VALIDATION
========================================================================= */

export const hasValidCoordinates = (location = {}) => {
  if (!location) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const removeInvalidLocations = (items = []) =>
  items.filter((item) => hasValidCoordinates(item?.location));

/* =========================================================================
   📍 LOCATION NORMALIZATION & FORMATTING
========================================================================= */

export const normalizeLocation = (location = {}) => ({
  city: toSafeString(location?.city),
  state: toSafeString(location?.state),
  country: toSafeString(location?.country),
  lat: toNumber(location?.lat),
  lng: toNumber(location?.lng),
});

export const formatLocation = (location = {}) =>
  [location?.city, location?.state, location?.country]
    .filter(Boolean)
    .join(", ");

/* =========================================================================
   📏 DISTANCE CALCULATION (HAVERSINE CORE)
========================================================================= */

export const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const start = { lat: toNumber(lat1), lng: toNumber(lng1) };
  const end = { lat: toNumber(lat2), lng: toNumber(lng2) };

  if (!hasValidCoordinates(start) || !hasValidCoordinates(end)) {
    return null;
  }

  const cacheKey = createCacheKey(start.lat, start.lng, end.lat, end.lng);
  const cached = distanceCache.get(cacheKey);

  if (Number.isFinite(cached)) {
    return cached;
  }

  const lat1Rad = toRadians(start.lat);
  const lat2Rad = toRadians(end.lat);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  setCache(cacheKey, distance);
  return distance;
};

export const calculateDistanceMiles = (...args) => {
  const distanceKm = calculateDistanceKm(...args);
  return Number.isFinite(distanceKm) ? distanceKm * KM_TO_MILES : null;
};

export const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return "Unknown";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

export const isWithinRadius = (distanceKm, radiusKm = 10) =>
  Number.isFinite(distanceKm) && distanceKm <= radiusKm;

/* =========================================================================
   🌍 CONVERSIONS
========================================================================= */

export const kmToMiles = (km) => (Number.isFinite(km) ? km * KM_TO_MILES : null);
export const milesToKm = (miles) => (Number.isFinite(miles) ? miles / KM_TO_MILES : null);

/* =========================================================================
   📊 DISTANCE OPERATIONS & STATISTICS
========================================================================= */

export const getDistanceStatistics = (items = []) => {
  const distances = items
    .map((item) => item?.distanceKm)
    .filter(Number.isFinite);

  if (!distances.length) {
    return { min: null, max: null, average: null, totalKm: 0, count: 0 };
  }

  // Sèvi ak yon sèl bouk reduce pou evite Stack Overflow si gen plizyè milye pòs
  let min = distances[0];
  let max = distances[0];
  let totalDistance = 0;

  for (let i = 0; i < distances.length; i++) {
    const val = distances[i];
    if (val < min) min = val;
    if (val > max) max = val;
    totalDistance += val;
  }

  return {
    min,
    max,
    average: totalDistance / distances.length,
    totalKm: totalDistance,
    count: distances.length,
  };
};

export const attachDistance = (items = [], currentLocation = {}) => {
  const origin = normalizeLocation(currentLocation);
  if (!hasValidCoordinates(origin)) return items;

  return items.map((item) => {
    const location = normalizeLocation(item?.location || {});
    return {
      ...item,
      distanceKm: calculateDistanceKm(origin.lat, origin.lng, location.lat, location.lng),
    };
  });
};

export const sortByDistance = (items = []) =>
  [...items].sort((a, b) => (a?.distanceKm ?? Infinity) - (b?.distanceKm ?? Infinity));

export const filterNearby = (items = [], radiusKm = 10) =>
  items.filter((item) => isWithinRadius(item?.distanceKm, radiusKm));

export const findNearestItem = (items = []) => sortByDistance(items)[0] ?? null;

export const findNearestItems = (items = [], limit = 10) => sortByDistance(items).slice(0, limit);

/* =========================================================================
   📡 GPS & LIVE TRACKING (SSR SAFE)
========================================================================= */

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  });

export const watchPosition = (success, error) => {
  if (typeof window === "undefined" || !navigator.geolocation) {
    error?.(new Error("Geolocation not supported"));
    return null;
  }

  return navigator.geolocation.watchPosition(
    ({ coords }) => success({ lat: coords.latitude, lng: coords.longitude }),
    error,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
  );
};

export const stopWatchingPosition = (watchId) => {
  if (typeof window !== "undefined" && navigator.geolocation && watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export const getLocationAccuracy = (coords = {}) =>
  Number.isFinite(coords?.accuracy) ? coords.accuracy : null;

/* =========================================================================
   🗺️ GEO-BOUNDING BOX & QUERIES
========================================================================= */

export const calculateBoundingBox = (lat, lng, radiusKm = 10) => {
  const latitude = toNumber(lat);
  const longitude = toNumber(lng);

  if (!hasValidCoordinates({ lat: latitude, lng: longitude })) {
    return null;
  }

  const latDelta = radiusKm / 111;
  const cosLat = Math.cos(toRadians(latitude));
  const safeCosLat = Math.max(cosLat, 0.001);
  const lngDelta = radiusKm / (111 * safeCosLat);

  return Object.freeze({
    minLat: Math.max(-90, latitude - latDelta),
    maxLat: Math.min(90, latitude + latDelta),
    minLng: Math.max(-180, longitude - lngDelta),
    maxLng: Math.min(180, longitude + lngDelta),
  });
};

/* =========================================================================
   🗂️ GROUPING ENGINE
========================================================================= */

export const groupByCity = (items = []) =>
  items.reduce((groups, item) => {
    const city = item?.location?.city || "Unknown";
    (groups[city] ??= []).push(item);
    return groups;
  }, {});

export const groupByCountry = (items = []) =>
  items.reduce((groups, item) => {
    const country = item?.location?.country || "Unknown";
    (groups[country] ??= []).push(item);
    return groups;
  }, {});

export const groupByState = (items = []) =>
  items.reduce((groups, item) => {
    const state = item?.location?.state || "Unknown";
    (groups[state] ??= []).push(item);
    return groups;
  }, {});

export const sortByNearestCity = (groups = {}) => {
  const getMinDistance = (items) => {
    let min = Infinity;
    for (let i = 0; i < items.length; i++) {
      const dist = items[i]?.distanceKm;
      if (Number.isFinite(dist) && dist < min) min = dist;
    }
    return min;
  };

  return Object.entries(groups)
    .sort(([, itemsA], [, itemsB]) => getMinDistance(itemsA) - getMinDistance(itemsB))
    .reduce((result, [city, items]) => {
      result[city] = items;
      return result;
    }, {});
};

/* =========================================================================
   💾 CLEANUP & LIFECYCLE
========================================================================= */

export const clearDistanceCache = () => distanceCache.clear();
export const getCacheSize = () => distanceCache.size;
export const getCacheStatistics = () => ({
  size: distanceCache.size,
  maxSize: MAX_CACHE_SIZE,
  usage: (distanceCache.size / MAX_CACHE_SIZE) * 100,
});
