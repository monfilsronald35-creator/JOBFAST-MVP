import { supabase } from '../../lib/supabase';
import type {
  NotificationDeliveryReceipt,
  NotificationFolder,
  NotificationLabel,
  NotificationBookmark,
  NotificationArchive,
  NotificationAiPrediction,
  NotificationAiEngagement,
  NotificationDigest,
  NotificationSync,
  DeviceNotificationPreference,
  NotificationMedia,
  NotificationAction,
  NotificationLiveSession,
  NotificationConsent,
  NotifChannel,
  DeliveryReceiptStatus,
} from '../../types/notifications';

// Backend-only (never exposed here):
//   - notification_providers, notification_provider_credentials (credentials_encrypted),
//     notification_provider_health, notification_provider_statistics — admin/ops
//   - notification_routes — routing config
//   - notification_experiments, notification_variants, notification_variant_results — A/B testing
//   - notification_retry_policies — retry config
//   - notification_suppressions — suppression lists
//   - notification_metrics — global aggregate metrics
//   - notification_costs — provider billing
//   - notification_data_retention — retention policy config
//   - campaign_jobs, campaign_job_logs — scheduling workers
//   - notification_template_reviews, notification_template_approvals — workflow
//   - notification_immutable_audit (previous_hash, current_hash, signature) — cryptographic chain
//   - notification_sync_history — backend sync analytics
//   - device_groups, device_group_members — admin device management
//   - notification_live_sessions.session_token — live activity token (never expose)
//   - notification_consents.ip_address — PII

// ── Column constants (sensitive fields excluded) ───────────────────────────

const LIVE_SESSION_COLS =
  'id, user_id, title, current_state, is_active, expires_at, created_at, updated_at';
// session_token excluded — used by backend to push live activity updates

const CONSENT_COLS =
  'id, user_id, channel, has_consented, consented_at, updated_at';
// ip_address excluded — PII

// ── Row types (snake_case) ─────────────────────────────────────────────────

