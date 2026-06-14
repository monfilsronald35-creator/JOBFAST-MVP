// ======================================================
// 🧼 SAFE ID UTILITY (ENTERPRISE FINAL - OPTIMIZED)
// ======================================================

// ======================================================
// 🧠 REGEX PATTERNS
// ======================================================

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAFE_STRING_REGEX = /^[a-zA-Z0-9_-]{3,100}$/;

// ======================================================
// 🧼 NORMALIZER (HARDENED)
// ======================================================

const normalizeId = (id) => {
  if (typeof id !== "string") return null;

  const cleaned = id
    .replace(/\u200B/g, "") // zero-width fix
    .trim();

  return cleaned || null;
};

// ======================================================
// 🧠 CORE VALIDATION
// ======================================================

export const isSafeId = (id) => {
  const clean = normalizeId(id);
  if (!clean) return false;

  const len = clean.length;
  if (len < 3 || len > 100) return false;

  return (
    OBJECT_ID_REGEX.test(clean) ||
    UUID_REGEX.test(clean) ||
    SAFE_STRING_REGEX.test(clean)
  );
};

// ======================================================
// 🚨 STRICT VALIDATION
// ======================================================

export const assertSafeId = (id, label = "ID") => {
  const clean = normalizeId(id);

  if (!clean) {
    throw new Error(`${label} is required`);
  }

  if (!isSafeId(clean)) {
    throw new Error(`${label} is invalid or unsafe`);
  }

  return clean;
};

// ======================================================
// 🧼 SANITIZE
// ======================================================

export const sanitizeId = (id) => {
  const clean = normalizeId(id);
  return clean && isSafeId(clean) ? clean : null;
};

// ======================================================
// 🔍 TYPE DETECTOR
// ======================================================

export const detectIdType = (id) => {
  const clean = normalizeId(id);
  if (!clean) return "invalid";

  if (OBJECT_ID_REGEX.test(clean)) return "objectId";
  if (UUID_REGEX.test(clean)) return "uuid";
  if (SAFE_STRING_REGEX.test(clean)) return "custom";

  return "invalid";
};

// ======================================================
// 🛡️ EXPRESS MIDDLEWARE
// ======================================================

export const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const raw = req.params?.[paramName];
    const clean = normalizeId(raw);

    if (!clean) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`,
      });
    }

    if (!isSafeId(clean)) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is invalid or unsafe`,
      });
    }

    req.params[paramName] = clean;
    next();
  };
};