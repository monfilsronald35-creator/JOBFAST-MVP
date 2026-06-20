// ======================================================
// 🌍 config/env.js
// 🚀 SAFE MVP ENV CONFIG
// ======================================================

import dotenv from "dotenv";

dotenv.config();

// ======================================================
// ✅ HELPERS
// ======================================================

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value === "true";
};

const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

// ======================================================
// 🌍 APP CONFIG
// ======================================================

const env = {
  app: {
    name: process.env.APP_NAME || "Global Services Platform",
    env: process.env.NODE_ENV || "development",
    port: toNumber(process.env.PORT, 5000),

    clientUrl:
      process.env.CLIENT_URL ||
      "http://localhost:3000"
  },

  // ======================================================
  // 🌍 DATABASE
  // ======================================================

  database: {
    mongoUri:
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/global-services-platform",

    autoIndex: false
  },

  // ======================================================
  // 🔐 AUTH
  // ======================================================

  auth: {
    jwtSecret:
      process.env.JWT_SECRET ||
      "CHANGE_THIS_SECRET",

    jwtExpire:
      process.env.JWT_EXPIRE ||
      "7d",

    refreshTokenExpire:
      process.env.REFRESH_TOKEN_EXPIRE ||
      "30d",

    bcryptRounds: toNumber(
      process.env.BCRYPT_ROUNDS,
      12
    )
  },

  // ======================================================
  // 🌍 LOCATION ENGINE
  // ======================================================

  location: {
    gpsEnabled: true,

    defaultRadiusKm: toNumber(
      process.env.DEFAULT_RADIUS_KM,
      15
    ),

    nearbyRadiusKm: toNumber(
      process.env.NEARBY_RADIUS_KM,
      50
    ),

    maxSearchRadiusKm: toNumber(
      process.env.MAX_SEARCH_RADIUS_KM,
      200
    ),

    distanceSorting: true,
    mapClustering: true,
    normalizeLocations: true
  },

  // ======================================================
  // 🔔 NOTIFICATIONS
  // ======================================================

  notifications: {
    enabled: true,

    pushNotifications: true,

    liveNotifications: true,

    nearbyWorkerNotifications: true,

    nearbyBusinessNotifications: true
  },

  // ======================================================
  // 💬 REALTIME
  // ======================================================

  realtime: {
    enabled: true,

    provider: "socket_io",

    liveChat: true,

    liveWorkerTracking: true,

    liveStatusUpdates: true
  },

  // ======================================================
  // 🔎 SEARCH SYSTEM
  // ======================================================

  search: {
    enabled: true,

    fuzzySearch: true,

    minimumSearchCharacters: 2,

    maxNearbyResults: 100,

    sortByDistance: true,

    sortByRating: true,

    sortByAvailability: true
  },

  // ======================================================
  // 📦 MEDIA
  // ======================================================

  media: {
    allowImages: true,

    allowVideos: true,

    maxImages: 10,

    maxVideoSizeMb: 100,

    supportedImageFormats: [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ]
  },

  // ======================================================
  // 🛠 CONSTRUCTION SYSTEM
  // ======================================================

  construction: {
    enabled: true,

    workerAvailability: true,

    liveWorkerStatus: true,

    roles: [
      "boss",
      "engineer",
      "architect",
      "mason",
      "ajoudan",
      "steel_worker",
      "electrician",
      "construction_plumber",
      "welder",
      "carpenter",
      "painter",
      "tiler",
      "roof_worker",
      "floor_worker",
      "terminador",
      "machine_operator",
      "concrete_worker",
      "block_worker",
      "excavator_operator",
      "survey_worker",
      "glass_worker",
      "drywall_worker"
    ],

    workStatus: [
      "looking_for_work",
      "working"
    ],

    availabilityStatus: [
      "available",
      "busy"
    ]
  },

  // ======================================================
  // 🚕 SERVICES ON DEMAND
  // ======================================================

  services: {
    enabled: true,

    instantBooking: true,

    servicesList: [
      "chef",
      "service_plumber",
      "doctor",
      "nurse",
      "taxi",
      "delivery",
      "cleaning",
      "videographer",
      "designer",
      "photographer",
      "security"
    ]
  },

  // ======================================================
  // 🛡 SECURITY
  // ======================================================

  security: {
    rateLimit: true,

    maxLoginAttempts: 5,

    sessionExpirationHours: 72
  },

  // ======================================================
  // 📊 LOGS
  // ======================================================

  logs: {
    enabled: true,

    level: process.env.LOG_LEVEL || "info"
  }
};

export default env;