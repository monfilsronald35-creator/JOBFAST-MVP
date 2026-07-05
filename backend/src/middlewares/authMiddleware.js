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
// ======================================================

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

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

  if (!decoded || !decoded.id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email ?? null,
    role: normalizeRole(decoded.role),
    iat: decoded.iat ?? null,
    exp: decoded.exp ?? null,
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

  if (decoded?.id) {
    req.user = {
      id: decoded.id,
      email: decoded.email ?? null,
      role: normalizeRole(decoded.role),
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