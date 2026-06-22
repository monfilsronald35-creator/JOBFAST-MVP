export const DEVICE_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  BLOCKED: "blocked",
});

export const ACCOUNT_ACTIONS = Object.freeze({
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  SUSPEND: "suspend",
  RESTORE: "restore",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: "cash",
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_MONEY: "mobile_money",
  WALLET: "wallet",
});

export const CHAT_MESSAGE_TYPES = Object.freeze({
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
  LOCATION: "location",
});

export const CHAT_MESSAGE_STATUS = Object.freeze({
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
});

export const SEARCH_SORT = Object.freeze({
  NEWEST: "newest",
  OLDEST: "oldest",
  RATING: "rating",
  DISTANCE: "distance",
  PRICE_LOW: "price_low",
  PRICE_HIGH: "price_high",
});

export const USER_GENDER = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
});

export const SUPPORT_STATUS = Object.freeze({
  OPEN: "open",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
});

export const SUPPORT_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
});

export const SYSTEM_SETTINGS = Object.freeze({
  APP_NAME: "JOBFAST",
  APP_VERSION: "4.0.0",
  DEFAULT_LANGUAGE: "en",
  DEFAULT_CURRENCY: "USD",
});

export const COLLECTION_NAMES = Object.freeze({
  USERS: "users",
  BUSINESSES: "businesses",
  SERVICES: "services",
  JOBS: "jobs",
  REVIEWS: "reviews",
  CHATS: "chats",
  MESSAGES: "messages",
  PAYMENTS: "payments",
  TRANSACTIONS: "transactions",
  WALLETS: "wallets",
  REPORTS: "reports",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings",
  DEVICES: "devices",
  SUPPORT_TICKETS: "supportTickets",
});

export const INDEX_NAMES = Object.freeze({
  USERS_EMAIL: "users_email_idx",
  USERS_PHONE: "users_phone_idx",
  JOBS_LOCATION: "jobs_location_idx",
  SERVICES_LOCATION: "services_location_idx",
  BUSINESSES_LOCATION: "businesses_location_idx",
});

export const DEFAULT_VALUES = Object.freeze({
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  RATING: 0,
  BALANCE: 0,
});

export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
});

export const MIME_TYPES = Object.freeze({
  JPEG: "image/jpeg",
  PNG: "image/png",
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});

export const TOKEN_TYPES = Object.freeze({
  ACCESS: "access",
  REFRESH: "refresh",
  RESET_PASSWORD: "reset_password",
  VERIFY_EMAIL: "verify_email",
});