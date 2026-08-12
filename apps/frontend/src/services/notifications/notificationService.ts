import { supabase } from '../../lib/supabase';
import type {
  Notification,
  NotificationRead,
  NotificationCategory,
  NotificationTemplate,
  NotificationLocalization,
  NotificationChannelConfig,
  NotificationPreference,
  PushDevice,
  NotificationAiPriority,
  NotificationTopic,
  TopicSubscriber,
  NotificationCampaignUser,
  NotifChannel,
  NotifPriority,
  NotificationEventRegistry,
} from '../../types/notifications';

// Backend-only (never exposed here):
//   - notification_queue, notification_retry_queue, notification_dead_letter_queue,
//     notification_batches — queue processing internals
//   - email_queue, email_delivery_logs, email_bounces — email pipeline
//   - sms_queue, sms_delivery_logs — SMS pipeline
//   - whatsapp_queue, whatsapp_delivery_logs — WhatsApp pipeline
//   - notification_webhooks.secret_key — webhook signing secret
//   - notification_api_keys — admin API keys
//   - notification_workers, notification_job_history — worker internals
//   - notification_ai_rules — ML rule definitions
//   - geo_notifications — admin-created geo triggers
//   - push_devices.device_token — push token (backend stores and reads only)
//   - notification_logs.response_payload — provider API responses

// ── Column constants (sensitive fields excluded) ───────────────────────────

const PUSH_DEVICE_COLS =
  'id, user_id, platform, app_version, locale, is_active, created_at, updated_at';
// device_token excluded — FCM/APNs token must not be returned to frontend

// ── Row types (snake_case) ─────────────────────────────────────────────────

type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  category_id: string | null;
  template_id: string | null;
  locale: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority: string;
  channels: string[];
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type NotificationReadRow = {
  id: string;
  user_id: string;
  notification_id: string;
  read_at: string;
};

type NotificationCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  is_critical: boolean;
  created_at: string;
};

type NotificationTemplateRow = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  default_channels: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type NotificationLocalizationRow = {
  id: string;
  template_id: string;
  locale: string;
  subject: string;
  body: string;
  rich_media_url: string | null;
  created_at: string;
};

type NotificationChannelConfigRow = {
  id: string;
  name: string;
  is_enabled: boolean;
};

type NotificationPreferenceRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  channel: string;
  is_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  updated_at: string;
};

