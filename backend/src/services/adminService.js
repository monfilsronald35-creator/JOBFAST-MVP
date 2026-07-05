// ======================================================
// ADMIN SERVICE
// ======================================================

import crypto from "crypto";
import { usersDatabase } from "../controllers/register.controller.js";

// ======================================================
// 🧠 INTERNAL HELPERS
// ======================================================

const throwIfNotFound = (item, name) => {
  if (!item) throw new Error(`${name} not found`);
};

const ensureId = (id, label) => {
  if (!id) throw new Error(`${label} is required`);
};

// ======================================================
// 👥 USER MANAGEMENT (UNCHANGED - CLEAN)
// ======================================================

export const banUserService = async (
  userId,
  reason,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.status = "banned";
  user.banReason = reason?.trim() || "No reason provided";
  user.bannedBy = adminId;
  user.bannedAt = new Date();

  await user.save();

  return { success: true, action: "ban_user", userId };
};

// ------------------------------------------------------

export const suspendUserService = async (
  userId,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.status = "suspended";
  user.suspendedBy = adminId;
  user.suspendedAt = new Date();

  await user.save();

  return { success: true, action: "suspend_user", userId };
};

// ------------------------------------------------------

export const verifyUserService = async (
  userId,
  adminId,
  UserModel
) => {
  ensureId(userId, "User ID");

  const user = await UserModel.findById(userId);
  throwIfNotFound(user, "User");

  user.isVerified = true;
  user.verifiedBy = adminId;
  user.verifiedAt = new Date();

  await user.save();

  return { success: true, action: "verify_user", userId };
};

// ======================================================
// 🗑️ CONTENT MODERATION (OPTIMIZED)
// ======================================================

export const deletePostService = async (postId, PostModel) => {
  ensureId(postId, "Post ID");

  const post = await PostModel.findByIdAndDelete(postId);
  throwIfNotFound(post, "Post");

  return { success: true, action: "delete_post", postId };
};

// ------------------------------------------------------

export const deleteCommentService = async (
  commentId,
  CommentModel
) => {
  ensureId(commentId, "Comment ID");

  const comment = await CommentModel.findByIdAndDelete(commentId);
  throwIfNotFound(comment, "Comment");

  return { success: true, action: "delete_comment", commentId };
};

// ======================================================
// 📊 DASHBOARD STATS (FAST + SAFE)
// ======================================================

export const getAdminStatsService = async (models) => {
  const { UserModel, PostModel, PaymentModel } = models;

  const [users, posts, payments] = await Promise.all([
    UserModel.countDocuments(),
    PostModel.countDocuments(),
    PaymentModel.countDocuments(),
  ]);

  return {
    success: true,
    data: { users, posts, payments },
    generatedAt: new Date().toISOString(),
  };
};

// ======================================================
// 🔔 GLOBAL NOTIFICATION SYSTEM (OOM SAFE + PRO HARDENED)
// ======================================================

export const sendGlobalNotificationService = async (
  message,
  adminId,
  NotificationModel,
  UserModel
) => {
  if (!message?.trim()) throw new Error("Message required");

  const cleanMessage = message.trim();

  const cursor = UserModel.find({}, "_id").lean().cursor();

  let batch = [];
  let sent = 0;

  for await (const user of cursor) {
    batch.push({
      userId: user._id,
      message: cleanMessage,
      type: "global",
      createdBy: adminId,
      createdAt: new Date(),
    });

    // 🔥 SAFE BATCH FLUSH
    if (batch.length >= 1000) {
      try {
        await NotificationModel.insertMany(batch, {
          ordered: false,
        });
        sent += batch.length;
      } catch (err) {
        // continue even if partial fail (enterprise resilience)
        console.error("[GLOBAL NOTIF BATCH ERROR]", err.message);
      }
      batch = [];
    }
  }

  // flush last batch
  if (batch.length > 0) {
    try {
      await NotificationModel.insertMany(batch, {
        ordered: false,
      });
      sent += batch.length;
    } catch (err) {
      console.error("[GLOBAL NOTIF FINAL BATCH ERROR]", err.message);
    }
  }

  return {
    success: true,
    action: "global_notification",
    sent,
  };
};

// ======================================================
// 🧠 AI ADMIN ENGINE (STRICT VALIDATION + SAFE EXECUTION)
// ======================================================

export const aiAdminDecisionService = async (input, AIEngine) => {
  if (!AIEngine || typeof AIEngine.process !== "function") {
    throw new Error("Invalid AI Engine");
  }

  if (!input || typeof input !== "object") {
    throw new Error("AI input required");
  }

  const result = await AIEngine.process(input);

  return {
    success: true,
    action: "ai_decision",
    result,
    processedAt: new Date().toISOString(),
  };
};
// ======================================================
// DEFAULT EXPORT — maps method names the adminController expects
// to in-memory implementations that work with usersDatabase.
// ======================================================

