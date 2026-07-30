import type { UUID, UnixMs, UserRole, JobStatus, MinorUnits, Currency } from '@shared-types';

// ——— Well-known domain event names ——————————————————————————————————————————

export const EVENT_NAMES = {
  // Auth
  AUTH_LOGIN:              'auth.login',
  AUTH_LOGOUT:             'auth.logout',
  AUTH_PASSWORD_CHANGED:   'auth.password_changed',
  AUTH_TOKEN_REFRESHED:    'auth.token_refreshed',

  // Users
  USER_REGISTERED:         'user.registered',
  USER_UPDATED:            'user.updated',
  USER_VERIFIED:           'user.verified',
  USER_SUSPENDED:          'user.suspended',
  USER_DELETED:            'user.deleted',

  // Jobs
  JOB_CREATED:             'job.created',
  JOB_UPDATED:             'job.updated',
  JOB_ASSIGNED:            'job.assigned',
  JOB_STARTED:             'job.started',
  JOB_COMPLETED:           'job.completed',
  JOB_CANCELLED:           'job.cancelled',
  JOB_DISPUTED:            'job.disputed',

  // Payments
  PAYMENT_INITIATED:       'payment.initiated',
  PAYMENT_COMPLETED:       'payment.completed',
  PAYMENT_FAILED:          'payment.failed',
  PAYMENT_REFUNDED:        'payment.refunded',
  ESCROW_LOCKED:           'escrow.locked',
  ESCROW_RELEASED:         'escrow.released',

  // Wallet
  WALLET_CREDITED:         'wallet.credited',
  WALLET_DEBITED:          'wallet.debited',

  // Chat
  MESSAGE_SENT:            'message.sent',
  CONVERSATION_CREATED:    'conversation.created',

  // Notifications
  NOTIFY_USER:             'notify.user',
  NOTIFY_BROADCAST:        'notify.broadcast',

  // Media
  MEDIA_UPLOADED:          'media.uploaded',
  MEDIA_PROCESSED:         'media.processed',

  // AI
  AI_RECOMMENDATION:       'ai.recommendation',
  AI_MATCH_FOUND:          'ai.match_found',

  // System
  CACHE_INVALIDATED:       'cache.invalidated',
  HEALTH_CHECK:            'system.health_check',
} as const;

export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];

// ——— Event payload types ——————————————————————————————————————————————————

export interface AuthLoginPayload {
  userId: UUID; email: string; role: UserRole; ip?: string;
}

export interface UserRegisteredPayload {
  userId: UUID; email: string; role: UserRole; createdAt: UnixMs;
}

export interface JobCreatedPayload {
  jobId: UUID; clientId: UUID; title: string; category: string; budget: MinorUnits; currency: Currency;
}

export interface JobAssignedPayload {
  jobId: UUID; clientId: UUID; workerId: UUID; assignedAt: UnixMs;
}

export interface JobCompletedPayload {
  jobId: UUID; clientId: UUID; workerId: UUID; completedAt: UnixMs;
}

export interface PaymentCompletedPayload {
  paymentId: UUID; userId: UUID; amount: MinorUnits; currency: Currency; provider: string;
}

export interface NotifyUserPayload {
  userId:   UUID;
  type:     string;
  title:    string;
  body:     string;
  channels: string[];
  data?:    Record<string, unknown>;
}

export interface MediaUploadedPayload {
  mediaId:  UUID;
  userId:   UUID;
  type:     string;
  mimeType: string;
  size:     number;
}
