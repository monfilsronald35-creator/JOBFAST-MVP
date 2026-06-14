// ======================================================
// 🏢 JOBFAST BUSINESS ROUTES (ULTRA PRO FINAL)
// src/routes/business.routes.js
// ======================================================

import express from "express";
import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  verifyBusiness,
  suspendBusiness,
  getBusinessStats,
} from "../controllers/businessController.js";

import {
  authMiddleware,
  adminOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================================
// 🧠 MIDDLEWARE GROUPS (CLEAN ARCHITECTURE)
// ======================================================

const requireAuth = authMiddleware;
const requireAdmin = adminOnly;
const adminGuard = [authMiddleware, adminOnly];

// ======================================================
// 🌍 PUBLIC ROUTES
// ======================================================

// GET all businesses (public + optional pagination support)
router.get("/", getBusinesses);

// GET business stats (admin only)
router.get("/admin/stats", adminGuard, getBusinessStats);

// GET single business by ID (public)
// ⚠️ Must be after fixed routes
router.get("/:id", getBusinessById);

// ======================================================
// 🔐 AUTH REQUIRED ROUTES
// ======================================================

router.use(requireAuth);

// ➕ CREATE BUSINESS
router.post("/", createBusiness);

// ✏️ UPDATE BUSINESS
router.put("/:id", updateBusiness);

// 🗑️ DELETE BUSINESS
router.delete("/:id", deleteBusiness);

// ======================================================
// 👮 ADMIN ONLY ROUTES
// ======================================================

// ✅ VERIFY BUSINESS
router.patch("/:id/verify", requireAdmin, verifyBusiness);

// 🚫 SUSPEND BUSINESS
router.patch("/:id/suspend", requireAdmin, suspendBusiness);

// ======================================================
// 🧱 FUTURE READY (OPTIONAL EXTENSIONS)
// ======================================================

// router.patch("/:id/feature", requireAdmin, featureBusiness);
// router.patch("/:id/unfeature", requireAdmin, unfeatureBusiness);
// router.get("/admin/reports", adminGuard, getBusinessReports);

export default router;