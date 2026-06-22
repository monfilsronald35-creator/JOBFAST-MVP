// ======================================================
// 🚀 JOBFAST ADMIN CONTROLLER (ULTRA PRO MAX)
// src/controllers/adminController.js
// ======================================================

import adminService from "../services/adminService.js";
import { HTTP_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ======================================================
// 🧩 RESPONSE HELPER (internal pattern)
// ======================================================

const sendResponse = (res, data, message = null, status = HTTP_STATUS.OK) => {
  return res.status(status).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

// ======================================================
// 📊 DASHBOARD & ANALYTICS
// ======================================================

export const getDashboardStats = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboardStats();
  return sendResponse(res, data);
});

export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getPlatformAnalytics();
  return sendResponse(res, data);
});

// ======================================================
// 👥 USERS MANAGEMENT (ADVANCED)
// ======================================================

export const getUsers = asyncHandler(async (req, res) => {
  const data = await adminService.getUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search || "",
    role: req.query.role || null,
    status: req.query.status || null,
  });

  return sendResponse(res, data);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const data = await adminService.getUserStats();
  return sendResponse(res, data);
});

export const verifyUser = asyncHandler(async (req, res) => {
  const data = await adminService.verifyUser({
    userId: req.params.id,
    adminId: req.user.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendResponse(res, data, "User verified successfully");
});

export const suspendUser = asyncHandler(async (req, res) => {
  const data = await adminService.suspendUser({
    userId: req.params.id,
    reason: req.body.reason || "No reason provided",
    adminId: req.user.id,
  });

  return sendResponse(res, data, "User suspended successfully");
});

export const banUser = asyncHandler(async (req, res) => {
  const data = await adminService.banUser({
    userId: req.params.id,
    reason: req.body.reason || "No reason provided",
    adminId: req.user.id,
  });

  return sendResponse(res, data, "User banned successfully");
});

// ======================================================
// 💼 JOBS MANAGEMENT
// ======================================================

export const getJobStats = asyncHandler(async (req, res) => {
  const data = await adminService.getJobStats();
  return sendResponse(res, data);
});

export const getReportedContent = asyncHandler(async (req, res) => {
  const data = await adminService.getReportedContent({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });

  return sendResponse(res, data);
});

// ======================================================
// 🏢 BUSINESS
// ======================================================

export const getBusinessStats = asyncHandler(async (req, res) => {
  const data = await adminService.getBusinessStats();
  return sendResponse(res, data);
});

// ======================================================
// 💳 PAYMENTS
// ======================================================

export const getPaymentStats = asyncHandler(async (req, res) => {
  const data = await adminService.getPaymentStats();
  return sendResponse(res, data);
});

// ======================================================
// ⚙️ SYSTEM SETTINGS
// ======================================================

export const getSystemSettings = asyncHandler(async (req, res) => {
  const data = await adminService.getSystemSettings();
  return sendResponse(res, data);
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const data = await adminService.updateSystemSettings({
    data: req.body || {},
    updatedBy: req.user.id,
  });

  return sendResponse(res, data, "Settings updated successfully");
});

export const toggleMaintenanceMode = asyncHandler(async (req, res) => {
  const data = await adminService.toggleMaintenanceMode({
    enabled: Boolean(req.body.enabled),
    updatedBy: req.user.id,
  });

  return sendResponse(res, data, "Maintenance mode updated");
});

// ======================================================
// 🔔 NOTIFICATIONS SYSTEM
// ======================================================

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const data = await adminService.getAdminNotifications(req.user.id);
  return sendResponse(res, data);
});

export const sendGlobalNotification = asyncHandler(async (req, res) => {
  const data = await adminService.sendGlobalNotification({
    title: req.body.title,
    message: req.body.message,
    createdBy: req.user.id,
  });

  return sendResponse(
    res,
    data,
    "Notification sent successfully",
    HTTP_STATUS.CREATED
  );
});

// ======================================================
// 📋 AUDIT LOGS
// ======================================================

export const getAuditLogs = asyncHandler(async (req, res) => {
  const data = await adminService.getAuditLogs({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });

  return sendResponse(res, data);
});

// ======================================================
// 📤 EXPORT DATA
// ======================================================

export const exportData = asyncHandler(async (req, res) => {
  const data = await adminService.exportData({
    type: req.query.type || "all",
    requestedBy: req.user.id,
  });

  return sendResponse(res, data);
});

// ======================================================
// 🧹 CACHE MANAGEMENT
// ======================================================

export const clearCache = asyncHandler(async (req, res) => {
  await adminService.clearCache();
  return sendResponse(res, null, "Cache cleared successfully");
});

// ======================================================
// ❤️ SYSTEM HEALTH CHECK
// ======================================================

export const adminHealthCheck = asyncHandler(async (req, res) => {
  const health = await adminService.getSystemHealth();

  return sendResponse(res, {
    service: "admin",
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    health,
  });
});