// ======================================================
// JOBFAST ADMIN CONTROLLER — Supabase (migrated from in-memory usersDatabase)
// ======================================================

import adminService from '../services/adminService.js';
import userRepo from '../repositories/user.repository.js';
import supabase from '../config/supabaseClient.js';
import { HTTP_STATUS }    from '../config/constants.js';
import { asyncHandler }   from '../utils/asyncHandler.js';
import { governanceStore } from '../config/governance.js';
import { queryAuditLogs, auditLogsToCsv, appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';

// ── Response helper ───────────────────────────────────────────

const sendResponse = (res, data, message = null, status = HTTP_STATUS.OK) =>
  res.status(status).json({ success: true, ...(message && { message }), data });

// ── Scan helper: fetch all profiles with reputation/marketplace JSONB ─────

async function scanAllProfiles(columns = 'id, name, role, email, account_status, verified, trust_score, reputation_data, marketplace_data, created_at') {
  const { data, error } = await supabase
    .from('profiles')
    .select(columns)
    .limit(2000);
  if (error) throw new Error(error.message);
  return data || [];
}

// ── Count helper ──────────────────────────────────────────────

async function countProfiles() {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ======================================================
// DASHBOARD & ANALYTICS
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
// USERS MANAGEMENT
// ======================================================

export const getUsers = asyncHandler(async (req, res) => {
  const data = await adminService.getUsers({
    page:   Number(req.query.page)  || 1,
    limit:  Number(req.query.limit) || 20,
    search: req.query.search        || '',
    role:   req.query.role          || null,
    status: req.query.status        || null,
  });
  return sendResponse(res, data);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const data = await adminService.getUserStats();
  return sendResponse(res, data);
});

export const verifyUser = asyncHandler(async (req, res) => {
  const data = await adminService.verifyUser({ userId: req.params.id, adminId: req.user.id });
  return sendResponse(res, data, 'User verified successfully');
});

export const suspendUser = asyncHandler(async (req, res) => {
  const data = await adminService.suspendUser({
    userId: req.params.id,
    reason: req.body.reason || 'No reason provided',
    adminId: req.user.id,
  });
  return sendResponse(res, data, 'User suspended successfully');
});

export const banUser = asyncHandler(async (req, res) => {
  const data = await adminService.banUser({
    userId: req.params.id,
    reason: req.body.reason || 'No reason provided',
    adminId: req.user.id,
  });
  return sendResponse(res, data, 'User banned successfully');
});

// ======================================================
// JOBS / CONTENT / BUSINESS / PAYMENTS
// ======================================================

export const getJobStats = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getJobStats()));

export const getReportedContent = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getReportedContent({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 })));

export const getBusinessStats = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getBusinessStats()));

export const getPaymentStats = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getPaymentStats()));

// ======================================================
// SYSTEM SETTINGS
// ======================================================

export const getSystemSettings = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getSystemSettings()));

export const updateSystemSettings = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.updateSystemSettings({ data: req.body || {}, updatedBy: req.user.id }), 'Settings updated successfully'));

export const toggleMaintenanceMode = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.toggleMaintenanceMode({ enabled: Boolean(req.body.enabled), updatedBy: req.user.id }), 'Maintenance mode updated'));

// ======================================================
// NOTIFICATIONS
// ======================================================

export const getAdminNotifications = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getAdminNotifications(req.user.id)));

export const sendGlobalNotification = asyncHandler(async (req, res) => {
  const data = await adminService.sendGlobalNotification({
    title:     req.body.title,
    message:   req.body.message,
    createdBy: req.user.id,
  });
  return sendResponse(res, data, 'Notification sent successfully', HTTP_STATUS.CREATED);
});

// ======================================================
// AUDIT LOGS
// ======================================================

export const getAuditLogs = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.getAuditLogs({ page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50 })));

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const { entries } = queryAuditLogs({ page: 1, limit: 10000, type: req.query.type || null, dateFrom: req.query.dateFrom || null, dateTo: req.query.dateTo || null });
  const csv = auditLogsToCsv(entries);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
  return res.send(csv);
});

export const exportData = asyncHandler(async (req, res) =>
  sendResponse(res, await adminService.exportData({ type: req.query.type || 'all', requestedBy: req.user.id })));