type DeliveryReceiptRow = {
  id: string;
  notification_id: string;
  user_id: string;
  status: string;
  device_id: string | null;
  channel: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type NotificationFolderRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationLabelRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

type NotificationBookmarkRow = {
  id: string;
  user_id: string;
  notification_id: string;
  created_at: string;
};

type NotificationArchiveRow = {
  id: string;
  user_id: string;
  notification_id: string;
  archived_at: string;
};

type AiPredictionRow = {
  user_id: string;
  optimal_delivery_time: string;
  optimal_channel: string;
  optimal_language: string;
  updated_at: string;
};

type AiEngagementRow = {
  id: string;
  user_id: string;
  channel: string;
  engagement_rate: number;
  sample_size: number;
  updated_at: string;
};

type DigestRow = {
  id: string;
  user_id: string;
  frequency: string;
  digest_payload: Record<string, unknown>;
  is_sent: boolean;
  scheduled_at: string;
  created_at: string;
};

type SyncRow = {
  id: string;
  user_id: string;
  device_id: string;
  last_synced_notification_id: string;
  synced_at: string;
};

type DevicePreferenceRow = {
  id: string;
  device_id: string;
  channel: string;
  is_enabled: boolean;
  updated_at: string;
};

type NotificationMediaRow = {
  id: string;
  notification_id: string;
  media_type: string;
  media_url: string;
  created_at: string;
};

type NotificationActionRow = {
  id: string;
  notification_id: string;
  action_key: string;
  action_title: string;
  deep_link: string | null;
  created_at: string;
};

type LiveSessionRow = {
  id: string;
  user_id: string;
  title: string;
  current_state: Record<string, unknown>;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type ConsentRow = {
  id: string;
  user_id: string;
  channel: string;
  has_consented: boolean;
  consented_at: string | null;
  updated_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapDeliveryReceipt(r: DeliveryReceiptRow): NotificationDeliveryReceipt {
  return { id: r.id, notificationId: r.notification_id, userId: r.user_id, status: r.status as DeliveryReceiptStatus, deviceId: r.device_id, channel: r.channel as NotifChannel, metadata: r.metadata, createdAt: r.created_at };
}

function mapFolder(r: NotificationFolderRow): NotificationFolder {
  return { id: r.id, userId: r.user_id, name: r.name, color: r.color, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapLabel(r: NotificationLabelRow): NotificationLabel {
  return { id: r.id, userId: r.user_id, name: r.name, createdAt: r.created_at };
}

function mapBookmark(r: NotificationBookmarkRow): NotificationBookmark {
  return { id: r.id, userId: r.user_id, notificationId: r.notification_id, createdAt: r.created_at };
}

function mapArchive(r: NotificationArchiveRow): NotificationArchive {
  return { id: r.id, userId: r.user_id, notificationId: r.notification_id, archivedAt: r.archived_at };
}

function mapAiPrediction(r: AiPredictionRow): NotificationAiPrediction {
  return { userId: r.user_id, optimalDeliveryTime: r.optimal_delivery_time, optimalChannel: r.optimal_channel as NotifChannel, optimalLanguage: r.optimal_language, updatedAt: r.updated_at };
}

function mapAiEngagement(r: AiEngagementRow): NotificationAiEngagement {
  return { id: r.id, userId: r.user_id, channel: r.channel as NotifChannel, engagementRate: r.engagement_rate, sampleSize: r.sample_size, updatedAt: r.updated_at };
}

function mapDigest(r: DigestRow): NotificationDigest {
  return { id: r.id, userId: r.user_id, frequency: r.frequency as 'daily' | 'weekly', digestPayload: r.digest_payload, isSent: r.is_sent, scheduledAt: r.scheduled_at, createdAt: r.created_at };
}

function mapSync(r: SyncRow): NotificationSync {
  return { id: r.id, userId: r.user_id, deviceId: r.device_id, lastSyncedNotificationId: r.last_synced_notification_id, syncedAt: r.synced_at };
}

function mapDevicePref(r: DevicePreferenceRow): DeviceNotificationPreference {
  return { id: r.id, deviceId: r.device_id, channel: r.channel as NotifChannel, isEnabled: r.is_enabled, updatedAt: r.updated_at };
}

function mapMedia(r: NotificationMediaRow): NotificationMedia {
  return { id: r.id, notificationId: r.notification_id, mediaType: r.media_type as NotificationMedia['mediaType'], mediaUrl: r.media_url, createdAt: r.created_at };
}

function mapAction(r: NotificationActionRow): NotificationAction {
  return { id: r.id, notificationId: r.notification_id, actionKey: r.action_key, actionTitle: r.action_title, deepLink: r.deep_link, createdAt: r.created_at };
}

function mapLiveSession(r: LiveSessionRow): NotificationLiveSession {
  return { id: r.id, userId: r.user_id, title: r.title, currentState: r.current_state, isActive: r.is_active, expiresAt: r.expires_at, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapConsent(r: ConsentRow): NotificationConsent {
  return { id: r.id, userId: r.user_id, channel: r.channel as NotifChannel, hasConsented: r.has_consented, consentedAt: r.consented_at, updatedAt: r.updated_at };
}

// ================================================================
// === Delivery Receipts
// ================================================================

export async function getMyDeliveryReceipts(
  notificationId: string
): Promise<NotificationDeliveryReceipt[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_delivery_receipts')
    .select('*')
    .eq('notification_id', notificationId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DeliveryReceiptRow[]).map(mapDeliveryReceipt);
}

// ================================================================
// === Folders (Gmail-style)
// ================================================================

export async function getMyFolders(): Promise<NotificationFolder[]> {
  const { data, error } = await supabase
    .from('notification_folders')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as NotificationFolderRow[]).map(mapFolder);
}

export async function createFolder(
  name: string,
  color?: string
): Promise<NotificationFolder> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_folders')
    .insert({ user_id: user.id, name, color: color ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return mapFolder(data as NotificationFolderRow);
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_folders')
    .delete()
    .eq('id', folderId);
  if (error) throw error;
}

// ================================================================
// === Labels
// ================================================================

export async function getMyLabels(): Promise<NotificationLabel[]> {
  const { data, error } = await supabase
    .from('notification_labels')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as NotificationLabelRow[]).map(mapLabel);
}

export async function createLabel(name: string): Promise<NotificationLabel> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_labels')
    .insert({ user_id: user.id, name })
    .select('*')
    .single();
  if (error) throw error;
  return mapLabel(data as NotificationLabelRow);
}

export async function deleteLabel(labelId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_labels')
    .delete()
    .eq('id', labelId);
  if (error) throw error;
}

// ================================================================
// === Bookmarks
// ================================================================

export async function getMyBookmarks(): Promise<NotificationBookmark[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as NotificationBookmarkRow[]).map(mapBookmark);
}

export async function addBookmark(notificationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notification_bookmarks')
    .upsert(
      { user_id: user.id, notification_id: notificationId },
      { onConflict: 'user_id,notification_id' }
    );
  if (error) throw error;
}

export async function removeBookmark(notificationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notification_bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('notification_id', notificationId);
  if (error) throw error;
}

// ================================================================
// === Archives
// ================================================================

export async function getMyArchivedNotifications(): Promise<NotificationArchive[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_archives')
    .select('*')
    .eq('user_id', user.id)
    .order('archived_at', { ascending: false });
  if (error) throw error;
  return (data as NotificationArchiveRow[]).map(mapArchive);
}

export async function archiveNotification(notificationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notification_archives')
    .upsert(
      { user_id: user.id, notification_id: notificationId },
      { onConflict: 'user_id,notification_id' }
    );
  if (error) throw error;
}

export async function unarchiveNotification(notificationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notification_archives')
    .delete()
    .eq('user_id', user.id)
    .eq('notification_id', notificationId);
  if (error) throw error;
}

// ================================================================
// === AI Personalization
// ================================================================

export async function getMyAiPrediction(): Promise<NotificationAiPrediction | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notification_ai_predictions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiPrediction(data as AiPredictionRow) : null;
}

export async function getMyEngagementRates(): Promise<NotificationAiEngagement[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_ai_engagement')
    .select('*')
    .eq('user_id', user.id)
    .order('engagement_rate', { ascending: false });
  if (error) throw error;
  return (data as AiEngagementRow[]).map(mapAiEngagement);
}

// ================================================================
// === Digests
// ================================================================

export async function getMyPendingDigests(): Promise<NotificationDigest[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notification_digests')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_sent', false)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data as DigestRow[]).map(mapDigest);
}

// ================================================================
// === Inbox Sync
// ================================================================

export async function getMySyncStatus(
  deviceId: string
): Promise<NotificationSync | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notification_sync')
    .select('*')
    .eq('user_id', user.id)
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSync(data as SyncRow) : null;
}

