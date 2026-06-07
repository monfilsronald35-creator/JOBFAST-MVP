/* =========================================================================
   🧩 JOBFAST ENTERPRISE SYSTEM — MASTER CORE CONSTANTS (v3.6)
   🚀 ATOMIC TRUTH LAYER — SAFE FOR PRODUCTION & DYNAMIC FILTERS
========================================================================= */

/* =========================================================================
   🔒 CORE ENUMS (ATOMIC TRUTH LAYER - PRIVATE CORE)
========================================================================= */
const STATUS = Object.freeze({
  ONLINE: "online",
  BUSY: "busy",
  OFFLINE: "offline",
});

const AVAILABILITY = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  WORKING: "working",
  ON_BREAK: "on_break",
});

const JOB_STATUS = Object.freeze({
  PENDING: "pending",
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

const DOMAIN = Object.freeze({
  STATUS,
  AVAILABILITY,
  JOB_STATUS,
});

/* =========================================================================
   🔐 PUBLIC READ-ONLY CONTRACT LAYER
========================================================================= */
export const USER_STATE = Object.freeze({
  STATUS: DOMAIN.STATUS,
  AVAILABILITY: DOMAIN.AVAILABILITY,
});

export { JOB_STATUS }; // Single clean export pou evite redondans

/* =========================================================================
   👤 USER ROLES
========================================================================= */
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

/* =========================================================================
   🏢 BUSINESS TYPES
========================================================================= */
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

/* =========================================================================
   ⚙️ SERVICE CATEGORIES (DEEP FROZEN ARCHITECTURE)
========================================================================= */
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

/* =========================================================================
   📍 LOCATION SYSTEM (PUNTA CANA / REGIONAL CORE)
========================================================================= */
export const LOCATION = Object.freeze({
  LEVELS: Object.freeze({
    CITY: "city",
    STATE: "state",
    COUNTRY: "country",
  }),

  DEFAULT: Object.freeze({
    lat: 18.5601,  /* Sante liyen nan zòn Punta Cana / Bávaro Hub */
    lng: -68.3725,
    zoom: 10,
  }),
});

/* =========================================================================
   🔥 PRIORITY & NOTIFICATION SYSTEM
========================================================================= */
export const PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

export const NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: "system",
  JOB: "job",
  SERVICE: "service",
  MESSAGE: "message",
  ALERT: "alert",
});

/* =========================================================================
   🔎 SEARCH ENGINE LIMITS
========================================================================= */
export const SEARCH_LIMITS = Object.freeze({
  USERS: 20,
  BUSINESSES: 20,
  SERVICES: 15,
  JOBS: 20,
});

/* =========================================================================
   🎨 UI DESIGN SYSTEM CONFIG (STRICT LIMITS)
========================================================================= */
export const UI = Object.freeze({
  MAX_MODAL_WIDTH: 500,
  TOAST_DURATION: 3000,
  ANIMATION_SPEED: 200,
});

export const ENTITY_TYPES = Object.freeze({
  USER: "user",
  BUSINESS: "business",
  SERVICE: "service",
  JOB: "job",
  LOCATION: "location",
});

/* =========================================================================
   🧭 STATUS GROUPS (FILTER ENGINE LAYER)
========================================================================= */
export const STATUS_GROUPS = Object.freeze({
  ACTIVE: Object.freeze([
    STATUS.ONLINE,
    AVAILABILITY.AVAILABLE,
    JOB_STATUS.IN_PROGRESS,
  ]),

  INACTIVE: Object.freeze([
    STATUS.OFFLINE,
    AVAILABILITY.UNAVAILABLE,
    JOB_STATUS.CANCELLED,
  ]),

  BUSY: Object.freeze([
    STATUS.BUSY,
    AVAILABILITY.WORKING,
    JOB_STATUS.ASSIGNED,
  ]),
});
