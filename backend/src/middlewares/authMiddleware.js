// ======================================================
// 🔐 JOBFAST AUTH MIDDLEWARE (ULTRA PRO FINAL POLISHED)
// src/middlewares/authMiddleware.js
// ======================================================

import jwt from "jsonwebtoken";
import { HTTP_STATUS, USER_ROLES } from "../config/constants.js";
import { env } from "../config/env.js";

// ======================================================
// 🔎 TOKEN EXTRACTION (SAFE)
// ======================================================

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) return null;
  if (parts[0] !== "Bearer") return null;

  return parts[1];
};

// ======================================================
// 🔐 VERIFY TOKEN (SAFE WRAPPER)
// Supports both legacy JWT (signed with JWT_SECRET, uses decoded.id)
// and Supabase JWT (signed with SUPABASE_JWT_SECRET, uses decoded.sub).
// ======================================================

const verifyToken = (token) => {
  // Try legacy secret first (fastest path for current tokens)
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (_) { /* try next */ }

  // Fall back to Supabase JWT secret
  if (env.SUPABASE_JWT_SECRET) {
    try {
      return jwt.verify(token, env.SUPABASE_JWT_SECRET);
    } catch (_) { /* fall through to null */ }
  }

  return null;
};

/**
 * Resolve user ID from either token style.
 * Legacy: decoded.id   Supabase: decoded.sub
 */
const resolveUserId = (decoded) => decoded?.id ?? decoded?.sub ?? null;

/**
 * Resolve app role from either token style.
 * Legacy: decoded.role  Supabase: app_metadata.role or user_metadata.role
 */
const resolveRole = (decoded) =>
  decoded?.role ||
  decoded?.app_metadata?.role ||
  decoded?.user_metadata?.role ||
  'user';

// ======================================================
// 🧼 NORMALIZE ROLE
// ======================================================

const normalizeRole = (role) => {
  if (!role) return "user";
  return String(role).toLowerCase().trim();
};

// ======================================================
// 🧠 AUTH MIDDLEWARE
// ======================================================

export const authMiddleware = (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const decoded = verifyToken(token);
  const userId  = resolveUserId(decoded);

  if (!decoded || !userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }

  req.user = {
    _id:   userId,
    id:    userId,
    email: decoded.email ?? null,
    role:  normalizeRole(resolveRole(decoded)),
    iat:   decoded.iat ?? null,
    exp:   decoded.exp ?? null,
  };

  return next();
};

// ======================================================
// 👮 ROLE BASED ACCESS CONTROL
// ======================================================

export const authorizeRoles = (...allowedRoles) => {
  const roles = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!roles.includes(userRole)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Forbidden: insufficient permissions.",
      });
    }

    return next();
  };
};

// ======================================================
// 🛡️ ADMIN ONLY SHORTCUT
// ======================================================

export const adminOnly = authorizeRoles(
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN
);

// ======================================================
// 🔓 OPTIONAL AUTH (NON-BLOCKING)
// ======================================================

export const optionalAuth = (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) return next();

  const decoded = verifyToken(token);

  const optUserId = resolveUserId(decoded);
  if (optUserId) {
    req.user = {
      _id:   optUserId,
      id:    optUserId,
      email: decoded.email ?? null,
      role:  normalizeRole(resolveRole(decoded)),
    };
  }

  return next();
};

// ======================================================
// 📌 REQUEST META (AUDIT READY)
// ======================================================

export const attachRequestMeta = (req, res, next) => {
  const forwarded = req.headers["x-forwarded-for"];

  req.meta = {
    ip: forwarded ? forwarded.split(",")[0] : req.ip || "unknown",
    userAgent: req.get("user-agent") || "unknown",
    timestamp: Date.now(),
    method: req.method,
    path: req.originalUrl,
  };

  return next();
};