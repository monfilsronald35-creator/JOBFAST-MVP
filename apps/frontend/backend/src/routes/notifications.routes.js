import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

import {
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendNotification,
  sendGlobalNotification,
  aiGenerateNotification,
  aiNotificationDigest,
  getNotificationStats,
} from "../controllers/notificationsController.js";

import { authMiddleware, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================================
// ⚡ RATE LIMITERS
// ======================================================
const userLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// ======================================================
// 🔐 AUTH LAYER (Deplase isit la pou req.user ka egziste anba)
// ======================================================
router.use(authMiddleware);

// ======================================================
// 🧠 REQUEST CONTEXT
// ======================================================
router.use((req, res, next) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded?.split(",")[0]?.trim() || req.ip || "unknown";

  req.requestId = crypto.randomUUID();

  req.meta = Object.freeze({
    requestId: req.requestId,
    source: "notifications-api",
    ip,
    method: req.method,
    path: req.originalUrl,
    timestamp: Date.now(),
    userId: req.user?.id ?? null, // Koulye a sa ap travay paske authMiddleware anlè l!
    isAdminRoute: req.originalUrl.startsWith("/admin"),
    userAgent: req.headers["user-agent"] || null,
  });

  next();
});

// ======================================================
// 🧠 RESPONSE UTILITIES & SAFE WRAPPER
// ======================================================
const fail = (res, message, req, code = 500) =>
  res.status(code).json({ success: false, requestId: req.requestId, message });

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res, next);
  } catch (err) {
    console.error("[NOTIF ERROR]", { requestId: req.requestId, error: err.message, path: req.originalUrl });
    return fail(res, "Internal server error", req);
  }
};

const sanitizeIdParam = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return fail(res, "Invalid ID format", req, 400);
  }
  next();
};

// ======================================================
// 👤 USER NOTIFICATIONS (Lòd fiks yo ranje anlè)
// ======================================================
router.get("/", userLimiter, asyncHandler(getUserNotifications));
router.get("/stats", userLimiter, asyncHandler(getNotificationStats));

// 🔄 Switched: ranje /read-all anlè rout ak :id a pou evite konfizyon nan Express
router.patch("/read-all", userLimiter, asyncHandler(markAllAsRead));
router.patch("/:id/read", userLimiter, sanitizeIdParam, asyncHandler(markNotificationAsRead));

router.delete("/", userLimiter, asyncHandler(deleteAllNotifications));
router.delete("/:id", userLimiter, sanitizeIdParam, asyncHandler(deleteNotification));

router.post("/send", userLimiter, asyncHandler(sendNotification));

// ======================================================
// 🛡️ ADMIN LAYER (STRICT)
// ======================================================
router.get("/admin", adminLimiter, adminOnly, asyncHandler(getAdminNotifications));
router.post("/admin/global", adminLimiter, adminOnly, asyncHandler(sendGlobalNotification));

// ======================================================
// 🤖 AI ENGINE
// ======================================================
const validateAIRequest = (req, res, next) => {
  if (!req.body || typeof req.body !== "object") return fail(res, "Invalid AI request body", req, 400);
  if (!req.user?.id) return fail(res, "Unauthorized AI request", req, 401);
  next();
};

router.post("/ai/generate", aiLimiter, validateAIRequest, asyncHandler(aiGenerateNotification));
router.get("/ai/digest", aiLimiter, asyncHandler(aiNotificationDigest));

export default router;
