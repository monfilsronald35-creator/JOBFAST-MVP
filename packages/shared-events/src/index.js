"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_NAMES = void 0;
// ——— Well-known domain event names ——————————————————————————————————————————
exports.EVENT_NAMES = {
    // Auth
    AUTH_LOGIN: 'auth.login',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_PASSWORD_CHANGED: 'auth.password_changed',
    AUTH_TOKEN_REFRESHED: 'auth.token_refreshed',
    // Users
    USER_REGISTERED: 'user.registered',
    USER_UPDATED: 'user.updated',
    USER_VERIFIED: 'user.verified',
    USER_SUSPENDED: 'user.suspended',
    USER_DELETED: 'user.deleted',
    // Jobs
    JOB_CREATED: 'job.created',
    JOB_UPDATED: 'job.updated',
    JOB_ASSIGNED: 'job.assigned',
    JOB_STARTED: 'job.started',
    JOB_COMPLETED: 'job.completed',
    JOB_CANCELLED: 'job.cancelled',
    JOB_DISPUTED: 'job.disputed',
    // Payments
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_REFUNDED: 'payment.refunded',
    ESCROW_LOCKED: 'escrow.locked',
    ESCROW_RELEASED: 'escrow.released',
    // Wallet
    WALLET_CREDITED: 'wallet.credited',
    WALLET_DEBITED: 'wallet.debited',
    // Chat
    MESSAGE_SENT: 'message.sent',
    CONVERSATION_CREATED: 'conversation.created',
    // Notifications
    NOTIFY_USER: 'notify.user',
    NOTIFY_BROADCAST: 'notify.broadcast',
    // Media
    MEDIA_UPLOADED: 'media.uploaded',
    MEDIA_PROCESSED: 'media.processed',
    // AI
    AI_RECOMMENDATION: 'ai.recommendation',
    AI_MATCH_FOUND: 'ai.match_found',
    // System
    CACHE_INVALIDATED: 'cache.invalidated',
    HEALTH_CHECK: 'system.health_check',
};
//# sourceMappingURL=index.js.map