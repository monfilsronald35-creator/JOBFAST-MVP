// ======================================================
// 🌍 JOBFAST — CORE ENUMS (SOURCE OF TRUTH)
// ======================================================
export const STATUS = Object.freeze({
  ONLINE: "online",
  BUSY: "busy",
  OFFLINE: "offline",
});

export const AVAILABILITY = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  WORKING: "working",
  ON_BREAK: "on_break",
});

export const JOB_STATUS = Object.freeze({
  PENDING: "pending",
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

// ======================================================
// 👤 SAFE DERIVED CONTRACT (READ-ONLY VIEW)
// ======================================================
export const USER_STATE = Object.freeze({
  STATUS,
  AVAILABILITY,
});

// ======================================================
// 👤 USER ROLES
// ======================================================
export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  BOSS: "boss",
  WORKER: "worker",
  APPRENTICE: "apprentice",
  DRIVER: "driver",
  ENGINEER: "engineer",
  PROVIDER: "provider",
  USER: "user",
});

// ======================================================
// 🏢 BUSINESS TYPES
// ======================================================
export const BUSINESS_TYPES = Object.freeze({
  COMPANY: "company",
  RESTAURANT: "restaurant",
  HOSPITAL: "hospital",
  CLINIC: "clinic",
  HOTEL: "hotel",
  OFFICE: "office",
  LAWYER: "lawyer",
  MECHANIC: "mechanic",
  TOUR_GUIDE: "tour_guide",
  ORGANIZATION: "organization",
});

// ======================================================
// ⚙️ SERVICE SYSTEM (IMMUTABLE)
// ======================================================
export const SERVICE_CATEGORIES = Object.freeze({
  CONSTRUCTION: Object.freeze([
    "mason",
    "carpenter",
    "electrician",
    "welder",
    "painter",
    "tiler",
    "foreman",
    "site_manager",
    "architect",
    "engineer",
  ]),

  ON_DEMAND: Object.freeze([
    "chef_lakay",
    "plumber",
    "doctor",
    "nurse",
    "taxi",
    "delivery",
    "cleaning",
    "videographer",
    "designer",
  ]),
});

// ======================================================
// 📍 LOCATION SYSTEM
// ======================================================
export const LOCATION = Object.freeze({
  LEVELS: Object.freeze({
    CITY: "city",
    STATE: "state",
    COUNTRY: "country",
  }),

  DEFAULT: Object.freeze({
    lat: 18.5601,
    lng: -68.3725,
    zoom: 10,
  }),
});

// ======================================================
// 🔥 PRIORITY SYSTEM
// ======================================================
export const PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

// ======================================================
// 🔔 NOTIFICATION TYPES
// ======================================================
export const NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: "system",
  JOB: "job",
  SERVICE: "service",
  MESSAGE: "message",
  ALERT: "alert",
});

// ======================================================
// 🔎 SEARCH LIMITS
// ======================================================
export const SEARCH_LIMITS = Object.freeze({
  USERS: 20,
  BUSINESSES: 20,
  SERVICES: 15,
  JOBS: 20,
});

// ======================================================
// 🎨 UI CONFIG
// ======================================================
export const UI = Object.freeze({
  MAX_MODAL_WIDTH: 500,
  TOAST_DURATION: 3000,
  ANIMATION_SPEED: 200,
});

// ======================================================
// 🧠 ENTITY TYPES
// ======================================================
export const ENTITY_TYPES = Object.freeze({
  USER: "user",
  BUSINESS: "business",
  SERVICE: "service",
  JOB: "job",
  LOCATION: "location",
});

// ======================================================
// 🧭 STATUS GROUPS (ROBUST + SAFE)
// ======================================================
export const STATUS_GROUPS = Object.freeze({
  ACTIVE: [
    STATUS.ONLINE,
    AVAILABILITY.AVAILABLE,
    JOB_STATUS.IN_PROGRESS,
  ],

  INACTIVE: [
    STATUS.OFFLINE,
    AVAILABILITY.UNAVAILABLE,
    JOB_STATUS.CANCELLED,
  ],

  BUSY: [
    STATUS.BUSY,
    AVAILABILITY.WORKING,
    JOB_STATUS.ASSIGNED,
  ],
});