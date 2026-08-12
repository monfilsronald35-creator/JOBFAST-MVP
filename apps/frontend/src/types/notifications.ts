// ── Enums ──────────────────────────────────────────────────────────────────

export const NOTIF_CHANNELS = [
  'push', 'email', 'sms', 'whatsapp', 'in_app',
  'webhook', 'slack', 'telegram', 'viber', 'wechat',
] as const;
export type NotifChannel = typeof NOTIF_CHANNELS[number];

export const NOTIF_PRIORITIES = ['low', 'normal', 'high', 'urgent', 'critical'] as const;
export type NotifPriority = typeof NOTIF_PRIORITIES[number];

export const NOTIF_STATUSES = [
  'pending', 'queued', 'processing', 'sent', 'delivered',
  'read', 'failed', 'bounced', 'suppressed', 'cancelled',
] as const;
export type NotifStatus = typeof NOTIF_STATUSES[number];

export const CAMPAIGN_STATUSES = [
  'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'failed',
] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

export const QUEUE_STATUSES = ['pending', 'processing', 'completed', 'failed', 'dead'] as const;
export type QueueStatus = typeof QUEUE_STATUSES[number];

// ── Core Notifications ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  categoryId: string | null;
  templateId: string | null;
  locale: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority: NotifPriority;
  channels: NotifChannel[];
  isRead: boolean;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotificationRead {
  id: string;
  userId: string;
  notificationId: string;
  readAt: string;
}

// ── Categories & Templates ─────────────────────────────────────────────────