const adminService = {

  getDashboardStats: async () => {
    const users = Array.from(usersDatabase.values());
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.accountStatus !== 'suspended' && u.accountStatus !== 'banned').length,
      verifiedUsers: users.filter(u => u.verified).length,
      roles: users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {}),
      generatedAt: new Date().toISOString(),
    };
  },

  getPlatformAnalytics: async () => ({
    userGrowth: [], revenueGrowth: [], topProfessions: [], generatedAt: new Date().toISOString(),
  }),

  getUsers: async ({ page = 1, limit = 20, search = '', role = null, status = null } = {}) => {
    let users = Array.from(usersDatabase.values()).map(({ password, ...u }) => u);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (role)   users = users.filter(u => u.role === role);
    if (status) users = users.filter(u => u.accountStatus === status);
    const total = users.length;
    const start = (page - 1) * limit;
    return { items: users.slice(start, start + limit), total, page, limit, hasMore: start + limit < total };
  },

  getUserStats: async () => {
    const users = Array.from(usersDatabase.values());
    return { total: users.length, byRole: users.reduce((a, u) => { a[u.role] = (a[u.role]||0)+1; return a; }, {}) };
  },

  verifyUser: async ({ userId, adminId }) => {
    const user = usersDatabase.get(userId);
    if (!user) throw new Error('User not found');
    user.verified = true;
    user.verifiedBy = adminId;
    user.verifiedAt = new Date().toISOString();
    usersDatabase.set(userId, user);
    return { userId, verified: true };
  },

  suspendUser: async ({ userId, reason, adminId }) => {
    const user = usersDatabase.get(userId);
    if (!user) throw new Error('User not found');
    user.accountStatus = 'suspended';
    user.suspendedReason = reason;
    user.suspendedBy = adminId;
    usersDatabase.set(userId, user);
    return { userId, accountStatus: 'suspended' };
  },

  banUser: async ({ userId, reason, adminId }) => {
    const user = usersDatabase.get(userId);
    if (!user) throw new Error('User not found');
    user.accountStatus = 'banned';
    user.banReason = reason;
    user.bannedBy = adminId;
    usersDatabase.set(userId, user);
    return { userId, accountStatus: 'banned' };
  },

  getJobStats: async () => ({ total: 0, active: 0, filled: 0, generatedAt: new Date().toISOString() }),

  getReportedContent: async ({ page = 1, limit = 20 } = {}) => ({ items: [], total: 0, page, limit }),

  getBusinessStats: async () => {
    const users = Array.from(usersDatabase.values());
    const businesses = users.filter(u => ['company','enterprise','restaurant','hotel','rental','tourism','hospital','clinic'].includes(u.role));
    return { total: businesses.length, verified: businesses.filter(u => u.verified).length };
  },

  getPaymentStats: async () => ({ total: 0, volume: 0, generatedAt: new Date().toISOString() }),

  getSystemSettings: async () => ({
    maintenance: false,
    registrationOpen: true,
    maxUsersPerSearch: 50,
    gpsEnabled: true,
  }),

  updateSystemSettings: async ({ data }) => ({ ...data, updatedAt: new Date().toISOString() }),

  toggleMaintenanceMode: async ({ enabled }) => ({ maintenance: enabled, updatedAt: new Date().toISOString() }),

  getAdminNotifications: async (adminId) => [],

  sendGlobalNotification: async ({ title, message, createdBy }) => {
    let count = 0;
    for (const [uid, user] of usersDatabase.entries()) {
      if (!user.notifications) user.notifications = [];
      user.notifications.unshift({ type: 'global', title, message, createdAt: new Date().toISOString(), read: false });
      if (user.notifications.length > 100) user.notifications.length = 100;
      usersDatabase.set(uid, user);
      count++;
    }
    return { sent: count };
  },

  getAuditLogs: async ({ page = 1, limit = 50 } = {}) => ({ entries: [], total: 0, page, limit }),

  exportData: async ({ type }) => ({ type, exported: 0, generatedAt: new Date().toISOString() }),

  clearCache: async () => { /* in-memory MVP: no persistent cache to clear */ },

  getSystemHealth: async () => {
    const mem = process.memoryUsage();
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: { heapUsedMb: Math.round(mem.heapUsed/1024/1024), rssMb: Math.round(mem.rss/1024/1024) },
      users: usersDatabase.size,
    };
  },
};

export default adminService;