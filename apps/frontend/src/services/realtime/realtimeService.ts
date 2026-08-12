import { supabase } from '../../lib/supabase';
import type {
  PresenceSession,
  PresenceStatusState,
  LocationUpdate,
  RealtimeChannel,
  ChannelType,
  ChannelMember,
  StreamEvent,
  OfflineSyncState,
  WebhookSubscription,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookRetryQueueEntry,
  IntegrationEndpoint,
} from '../../types/realtime';

// Backend-only tables — zero frontend code (25 of 35 tables):
//   realtime_connections, sync_queue, background_jobs, event_bus, webhook_events,
//   event_subscriptions, message_queue, dead_letter_queue, job_schedules,
//   job_execution_history, worker_nodes, edge_sync_nodes, conflict_resolution_logs,
//   cache_invalidation_events, distributed_locks, integration_tokens,
//   event_transformations, integration_audit_logs, ai_event_prioritization,
//   global_event_replication, cross_region_sync, realtime_metrics,
//   connection_health, event_replay_log, quantum_event_consensus

// ── Column constants ───────────────────────────────────────────────────────

const PRESENCE_COLS =
  'id, organization_id, user_id, status_state, custom_status_text, current_activity, client_platform, last_ping_at, session_expires_at, created_at';

const LOCATION_COLS =
  'id, organization_id, entity_type, entity_id, latitude, longitude, altitude_meters, heading_degrees, speed_mps, accuracy_radius_meters, battery_level_pct, captured_at, created_at';

const CHANNEL_COLS =
  'id, organization_id, channel_name, channel_type, max_members, is_archived, created_at';

const CHANNEL_MEMBER_COLS =
  'id, organization_id, channel_id, user_id, member_role, muted_until, joined_at, created_at';

const STREAM_EVENT_COLS =
  'id, organization_id, channel_id, event_payload_json, sequence_index, created_at';
// event_checksum excluded — internal content integrity hash; not needed by clients

const OFFLINE_SYNC_COLS =
  'id, organization_id, user_id, entity_name, last_synced_version, client_last_sync_timestamp, server_last_sync_timestamp, created_at';

const WEBHOOK_SUB_COLS =
  'id, organization_id, endpoint_url, events_list, retry_policy_json, is_active, created_at';
// secret_token excluded — ABSOLUTE NEVER (HMAC signing secret)

const WEBHOOK_DELIVERY_COLS =
  'id, organization_id, webhook_subscription_id, response_status_code, response_body, delivery_status, latency_ms, delivered_at, created_at';
// request_headers_json excluded — may contain computed auth signatures

const WEBHOOK_RETRY_COLS =
  'id, organization_id, webhook_delivery_id, next_retry_at, retry_attempt_count, max_retry_attempts, last_error_message, created_at';

const INTEGRATION_EP_COLS =
  'id, organization_id, service_name, base_url, auth_type, rate_limit_per_minute, is_active, created_at';

// ── Row types ─────────────────────────────────────────────────────────────

type PresenceRow = {
  id: string;
  organization_id: string;
  user_id: string;
  status_state: PresenceStatusState;
  custom_status_text: string | null;
  current_activity: string | null;
  client_platform: string;
  last_ping_at: string;
  session_expires_at: string | null;
  created_at: string;
};

type LocationRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  latitude: number;
  longitude: number;
  altitude_meters: number;
  heading_degrees: number;
  speed_mps: number;
  accuracy_radius_meters: number;
  battery_level_pct: number | null;
  captured_at: string;
  created_at: string;
};

type ChannelRow = {
  id: string;
  organization_id: string;
  channel_name: string;
  channel_type: ChannelType;
  max_members: number;
  is_archived: boolean;
  created_at: string;
};

type ChannelMemberRow = {
  id: string;
  organization_id: string;
  channel_id: string;
  user_id: string;
  member_role: ChannelMember['memberRole'];
  muted_until: string | null;
  joined_at: string;
  created_at: string;
};

