/* ==================================================
   🌍 JOBFAST LOCATION ENGINE
   FILE: src/utils/location.js
   PRODUCTION READY+ (v4.4 - Global Enterprise Plus)
   ================================================== */

const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;

const MAX_CACHE_SIZE = 5000;

const distanceCache = new Map();

/* ==================================================
   ⚙️ HELPERS
   ================================================== */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toSafeString = (value) =>
  String(value ?? "").trim();

const toRadians = (degrees) =>
  (degrees * Math.PI) / 180;

/**
 * Creates a symmetrical cache key ensuring point A to B matches B to A.
 * Reduces cache memory utilization significantly.
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {string}
 */
const createCacheKey = (lat1, lng1, lat2, lng2) => {
  const pointA = `${lat1}:${lng1}`;
  const pointB = `${lat2}:${lng2}`;
  return [pointA, pointB].sort().join("|");
};

const setCache = (key, value) => {
  // Sèlman efase si se yon nouvo kle n ap ajoute pou evite deregle gwosè a nan update
  if (!distanceCache.has(key) && distanceCache.size >= MAX_CACHE_SIZE) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  distanceCache.set(key, value);
};

/* ==================================================
   🛡️ VALIDATION
   ================================================== */

/**
 * Validates if the given location object contains valid coordinates.
 * @param {Object} location 
 * @returns {boolean}
 */
export const hasValidCoordinates = (location = {}) => {
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

/**
 * Filters out items that do not have valid coordinates.
 * @param {Array} items 
 * @returns {Array}
 */
export const removeInvalidLocations = (items = []) =>
  items.filter((item) => hasValidCoordinates(item?.location));

/* ==================================================
   📍 LOCATION NORMALIZATION & FORMATTING
   ================================================== */

/**
 * Normalizes a location object with fallback values and typed coordinates.
 * @param {Object} location 
 * @returns {Object}
 */
export const normalizeLocation = (location = {}) => ({
  city: toSafeString(location.city),
  state: toSafeString(location.state),
  country: toSafeString(location.country),
  lat: toNumber(location.lat),
  lng: toNumber(location.lng),
});

/**
 * Formats city, state, and country into a readable comma-separated string.
 * @param {Object} location 
 * @returns {string}
 */
export const formatLocation = (location = {}) =>
  [location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

/* ==================================================
   📏 DISTANCE CALCULATION
   ================================================== */

/**
 * Calculates the great-circle distance between two points using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number|null} Distance in kilometers
 */
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

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);

  const a =
    sinLat * sinLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  setCache(cacheKey, distance);
  return distance;
};

/**
 * Calculates the distance between two points in miles.
 * @param  {...number} args 
 * @returns {number|null} Distance in miles
 */
export const calculateDistanceMiles = (...args) => {
  const distanceKm = calculateDistanceKm(...args);
  return Number.isFinite(distanceKm) ? distanceKm * KM_TO_MILES : null;
};

/**
 * Formats kilometers into a localized string (meters or kilometers).
 * @param {number} distanceKm 
 * @returns {string}
 */
export const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return "Unknown";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Checks if a distance falls within a specified radius.
 * @param {number} distanceKm 
 * @param {number} radiusKm 
 * @returns {boolean}
 */
export const isWithinRadius = (distanceKm, radiusKm = 10) =>
  Number.isFinite(distanceKm) && distanceKm <= radiusKm;

/* ==================================================
   🌍 EXTRA GEO UTILITIES
   ================================================== */

/**
 * Converts kilometers to miles.
 * @param {number} km
 * @returns {number|null}
 */
export const kmToMiles = (km) =>
  Number.isFinite(km) ? km * KM_TO_MILES : null;

/**
 * Converts miles to kilometers.
 * @param {number} miles
 * @returns {number|null}
 */
export const milesToKm = (miles) =>
  Number.isFinite(miles) ? miles / KM_TO_MILES : null;

/* ==================================================
   📊 DISTANCE OPERATIONS & STATISTICS
   ================================================== */

/**
 * Computes min, max, average, total km and count from a collection of items.
 * @param {Array} items 
 * @returns {Object}
 */
export const getDistanceStatistics = (items = []) => {
  const distances = items
    .map((item) => item?.distanceKm)
    .filter(Number.isFinite);

  if (!distances.length) {
    return {
      min: null,
      max: null,
      average: null,
      totalKm: 0,
      count: 0,
    };
  }

  const totalDistance = distances.reduce((sum, value) => sum + value, 0);

  return {
    min: Math.min(...distances),
    max: Math.max(...distances),
    average: totalDistance / distances.length,
    totalKm: totalDistance,
    count: distances.length,
  };
};

/**
 * Injects `distanceKm` into each item relative to a current location origin.
 * @param {Array} items 
 * @param {Object} currentLocation 
 * @returns {Array}
 */
export const attachDistance = (items = [], currentLocation = {}) => {
  const origin = normalizeLocation(currentLocation);

  if (!hasValidCoordinates(origin)) {
    return items;
  }

  return items.map((item) => {
    const location = normalizeLocation(item?.location || {});
    return {
      ...item,
      distanceKm: calculateDistanceKm(
        origin.lat,
        origin.lng,
        location.lat,
        location.lng
      ),
    };
  });
};

