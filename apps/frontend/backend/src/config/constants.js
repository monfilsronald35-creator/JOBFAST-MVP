// ======================================================
// 👤 USER ROLES
// ======================================================

export const USER_ROLES = Object.freeze({
  USER: "user",
  WORKER: "worker",
  BUSINESS: "business",
  ADMIN: "admin",
});

export const USER_ROLE_VALUES = Object.freeze(
  Object.values(USER_ROLES)
);

// ======================================================
// 📋 ACCOUNT STATUS
// ======================================================

export const ACCOUNT_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DELETED: "deleted",
});

export const ACCOUNT_STATUS_VALUES = Object.freeze(
  Object.values(ACCOUNT_STATUS)
);

// ======================================================
// 📍 DEFAULT VALUES
// ======================================================

export const DEFAULT_RADIUS_KM = 10;

export const DEFAULTS = Object.freeze({
  LANGUAGE: "es",
  CURRENCY: "USD",
  USER_ROLE: USER_ROLES.USER,
  ACCOUNT_STATUS: ACCOUNT_STATUS.PENDING,
  RADIUS_KM: DEFAULT_RADIUS_KM,
});

// ======================================================
// 📦 SORT OPTIONS
// ======================================================

export const SORT_OPTIONS = Object.freeze({
  ASC: "asc",
  DESC: "desc",
});

export const SORT_OPTION_VALUES = Object.freeze(
  Object.values(SORT_OPTIONS)
);

// ======================================================
// 📱 DEVICE TYPES
// ======================================================

export const DEVICE_TYPES = Object.freeze({
  WEB: "web",
  IOS: "ios",
  ANDROID: "android",
});

export const DEVICE_TYPE_VALUES = Object.freeze(
  Object.values(DEVICE_TYPES)
);

// ======================================================
// 💬 MESSAGE STATUS
// ======================================================

export const MESSAGE_STATUS = Object.freeze({
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
});

export const MESSAGE_STATUS_VALUES = Object.freeze(
  Object.values(MESSAGE_STATUS)
);

// ======================================================
// ⭐ REVIEW STATUS
// ======================================================

export const REVIEW_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const REVIEW_STATUS_VALUES = Object.freeze(
  Object.values(REVIEW_STATUS)
);

// ======================================================
// 🚩 REPORT STATUS
// ======================================================

export const REPORT_STATUS = Object.freeze({
  OPEN: "open",
  UNDER_REVIEW: "under_review",
  RESOLVED: "resolved",
  CLOSED: "closed",
});

export const REPORT_STATUS_VALUES = Object.freeze(
  Object.values(REPORT_STATUS)
);

// ======================================================
// 🔐 HTTP STATUS CODES
// ======================================================

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
});