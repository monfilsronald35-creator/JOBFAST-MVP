// ======================================================
// 🧠 VALIDATORS (JOBFAST CORE UTILS)
// ======================================================

// ======================================================
// 🧼 REGEX PATTERNS
// ======================================================

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAFE_STRING_REGEX = /^[a-zA-Z0-9_-]+$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ======================================================
// 🧼 BASIC HELPERS
// ======================================================

export const isString = (v) => typeof v === "string";

export const isNumber = (v) =>
  typeof v === "number" && Number.isFinite(v);

export const isBoolean = (v) => typeof v === "boolean";

// ======================================================
// 🧠 STRING VALIDATION
// ======================================================

export const isSafeString = (value, min = 3, max = 100) => {
  if (!isString(value)) return false;

  const clean = value.trim();

  if (clean.length < min || clean.length > max) return false;

  return SAFE_STRING_REGEX.test(clean);
};

export const isEmail = (email) => {
  if (!isString(email)) return false;
  return EMAIL_REGEX.test(email.trim());
};

// ======================================================
// 🧼 ID VALIDATION (OBJECTID / UUID / CUSTOM)
// ======================================================

export const isSafeId = (id) => {
  if (!isString(id)) return false;

  const clean = id.trim();

  if (clean.length < 3 || clean.length > 100) return false;

  return (
    OBJECT_ID_REGEX.test(clean) ||
    UUID_REGEX.test(clean) ||
    isSafeString(clean, 3, 100)
  );
};

export const assertSafeId = (id, label = "ID") => {
  if (id === undefined || id === null || id === "") {
    throw new Error(`${label} is required`);
  }

  const clean = isString(id) ? id.trim() : id;

  if (!isSafeId(clean)) {
    throw new Error(`${label} is invalid`);
  }

  return clean;
};

// ======================================================
// 📍 GEO VALIDATION
// ======================================================

export const isValidLatitude = (lat) =>
  isNumber(lat) && lat >= -90 && lat <= 90;

export const isValidLongitude = (lng) =>
  isNumber(lng) && lng >= -180 && lng <= 180;

export const isValidCoordinates = (lat, lng) =>
  isValidLatitude(lat) && isValidLongitude(lng);

// ======================================================
// 💰 NUMBER VALIDATION
// ======================================================

export const isPositiveNumber = (v) =>
  isNumber(v) && v >= 0;

export const isStrictPositiveNumber = (v) =>
  isNumber(v) && v > 0;

export const isPositiveInt = (v) =>
  Number.isInteger(v) && v > 0;

// ======================================================
// 🧼 ARRAY VALIDATION
// ======================================================

export const isNonEmptyArray = (arr) =>
  Array.isArray(arr) && arr.length > 0;

// ======================================================
// 🛡️ OBJECT VALIDATION
// ======================================================

export const isObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// ======================================================
// 🚨 EXPRESS HELPERS
// ======================================================

export const validateRequiredFields = (fields = [], body = {}) => {
  const missing = fields.filter((field) => {
    const value = body[field];

    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  if (missing.length > 0) {
    throw new Error(`Missing fields: ${missing.join(", ")}`);
  }

  return true;
};

// ======================================================
// 🧠 FUTURE EXTENSIONS
// ======================================================
// - password strength validator
// - phone number validation (intl)
// - file upload validation
// - schema-based validator (Zod/Joi replacement layer)
// ======================================================