export const clearCache = asyncHandler(async (req, res) => {
  await adminService.clearCache();
  return sendResponse(res, null, 'Cache cleared successfully');
});

export const adminHealthCheck = asyncHandler(async (req, res) => {
  const health = await adminService.getSystemHealth();
  return sendResponse(res, { service: 'admin', status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString(), health });
});

// ======================================================
// GOVERNANCE — FEATURE FLAGS
// ======================================================

export const getFeatureFlags = asyncHandler(async (req, res) =>
  sendResponse(res, { flags: governanceStore.featureFlags }));

export const updateFeatureFlag = asyncHandler(async (req, res) => {
  const { id }  = req.params;
  const patch   = req.body || {};
  const updated = governanceStore.updateFlag(id, patch);
  appendAuditLog({ type: AUDIT_TYPES.FEATURE_FLAG_CHANGE, actorId: req.user?.id, actorRole: req.user?.role, targetId: id, targetType: 'feature_flag', action: 'update', meta: { patch }, ip: req.ip });
  return sendResponse(res, { flag: updated }, 'Feature flag updated');
});

// ======================================================
// GOVERNANCE — MODERATION CENTER
// ======================================================

export const getModerationQueue = asyncHandler(async (req, res) => {
  const { type = 'all', page = 1, limit = 20 } = req.query;
  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(100, parseInt(limit, 10) || 20);
  const items    = [];

  const rows = await scanAllProfiles('id, name, role, email, account_status, reputation_data, marketplace_data, created_at');

  for (const user of rows) {
    const rd = user.reputation_data || {};
    const uid = user.id;

    if (type === 'all' || type === 'verification') {
      const verifs = rd.verificationStatus || {};
      for (const [vType, vData] of Object.entries(verifs)) {
        if (vData && typeof vData === 'object' && vData.status === 'pending') {
          items.push({ id: `ver_${uid}_${vType}`, itemType: 'verification', status: 'pending', userId: uid, userName: user.name, userRole: user.role, verificationType: vType, submittedAt: vData.submittedAt || null, meta: vData });
        }
      }
    }

    if (type === 'all' || type === 'review') {
      const reviews = [
        ...(rd.workerReviews || []),
        ...(user.marketplace_data?.reviews || []),
      ];
      for (const rv of reviews) {
        if ((rv.flagScore || 0) >= 5 && rv.moderationStatus !== 'approved' && rv.moderationStatus !== 'rejected') {
          items.push({ id: `rev_${rv.id || rv.reviewId || ''}`, itemType: 'review', status: rv.moderationStatus || 'flagged', userId: uid, userName: user.name, rating: rv.rating, comment: rv.comment, flagScore: rv.flagScore, signals: rv.signals || [], submittedAt: rv.createdAt || null, meta: rv });
        }
      }
    }

    if (type === 'all' || type === 'complaint') {
      for (const c of (rd.complaints || [])) {
        if (['open','under_review','investigating','escalated'].includes(c.status)) {
          items.push({ id: `cmp_${c.id}`, itemType: 'complaint', status: c.status, userId: uid, userName: user.name, category: c.category, description: c.description, submittedAt: c.createdAt || null, meta: c });
        }
      }
    }

    if (type === 'all' || type === 'user') {
      if (['suspended','banned'].includes(user.account_status)) {
        items.push({ id: `usr_${uid}`, itemType: 'user', status: user.account_status, userId: uid, userName: user.name, userRole: user.role, email: user.email, trustScore: user.trust_score || 0, submittedAt: user.created_at || null, meta: {} });
      }
    }
  }

  items.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  const total = items.length;
  const start = (pageNum - 1) * limitNum;
  return sendResponse(res, { items: items.slice(start, start + limitNum), total, page: pageNum, limit: limitNum, hasMore: start + limitNum < total });
});