type StreamEventRow = {
  id: string;
  organization_id: string;
  channel_id: string;
  event_payload_json: Record<string, unknown>;
  sequence_index: number;
  created_at: string;
};

type OfflineSyncRow = {
  id: string;
  organization_id: string;
  user_id: string;
  entity_name: string;
  last_synced_version: number;
  client_last_sync_timestamp: string | null;
  server_last_sync_timestamp: string;
  created_at: string;
};

type WebhookSubRow = {
  id: string;
  organization_id: string;
  endpoint_url: string;
  events_list: string[];
  retry_policy_json: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

type WebhookDeliveryRow = {
  id: string;
  organization_id: string;
  webhook_subscription_id: string;
  response_status_code: number;
  response_body: string | null;
  delivery_status: WebhookDeliveryStatus;
  latency_ms: number;
  delivered_at: string;
  created_at: string;
};

type WebhookRetryRow = {
  id: string;
  organization_id: string;
  webhook_delivery_id: string;
  next_retry_at: string;
  retry_attempt_count: number;
  max_retry_attempts: number;
  last_error_message: string | null;
  created_at: string;
};

type IntegrationEpRow = {
  id: string;
  organization_id: string;
  service_name: string;
  base_url: string;
  auth_type: IntegrationEndpoint['authType'];
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapPresence(r: PresenceRow): PresenceSession {
  return {
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    statusState: r.status_state,
    customStatusText: r.custom_status_text,
    currentActivity: r.current_activity,
    clientPlatform: r.client_platform,
    lastPingAt: r.last_ping_at,
    sessionExpiresAt: r.session_expires_at,
    createdAt: r.created_at,
  };
}

function mapLocation(r: LocationRow): LocationUpdate {
  return {
    id: r.id,
    organizationId: r.organization_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    latitude: r.latitude,
    longitude: r.longitude,
    altitudeMeters: r.altitude_meters,
    headingDegrees: r.heading_degrees,
    speedMps: r.speed_mps,
    accuracyRadiusMeters: r.accuracy_radius_meters,
    batteryLevelPct: r.battery_level_pct,
    capturedAt: r.captured_at,
    createdAt: r.created_at,
  };
}

function mapChannel(r: ChannelRow): RealtimeChannel {
  return {
    id: r.id,
    organizationId: r.organization_id,
    channelName: r.channel_name,
    channelType: r.channel_type,
    maxMembers: r.max_members,
    isArchived: r.is_archived,
    createdAt: r.created_at,
  };
}

function mapChannelMember(r: ChannelMemberRow): ChannelMember {
  return {
    id: r.id,
    organizationId: r.organization_id,
    channelId: r.channel_id,
    userId: r.user_id,
    memberRole: r.member_role,
    mutedUntil: r.muted_until,
    joinedAt: r.joined_at,
    createdAt: r.created_at,
  };
}

function mapStreamEvent(r: StreamEventRow): StreamEvent {
  return {
    id: r.id,
    organizationId: r.organization_id,
    channelId: r.channel_id,
    eventPayloadJson: r.event_payload_json,
    sequenceIndex: r.sequence_index,
    createdAt: r.created_at,
  };
}

function mapOfflineSync(r: OfflineSyncRow): OfflineSyncState {
  return {
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    entityName: r.entity_name,
    lastSyncedVersion: r.last_synced_version,
    clientLastSyncTimestamp: r.client_last_sync_timestamp,
    serverLastSyncTimestamp: r.server_last_sync_timestamp,
    createdAt: r.created_at,
  };
}

function mapWebhookSub(r: WebhookSubRow): WebhookSubscription {
  return {
    id: r.id,
    organizationId: r.organization_id,
    endpointUrl: r.endpoint_url,
    eventsList: r.events_list,
    retryPolicyJson: r.retry_policy_json,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapWebhookDelivery(r: WebhookDeliveryRow): WebhookDelivery {
  return {
    id: r.id,
    organizationId: r.organization_id,
    webhookSubscriptionId: r.webhook_subscription_id,
    responseStatusCode: r.response_status_code,
    responseBody: r.response_body,
    deliveryStatus: r.delivery_status,
    latencyMs: r.latency_ms,
    deliveredAt: r.delivered_at,
    createdAt: r.created_at,
  };
}

function mapWebhookRetry(r: WebhookRetryRow): WebhookRetryQueueEntry {
  return {
    id: r.id,
    organizationId: r.organization_id,
    webhookDeliveryId: r.webhook_delivery_id,
    nextRetryAt: r.next_retry_at,
    retryAttemptCount: r.retry_attempt_count,
    maxRetryAttempts: r.max_retry_attempts,
    lastErrorMessage: r.last_error_message,
    createdAt: r.created_at,
  };
}

function mapIntegrationEp(r: IntegrationEpRow): IntegrationEndpoint {
  return {
    id: r.id,
    organizationId: r.organization_id,
    serviceName: r.service_name,
    baseUrl: r.base_url,
    authType: r.auth_type,
    rateLimitPerMinute: r.rate_limit_per_minute,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

// ── Presence Session functions ────────────────────────────────────────────

export async function getMyPresenceSession(): Promise<PresenceSession | null> {
  const { data, error } = await supabase
    .from('presence_sessions')
    .select(PRESENCE_COLS)
    .order('last_ping_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapPresence(data as PresenceRow) : null;
}

export async function getUserPresence(userId: string): Promise<PresenceSession | null> {
  const { data, error } = await supabase
    .from('presence_sessions')
    .select(PRESENCE_COLS)
    .eq('user_id', userId)
    .order('last_ping_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapPresence(data as PresenceRow) : null;
}

export async function getOrganizationPresence(options: {
  statusState?: PresenceStatusState;
  limit?: number;
} = {}): Promise<PresenceSession[]> {
  let q = supabase
    .from('presence_sessions')
    .select(PRESENCE_COLS);

  if (options.statusState) q = q.eq('status_state', options.statusState);

  const { data, error } = await q
    .order('last_ping_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as PresenceRow[]).map(mapPresence);
}

export async function getOnlineUsers(options: { limit?: number } = {}): Promise<PresenceSession[]> {
  const { data, error } = await supabase
    .from('presence_sessions')
    .select(PRESENCE_COLS)
    .in('status_state', ['online', 'in_transit'])
    .gt('last_ping_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order('last_ping_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as PresenceRow[]).map(mapPresence);
}

// ── Location Update functions ─────────────────────────────────────────────

export async function getEntityLocationHistory(
  entityType: string,
  entityId: string,
  options: { limit?: number; before?: string } = {}
): Promise<LocationUpdate[]> {
  let q = supabase
    .from('location_updates')
    .select(LOCATION_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (options.before) q = q.lt('captured_at', options.before);

  const { data, error } = await q
    .order('captured_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as LocationRow[]).map(mapLocation);
}

export async function getLatestEntityLocation(
  entityType: string,
  entityId: string
): Promise<LocationUpdate | null> {
  const { data, error } = await supabase
    .from('location_updates')
    .select(LOCATION_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapLocation(data as LocationRow) : null;
}

export async function getMyLocationHistory(options: {
  limit?: number;
  before?: string;
} = {}): Promise<LocationUpdate[]> {
  let q = supabase
    .from('location_updates')
    .select(LOCATION_COLS)
    .eq('entity_type', 'user');

  if (options.before) q = q.lt('captured_at', options.before);

  const { data, error } = await q
    .order('captured_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as LocationRow[]).map(mapLocation);
}

// ── Realtime Channel functions ────────────────────────────────────────────

export async function getPublicChannels(options: {
  limit?: number;
  before?: string;
} = {}): Promise<RealtimeChannel[]> {
  let q = supabase
    .from('realtime_channels')
    .select(CHANNEL_COLS)
    .eq('channel_type', 'public')
    .eq('is_archived', false);

  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ChannelRow[]).map(mapChannel);
}

export async function getChannel(id: string): Promise<RealtimeChannel | null> {
  const { data, error } = await supabase
    .from('realtime_channels')
    .select(CHANNEL_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapChannel(data as ChannelRow) : null;
}

export async function getChannels(options: {
  channelType?: ChannelType;
  isArchived?: boolean;
  limit?: number;
} = {}): Promise<RealtimeChannel[]> {
  let q = supabase
    .from('realtime_channels')
    .select(CHANNEL_COLS);

  if (options.channelType) q = q.eq('channel_type', options.channelType);
  if (options.isArchived !== undefined) q = q.eq('is_archived', options.isArchived);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ChannelRow[]).map(mapChannel);
}

// ── Channel Member functions ──────────────────────────────────────────────

export async function getChannelMembers(
  channelId: string,
  options: { limit?: number } = {}
): Promise<ChannelMember[]> {
  const { data, error } = await supabase
    .from('channel_members')
    .select(CHANNEL_MEMBER_COLS)
    .eq('channel_id', channelId)
    .order('joined_at', { ascending: true })
    .limit(options.limit ?? 200);
  if (error) throw error;
  return (data as ChannelMemberRow[]).map(mapChannelMember);
}

export async function getMyChannelMemberships(): Promise<ChannelMember[]> {
  const { data, error } = await supabase
    .from('channel_members')
    .select(CHANNEL_MEMBER_COLS)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data as ChannelMemberRow[]).map(mapChannelMember);
}

export async function getMyMembershipInChannel(
  channelId: string
): Promise<ChannelMember | null> {
  const { data, error } = await supabase
    .from('channel_members')
    .select(CHANNEL_MEMBER_COLS)
    .eq('channel_id', channelId)
    .single();
  if (error) throw error;
  return data ? mapChannelMember(data as ChannelMemberRow) : null;
}

// ── Stream Event functions ────────────────────────────────────────────────

export async function getChannelEvents(
  channelId: string,
  options: { limit?: number; beforeSequence?: number } = {}
): Promise<StreamEvent[]> {
  let q = supabase
    .from('stream_events')
    .select(STREAM_EVENT_COLS)
    .eq('channel_id', channelId);

  if (options.beforeSequence !== undefined) {
    q = q.lt('sequence_index', options.beforeSequence);
  }

  const { data, error } = await q
    .order('sequence_index', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as StreamEventRow[]).map(mapStreamEvent);
}

export async function getChannelEventsSince(
  channelId: string,
  sinceSequence: number,
  options: { limit?: number } = {}
): Promise<StreamEvent[]> {
  const { data, error } = await supabase
    .from('stream_events')
    .select(STREAM_EVENT_COLS)
    .eq('channel_id', channelId)
    .gt('sequence_index', sinceSequence)
    .order('sequence_index', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as StreamEventRow[]).map(mapStreamEvent);
}

// ── Offline Sync State functions ──────────────────────────────────────────

export async function getMySyncStates(): Promise<OfflineSyncState[]> {
  const { data, error } = await supabase
    .from('offline_sync_states')
    .select(OFFLINE_SYNC_COLS)
    .order('entity_name', { ascending: true });
  if (error) throw error;
  return (data as OfflineSyncRow[]).map(mapOfflineSync);
}

export async function getMySyncState(entityName: string): Promise<OfflineSyncState | null> {
  const { data, error } = await supabase
    .from('offline_sync_states')
    .select(OFFLINE_SYNC_COLS)
    .eq('entity_name', entityName)
    .single();
  if (error) throw error;
  return data ? mapOfflineSync(data as OfflineSyncRow) : null;
}

// ── Webhook Subscription functions ────────────────────────────────────────

export async function getMyWebhookSubscriptions(options: {
  isActive?: boolean;
  limit?: number;
} = {}): Promise<WebhookSubscription[]> {
  let q = supabase
    .from('webhook_subscriptions')
    .select(WEBHOOK_SUB_COLS);

  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookSubRow[]).map(mapWebhookSub);
}

export async function getWebhookSubscription(id: string): Promise<WebhookSubscription | null> {
  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .select(WEBHOOK_SUB_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapWebhookSub(data as WebhookSubRow) : null;
}

export async function getActiveWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .select(WEBHOOK_SUB_COLS)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WebhookSubRow[]).map(mapWebhookSub);
}

// ── Webhook Delivery functions ────────────────────────────────────────────

export async function getWebhookDeliveries(
  subscriptionId: string,
  options: {
    deliveryStatus?: WebhookDeliveryStatus;
    limit?: number;
    before?: string;
  } = {}
): Promise<WebhookDelivery[]> {
  let q = supabase
    .from('webhook_deliveries')
    .select(WEBHOOK_DELIVERY_COLS)
    .eq('webhook_subscription_id', subscriptionId);

  if (options.deliveryStatus) q = q.eq('delivery_status', options.deliveryStatus);
  if (options.before) q = q.lt('delivered_at', options.before);

  const { data, error } = await q
    .order('delivered_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookDeliveryRow[]).map(mapWebhookDelivery);
}

export async function getFailedWebhookDeliveries(
  subscriptionId: string,
  options: { limit?: number } = {}
): Promise<WebhookDelivery[]> {
  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select(WEBHOOK_DELIVERY_COLS)
    .eq('webhook_subscription_id', subscriptionId)
    .in('delivery_status', ['failed', 'timeout'])
    .order('delivered_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookDeliveryRow[]).map(mapWebhookDelivery);
}

// ── Webhook Retry Queue functions ─────────────────────────────────────────

export async function getWebhookRetryQueue(
  subscriptionId: string,
  options: { limit?: number } = {}
): Promise<WebhookRetryQueueEntry[]> {
  const { data, error } = await supabase
    .from('webhook_retry_queue')
    .select(`${WEBHOOK_RETRY_COLS}, webhook_deliveries!inner(webhook_subscription_id)`)
    .eq('webhook_deliveries.webhook_subscription_id', subscriptionId)
    .order('next_retry_at', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookRetryRow[]).map(mapWebhookRetry);
}

export async function getPendingRetries(options: { limit?: number } = {}): Promise<WebhookRetryQueueEntry[]> {
  const { data, error } = await supabase
    .from('webhook_retry_queue')
    .select(WEBHOOK_RETRY_COLS)
    .order('next_retry_at', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WebhookRetryRow[]).map(mapWebhookRetry);
}

// ── Integration Endpoint functions ────────────────────────────────────────

export async function getIntegrationEndpoints(options: {
  isActive?: boolean;
  limit?: number;
} = {}): Promise<IntegrationEndpoint[]> {
  let q = supabase
    .from('integration_endpoints')
    .select(INTEGRATION_EP_COLS);

  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);

  const { data, error } = await q
    .order('service_name', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as IntegrationEpRow[]).map(mapIntegrationEp);
}

export async function getIntegrationEndpoint(id: string): Promise<IntegrationEndpoint | null> {
  const { data, error } = await supabase
    .from('integration_endpoints')
    .select(INTEGRATION_EP_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapIntegrationEp(data as IntegrationEpRow) : null;
}

export async function getActiveIntegrations(): Promise<IntegrationEndpoint[]> {
  const { data, error } = await supabase
    .from('integration_endpoints')
    .select(INTEGRATION_EP_COLS)
    .eq('is_active', true)
    .order('service_name', { ascending: true });
  if (error) throw error;
  return (data as IntegrationEpRow[]).map(mapIntegrationEp);
}

export async function getIntegrationByServiceName(
  serviceName: string
): Promise<IntegrationEndpoint | null> {
  const { data, error } = await supabase
    .from('integration_endpoints')
    .select(INTEGRATION_EP_COLS)
    .eq('service_name', serviceName)
    .single();
  if (error) throw error;
  return data ? mapIntegrationEp(data as IntegrationEpRow) : null;
}
