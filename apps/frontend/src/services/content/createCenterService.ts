import { supabase } from '../../lib/supabase';
import type {
  CreateDraft,
  DraftStatus,
  ApprovalStatus,
  ModerationStatus,
  SyncStatus,
  CreateMedia,
  MediaProcessingStatus,
  CreateAiGeneration,
} from '../../types/createCenter';

// Backend-only tables — zero frontend code (2 of 5 tables):
//   create_workflows    — internal CMS state machine configuration
//   create_event_outbox — outbox pattern; payload consumed by backend event processors

// ── Column constants ───────────────────────────────────────────────────────

const DRAFT_COLS = [
  'id', 'user_id', 'content_type', 'template_version', 'form_data',
  'approval_status', 'moderation_status',
  'locked_by', 'locked_until',
  'published_at', 'expired_at', 'visibility_start', 'visibility_end',
  'publish_targets', 'status',
  'sync_status', 'last_sync_at', 'updated_at',
].join(', ');
// fraud_score excluded — NEVER (internal fraud detection score; exposing enables gaming)
// device_id excluded — internal sync device tracking identifier
// client_version excluded — internal client version tracking

const MEDIA_COLS = 'id, draft_id, file_url, processing_status';
// storage_provider excluded — reveals internal cloud infrastructure provider
// metadata excluded — internal processing pipeline state

const AI_GEN_COLS = 'id, draft_id, model_name, provider, output_payload';
// latency_ms excluded — internal performance metric
// tokens_used excluded — NEVER (reveals API billing cost)
// prompt_version excluded — internal prompt engineering; exposing enables reverse-engineering

// ── Row types ─────────────────────────────────────────────────────────────

type DraftRow = {
  id: string;
  user_id: string | null;
  content_type: string;
  template_version: number;
  form_data: Record<string, unknown>;
  approval_status: ApprovalStatus;
  moderation_status: ModerationStatus;
  locked_by: string | null;
  locked_until: string | null;
  published_at: string | null;
  expired_at: string | null;
  visibility_start: string | null;
  visibility_end: string | null;
  publish_targets: string[];
  status: DraftStatus;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  updated_at: string;
};

type MediaRow = {
  id: string;
  draft_id: string | null;
  file_url: string;
  processing_status: MediaProcessingStatus;
};

