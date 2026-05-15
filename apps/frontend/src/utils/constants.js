
/* ===============================
   🚀 GLOBAL APP CONSTANTS (FINAL MVP SAFE CORE)
   =============================== */

/* ===============================
   👤 USER ROLES
   =============================== */
export const USER_ROLES = {
  ADMIN: "admin",

  // Construction system
  BOSS: "boss",
  WORKER: "worker",
  APPRENTICE: "apprentice",
  DRIVER: "driver",
  ENGINEER: "engineer",

  // Service providers
  PROVIDER: "provider",

  USER: "user",
};

/* ===============================
   🏗️ BUSINESS TYPES
   =============================== */
export const BUSINESS_TYPES = {
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
};

/* ===============================
   🧱 CONSTRUCTION SERVICES
   =============================== */
export const CONSTRUCTION_SERVICES = [
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
];

/* ===============================
   ⚡ ON-DEMAND SERVICES
   =============================== */
export const ON_DEMAND_SERVICES = [
  "chef_lakay",
  "plumber",
  "doctor",
  "nurse",
  "taxi",
  "delivery",
  "cleaning",
  "videographer",
  "designer",
];

/* ===============================
   📍 LOCATION SYSTEM
   =============================== */
export const LOCATION_LEVELS = {
  CITY: "city",
  STATE: "state",
  COUNTRY: "country",
};

export const DEFAULT_LOCATION = {
  lat: 18.5601,
  lng: -68.3725,
  zoom: 10,
};

/* ===============================
   📡 USER STATUS SYSTEM
   =============================== */
export const USER_STATUS = {
  ONLINE: "online",
  BUSY: "busy",
  OFFLINE: "offline",
};

/* ===============================
   🚧 AVAILABILITY SYSTEM
   =============================== */
export const AVAILABILITY_STATUS = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  WORKING: "working",
  ON_BREAK: "on_break",
};

/* ===============================
   🚧 JOB STATUS SYSTEM (IMPROVED SAFE FLOW)
   =============================== */
export const JOB_STATUS = {
  PENDING: "pending",
  AVAILABLE: "available",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/* ===============================
   🔥 PRIORITY SYSTEM
   =============================== */
export const PRIORITY_LEVELS = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

/* ===============================
   🔔 NOTIFICATION TYPES
   =============================== */
export const NOTIFICATION_TYPES = {
  SYSTEM: "system",
  JOB: "job",
  SERVICE: "service",
  MESSAGE: "message",
  ALERT: "alert",
};

/* ===============================
   ⚡ SEARCH LIMITS
   =============================== */
export const SEARCH_LIMITS = {
  USERS: 20,
  BUSINESSES: 20,
  SERVICES: 15,
  JOBS: 20,
};

/* ===============================
   🧩 UI CONSTANTS
   =============================== */
export const UI = {
  MAX_MODAL_WIDTH: 500,
  TOAST_DURATION: 3000,
  ANIMATION_SPEED: 200,
};

/* ===============================
   🧠 GLOBAL ENTITY TYPES
   =============================== */
export const ENTITY_TYPES = {
  USER: "user",
  BUSINESS: "business",
  SERVICE: "service",
  JOB: "job",
  LOCATION: "location",
};

/* ===============================
   🧭 STATUS GROUPING (NEW - IMPORTANT FOR UI FILTERS)
   =============================== */
export const STATUS_GROUPS = {
  ACTIVE: ["online", "available", "in_progress"],
  INACTIVE: ["offline", "unavailable", "cancelled"],
  BUSY: ["busy", "working", "assigned"],
};