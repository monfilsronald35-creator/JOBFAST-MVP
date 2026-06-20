// ======================================================
// 🌍 CORE MARKETPLACE ENGINE (V8.2 PRODUCTION HARDENED)
// ======================================================

const EARTH_RADIUS_KM = 6371;

// ======================================================
// 📍 SAFE NUMBER (STRICT + NO EDGE LEAKS)
// ======================================================
export function isValidNumber(n) {
  if (typeof n === "boolean") return false;
  if (n === null || n === undefined) return false;

  if (typeof n === "string") {
    const t = n.trim();
    if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return false;
    n = t;
  }

  const num = Number(n);

  return Number.isFinite(num) &&
    !Number.isNaN(num) &&
    Math.abs(num) <= 1e12;
}

// ======================================================
// 📍 SAFE GEO (NO STRING COERCION BUG)
// ======================================================
export function isValidGeo(geo) {
  if (!geo || typeof geo !== "object") return false;

  const lat = Number(geo.lat);
  const lng = Number(geo.lng);

  if (!isValidNumber(lat) || !isValidNumber(lng)) return false;

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// ======================================================
// 📍 TEXT NORMALIZER
// ======================================================
export function normalizeText(str) {
  if (typeof str !== "string") return "";
  return str.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ======================================================
// 📍 CITY MAP (FAST + SAFE)
// ======================================================
const CITY_MAP = Object.freeze({
  "santo domingo": "santo_domingo",
  "sto domingo": "santo_domingo",
  "punta cana": "punta_cana",
  "cap haitien": "cap_haitien",
  "port au prince": "port_au_prince"
});

export function normalizeCity(city) {
  if (typeof city !== "string") return "unknown";
  const c = normalizeText(city);
  return CITY_MAP[c] || c || "unknown";
}

// ======================================================
// 📍 SAFE ITEM WRAPPER (NO NULL SPREAD BUG)
// ======================================================
function safeItem(item) {
  if (!item || typeof item !== "object") return null;

  const rating = Number(item.rating);
  const responseTime = Number(item.responseTime);
  const completedJobs = Number(item.completedJobs);

  return {
    ...item,
    type: item.type ?? "unknown",
    status: item.status ?? "unknown",
    workStatus: item.workStatus ?? "unknown",
    verified: Boolean(item.verified),

    rating: Number.isFinite(rating) ? rating : 0,
    responseTime: Number.isFinite(responseTime) ? responseTime : 999,
    completedJobs: Number.isFinite(completedJobs) ? completedJobs : 0,

    geo: isValidGeo(item.geo) ? item.geo : null
  };
}

// ======================================================
// 📍 STATUS SYSTEM
// ======================================================
export function getStatus(entity) {
  return normalizeText(entity?.status);
}

export const isAvailable = (e) => getStatus(e) === "available";
export const isBusy = (e) => getStatus(e) === "busy";
export const isWorking = (e) => normalizeText(e?.workStatus) === "working";

// ======================================================
// 📍 TYPE SYSTEM
// ======================================================
const TYPE_ALIASES = Object.freeze({
  doctor: ["doctor", "doktè", "medecin"],
  nurse: ["nurse", "infirmier", "infermiere"],
  mechanic: ["mechanic", "mekanisyen"],
  restaurant: ["restaurant", "resto", "food"],
  hotel: ["hotel", "hôtel"],
  taxi: ["taxi", "transport"],
  delivery: ["delivery", "livraison"],
  construction_worker: ["construction", "builder", "maçon", "worker", "boss", "ouvrier"],
  electrician: ["electrician", "elektrisyen"],
  plumber: ["plumber", "plonbye"],
  architect: ["architect", "engineer"],
  chef: ["chef", "cuisinier", "cook"],
  cleaner: ["cleaner", "netwayaj", "cleaning"],
  designer: ["designer", "graphic"],
  videographer: ["video", "videographer"],
  tutor: ["tutor", "teacher"]
});

function fuzzyMatch(a, b) {
  if (!a || !b) return false;
  return normalizeText(a).includes(normalizeText(b));
}

function matchType(itemType, type) {
  if (!type) return true;

  const key = normalizeText(type);
  const aliases = TYPE_ALIASES[key];

  if (!aliases) return false;

  const item = normalizeText(itemType || "");
  return aliases.some(t => fuzzyMatch(item, t));
}

// ======================================================
// 📍 QUALITY BOOST
// ======================================================
function qualityBoost(item) {
  let boost = 0;

  if (item.verified) boost += 0.5;
  if (item.rating >= 4.5) boost += 0.4;
  if (item.responseTime <= 10) boost += 0.2;
  if (item.completedJobs >= 50) boost += 0.3;

  return boost;
}

// ======================================================
// 📍 DISTANCE CORE (ROBUST)
// ======================================================
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(isValidNumber)) return null;

  const toRad = (v) => (Number(v) * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ======================================================
// 📍 COMPUTE DISTANCE
// ======================================================
function computeDistance(userGeo, itemGeo) {
  if (!isValidGeo(userGeo) || !isValidGeo(itemGeo)) return null;

  const d = calculateDistanceKm(
    userGeo.lat,
    userGeo.lng,
    itemGeo.lat,
    itemGeo.lng
  );

  return Number.isFinite(d) ? d : null;
}

// ======================================================
// 📍 SCORE ENGINE (NO NEGATIVE / NO NaN)
// ======================================================
function calculateScore(distance, item) {
  if (!Number.isFinite(distance)) return Number.MAX_SAFE_INTEGER;

  let score = distance;

  if (isAvailable(item)) score -= 0.5;
  if (isWorking(item)) score -= 0.2;

  const boost = qualityBoost(item);
  score = score - (Number.isFinite(boost) ? boost : 0);

  return Math.max(0, score);
}

// ======================================================
// 📍 PAGINATION
// ======================================================
export function paginate(items = [], page = 1, limit = 20) {
  if (!Array.isArray(items)) {
    return { data: [], page: 1, limit, total: 0, pages: 0 };
  }

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);

  const start = (p - 1) * l;

  return {
    data: items.slice(start, start + l),
    page: p,
    limit: l,
    total: items.length,
    pages: Math.ceil(items.length / l)
  };
}

// ======================================================
// 📍 NOTIFICATION ENGINE
// ======================================================
export function buildNotificationPayload(entity, distanceKm) {
  const d = Number(distanceKm);

  return {
    id: entity?.id ?? null,
    name: entity?.name ?? "Unknown",
    type: entity?.type ?? "unknown",
    status: entity?.status ?? "unknown",
    verified: Boolean(entity?.verified),
    rating: entity?.rating ?? null,
    distanceKm: Number.isFinite(d) ? Number(d.toFixed(2)) : null,
    timestamp: Date.now(),
    message: Number.isFinite(d)
      ? `${entity?.name ?? "Someone"} is ${d.toFixed(1)}km away`
      : `${entity?.name ?? "Someone"} is nearby`
  };
}

// ======================================================
// 📍 BULK NOTIFICATIONS
// ======================================================
export function buildBulkNotifications(items = [], distanceMap = new Map()) {
  if (!Array.isArray(items)) return [];

  return items.map(item => {
    const d = distanceMap.get(item?.id);
    const safeDistance = Number.isFinite(d) ? d : null;

    return {
      ...buildNotificationPayload(item, safeDistance),
      priority:
        safeDistance === null ? "LOW" :
        safeDistance < 2 ? "HIGH" :
        safeDistance < 10 ? "MEDIUM" : "LOW"
    };
  });
}

// ======================================================
// 📍 MAIN SEARCH ENGINE (FINAL SAFE)
// ======================================================
export function geoSearch({
  userGeo,
  items = [],
  maxDistanceKm = 50,
  onlyAvailable = false,
  onlyWorking = false,
  type = null,
  verifiedOnly = false
}) {
  if (!isValidGeo(userGeo) || !Array.isArray(items)) return [];

  const max = Number(maxDistanceKm);
  if (!Number.isFinite(max) || max < 0) return [];

  const results = [];

  for (const raw of items) {
    const item = safeItem(raw);
    if (!item || !item.geo) continue;

    if (type && !matchType(item.type, type)) continue;
    if (verifiedOnly && !item.verified) continue;
    if (onlyAvailable && !isAvailable(item)) continue;
    if (onlyWorking && !isWorking(item)) continue;

    const d = computeDistance(userGeo, item.geo);
    if (!Number.isFinite(d) || d > max) continue;

    results.push({
      ...item,
      city: normalizeCity(item.city),
      distanceKm: Number(d.toFixed(2)),
      score: calculateScore(d, item)
    });
  }

  return results.sort((a, b) => a.score - b.score);
}

// ======================================================
// 📍 GROUP BY CITY
// ======================================================
export function groupByCity(items = []) {
  if (!Array.isArray(items)) return {};

  const map = {};

  for (const item of items) {
    const city = normalizeCity(item?.location?.city ?? item?.city);
    (map[city] ||= []).push(item);
  }

  return map;
}

// ======================================================
// 📍 CITY RADIUS CHECK
// ======================================================
export function isInCityRadius(userGeo, cityGeo, radiusKm = 0) {
  const d = computeDistance(userGeo, cityGeo);
  if (!Number.isFinite(d)) return false;

  return d <= (Number(radiusKm) || 0);
}

// ======================================================
// 📍 ACTIVE CHECK
// ======================================================
export function isEntityActive(entity) {
  return isAvailable(entity) || isWorking(entity);
}

// ======================================================
// 📍 FILTER AVAILABILITY
// ======================================================
export function filterAvailability(items = [], mode = "all") {
  if (!Array.isArray(items)) return [];

  return items.filter(item => {
    if (mode === "available") return isAvailable(item);
    if (mode === "busy") return isBusy(item);
    if (mode === "working") return isWorking(item);
    return true;
  });
}