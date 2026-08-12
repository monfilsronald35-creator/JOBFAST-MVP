// ── Create Center Engine V3 ───────────────────────────────────────────────
//
// Backend-only tables (zero frontend types or functions):
//   create_workflows    — internal CMS state machine; step_sequence defines approval workflow logic
//   create_event_outbox — outbox pattern is backend-internal; payload consumed by backend processors
//
// NEVER fields:
//   create_drafts.fraud_score       — internal fraud detection score; exposing enables gaming
//   create_ai_generations.tokens_used — internal API billing cost; must not be exposed to clients
//
// Excluded (non-NEVER, still internal):
//   create_drafts.device_id         — internal sync device tracking identifier
//   create_drafts.client_version    — internal client version tracking
//   create_media.storage_provider   — reveals internal cloud infrastructure provider
//   create_media.metadata           — internal processing pipeline state
//   create_ai_generations.latency_ms    — internal performance metric
//   create_ai_generations.prompt_version — internal prompt engineering; exposing enables reverse-engineering

// ── Create Drafts ─────────────────────────────────────────────────────────

export const DRAFT_STATUSES = [
  'draft', 'review', 'approved', 'published', 'rejected', 'expired',
] as const;
export type DraftStatus = typeof DRAFT_STATUSES[number];

export const APPROVAL_STATUSES = [
  'pending', 'approved', 'rejected',
] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const MODERATION_STATUSES = [
  'pending', 'approved', 'flagged', 'removed',
] as const;
export type ModerationStatus = typeof MODERATION_STATUSES[number];

export const SYNC_STATUSES = [
  'synced', 'pending', 'conflict', 'failed',
] as const;
export type SyncStatus = typeof SYNC_STATUSES[number];

export interface CreateDraft {
  id: string;
  userId: string | null;
  contentType: string;
  templateVersion: number;
  formData: Record<string, unknown>;
  approvalStatus: ApprovalStatus;
  moderationStatus: ModerationStatus;
  lockedBy: string | null;
  lockedUntil: string | null;
  publishedAt: string | null;
  expiredAt: string | null;
  visibilityStart: string | null;
  visibilityEnd: string | null;
  publishTargets: string[];
  status: DraftStatus;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  updatedAt: string;
  // fraud_score excluded — NEVER (internal fraud detection score; exposing enables gaming)
  // device_id excluded — internal sync device tracking identifier
  // client_version excluded — internal client version tracking
}

// ── Create Media ──────────────────────────────────────────────────────────

export const MEDIA_PROCESSING_STATUSES = [
  'uploaded', 'processing', 'optimized', 'failed',
] as const;
export type MediaProcessingStatus = typeof MEDIA_PROCESSING_STATUSES[number];

export interface CreateMedia {
  id: string;
  draftId: string | null;
  fileUrl: string;
  processingStatus: MediaProcessingStatus;
  // storage_provider excluded — reveals internal cloud infrastructure provider
  // metadata excluded — internal processing pipeline state
}

// ── AI Generations ────────────────────────────────────────────────────────

export interface CreateAiGeneration {
  id: string;
  draftId: string | null;
  modelName: string | null;
  provider: string | null;
  outputPayload: Record<string, unknown> | null;
  // latency_ms excluded — internal performance metric
  // tokens_used excluded — NEVER (reveals API billing cost; internal)
  // prompt_version excluded — internal prompt engineering; exposing enables reverse-engineering
}