export const moderateItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { action, reason, newStatus } = req.body || {};
  const adminId = req.user?.id;
  let result = null;

  if (type === 'user') {
    const user = await userRepo.getById(id).catch(() => null);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updates = {};
    if (action === 'suspend') updates.accountStatus = 'suspended';
    else if (action === 'restore') updates.accountStatus = 'active';
    else if (action === 'ban')    updates.accountStatus = 'banned';
    else if (action === 'verify') {
      updates.verified = true;
      const rd = user.reputationData || {};
      if (!rd.verificationStatus) rd.verificationStatus = {};
      rd.verificationStatus.identity = { status: 'verified', verifiedAt: new Date().toISOString(), verifiedBy: adminId };
      updates.reputationData = rd;
    }
    const updated = await userRepo.update(id, updates);
    result = { userId: id, accountStatus: updated.accountStatus, verified: updated.verified };
    appendAuditLog({ type: AUDIT_TYPES.MODERATION_ACTION, actorId: adminId, actorRole: req.user?.role, targetId: id, targetType: 'user', action, meta: { reason }, ip: req.ip });

  } else if (type === 'review') {
    const rows = await scanAllProfiles('id, reputation_data, marketplace_data');
    let found = false;
    for (const row of rows) {
      const rdArr = row.reputation_data?.workerReviews || [];
      const mdArr = row.marketplace_data?.reviews      || [];
      const rv = rdArr.find(r => r.id === id) || mdArr.find(r => r.id === id);
      if (rv) {
        rv.moderationStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action;
        rv.moderatedBy      = adminId;
        rv.moderatedAt      = new Date().toISOString();
        rv.moderationReason = reason || null;
        const isRD = rdArr.some(r => r.id === id);
        await userRepo.update(row.id, isRD ? { reputationData: row.reputation_data } : { marketplaceData: row.marketplace_data });
        result = { reviewId: id, moderationStatus: rv.moderationStatus };
        found  = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ success: false, message: 'Review not found' });
    appendAuditLog({ type: AUDIT_TYPES.REVIEW_MODERATION, actorId: adminId, actorRole: req.user?.role, targetId: id, targetType: 'review', action, meta: { reason }, ip: req.ip });

  } else if (type === 'complaint') {
    const rows = await scanAllProfiles('id, reputation_data');
    let found = false;
    for (const row of rows) {
      const rd = row.reputation_data || {};
      const c  = (rd.complaints || []).find(x => x.id === id);
      if (c) {
        c.status    = newStatus || (action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : action === 'escalate' ? 'escalated' : c.status);
        c.adminNotes = (c.adminNotes || []);
        c.adminNotes.push({ adminId, note: reason, status: c.status, createdAt: new Date().toISOString() });
        c.updatedAt = new Date().toISOString();
        await userRepo.update(row.id, { reputationData: rd });
        result = { complaintId: id, status: c.status };
        found  = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ success: false, message: 'Complaint not found' });
    appendAuditLog({ type: AUDIT_TYPES.COMPLAINT_ACTION, actorId: adminId, actorRole: req.user?.role, targetId: id, targetType: 'complaint', action, meta: { reason, newStatus }, ip: req.ip });

  } else {
    return res.status(400).json({ success: false, message: 'Unknown moderation type' });
  }

  return sendResponse(res, result, 'Moderation action applied');
});

// ======================================================
// GOVERNANCE — FRAUD DETECTION
// ======================================================

export const getFraudDashboard = asyncHandler(async (req, res) => {
  const rows       = await scanAllProfiles('id, name, role, email, account_status, reputation_data, marketplace_data, created_at');
  const flagged    = [];
  let totalFraudFlags = 0;
  let totalSpamFlags  = 0;
  let highRiskCount   = 0;

  for (const user of rows) {
    const rd         = user.reputation_data || {};
    const fraudScore = rd.fraudScore || 0;
    const spamScore  = rd.spamScore  || 0;
    if (fraudScore > 0)  totalFraudFlags++;
    if (spamScore  > 5)  totalSpamFlags++;
    if (fraudScore >= 3 || spamScore > 10) {
      highRiskCount++;
      flagged.push({ userId: user.id, name: user.name, role: user.role, email: user.email, fraudScore, spamScore, fraudSignals: rd.fraudSignals || [], accountStatus: user.account_status || 'active', createdAt: user.created_at || null });
    }
  }

  flagged.sort((a, b) => (b.fraudScore + b.spamScore) - (a.fraudScore + a.spamScore));

  return sendResponse(res, {
    summary: { totalUsers: rows.length, totalFraudFlags, totalSpamFlags, highRiskCount },
    flagged: flagged.slice(0, 100),
  });
});