export interface NotificationCategory {
  id: string;
  name: string;
  description: string | null;
  isCritical: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  defaultChannels: NotifChannel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLocalization {
  id: string;
  templateId: string;
  locale: string;
  subject: string;
  body: string;
  richMediaUrl: string | null;
  createdAt: string;
}

// ── Preferences ────────────────────────────────────────────────────────────

export interface NotificationChannelConfig {
  id: string;
  name: NotifChannel;
  isEnabled: boolean;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  categoryId: string | null;
  channel: NotifChannel;
  isEnabled: boolean;
  quietHoursStart: string | null; // PostgreSQL TIME → "HH:MM:SS"
  quietHoursEnd: string | null;
  timezone: string;
  updatedAt: string;
}

// ── Push Devices ───────────────────────────────────────────────────────────

export interface PushDevice {
  id: string;
  userId: string;
  platform: string; // fcm | apns | web
  appVersion: string | null;
  locale: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // device_token excluded — security sensitive (backend stores and uses only)
}

// ── AI Priority ────────────────────────────────────────────────────────────

export interface NotificationAiPriority {
  userId: string;
  recommendedChannel: NotifChannel | null;
  optimalDeliveryHour: number | null; // 0–23
  updatedAt: string;
}

// ── Topics & Subscriptions ─────────────────────────────────────────────────

export interface NotificationTopic {
  id: string;
  topicName: string;
  description: string | null;
  createdAt: string;
}

export interface TopicSubscriber {
  id: string;
  topicId: string;
  userId: string;
  subscribedAt: string;
}

// ── Campaign (user-facing status only) ────────────────────────────────────

export interface NotificationCampaignUser {
  id: string;
  campaignId: string;
  userId: string;
  status: NotifStatus;
  sentAt: string | null;
}

// ── Scheduled (read-only) ──────────────────────────────────────────────────

export interface ScheduledNotification {
  id: string;
  notificationPayload: Record<string, unknown>;
  runAt: string;
  isExecuted: boolean;
  createdAt: string;
}

// ── Analytics (user-facing) ────────────────────────────────────────────────

export interface NotificationClickEvent {
  id: string;
  notificationId: string;
  targetUrl: string | null;
  clickedAt: string;
}

// ── Advanced ENUMs (Migration 011) ─────────────────────────────────────────

export const DEVICE_PLATFORMS = [
  'ios', 'android', 'web', 'macos', 'windows', 'linux', 'ipad',
] as const;
export type DevicePlatform = typeof DEVICE_PLATFORMS[number];

export const NOTIFICATION_PROVIDERS = [
  'fcm', 'apns', 'onesignal', 'twilio', 'sendgrid', 'amazon_ses',
  'whatsapp_business', 'telegram', 'slack', 'discord', 'viber', 'wechat',
] as const;
export type NotificationProvider = typeof NOTIFICATION_PROVIDERS[number];

export const DELIVERY_RECEIPT_STATUSES = [
  'stored', 'delivered', 'opened', 'clicked', 'dismissed', 'expired', 'suppressed',
] as const;
export type DeliveryReceiptStatus = typeof DELIVERY_RECEIPT_STATUSES[number];

// ── Delivery Receipts ──────────────────────────────────────────────────────

export interface NotificationDeliveryReceipt {
  id: string;
  notificationId: string;
  userId: string;
  status: DeliveryReceiptStatus;
  deviceId: string | null;
  channel: NotifChannel;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── Notification Center (Gmail-style) ─────────────────────────────────────

export interface NotificationFolder {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLabel {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface NotificationBookmark {
  id: string;
  userId: string;
  notificationId: string;
  createdAt: string;
}

export interface NotificationArchive {
  id: string;
  userId: string;
  notificationId: string;
  archivedAt: string;
}

// ── AI Personalization ─────────────────────────────────────────────────────

export interface NotificationAiPrediction {
  userId: string;
  optimalDeliveryTime: string; // PostgreSQL TIME → "HH:MM:SS"
  optimalChannel: NotifChannel;
  optimalLanguage: string;
  updatedAt: string;
}

export interface NotificationAiEngagement {
  id: string;
  userId: string;
  channel: NotifChannel;
  engagementRate: number;
  sampleSize: number;
  updatedAt: string;
}

// ── Digest ─────────────────────────────────────────────────────────────────

export interface NotificationDigest {
  id: string;
  userId: string;
  frequency: 'daily' | 'weekly';
  digestPayload: Record<string, unknown>;
  isSent: boolean;
  scheduledAt: string;
  createdAt: string;
}

// ── Inbox Sync ─────────────────────────────────────────────────────────────

export interface NotificationSync {
  id: string;
  userId: string;
  deviceId: string;
  lastSyncedNotificationId: string;
  syncedAt: string;
}

// ── Per-Device Preferences ─────────────────────────────────────────────────

export interface DeviceNotificationPreference {
  id: string;
  deviceId: string;
  channel: NotifChannel;
  isEnabled: boolean;
  updatedAt: string;
}

// ── Rich Push ──────────────────────────────────────────────────────────────

export interface NotificationMedia {
  id: string;
  notificationId: string;
  mediaType: 'image' | 'video' | 'audio' | 'gif';
  mediaUrl: string;
  createdAt: string;
}

export interface NotificationAction {
  id: string;
  notificationId: string;
  actionKey: string;
  actionTitle: string;
  deepLink: string | null;
  createdAt: string;
}

// ── Live Sessions (iOS/Android Live Updates) ───────────────────────────────

export interface NotificationLiveSession {
  id: string;
  userId: string;
  title: string;
  currentState: Record<string, unknown>;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // session_token excluded — backend uses to push live updates (never expose)
}

// ── GDPR Consent ───────────────────────────────────────────────────────────

export interface NotificationConsent {
  id: string;
  userId: string;
  channel: NotifChannel;
  hasConsented: boolean;
  consentedAt: string | null;
  updatedAt: string;
  // ip_address excluded — PII
}

// ── V5.0: Event Bus Registry ───────────────────────────────────────────────
// Schema conflict note (V5 CREATE IF NOT EXISTS = no-op on deployed tables):
//   notification_templates (V5): template_code/channel/language_code vs existing name/category_id/default_channels
//   notification_preferences (V5): profile_id + boolean per-channel vs existing user_id + per-channel rows
//   notifications (V5): profile_id/message/event_type vs existing user_id/body/actor_id
//
// Backend-only V5 tables (zero frontend types):
//   notification_devices       — device_token = ABSOLUTE NEVER (FCM/APNs → unauthorized push delivery)
//   notification_dispatch_queue — recipient_destination may be device token / phone; internal delivery
//   notification_dead_letter_queue — internal failure tracking
//   notification_tracking      — client_ip = NEVER (PII); internal A/B analytics
//   notification_rate_limits   — server-enforced rate counter; never needed by client

export interface NotificationEventRegistry {
  id: string;
  eventName: string;
  category: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}
