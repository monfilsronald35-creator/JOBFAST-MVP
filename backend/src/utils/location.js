/* ==================================================
   🌍 JOBFAST LOCATION ENGINE (MVP STABLE FINAL)
   FILE: backend/src/utils/location.js
   ================================================== */

/* ==================================================
   📍 EARTH RADIUS
   ================================================== */

const EARTH_RADIUS_KM = 6371;

/* ==================================================
   📍 SAFE NUMBER
   ================================================== */

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/* ==================================================
   📍 DEGREE → RADIAN
   ================================================== */

const toRadians = (value) => {
  return (toNumber(value) * Math.PI) / 180;
};

/* ==================================================
   📍 SAFE STRING
   ================================================== */

const toSafeString = (value) => {
  return String(value || "").trim();
};

/* ==================================================
   📍 VALID COORDINATES CHECK
   ================================================== */

export const hasValidCoordinates = (
  location = {}
) => {
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

/* ==================================================
   📍 NORMALIZE LOCATION
   ================================================== */

export const normalizeLocation = (
  location = {}
) => {
  return {
    city: toSafeString(location.city),
    state: toSafeString(location.state),
    country: toSafeString(location.country),

    lat: toNumber(location.lat),
    lng: toNumber(location.lng)
  };
};

/* ==================================================
   📍 CREATE LOCATION PAYLOAD
   ================================================== */

export const createLocationPayload = (
  data = {}
) => {
  return normalizeLocation({
    city: data.city,
    state: data.state,
    country: data.country,
    lat: data.lat,
    lng: data.lng
  });
};

/* ==================================================
   📍 FORMAT LOCATION
   ================================================== */

export const formatLocation = (
  location = {}
) => {
  const normalized =
    normalizeLocation(location);

  return [
    normalized.city,
    normalized.state,
    normalized.country
  ]
    .filter(Boolean)
    .join(", ");
};

/* ==================================================
   📍 DISTANCE CALCULATOR (HAVERSINE)
   ================================================== */

export const calculateDistanceKm = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const start = {
    lat: toNumber(lat1),
    lng: toNumber(lng1)
  };

  const end = {
    lat: toNumber(lat2),
    lng: toNumber(lng2)
  };

  if (
    !hasValidCoordinates(start) ||
    !hasValidCoordinates(end)
  ) {
    return null;
  }

  const latitude1 = toRadians(start.lat);
  const longitude1 = toRadians(start.lng);

  const latitude2 = toRadians(end.lat);
  const longitude2 = toRadians(end.lng);

  const deltaLat =
    latitude2 - latitude1;

  const deltaLng =
    longitude2 - longitude1;

  const a =
    Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return Number(
    (EARTH_RADIUS_KM * c).toFixed(2)
  );
};

/* ==================================================
   📍 ADD DISTANCE TO ITEMS
   USERS / JOBS / BUSINESSES
   ================================================== */

export const attachDistance = (
  items = [],
  currentLocation = {}
) => {
  const origin =
    normalizeLocation(currentLocation);

  return items.map((item) => {
    const target =
      normalizeLocation(item.location);

    const distanceKm =
      calculateDistanceKm(
        origin.lat,
        origin.lng,
        target.lat,
        target.lng
      );

    return {
      ...item,
      distanceKm
    };
  });
};

/* ==================================================
   📍 SORT BY DISTANCE
   ================================================== */

export const sortByDistance = (
  items = []
) => {
  return [...items].sort((a, b) => {
    const distanceA =
      Number(a.distanceKm);

    const distanceB =
      Number(b.distanceKm);

    if (!Number.isFinite(distanceA))
      return 1;

    if (!Number.isFinite(distanceB))
      return -1;

    return distanceA - distanceB;
  });
};

/* ==================================================
   📍 FILTER NEARBY
   ================================================== */

export const filterNearby = (
  items = [],
  maxDistanceKm = 10
) => {
  const safeDistance =
    toNumber(maxDistanceKm);

  return items.filter((item) => {
    return (
      Number.isFinite(
        Number(item.distanceKm)
      ) &&
      Number(item.distanceKm) <=
        safeDistance
    );
  });
};

/* ==================================================
   📍 LOCATION CATEGORY
   ================================================== */

export const getLocationCategory = (
  item = {}
) => {
  if (item.businessType) {
    return "business";
  }

  if (item.serviceType) {
    return "service";
  }

  if (item.role) {
    return "worker";
  }

  return "general";
};

/* ==================================================
   📍 GROUP ITEMS BY CITY
   ================================================== */

export const groupByCity = (
  items = []
) => {
  return items.reduce(
    (accumulator, item) => {
      const city =
        toSafeString(
          item.location?.city
        ) || "Unknown";

      if (!accumulator[city]) {
        accumulator[city] = [];
      }

      accumulator[city].push(item);

      return accumulator;
    },
    {}
  );
};

/* ==================================================
   📍 MAP CLUSTER READY
   ================================================== */

export const createMapClusterPayload =
  (items = []) => {
    return items.map((item) => ({
      id: item.id || null,

      name:
        item.name ||
        item.title ||
        "Unknown",

      category:
        getLocationCategory(item),

      location:
        normalizeLocation(
          item.location
        ),

      distanceKm:
        item.distanceKm || null
    }));
  };