export const runFraudScan = asyncHandler(async (req, res) => {
  const rows   = await scanAllProfiles('id, reputation_data, marketplace_data');
  const now    = Date.now();
  let scanned  = 0;
  let flagged  = 0;

  for (const row of rows) {
    const rd      = row.reputation_data || {};
    const signals = [];
    let score     = rd.fraudScore || 0;

    const allReviews = [
      ...(rd.workerReviews || []),
      ...(row.marketplace_data?.reviews || []),
    ];

    const recentReviews = allReviews.filter(r => now - new Date(r.createdAt || 0).getTime() < 3600000);
    if (recentReviews.length > 10) { signals.push('rapid_reviews'); score = Math.min(10, score + 2); }

    const flaggedReviews = allReviews.filter(r => (r.flagScore || 0) >= 5);
    if (flaggedReviews.length >= 3) { signals.push('fake_review'); score = Math.min(10, score + 3); }

    if (signals.length > 0) {
      rd.fraudScore   = score;
      rd.fraudSignals = [...new Set([...(rd.fraudSignals || []), ...signals])];
      await userRepo.update(row.id, { reputationData: rd }).catch(() => {});
      flagged++;
    }
    scanned++;
  }

  appendAuditLog({ type: AUDIT_TYPES.FRAUD_INVESTIGATION, actorId: req.user?.id, actorRole: req.user?.role, targetId: null, targetType: 'system', action: 'fraud_scan', meta: { scanned, flagged }, ip: req.ip });

  return sendResponse(res, { scanned, flagged }, 'Fraud scan complete');
});

// ======================================================
// GOVERNANCE — DISPUTE RESOLUTION
// ======================================================

export const getDisputeQueue = asyncHandler(async (req, res) => {
  const rows     = await scanAllProfiles('id, name, role, reputation_data');
  const disputes = [];

  for (const user of rows) {
    const rd = user.reputation_data || {};
    for (const c of (rd.complaints || [])) {
      if (['escalated','investigating'].includes(c.status)) {
        disputes.push({ ...c, targetUserId: user.id, targetUserName: user.name, targetUserRole: user.role });
      }
    }
  }

  disputes.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  return sendResponse(res, { disputes, total: disputes.length });
});

export const updateDisputeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, resolution, adminNotes } = req.body || {};

  const rows = await scanAllProfiles('id, reputation_data');
  for (const row of rows) {
    const rd = row.reputation_data || {};
    const c  = (rd.complaints || []).find(x => x.id === id);
    if (c) {
      c.status     = status     || c.status;
      c.resolution = resolution || c.resolution;
      if (!Array.isArray(c.adminNotes)) c.adminNotes = [];
      if (adminNotes) c.adminNotes.push({ note: adminNotes, createdAt: new Date().toISOString() });
      c.updatedAt  = new Date().toISOString();
      await userRepo.update(row.id, { reputationData: rd });
      appendAuditLog({ type: AUDIT_TYPES.COMPLAINT_ACTION, actorId: req.user?.id, actorRole: req.user?.role, targetId: id, targetType: 'complaint', action: 'dispute_update', meta: { status, resolution }, ip: req.ip });
      return sendResponse(res, { complaintId: id, status: c.status, resolution: c.resolution }, 'Dispute updated');
    }
  }

  return res.status(404).json({ success: false, message: 'Dispute not found' });
});

// ======================================================
// GOVERNANCE — COUNTRY CONFIG / PERMISSIONS
// ======================================================

export const getCountryConfig = asyncHandler(async (req, res) =>
  sendResponse(res, { countries: governanceStore.countryConfig }));

export const updateCountryConfig = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const patch    = req.body || {};
  const updated  = governanceStore.updateCountry(code, patch);
  if (!updated) return res.status(404).json({ success: false, message: 'Country not found' });
  appendAuditLog({ type: AUDIT_TYPES.COUNTRY_CONFIG_CHANGE, actorId: req.user?.id, actorRole: req.user?.role, targetId: code, targetType: 'country', action: 'update', meta: { patch }, ip: req.ip });
  return sendResponse(res, { country: updated }, 'Country config updated');
});

export const getPermissionMatrix = asyncHandler(async (req, res) =>
  sendResponse(res, { matrix: governanceStore.permissionMatrix }));

