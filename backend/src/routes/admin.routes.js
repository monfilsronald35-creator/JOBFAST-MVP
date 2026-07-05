// ======================================================
// 🛡️ JOBFAST ADMIN ROUTES (AI CORE ENTERPRISE MAX + FULL SYSTEM)
// ======================================================

import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

import {
  getDashboardStats,
  getUserStats,
  getJobStats,
  getPaymentStats,
  getBusinessStats,
  getPlatformAnalytics,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  getReportedContent,
  getAdminNotifications,
  toggleMaintenanceMode,
  sendGlobalNotification,
  exportData,
  clearCache,
  adminHealthCheck,
  getUsers,
  verifyUser,
  suspendUser,
  banUser,

  // Governance
  exportAuditLogs,
  getFeatureFlags,
  updateFeatureFlag,
  getModerationQueue,
  moderateItem,
  getFraudDashboard,
  runFraudScan,
  getDisputeQueue,
  updateDisputeStatus,
  getCountryConfig,
  updateCountryConfig,
  getPermissionMatrix,
  updatePermissionMatrix,
  getConsentLogs,
  updateUserConsent,
  getGovernanceHealth,
  getSecurityEvents,

  aiAdminGateway,

  // 🤖 AI CORE EXTENSIONS (NEW POWER LAYER)
  aiFraudDetection,
  aiAutoModeration,
  aiSmartInsights,
  aiRevenueForecast,
  aiUserScoring,
  aiNotificationEngine,
  aiAutoActions,
} from "../controllers/adminController.js";

import { authMiddleware, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================================
// ⚡ RATE LIMITERS (ENTERPRISE SAFE STACK)
// ======================================================

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

const aiIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
});

// ======================================================
// 🔐 GLOBAL SECURITY STACK
// ======================================================

router.use(adminLimiter);
router.use(authMiddleware);
router.use(adminOnly);

// ======================================================
// 🧠 REQUEST META (FULL OBSERVABILITY LAYER)
// ======================================================

router.use((req, res, next) => {
  const forwarded = req.headers["x-forwarded-for"];

  req.requestId = crypto.randomUUID();

  req.meta = Object.freeze({
    requestId: req.requestId,
    source: "admin-api",
    ip: req.ip || forwarded?.split(",")[0] || "unknown",
    method: req.method,
    path: req.originalUrl,
    timestamp: Date.now(),
    adminId: req.user?.id || null,
    env: process.env.NODE_ENV || "development",

    // 🔥 AI SIGNALS
    isAdminRoute: true,
    hasAI: true,
  });

  next();
});

// ======================================================
// 🧠 AI CONTEXT BUILDER (IMMUTABLE CORE)
// ======================================================

const buildAIContext = (req, mode) =>
  Object.freeze({
    requestId: req.requestId,

    admin: Object.freeze({
      id: req.user.id,
      role: req.user.role,
    }),

    request: Object.freeze({
      path: req.meta.path,
      method: req.meta.method,
    }),

    system: Object.freeze({
      time: new Date().toISOString(),
      env: req.meta.env,
    }),

    input: req.body,

    mode,
  });

// ======================================================
// 🧠 AI MODE VALIDATION (FAST SET LOOKUP)
// ======================================================

const validateAIMode = (mode) => {
  const allowed = new Set([
    "assistant",
    "moderation",
    "announce",
    "analyze",
    "bulk",
    "fraud",
    "insights",
    "forecast",
  ]);

  return allowed.has(mode);
};

// ======================================================
// 📊 CORE ANALYTICS
// ======================================================

router.get("/dashboard", getDashboardStats);
router.get("/analytics", getPlatformAnalytics);

// ======================================================
// 👥 USERS MANAGEMENT
// ======================================================

router.get("/users", getUsers);
router.get("/users/stats", getUserStats);

router.patch("/users/:id/verify", verifyUser);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/ban", banUser);

// ======================================================
// 💼 MODERATION
// ======================================================

router.get("/jobs/stats", getJobStats);
router.get("/reports", getReportedContent);

// ======================================================
// 🏢 BUSINESS
// ======================================================

router.get("/business/stats", getBusinessStats);

// ======================================================
// 💳 PAYMENTS
// ======================================================

router.get("/payments/stats", getPaymentStats);

// ======================================================
// ⚙️ SYSTEM CONFIG
// ======================================================

router
  .route("/settings")
  .get(getSystemSettings)
  .put(updateSystemSettings);

router.patch("/maintenance", toggleMaintenanceMode);

// ======================================================
// 🔔 NOTIFICATIONS SYSTEM
// ======================================================

router.route("/notifications").get(getAdminNotifications);
router.post("/notifications/global", sendGlobalNotification);

// ======================================================
// 🤖 AI CORE ENGINE (FULL ENTERPRISE BRAIN)
// ======================================================

router.post(
  "/ai",
  aiLimiter,
  aiIpLimiter,
  (req, res, next) => {
    try {
      const mode = req.body?.mode || "assistant";

      if (!validateAIMode(mode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid AI mode",
          requestId: req.requestId,
        });
      }

      req.aiContext = buildAIContext(req, mode);
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "AI middleware failed",
        requestId: req.requestId,
      });
    }
  },
  aiAdminGateway
);

// ======================================================
// 🤖 AI POWER FEATURES (NEW INTELLIGENCE LAYER)
// ======================================================

// 🔥 Fraud detection system
router.post("/ai/fraud-detection", aiFraudDetection);

// 🔥 Auto moderation engine
router.post("/ai/moderation", aiAutoModeration);

// 🔥 Business intelligence insights
router.get("/ai/insights", aiSmartInsights);

// 🔥 Revenue prediction engine
router.get("/ai/forecast", aiRevenueForecast);

// 🔥 User behavior scoring
router.get("/ai/user-score/:id", aiUserScoring);

// 🔥 Smart notification generator
router.post("/ai/notifications", aiNotificationEngine);

// 🔥 Auto admin actions (self-healing system)
router.post("/ai/auto-actions", aiAutoActions);

// ======================================================
// 📋 SYSTEM
// ======================================================

router.get("/audit-logs", getAuditLogs);
router.get("/export", exportData);
router.delete("/cache", clearCache);
router.get("/health", adminHealthCheck);

// ======================================================
// 🚀 FUTURE EVOLUTION LAYER
// ======================================================
// - self healing admin system
// - AI autonomous moderation
// - real-time fraud blocking
// - predictive scaling engine
// - zero-admin automation mode

// ======================================================
// GOVERNANCE ROUTES
// ======================================================

router.get("/governance/audit-logs", getAuditLogs);
router.get("/governance/audit-logs/export", exportAuditLogs);

router.get("/governance/feature-flags", getFeatureFlags);
router.post("/governance/feature-flags/:id", updateFeatureFlag);

router.get("/governance/moderation", getModerationQueue);
router.post("/governance/moderation/:type/:id", moderateItem);

router.get("/governance/fraud", getFraudDashboard);
router.post("/governance/fraud/scan", runFraudScan);

router.get("/governance/disputes", getDisputeQueue);
router.patch("/governance/disputes/:id", updateDisputeStatus);

router.get("/governance/countries", getCountryConfig);
router.patch("/governance/countries/:code", updateCountryConfig);

router.get("/governance/permissions", getPermissionMatrix);
router.patch("/governance/permissions/:role", updatePermissionMatrix);

router.get("/governance/consent", getConsentLogs);
router.patch("/governance/consent/:userId", updateUserConsent);

router.get("/governance/health", getGovernanceHealth);
router.get("/governance/security", getSecurityEvents);

export default router;