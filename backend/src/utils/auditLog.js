/**
 * auditLog.js
 *
 * Shared in-memory audit log for the JOBFAST MVP.
 * All admin actions, moderation events, and governance changes
 * call appendAuditLog() to leave a traceable record.
 *
 * Resets on server restart (same limitation as usersDatabase).
 * Retention policy: last MAX_ENTRIES entries kept (ring-buffer trim).
 *
 * Imported and called by:
 *   - admin.routes.js (admin actions)
 *   - reputation.routes.js (review/complaint moderation)
 *   - Any route that modifies trust score, verification, or role
 */

const MAX_ENTRIES = 10_000;

/** Singleton audit log array. */
export const auditLogStore = [];

/**
 * Audit event type constants.
 * Consumers should use these strings to allow reliable filtering.
 */
export const AUDIT_TYPES = Object.freeze({
  // User / account
  ROLE_CHANGE:           'role_change',
  PERMISSION_CHANGE:     'permission_change',
  USER_VERIFIED:         'user_verified',
  USER_SUSPENDED:        'user_suspended',
  USER_BANNED:           'user_banned',
  USER_RESTORED:         'user_restored',
  PROFILE_VISIBILITY:    'profile_visibility',

  // Job / marketplace
  JOB_LIFECYCLE:         'job_lifecycle',
  BOOKING_ACTION:        'booking_action',

  // Reputation / trust
  TRUST_SCORE_CHANGE:    'trust_score_change',
  VERIFICATION_CHANGE:   'verification_change',
  REVIEW_MODERATION:     'review_moderation',
  BADGE_AWARDED:         'badge_awarded',
  BADGE_REVOKED:         'badge_revoked',

  // Complaints / disputes
  COMPLAINT_ACTION:      'complaint_action',
  DISPUTE_ESCALATED:     'dispute_escalated',

  // GPS / location
  GPS_PERMISSION:        'gps_permission',
  LOCATION_UPDATE:       'location_update',

  // Admin governance
  ADMIN_ACTION:          'admin_action',
  MODERATION_ACTION:     'moderation_action',
  FRAUD_INVESTIGATION:   'fraud_investigation',
  FEATURE_FLAG_CHANGE:   'feature_flag_change',
  COUNTRY_CONFIG_CHANGE: 'country_config_change',
  PERMISSION_MATRIX:     'permission_matrix',
  CONSENT_CHANGE:        'consent_change',

  // Security
  SECURITY_EVENT:        'security_event',
  SYSTEM_HEALTH:         'system_health',
});

/**
 * Append a single audit log entry.
 *
 * @param {object} entry
 *   @param {string} entry.type          - One of AUDIT_TYPES
 *   @param {string} [entry.actorId]     - Who performed the action (adminId or userId)
 *   @param {string} [entry.actorRole]   - Role of the actor
 *   @param {string} [entry.targetId]    - Who/what the action was applied to
 *   @param {string} [entry.targetType]  - 'user' | 'review' | 'complaint' | 'flag' | ...
 *   @param {string} [entry.action]      - Short verb: 'verify', 'ban', 'approve', ...
 *   @param {object} [entry.meta]        - Any extra structured data
 *   @param {string} [entry.ip]          - Request IP (for security events)
 * @returns {object} The stored entry (with generated id + timestamp)
 */
export function appendAuditLog({
  type,
  actorId   = null,
  actorRole = null,
  targetId  = null,
  targetType = null,
  action    = '',
  meta      = {},
  ip        = null,
} = {}) {
  const entry = {
    id:         `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    actorId,
    actorRole,
    targetId,
    targetType,
    action,
    meta,
    ip,
    createdAt:  new Date().toISOString(),
  };

  auditLogStore.unshift(entry);   // newest first

  // Ring-buffer trim
  if (auditLogStore.length > MAX_ENTRIES) {
    auditLogStore.length = MAX_ENTRIES;
  }

  return entry;
}

/**
 * Query the audit log with filters + pagination.
 *
 * @param {object} opts
 *   @param {number}  [opts.page]       default 1
 *   @param {number}  [opts.limit]      default 50, max 200
 *   @param {string}  [opts.type]       filter by AUDIT_TYPES value
 *   @param {string}  [opts.actorId]    filter by actorId
 *   @param {string}  [opts.targetId]   filter by targetId
 *   @param {string}  [opts.search]     fuzzy search on action + meta (stringified)
 *   @param {string}  [opts.dateFrom]   ISO date string (inclusive)
 *   @param {string}  [opts.dateTo]     ISO date string (inclusive)
 * @returns {{ entries: object[], total: number, page: number, limit: number }}
 */
export function queryAuditLogs({
  page     = 1,
  limit    = 50,
  type     = null,
  actorId  = null,
  targetId = null,
  search   = '',
  dateFrom = null,
  dateTo   = null,
} = {}) {
  const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

  const fromMs = dateFrom ? new Date(dateFrom).getTime() : 0;
  const toMs   = dateTo   ? new Date(dateTo).getTime()   : Infinity;
  const q      = search.trim().toLowerCase();

  let filtered = auditLogStore;

  if (type)     filtered = filtered.filter(e => e.type     === type);
  if (actorId)  filtered = filtered.filter(e => e.actorId  === actorId);
  if (targetId) filtered = filtered.filter(e => e.targetId === targetId);

  if (fromMs || toMs < Infinity) {
    filtered = filtered.filter(e => {
      const t = new Date(e.createdAt).getTime();
      return t >= fromMs && t <= toMs;
    });
  }

  if (q) {
    filtered = filtered.filter(e => {
      const str = [e.type, e.action, e.actorId, e.targetId, JSON.stringify(e.meta)]
        .join(' ').toLowerCase();
      return str.includes(q);
    });
  }

  const total = filtered.length;
  const start = (pageNum - 1) * limitNum;
  const entries = filtered.slice(start, start + limitNum);

  return { entries, total, page: pageNum, limit: limitNum, hasMore: start + limitNum < total };
}

/**
 * Export audit logs as a CSV string (for the /admin/export endpoint).
 * @param {object[]} entries
 * @returns {string}
 */
export function auditLogsToCsv(entries) {
  const header = 'id,type,actorId,actorRole,targetId,targetType,action,ip,createdAt\n';
  const rows = entries.map(e =>
    [e.id, e.type, e.actorId, e.actorRole, e.targetId, e.targetType, e.action, e.ip, e.createdAt]
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return header + rows.join('\n');
}