/**
 * Sorts items by their `distanceKm` property in ascending order.
 * @param {Array} items 
 * @returns {Array}
 */
export const sortByDistance = (items = []) =>
  [...items].sort((a, b) => (a?.distanceKm ?? Infinity) - (b?.distanceKm ?? Infinity));

/**
 * Filters items that are within a specific kilometer radius.
 * @param {Array} items 
 * @param {number} radiusKm 
 * @returns {Array}
 */
export const filterNearby = (items = [], radiusKm = 10) =>
  items.filter((item) => isWithinRadius(item?.distanceKm, radiusKm));

/**
 * Finds the absolute single nearest item.
 * @param {Array} items 
 * @returns {Object|null}
 */
export const findNearestItem = (items = []) =>
  sortByDistance(items)[0] ?? null;

/**
 * Returns the top nearest items up to a defined limit.
 * @param {Array} items 
 * @param {number} limit 
 * @returns {Array}
 */
export const findNearestItems = (items = [], limit = 10) =>
  sortByDistance(items).slice(0, limit);

/* ==================================================
   📡 GPS & LIVE TRACKING
   ================================================== */

/**
 * Wraps geolocation.getCurrentPosition in a native Promise.
 * @returns {Promise<Object>} Coords object { lat, lng }
 */
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
        }),
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  });

/**
 * Subscribes to device continuous position changes.
 * @param {Function} success 
 * @param {Function} error 
 * @returns {number|null} watchId
 */
export const watchPosition = (success, error) => {
  if (!navigator.geolocation) {
    error?.(new Error("Geolocation not supported"));
    return null;
  }

  return navigator.geolocation.watchPosition(
    ({ coords }) =>
      success({
        lat: coords.latitude,
        lng: coords.longitude,
      }),
    error,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
    }
  );
};

/**
 * Unsubscribes from location tracking via watchId.
 * @param {number} watchId 
 */
export const stopWatchingPosition = (watchId) => {
  if (
    navigator.geolocation &&
    watchId !== null &&
    watchId !== undefined
  ) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Safely extracts the accuracy margin from a raw coordinate block.
 * @param {Object} coords 
 * @returns {number|null} Accuracy in meters
 */
export const getLocationAccuracy = (coords = {}) =>
  Number.isFinite(coords?.accuracy) ? coords.accuracy : null;

/* ==================================================
   🗺️ GEO-BOUNDING BOX & QUERIES
   ================================================== */

/**
 * Calculates a standard bounding box (min/max Lat/Lng) around a point given a radius.
 * Protected with safe pole clamping and immutable response safety.
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radiusKm 
 * @returns {Object|null} Immutable Bounding box limits
 */
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

/* ==================================================
   🗂️ GROUPING & RANKING
   ================================================== */

/**
 * Groups a collection of items by their location city.
 * @param {Array} items 
 * @returns {Object}
 */
export const groupByCity = (items = []) =>
  items.reduce((groups, item) => {
    const city = item?.location?.city || "Unknown";
    (groups[city] ??= []).push(item);
    return groups;
  }, {});

/**
 * Groups a collection of items by their location country.
 * @param {Array} items 
 * @returns {Object}
 */
export const groupByCountry = (items = []) =>
  items.reduce((groups, item) => {
    const country = item?.location?.country || "Unknown";
    (groups[country] ??= []).push(item);
    return groups;
  }, {});

/**
 * Groups a collection of items by their location state.
 * @param {Array} items 
 * @returns {Object}
 */
export const groupByState = (items = []) =>
  items.reduce((groups, item) => {
    const state = item?.location?.state || "Unknown";
    (groups[state] ??= []).push(item);
    return groups;
  }, {});

/**
 * Sorts grouped city elements based on the absolute minimum distance found inside each group.
 * @param {Object} groups 
 * @returns {Object} Sorted dictionary
 */
export const sortByNearestCity = (groups = {}) => {
  const getMinDistance = (items) => {
    const validDistances = items.map(i => i?.distanceKm).filter(Number.isFinite);
    return validDistances.length ? Math.min(...validDistances) : Infinity;
  };

  return Object.entries(groups)
    .sort(([, itemsA], [, itemsB]) => getMinDistance(itemsA) - getMinDistance(itemsB))
    .reduce((result, [city, items]) => {
      result[city] = items;
      return result;
    }, {});
};

/* ==================================================
   💾 CACHE MONITORING & CLEANUP
   ================================================== */

export const clearDistanceCache = () => {
  distanceCache.clear();
};

export const clearAllLocationData = () => {
  clearDistanceCache();
};

export const getCacheSize = () => distanceCache.size;

/**
 * Provides comprehensive real-time insights into engine cache for monitoring.
 * @returns {Object} Cache monitoring state
 */
export const getCacheStatistics = () => ({
  size: distanceCache.size,
  maxSize: MAX_CACHE_SIZE,
  usage: (distanceCache.size / MAX_CACHE_SIZE) * 100,
});
