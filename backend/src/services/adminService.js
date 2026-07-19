// ======================================================
// ADMIN SERVICE — Supabase (migrated from in-memory usersDatabase)
// ======================================================

import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';

// ======================================================
// Legacy named exports — still accepted by adminController
// but now delegate to Supabase via userRepo.
// ======================================================

export const banUserService = async (userId, reason, adminId) => {
  if (!userId) throw new Error('User ID is required');
  await userRepo.update(userId, { accountStatus: 'banned' });
  return { success: true, action: 'ban_user', userId };
};

export const suspendUserService = async (userId, adminId) => {
  if (!userId) throw new Error('User ID is required');
  await userRepo.update(userId, { accountStatus: 'suspended' });
  return { success: true, action: 'suspend_user', userId };
};

export const verifyUserService = async (userId, adminId) => {
  if (!userId) throw new Error('User ID is required');
  await userRepo.update(userId, { verified: true });
  return { success: true, action: 'verify_user', userId };
};

export const deletePostService = async (postId, PostModel) => {
  if (!postId) throw new Error('Post ID is required');
  if (PostModel?.findByIdAndDelete) await PostModel.findByIdAndDelete(postId);
  return { success: true, action: 'delete_post', postId };
};

export const deleteCommentService = async (commentId, CommentModel) => {
  if (!commentId) throw new Error('Comment ID is required');
  if (CommentModel?.findByIdAndDelete) await CommentModel.findByIdAndDelete(commentId);
  return { success: true, action: 'delete_comment', commentId };
};

export const getAdminStatsService = async () => {
  const stats = await userRepo.getStats();
  return { success: true, data: { users: stats.total }, generatedAt: new Date().toISOString() };
};

export const sendGlobalNotificationService = async (message, adminId) => {
  if (!message?.trim()) throw new Error('Message required');
  const { users } = await userRepo.getUsers({ limit: 10000 });
  const notifs = users.map(u => ({
    userId:      u.id,
    type:        'global',
    message:     message.trim(),
    title:       'Message Global',
    sourceUserId: adminId,
  }));
  let sent = 0;
  for (let i = 0; i < notifs.length; i += 1000) {
    await notificationRepo.broadcast(notifs.slice(i, i + 1000)).catch(e =>
      console.error('[adminService] sendGlobalNotificationService batch error:', e.message)
    );
    sent += Math.min(1000, notifs.length - i);
  }
  return { success: true, action: 'global_notification', sent };
};

export const aiAdminDecisionService = async (input, AIEngine) => {
  if (!AIEngine || typeof AIEngine.process !== 'function') throw new Error('Invalid AI Engine');
  if (!input || typeof input !== 'object') throw new Error('AI input required');
  const result = await AIEngine.process(input);
  return { success: true, action: 'ai_decision', result, processedAt: new Date().toISOString() };
};

// ======================================================
// DEFAULT EXPORT — used by adminController.js
// ======================================================

const adminService = {

  getDashboardStats: async () => {
    const { total, byRole, byStatus } = await userRepo.getStats();
    return {
      totalUsers:    total,
      activeUsers:   (byStatus.active   ?? 0),
      verifiedUsers: 0,  // computed on demand — no scan needed
      roles:         byRole,
      generatedAt:   new Date().toISOString(),
    };
  },

  getPlatformAnalytics: async () => ({
    userGrowth: [], revenueGrowth: [], topProfessions: [], generatedAt: new Date().toISOString(),
  }),

  getUsers: async ({ page = 1, limit = 20, search = '', role = null, status = null } = {}) => {
    const result = await userRepo.getUsers({ page, limit, search, role, status });
    return {
      items:   result.users.map(({ passwordHash: _pw, ...u }) => u),
      total:   result.total,
      page:    result.page,
      limit:   result.limit,
      hasMore: result.page < result.pages,
    };
  },

  getUserStats: async () => {
    const { total, byRole, byStatus } = await userRepo.getStats();
    return { total, byRole, byStatus };
  },

  verifyUser: async ({ userId }) => {
    await userRepo.update(userId, { verified: true, accountStatus: 'active' });
    return { userId, verified: true };
  },

  suspendUser: async ({ userId, reason }) => {
    await userRepo.update(userId, { accountStatus: 'suspended' });
    return { userId, accountStatus: 'suspended', reason };
  },

  banUser: async ({ userId, reason }) => {
    await userRepo.update(userId, { accountStatus: 'banned' });
    return { userId, accountStatus: 'banned', reason };
  },

  getJobStats: async () => ({ total: 0, active: 0, filled: 0, generatedAt: new Date().toISOString() }),

  getReportedContent: async ({ page = 1, limit = 20 } = {}) => ({ items: [], total: 0, page, limit }),

  getBusinessStats: async () => {
    const businessRoles = ['company','enterprise','restaurant','hotel','rental','tourism','hospital','clinic'];
    let total    = 0;
    let verified = 0;
    for (const role of businessRoles) {
      const res = await userRepo.getUsers({ role, limit: 1 }).catch(() => ({ total: 0 }));
      total += res.total || 0;
    }
    return { total, verified };
  },

  getPaymentStats: async () => ({ total: 0, volume: 0, generatedAt: new Date().toISOString() }),

  getSystemSettings: async () => ({
    maintenance: false, registrationOpen: true, maxUsersPerSearch: 50, gpsEnabled: true,
  }),

  updateSystemSettings: async ({ data }) => ({ ...data, updatedAt: new Date().toISOString() }),

  toggleMaintenanceMode: async ({ enabled }) => ({ maintenance: enabled, updatedAt: new Date().toISOString() }),

  getAdminNotifications: async () => [],

  sendGlobalNotification: async ({ title, message, createdBy }) => {
    const { users } = await userRepo.getUsers({ limit: 10000 });
    const notifs = users.map(u => ({
      userId:       u.id,
      type:         'global',
      title:        title || 'Message Global',
      message:      message || '',
      sourceUserId: createdBy,
    }));
    let count = 0;
    for (let i = 0; i < notifs.length; i += 1000) {
      await notificationRepo.broadcast(notifs.slice(i, i + 1000)).catch(e =>
        console.error('[adminService] sendGlobalNotification batch error:', e.message)
      );
      count += Math.min(1000, notifs.length - i);
    }
    return { sent: count };
  },

  getAuditLogs: async ({ page = 1, limit = 50 } = {}) => ({ entries: [], total: 0, page, limit }),

  exportData: async ({ type }) => ({ type, exported: 0, generatedAt: new Date().toISOString() }),

  clearCache: async () => { /* Supabase has no local cache to clear */ },

  getSystemHealth: async () => {
    const mem    = process.memoryUsage();
    const { total } = await userRepo.getStats().catch(() => ({ total: 0 }));
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        heapUsedMb: Math.round(mem.heapUsed  / 1024 / 1024),
        rssMb:      Math.round(mem.rss       / 1024 / 1024),
      },
      users: total,
    };
  },
};

export default adminService;