type PushDeviceRow = {
  id: string;
  user_id: string;
  platform: string;
  app_version: string | null;
  locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type NotificationAiPriorityRow = {
  user_id: string;
  recommended_channel: string | null;
  optimal_delivery_hour: number | null;
  updated_at: string;
};

type NotificationTopicRow = {
  id: string;
  topic_name: string;
  description: string | null;
  created_at: string;
};

type TopicSubscriberRow = {
  id: string;
  topic_id: string;
  user_id: string;
  subscribed_at: string;
};

type NotificationCampaignUserRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  status: string;
  sent_at: string | null;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    actorId: r.actor_id,
    categoryId: r.category_id,
    templateId: r.template_id,
    locale: r.locale,
    title: r.title,
    body: r.body,
    data: r.data,
    priority: r.priority as NotifPriority,
    channels: r.channels as NotifChannel[],
    isRead: r.is_read,
    readAt: r.read_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function mapNotificationRead(r: NotificationReadRow): NotificationRead {
  return { id: r.id, userId: r.user_id, notificationId: r.notification_id, readAt: r.read_at };
}

function mapCategory(r: NotificationCategoryRow): NotificationCategory {
  return { id: r.id, name: r.name, description: r.description, isCritical: r.is_critical, createdAt: r.created_at };
}

function mapTemplate(r: NotificationTemplateRow): NotificationTemplate {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description,
    defaultChannels: r.default_channels as NotifChannel[],
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLocalization(r: NotificationLocalizationRow): NotificationLocalization {
  return { id: r.id, templateId: r.template_id, locale: r.locale, subject: r.subject, body: r.body, richMediaUrl: r.rich_media_url, createdAt: r.created_at };
}

function mapChannelConfig(r: NotificationChannelConfigRow): NotificationChannelConfig {
  return { id: r.id, name: r.name as NotifChannel, isEnabled: r.is_enabled };
}

function mapPreference(r: NotificationPreferenceRow): NotificationPreference {
  return {
    id: r.id,
    userId: r.user_id,
    categoryId: r.category_id,
    channel: r.channel as NotifChannel,
    isEnabled: r.is_enabled,
    quietHoursStart: r.quiet_hours_start,
    quietHoursEnd: r.quiet_hours_end,
    timezone: r.timezone,
    updatedAt: r.updated_at,
  };
}

function mapPushDevice(r: PushDeviceRow): PushDevice {
  return { id: r.id, userId: r.user_id, platform: r.platform, appVersion: r.app_version, locale: r.locale, isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapAiPriority(r: NotificationAiPriorityRow): NotificationAiPriority {
  return { userId: r.user_id, recommendedChannel: r.recommended_channel as NotifChannel | null, optimalDeliveryHour: r.optimal_delivery_hour, updatedAt: r.updated_at };
}

function mapTopic(r: NotificationTopicRow): NotificationTopic {
  return { id: r.id, topicName: r.topic_name, description: r.description, createdAt: r.created_at };
}

function mapTopicSubscriber(r: TopicSubscriberRow): TopicSubscriber {
  return { id: r.id, topicId: r.topic_id, userId: r.user_id, subscribedAt: r.subscribed_at };
}

function mapCampaignUser(r: NotificationCampaignUserRow): NotificationCampaignUser {
  return { id: r.id, campaignId: r.campaign_id, userId: r.user_id, status: r.status as NotificationCampaignUser['status'], sentAt: r.sent_at };
}

// ================================================================
// === Core Notifications
// ================================================================

// RLS policy ensures only the user's own notifications are returned.

export async function getMyNotifications(
  options: {
    unreadOnly?: boolean;
    categoryId?: string;
    limit?: number;
    before?: string;
  } = {}
): Promise<Notification[]> {
  let q = supabase
    .from('notifications')
    .select('*');

  if (options.unreadOnly) q = q.eq('is_read', false);
  if (options.categoryId) q = q.eq('category_id', options.categoryId);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as NotificationRow[]).map(mapNotification);
}

export async function getMyUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function getNotificationById(
  notificationId: string
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapNotification(data as NotificationRow) : null;
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw error;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notification_reads')
    .upsert(
      { notification_id: notificationId, user_id: user.id },
      { onConflict: 'user_id,notification_id' }
    );
}

export async function markAllNotificationsRead(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('is_read', false);
  if (error) throw error;
}

// ================================================================
// === Categories & Templates (reference data)
// ================================================================

export async function getNotificationCategories(): Promise<NotificationCategory[]> {
  const { data, error } = await supabase
    .from('notification_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as NotificationCategoryRow[]).map(mapCategory);
}

export async function getNotificationTemplates(
  categoryId?: string
): Promise<NotificationTemplate[]> {
  let q = supabase
    .from('notification_templates')
    .select('*')
    .eq('is_active', true);

  if (categoryId) q = q.eq('category_id', categoryId);

  const { data, error } = await q.order('name', { ascending: true });
  if (error) throw error;
  return (data as NotificationTemplateRow[]).map(mapTemplate);
}

export async function getTemplateLocalizations(
  templateId: string,
  locale?: string
): Promise<NotificationLocalization[]> {
  let q = supabase
    .from('notification_localizations')
    .select('*')
    .eq('template_id', templateId);

  if (locale) q = q.eq('locale', locale);

  const { data, error } = await q;
  if (error) throw error;
  return (data as NotificationLocalizationRow[]).map(mapLocalization);
}

// ================================================================
// === Notification Channels & Preferences
// ================================================================

export async function getAvailableChannels(): Promise<NotificationChannelConfig[]> {
  const { data, error } = await supabase
    .from('notification_channels')
    .select('*')
    .eq('is_enabled', true);
  if (error) throw error;
  return (data as NotificationChannelConfigRow[]).map(mapChannelConfig);
}

export async function getMyPreferences(): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .order('channel', { ascending: true });
  if (error) throw error;
  return (data as NotificationPreferenceRow[]).map(mapPreference);
}

export async function upsertPreference(
  categoryId: string | null,
  channel: NotifChannel,
  isEnabled: boolean,
  quietHours?: { start: string; end: string; timezone?: string }
): Promise<NotificationPreference> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        channel,
        is_enabled: isEnabled,
        quiet_hours_start: quietHours?.start ?? null,
        quiet_hours_end: quietHours?.end ?? null,
        timezone: quietHours?.timezone ?? 'UTC',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category_id,channel' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapPreference(data as NotificationPreferenceRow);
}

// ================================================================
// === Push Devices
// ================================================================

// Device registration must go through backend to validate and store the
// device_token securely. Frontend only reads non-sensitive device info.

export async function getMyPushDevices(): Promise<PushDevice[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('push_devices')
    .select(PUSH_DEVICE_COLS)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PushDeviceRow[]).map(mapPushDevice);
}

// ================================================================
// === AI Delivery Priority
// ================================================================

export async function getMyAiPriority(): Promise<NotificationAiPriority | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notification_ai_priority')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiPriority(data as NotificationAiPriorityRow) : null;
}