// ================================================================
// === Per-Device Preferences
// ================================================================

export async function getDevicePreferences(
  deviceId: string
): Promise<DeviceNotificationPreference[]> {
  const { data, error } = await supabase
    .from('device_notification_preferences')
    .select('*')
    .eq('device_id', deviceId);
  if (error) throw error;
  return (data as DevicePreferenceRow[]).map(mapDevicePref);
}

export async function updateDevicePreference(
  deviceId: string,
  channel: NotifChannel,
  isEnabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('device_notification_preferences')
    .upsert(
      {
        device_id: deviceId,
        channel,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id,channel' }
    );
  if (error) throw error;
}

// ================================================================
// === Rich Push (Media & Actions)
// ================================================================

export async function getNotificationMedia(
  notificationId: string
): Promise<NotificationMedia[]> {
  const { data, error } = await supabase
    .from('notification_media')
    .select('*')
    .eq('notification_id', notificationId);
  if (error) throw error;
  return (data as NotificationMediaRow[]).map(mapMedia);
}

export async function getNotificationActions(
  notificationId: string
): Promise<NotificationAction[]> {
  const { data, error } = await supabase
    .from('notification_actions')
    .select('*')
    .eq('notification_id', notificationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as NotificationActionRow[]).map(mapAction);
}

// ================================================================
// === Live Sessions (iOS/Android Live Updates)
// ================================================================

// session_token is used by backend to push live activity updates via APNs/FCM.
// It must never be returned to frontend — excluded via LIVE_SESSION_COLS.

export async function getMyLiveSessions(): Promise<NotificationLiveSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notification_live_sessions')
    .select(LIVE_SESSION_COLS)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LiveSessionRow[]).map(mapLiveSession);
}

// ================================================================
// === GDPR Consents
// ================================================================

// ip_address is excluded — captured by backend on consent submission.

export async function getMyConsents(): Promise<NotificationConsent[]> {
  const { data, error } = await supabase
    .from('notification_consents')
    .select(CONSENT_COLS);
  if (error) throw error;
  return (data as ConsentRow[]).map(mapConsent);
}

export async function upsertConsent(
  channel: NotifChannel,
  hasConsented: boolean
): Promise<NotificationConsent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // ip_address is recorded server-side via backend endpoint for GDPR compliance.
  const { data, error } = await supabase
    .from('notification_consents')
    .upsert(
      {
        user_id: user.id,
        channel,
        has_consented: hasConsented,
        consented_at: hasConsented ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,channel' }
    )
    .select(CONSENT_COLS)
    .single();
  if (error) throw error;
  return mapConsent(data as ConsentRow);
}
