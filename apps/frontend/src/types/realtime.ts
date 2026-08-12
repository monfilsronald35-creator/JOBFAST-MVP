// ── Migration 021: Global Realtime Infrastructure Platform ────────────────
//
// Realtime domain classification:
//   25 of 35 tables are BACKEND ONLY — internal infrastructure must never be queryable from frontend.
//   Exposing message queues, job payloads, AI prioritization scores, consensus hashes, or
//   sync machinery would reveal system internals and enable calibrated attacks.
//
// Backend-only tables (zero frontend types or functions):
//   realtime_connections          — client_ip (PII/NEVER); auth_token_hash (NEVER); raw socket tracking
//   sync_queue                    — payload_data_json contains arbitrary table data; internal sync machinery
//   background_jobs               — job_payload_json internal; results surface via notifications
//   event_bus                     — pure internal pub/sub infrastructure
//   webhook_events                — http_headers_json may contain auth/signing headers
//   event_subscriptions           — internal backend pub/sub routing config
//   message_queue                 — message_body_json arbitrary; internal
//   dead_letter_queue             — failed_payload_json arbitrary; internal ops
//   job_schedules                 — cron_expression + job_payload_json internal backend config
//   job_execution_history         — output_payload_json arbitrary; internal
//   worker_nodes                  — node_ip is infrastructure IP; CPU/memory metrics internal
//   edge_sync_nodes               — edge_endpoint_url reveals infrastructure topology
//   conflict_resolution_logs      — server/client/resolved state JSONBs contain arbitrary table data
//   cache_invalidation_events     — internal cache management
//   distributed_locks             — internal concurrency control
//   integration_tokens            — encrypted_token_payload (NEVER); refresh_token_payload (NEVER)
//   event_transformations         — mapping_rules_json internal pipeline config
//   integration_audit_logs        — immutable_proof_hash internal; request_payload_summary internal
//   ai_event_prioritization       — priority_score (NEVER: AI scoring); ai_adjustment_rules_json reveals AI logic
//   global_event_replication      — internal event replication infrastructure
//   cross_region_sync             — internal network performance metrics
//   realtime_metrics              — internal system metrics (Prometheus-equivalent data)
//   connection_health             — internal connection health monitoring
//   event_replay_log              — replay_payload_json contains arbitrary event data
//   quantum_event_consensus       — consensus_hash (NEVER: 256-char); quantum_signature (NEVER: 512-char)

// ── Presence Sessions (own + others' online status) ───────────────────────

export const PRESENCE_STATUS_STATES = [
  'online', 'away', 'busy', 'offline', 'quantum_invisible', 'in_transit',
] as const;
export type PresenceStatusState = typeof PRESENCE_STATUS_STATES[number];

export interface PresenceSession {
  id: string;
  organizationId: string;
  userId: string;
  statusState: PresenceStatusState;
  customStatusText: string | null;
  currentActivity: string | null;
  clientPlatform: string;
  lastPingAt: string;
  sessionExpiresAt: string | null;
  createdAt: string;
}

// ── Location Updates (tracking drivers, deliveries, IoT assets) ───────────

export interface LocationUpdate {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  headingDegrees: number;
  speedMps: number;
  accuracyRadiusMeters: number;
  batteryLevelPct: number | null;
  capturedAt: string;
  createdAt: string;
}

// ── Realtime Channels (collaborative spaces) ──────────────────────────────

export const CHANNEL_TYPES = [
  'public', 'private', 'encrypted_quantum', 'broadcast',
] as const;
export type ChannelType = typeof CHANNEL_TYPES[number];

export interface RealtimeChannel {
  id: string;
  organizationId: string;
  channelName: string;
  channelType: ChannelType;
  maxMembers: number;
  isArchived: boolean;
  createdAt: string;
}

// ── Channel Members (own membership and role) ─────────────────────────────

export const CHANNEL_MEMBER_ROLES = [
  'owner', 'admin', 'participant', 'observer',
] as const;
export type ChannelMemberRole = typeof CHANNEL_MEMBER_ROLES[number];

export interface ChannelMember {
  id: string;
  organizationId: string;
  channelId: string;
  userId: string;
  memberRole: ChannelMemberRole;
  mutedUntil: string | null;
  joinedAt: string;
  createdAt: string;
}

// ── Stream Events (event history in a channel) ────────────────────────────

export interface StreamEvent {
  id: string;
  organizationId: string;
  channelId: string;
  eventPayloadJson: Record<string, unknown>;
  sequenceIndex: number;
  createdAt: string;
  // event_checksum excluded — internal content integrity hash; not needed by clients
}

// ── Offline Sync States (client sync version tracking) ────────────────────

export interface OfflineSyncState {
  id: string;
  organizationId: string;
  userId: string;
  entityName: string;
  lastSyncedVersion: number;
  clientLastSyncTimestamp: string | null;
  serverLastSyncTimestamp: string;
  createdAt: string;
}

// ── Webhook Subscriptions (own webhook configurations) ────────────────────

export interface WebhookSubscription {
  id: string;
  organizationId: string;
  endpointUrl: string;
  eventsList: string[];
  retryPolicyJson: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  // secret_token excluded — ABSOLUTE NEVER (HMAC signing secret; same classification as security_webhooks.secret_signature_key)
}

// ── Webhook Deliveries (delivery status for own webhooks) ─────────────────

export const WEBHOOK_DELIVERY_STATUSES = [
  'success', 'failed', 'timeout',
] as const;
export type WebhookDeliveryStatus = typeof WEBHOOK_DELIVERY_STATUSES[number];

export interface WebhookDelivery {
  id: string;
  organizationId: string;
  webhookSubscriptionId: string;
  responseStatusCode: number;
  responseBody: string | null;
  deliveryStatus: WebhookDeliveryStatus;
  latencyMs: number;
  deliveredAt: string;
  createdAt: string;
  // request_headers_json excluded — internal HTTP headers may contain computed auth signatures
}

// ── Webhook Retry Queue (pending retries for failed deliveries) ───────────

export interface WebhookRetryQueueEntry {
  id: string;
  organizationId: string;
  webhookDeliveryId: string;
  nextRetryAt: string;
  retryAttemptCount: number;
  maxRetryAttempts: number;
  lastErrorMessage: string | null;
  createdAt: string;
}

// ── Integration Endpoints (external service connection metadata) ───────────

export const AUTH_TYPES = [
  'bearer', 'api_key', 'oauth2', 'basic', 'quantum_signature',
] as const;
export type AuthType = typeof AUTH_TYPES[number];

export interface IntegrationEndpoint {
  id: string;
  organizationId: string;
  serviceName: string;
  baseUrl: string;
  authType: AuthType;
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
}