type AiGenRow = {
  id: string;
  draft_id: string | null;
  model_name: string | null;
  provider: string | null;
  output_payload: Record<string, unknown> | null;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapDraft(r: DraftRow): CreateDraft {
  return {
    id: r.id,
    userId: r.user_id,
    contentType: r.content_type,
    templateVersion: r.template_version,
    formData: r.form_data,
    approvalStatus: r.approval_status,
    moderationStatus: r.moderation_status,
    lockedBy: r.locked_by,
    lockedUntil: r.locked_until,
    publishedAt: r.published_at,
    expiredAt: r.expired_at,
    visibilityStart: r.visibility_start,
    visibilityEnd: r.visibility_end,
    publishTargets: r.publish_targets,
    status: r.status,
    syncStatus: r.sync_status,
    lastSyncAt: r.last_sync_at,
    updatedAt: r.updated_at,
  };
}

function mapMedia(r: MediaRow): CreateMedia {
  return {
    id: r.id,
    draftId: r.draft_id,
    fileUrl: r.file_url,
    processingStatus: r.processing_status,
  };
}

function mapAiGen(r: AiGenRow): CreateAiGeneration {
  return {
    id: r.id,
    draftId: r.draft_id,
    modelName: r.model_name,
    provider: r.provider,
    outputPayload: r.output_payload,
  };
}

// ── Draft functions ───────────────────────────────────────────────────────

export async function getMyDrafts(options: {
  status?: DraftStatus;
  contentType?: string;
  approvalStatus?: ApprovalStatus;
  limit?: number;
  before?: string;
} = {}): Promise<CreateDraft[]> {
  let q = supabase
    .from('create_drafts')
    .select(DRAFT_COLS);

  if (options.status) q = q.eq('status', options.status);
  if (options.contentType) q = q.eq('content_type', options.contentType);
  if (options.approvalStatus) q = q.eq('approval_status', options.approvalStatus);
  if (options.before) q = q.lt('updated_at', options.before);

  const { data, error } = await q
    .order('updated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DraftRow[]).map(mapDraft);
}

export async function getDraft(id: string): Promise<CreateDraft | null> {
  const { data, error } = await supabase
    .from('create_drafts')
    .select(DRAFT_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapDraft(data as DraftRow) : null;
}

export async function getMyPublishedDrafts(options: {
  contentType?: string;
  limit?: number;
} = {}): Promise<CreateDraft[]> {
  let q = supabase
    .from('create_drafts')
    .select(DRAFT_COLS)
    .eq('status', 'published');

  if (options.contentType) q = q.eq('content_type', options.contentType);

  const { data, error } = await q
    .order('published_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DraftRow[]).map(mapDraft);
}

export async function getPendingApprovalDrafts(options: {
  contentType?: string;
  limit?: number;
} = {}): Promise<CreateDraft[]> {
  let q = supabase
    .from('create_drafts')
    .select(DRAFT_COLS)
    .eq('approval_status', 'pending')
    .eq('status', 'review');

  if (options.contentType) q = q.eq('content_type', options.contentType);

  const { data, error } = await q
    .order('updated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DraftRow[]).map(mapDraft);
}

export async function getPendingSyncDrafts(): Promise<CreateDraft[]> {
  const { data, error } = await supabase
    .from('create_drafts')
    .select(DRAFT_COLS)
    .in('sync_status', ['pending', 'conflict'])
    .order('last_sync_at', { ascending: true });
  if (error) throw error;
  return (data as DraftRow[]).map(mapDraft);
}

// ── Media functions ───────────────────────────────────────────────────────

export async function getDraftMedia(draftId: string): Promise<CreateMedia[]> {
  const { data, error } = await supabase
    .from('create_media')
    .select(MEDIA_COLS)
    .eq('draft_id', draftId);
  if (error) throw error;
  return (data as MediaRow[]).map(mapMedia);
}

export async function getMediaItem(id: string): Promise<CreateMedia | null> {
  const { data, error } = await supabase
    .from('create_media')
    .select(MEDIA_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapMedia(data as MediaRow) : null;
}

export async function getOptimizedMedia(draftId: string): Promise<CreateMedia[]> {
  const { data, error } = await supabase
    .from('create_media')
    .select(MEDIA_COLS)
    .eq('draft_id', draftId)
    .eq('processing_status', 'optimized');
  if (error) throw error;
  return (data as MediaRow[]).map(mapMedia);
}

export async function getMediaByProcessingStatus(
  draftId: string,
  processingStatus: MediaProcessingStatus
): Promise<CreateMedia[]> {
  const { data, error } = await supabase
    .from('create_media')
    .select(MEDIA_COLS)
    .eq('draft_id', draftId)
    .eq('processing_status', processingStatus);
  if (error) throw error;
  return (data as MediaRow[]).map(mapMedia);
}

// ── AI Generation functions ───────────────────────────────────────────────

export async function getDraftAiGenerations(draftId: string): Promise<CreateAiGeneration[]> {
  const { data, error } = await supabase
    .from('create_ai_generations')
    .select(AI_GEN_COLS)
    .eq('draft_id', draftId);
  if (error) throw error;
  return (data as AiGenRow[]).map(mapAiGen);
}

export async function getAiGeneration(id: string): Promise<CreateAiGeneration | null> {
  const { data, error } = await supabase
    .from('create_ai_generations')
    .select(AI_GEN_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapAiGen(data as AiGenRow) : null;
}

export async function getAiGenerationsByProvider(
  draftId: string,
  provider: string
): Promise<CreateAiGeneration[]> {
  const { data, error } = await supabase
    .from('create_ai_generations')
    .select(AI_GEN_COLS)
    .eq('draft_id', draftId)
    .eq('provider', provider);
  if (error) throw error;
  return (data as AiGenRow[]).map(mapAiGen);
}
