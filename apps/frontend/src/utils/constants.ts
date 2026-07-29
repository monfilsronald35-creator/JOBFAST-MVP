export const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
} as const;
export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];

export const ACCOUNT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SUSPEND: 'suspend',
  RESTORE: 'restore',
} as const;
export type AccountAction = (typeof ACCOUNT_ACTIONS)[keyof typeof ACCOUNT_ACTIONS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY: 'mobile_money',
  WALLET: 'wallet',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
} as const;
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[keyof typeof CHAT_MESSAGE_TYPES];

export const CHAT_MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;
export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUS)[keyof typeof CHAT_MESSAGE_STATUS];

export const SEARCH_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  RATING: 'rating',
  DISTANCE: 'distance',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
} as const;
export type SearchSort = (typeof SEARCH_SORT)[keyof typeof SEARCH_SORT];

export const USER_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;
export type UserGender = (typeof USER_GENDER)[keyof typeof USER_GENDER];

export const SUPPORT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type SupportStatus = (typeof SUPPORT_STATUS)[keyof typeof SUPPORT_STATUS];

export const SUPPORT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type SupportPriority = (typeof SUPPORT_PRIORITY)[keyof typeof SUPPORT_PRIORITY];

export const SYSTEM_SETTINGS = {
  APP_NAME: 'JOBFAST',
  APP_VERSION: '4.0.0',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_CURRENCY: 'USD',
} as const;

export const COLLECTION_NAMES = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  SERVICES: 'services',
  JOBS: 'jobs',
  REVIEWS: 'reviews',
  CHATS: 'chats',
  MESSAGES: 'messages',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  WALLETS: 'wallets',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  DEVICES: 'devices',
  SUPPORT_TICKETS: 'supportTickets',
} as const;

export const INDEX_NAMES = {
  USERS_EMAIL: 'users_email_idx',
  USERS_PHONE: 'users_phone_idx',
  JOBS_LOCATION: 'jobs_location_idx',
  SERVICES_LOCATION: 'services_location_idx',
  BUSINESSES_LOCATION: 'businesses_location_idx',
} as const;

export const DEFAULT_VALUES = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  RATING: 0,
  BALANCE: 0,
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

export const MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email',
} as const;
export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];