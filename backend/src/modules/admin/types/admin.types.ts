export type AdminRole = 'admin' | 'superadmin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_review';

export interface AdminUser {
  id:            string;
  name:          string;
  email:         string;
  role:          string;
  status:        UserStatus;
  createdAt:     string;
  lastLoginAt?:  string | undefined;
  jobCount:      number;
  reportCount:   number;
}

export type ModerationEntityType = 'job' | 'review' | 'profile' | 'message' | 'media';
export type ModerationStatus     = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface ModerationItem {
  id:           string;
  entityType:   ModerationEntityType;
  entityId:     string;
  reportedBy:   string;
  reason:       string;
  status:       ModerationStatus;
  resolverId?:  string | undefined;
  resolution?:  string | undefined;
  createdAt:    string;
  resolvedAt?:  string | undefined;
}

export interface FeatureFlag {
  key:         string;
  enabled:     boolean;
  description: string;
  rolloutPct:  number;
  updatedBy:   string;
  updatedAt:   string;
}

export interface SystemConfig {
  key:         string;
  value:       string;
  description: string;
  isSecret:    boolean;
  updatedBy:   string;
  updatedAt:   string;
}

export type AuditAction =
  | 'user.suspended' | 'user.activated' | 'user.banned' | 'user.role_changed'
  | 'moderation.resolved' | 'flag.toggled' | 'config.updated'
  | 'content.removed' | 'refund.issued' | 'payout.blocked';

export interface AuditLog {
  id:          string;
  action:      AuditAction;
  actorId:     string;
  targetId?:   string | undefined;
  targetType?: string | undefined;
  metadata:    Record<string, unknown>;
  createdAt:   string;
}

export interface PlatformStats {
  totalUsers:     number;
  activeUsers:    number;
  totalJobs:      number;
  activeJobs:     number;
  totalRevenue:   number;
  revenueToday:   number;
  pendingModeration: number;
  openDisputes:   number;
}