export const updatePermissionMatrix = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const patch    = req.body || {};
  if (!governanceStore.permissionMatrix[role]) governanceStore.permissionMatrix[role] = {};
  Object.assign(governanceStore.permissionMatrix[role], patch);
  appendAuditLog({ type: AUDIT_TYPES.PERMISSION_MATRIX, actorId: req.user?.id, actorRole: req.user?.role, targetId: role, targetType: 'role', action: 'update', meta: { patch }, ip: req.ip });
  return sendResponse(res, { role, permissions: governanceStore.permissionMatrix[role] }, 'Permissions updated');
});

// ======================================================
// GOVERNANCE — CONSENT & PRIVACY
// ======================================================

export const getConsentLogs = asyncHandler(async (req, res) => {
  const { userId, type, page = 1, limit = 50 } = req.query;
  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(200, parseInt(limit, 10) || 50);
  let logs = governanceStore.consentLogs;
  if (userId) logs = logs.filter(l => l.userId === userId);
  if (type)   logs = logs.filter(l => l.type   === type);
  const total = logs.length;
  const start = (pageNum - 1) * limitNum;
  return sendResponse(res, { logs: logs.slice(start, start + limitNum), total, page: pageNum, limit: limitNum });
});

export const updateUserConsent = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type, granted } = req.body || {};
  governanceStore.recordConsent({ userId, type, granted, ip: req.ip });
  appendAuditLog({ type: AUDIT_TYPES.CONSENT_CHANGE, actorId: req.user?.id, actorRole: req.user?.role, targetId: userId, targetType: 'user', action: granted ? 'consent_granted' : 'consent_revoked', meta: { consentType: type }, ip: req.ip });
  return sendResponse(res, { userId, type, granted }, 'Consent updated');
});

// ======================================================
// GOVERNANCE — SYSTEM HEALTH & SECURITY EVENTS
// ======================================================

export const getGovernanceHealth = asyncHandler(async (req, res) => {
  const mem   = process.memoryUsage();
  const total = await countProfiles();

  const { data: statusRows } = await supabase
    .from('profiles')
    .select('account_status, verified')
    .limit(10000);

  const rows         = statusRows || [];
  const activeUsers  = rows.filter(u => !['suspended','banned'].includes(u.account_status)).length;
  const suspended    = rows.filter(u => u.account_status === 'suspended').length;
  const banned       = rows.filter(u => u.account_status === 'banned').length;
  const verified     = rows.filter(u => u.verified).length;

  return sendResponse(res, {
    uptime: process.uptime(),
    memory: { heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024), heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024), rssMb: Math.round(mem.rss / 1024 / 1024) },
    users:  { total, active: activeUsers, suspended, banned, verified },
    featureFlags: { total: governanceStore.featureFlags.length, enabled: governanceStore.featureFlags.filter(f => f.enabled && !f.emergencyDisabled).length },
    consentLogs: governanceStore.consentLogs.length,
    timestamp: new Date().toISOString(),
  });
});

export const getSecurityEvents = asyncHandler(async (req, res) => {
  const result = queryAuditLogs({ type: AUDIT_TYPES.SECURITY_EVENT, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 50, dateFrom: req.query.dateFrom || null, dateTo: req.query.dateTo || null });
  return sendResponse(res, result);
});

// ======================================================
// AI ADMIN GATEWAY STUBS
// ======================================================

export const aiAdminGateway = asyncHandler(async (req, res) => {
  const mode = req.aiContext?.mode || req.body?.mode || 'assistant';
  return sendResponse(res, { mode, status: 'processed', requestId: req.requestId });
});

export const aiFraudDetection    = asyncHandler(async (req, res) => sendResponse(res, { detected: false, signals: [], confidence: 0 }));
export const aiAutoModeration    = asyncHandler(async (req, res) => sendResponse(res, { action: 'review', confidence: 0.5, reason: 'Manual review required' }));
export const aiSmartInsights     = asyncHandler(async (req, res) => sendResponse(res, { insights: [], generatedAt: new Date().toISOString() }));
export const aiRevenueForecast   = asyncHandler(async (req, res) => sendResponse(res, { forecast: [], period: '30d', generatedAt: new Date().toISOString() }));
export const aiUserScoring       = asyncHandler(async (req, res) => sendResponse(res, { userId: req.params.id, score: 0, factors: [] }));
export const aiNotificationEngine = asyncHandler(async (req, res) => sendResponse(res, { sent: 0, queued: 0 }));
export const aiAutoActions       = asyncHandler(async (req, res) => sendResponse(res, { actionsExecuted: 0, skipped: 0 }));