// ================================================================
// === Topics & Subscriptions
// ================================================================

export async function getNotificationTopics(): Promise<NotificationTopic[]> {
  const { data, error } = await supabase
    .from('notification_topics')
    .select('*')
    .order('topic_name', { ascending: true });
  if (error) throw error;
  return (data as NotificationTopicRow[]).map(mapTopic);
}

export async function getMyTopicSubscriptions(): Promise<TopicSubscriber[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('topic_subscribers')
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;
  return (data as TopicSubscriberRow[]).map(mapTopicSubscriber);
}

export async function subscribeToTopic(topicId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('topic_subscribers')
    .upsert(
      { topic_id: topicId, user_id: user.id },
      { onConflict: 'topic_id,user_id' }
    );
  if (error) throw error;
}

export async function unsubscribeFromTopic(topicId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('topic_subscribers')
    .delete()
    .eq('topic_id', topicId)
    .eq('user_id', user.id);
  if (error) throw error;
}

// ================================================================
// === Campaign Status (user-facing only)
// ================================================================

export async function getMyCampaignNotifications(): Promise<NotificationCampaignUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_campaign_users')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return (data as NotificationCampaignUserRow[]).map(mapCampaignUser);
}

// ================================================================
// === V5.0: Event Bus Registry (notification_event_registry)
// ================================================================
// Reference catalog — SELECT USING (TRUE); all authenticated clients can read.
// Backend-only V5 tables skipped here:
//   notification_devices       — device_token = ABSOLUTE NEVER
//   notification_dispatch_queue — internal delivery queue
//   notification_dead_letter_queue — internal failure tracking
//   notification_tracking      — client_ip = NEVER (PII)
//   notification_rate_limits   — server-enforced rate counter

const EVENT_REGISTRY_COLS = 'id, event_name, category, description, is_active, created_at';

type EventRegistryRow = {
  id: string;
  event_name: string;
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

function mapEventRegistry(r: EventRegistryRow): NotificationEventRegistry {
  return {
    id: r.id,
    eventName: r.event_name,
    category: r.category,
    description: r.description,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export async function getNotificationEventRegistry(options: {
  category?: string;
  activeOnly?: boolean;
} = {}): Promise<NotificationEventRegistry[]> {
  let q = supabase.from('notification_event_registry').select(EVENT_REGISTRY_COLS);
  if (options.category) q = q.eq('category', options.category);
  if (options.activeOnly !== false) q = q.eq('is_active', true);
  const { data, error } = await q.order('category').order('event_name');
  if (error) throw error;
  return (data as EventRegistryRow[]).map(mapEventRegistry);
}

export async function getEventsByCategory(category: string): Promise<NotificationEventRegistry[]> {
  const { data, error } = await supabase
    .from('notification_event_registry')
    .select(EVENT_REGISTRY_COLS)
    .eq('category', category)
    .eq('is_active', true)
    .order('event_name');
  if (error) throw error;
  return (data as EventRegistryRow[]).map(mapEventRegistry);
}
