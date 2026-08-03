import type { UUID, UnixMs, UserRole, MinorUnits, Currency } from '@shared-types';
export declare const EVENT_NAMES: {
    readonly AUTH_LOGIN: "auth.login";
    readonly AUTH_LOGOUT: "auth.logout";
    readonly AUTH_PASSWORD_CHANGED: "auth.password_changed";
    readonly AUTH_TOKEN_REFRESHED: "auth.token_refreshed";
    readonly USER_REGISTERED: "user.registered";
    readonly USER_UPDATED: "user.updated";
    readonly USER_VERIFIED: "user.verified";
    readonly USER_SUSPENDED: "user.suspended";
    readonly USER_DELETED: "user.deleted";
    readonly JOB_CREATED: "job.created";
    readonly JOB_UPDATED: "job.updated";
    readonly JOB_ASSIGNED: "job.assigned";
    readonly JOB_STARTED: "job.started";
    readonly JOB_COMPLETED: "job.completed";
    readonly JOB_CANCELLED: "job.cancelled";
    readonly JOB_DISPUTED: "job.disputed";
    readonly PAYMENT_INITIATED: "payment.initiated";
    readonly PAYMENT_COMPLETED: "payment.completed";
    readonly PAYMENT_FAILED: "payment.failed";
    readonly PAYMENT_REFUNDED: "payment.refunded";
    readonly ESCROW_LOCKED: "escrow.locked";
    readonly ESCROW_RELEASED: "escrow.released";
    readonly WALLET_CREDITED: "wallet.credited";
    readonly WALLET_DEBITED: "wallet.debited";
    readonly MESSAGE_SENT: "message.sent";
    readonly CONVERSATION_CREATED: "conversation.created";
    readonly NOTIFY_USER: "notify.user";
    readonly NOTIFY_BROADCAST: "notify.broadcast";
    readonly MEDIA_UPLOADED: "media.uploaded";
    readonly MEDIA_PROCESSED: "media.processed";
    readonly AI_RECOMMENDATION: "ai.recommendation";
    readonly AI_MATCH_FOUND: "ai.match_found";
    readonly CACHE_INVALIDATED: "cache.invalidated";
    readonly HEALTH_CHECK: "system.health_check";
};
export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];
export interface AuthLoginPayload {
    userId: UUID;
    email: string;
    role: UserRole;
    ip?: string;
}
export interface UserRegisteredPayload {
    userId: UUID;
    email: string;
    role: UserRole;
    createdAt: UnixMs;
}
export interface JobCreatedPayload {
    jobId: UUID;
    clientId: UUID;
    title: string;
    category: string;
    budget: MinorUnits;
    currency: Currency;
}
export interface JobAssignedPayload {
    jobId: UUID;
    clientId: UUID;
    workerId: UUID;
    assignedAt: UnixMs;
}
export interface JobCompletedPayload {
    jobId: UUID;
    clientId: UUID;
    workerId: UUID;
    completedAt: UnixMs;
}
export interface PaymentCompletedPayload {
    paymentId: UUID;
    userId: UUID;
    amount: MinorUnits;
    currency: Currency;
    provider: string;
}
export interface NotifyUserPayload {
    userId: UUID;
    type: string;
    title: string;
    body: string;
    channels: string[];
    data?: Record<string, unknown>;
}
export interface MediaUploadedPayload {
    mediaId: UUID;
    userId: UUID;
    type: string;
    mimeType: string;
    size: number;
}
//# sourceMappingURL=index.d.ts.map