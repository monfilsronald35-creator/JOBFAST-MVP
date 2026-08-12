import { supabase } from '../../lib/supabase';
import type {
  Conversation,
  ConversationMember,
  Message,
  MessageRead,
  MessageDelivery,
  MessageMention,
  MessageReaction,
  MessageEdit,
  PresenceStatus,
  TypingStatus,
  UserDevice,
  CallSession,
  CallParticipant,
  CallRecording,
  MessageAttachment,
  AttachmentScan,
  AttachmentVersion,
  MessageAiAnalysis,
  ConversationAiSummary,
  TranslationCache,
  ConversationKey,
  MessageAuditLog,
  MessageRetentionPolicy,
  ConversationTask,
  ConversationEvent,
  ConversationPoll,
  ConversationStatistics,
  MessageType,
  PresenceState,
} from '../../types/chat';

// Creating conversations (multi-member atomic insert) and managing call
// sessions (WebRTC signaling + recording) must go through backend/Edge Functions.
// Uploading attachments must go through backend to generate signed URLs and
// trigger antivirus scanning.
// AI analysis and translation requests require backend API key access.
// message_notification_queue is backend-only.

// ── Column constants (sensitive fields excluded) ───────────────────────────

const USER_DEVICE_COLS =
  'id, user_id, device_name, device_type, is_active, last_active_at, created_at';
// push_token excluded — security/PII

const CONV_KEY_COLS =
  'id, conversation_id, user_id, created_at';
// encrypted_key excluded — E2E key material, never sent over REST

const MSG_AUDIT_COLS =
  'id, message_id, actor_id, action, created_at';
// ip_address excluded — PII

const ATTACHMENT_SCAN_COLS =
  'id, attachment_id, scanner_name, is_safe, scanned_at';
// threat_details excluded — internal security info

const AI_ANALYSIS_COLS =
  'id, message_id, sentiment, is_flagged, suggested_replies, created_at';
// toxicity_score, spam_score excluded — internal moderation data

// ── Row types (snake_case) ─────────────────────────────────────────────────

type ConversationRow = {
  id: string;
  title: string | null;
  type: string;
  avatar_url: string | null;
  is_encrypted: boolean;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ConversationMemberRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  nickname: string | null;
  last_read_at: string;
  is_muted: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  joined_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  reply_to_id: string | null;
  type: string;
  content: string;
  status: string;
  is_edited: boolean;
  is_deleted: boolean;
  job_id: string | null;
  order_id: string | null;
  wallet_transaction_id: string | null;
  escrow_id: string | null;
  invoice_id: string | null;
  payment_intent_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type MessageReadRow = {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
};

type MessageDeliveryRow = {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at: string;
};

type MessageMentionRow = {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
};

type MessageReactionRow = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

type MessageEditRow = {
  id: string;
  message_id: string;
  old_content: string;
  new_content: string;
  edited_at: string;
};

type PresenceStatusRow = {
  user_id: string;
  state: string;
  custom_status: string | null;
  last_seen_at: string;
  updated_at: string;
};

type TypingStatusRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
};

type UserDeviceRow = {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
};

type CallSessionRow = {
  id: string;
  conversation_id: string | null;
  initiator_id: string;
  type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  metadata: Record<string, unknown>;
};

type CallParticipantRow = {
  id: string;
  call_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  has_video: boolean;
  is_screen_sharing: boolean;
};

type CallRecordingRow = {
  id: string;
  call_id: string;
  file_url: string;
  file_size: number | null;
  duration_seconds: number | null;
  created_at: string;
};

type MessageAttachmentRow = {
  id: string;
  message_id: string;
  file_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AttachmentScanRow = {
  id: string;
  attachment_id: string;
  scanner_name: string;
  is_safe: boolean;
  scanned_at: string;
};

type AttachmentVersionRow = {
  id: string;
  attachment_id: string;
  version_number: number;
  file_url: string;
  created_at: string;
};

type MessageAiAnalysisRow = {
  id: string;
  message_id: string;
  sentiment: string | null;
  is_flagged: boolean;
  suggested_replies: string[];
  created_at: string;
};

type ConversationAiSummaryRow = {
  id: string;
  conversation_id: string;
  summary_text: string;
  key_action_items: unknown[];
  generated_at: string;
};

type TranslationCacheRow = {
  id: string;
  message_id: string;
  target_language: string;
  translated_text: string;
  created_at: string;
};

type ConversationKeyRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
};

type MessageAuditLogRow = {
  id: string;
  message_id: string | null;
  actor_id: string;
  action: string;
  created_at: string;
};

type MessageRetentionPolicyRow = {
  id: string;
  conversation_id: string | null;
  retention_days: number;
  auto_delete: boolean;
  updated_at: string;
};

type ConversationTaskRow = {
  id: string;
  conversation_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
};

type ConversationEventRow = {
  id: string;
  conversation_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
};

type ConversationPollRow = {
  id: string;
  conversation_id: string;
  creator_id: string;
  question: string;
  options: unknown[];
  is_closed: boolean;
  created_at: string;
};

type ConversationStatisticsRow = {
  conversation_id: string;
  total_messages: number;
  total_calls: number;
  average_response_time_seconds: number;
  last_activity_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapConversation(r: ConversationRow): Conversation {
  return {
    id: r.id,
    title: r.title,
    type: r.type as Conversation['type'],
    avatarUrl: r.avatar_url,
    isEncrypted: r.is_encrypted,
    isArchived: r.is_archived,
    metadata: r.metadata,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMember(r: ConversationMemberRow): ConversationMember {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    userId: r.user_id,
    role: r.role,
    nickname: r.nickname,
    lastReadAt: r.last_read_at,
    isMuted: r.is_muted,
    isPinned: r.is_pinned,
    isHidden: r.is_hidden,
    joinedAt: r.joined_at,
  };
}

function mapMessage(r: MessageRow): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    replyToId: r.reply_to_id,
    type: r.type as Message['type'],
    content: r.content,
    status: r.status as Message['status'],
    isEdited: r.is_edited,
    isDeleted: r.is_deleted,
    jobId: r.job_id,
    orderId: r.order_id,
    walletTransactionId: r.wallet_transaction_id,
    escrowId: r.escrow_id,
    invoiceId: r.invoice_id,
    paymentIntentId: r.payment_intent_id,
    metadata: r.metadata,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMessageRead(r: MessageReadRow): MessageRead {
  return { id: r.id, messageId: r.message_id, userId: r.user_id, readAt: r.read_at };
}

function mapMessageDelivery(r: MessageDeliveryRow): MessageDelivery {
  return { id: r.id, messageId: r.message_id, userId: r.user_id, deliveredAt: r.delivered_at };
}

function mapMention(r: MessageMentionRow): MessageMention {
  return { id: r.id, messageId: r.message_id, userId: r.user_id, createdAt: r.created_at };
}

function mapReaction(r: MessageReactionRow): MessageReaction {
  return { id: r.id, messageId: r.message_id, userId: r.user_id, emoji: r.emoji, createdAt: r.created_at };
}

function mapMessageEdit(r: MessageEditRow): MessageEdit {
  return { id: r.id, messageId: r.message_id, oldContent: r.old_content, newContent: r.new_content, editedAt: r.edited_at };
}

function mapPresence(r: PresenceStatusRow): PresenceStatus {
  return {
    userId: r.user_id,
    state: r.state as PresenceStatus['state'],
    customStatus: r.custom_status,
    lastSeenAt: r.last_seen_at,
    updatedAt: r.updated_at,
  };
}

function mapTyping(r: TypingStatusRow): TypingStatus {
  return { id: r.id, conversationId: r.conversation_id, userId: r.user_id, isTyping: r.is_typing, updatedAt: r.updated_at };
}

function mapDevice(r: UserDeviceRow): UserDevice {
  return { id: r.id, userId: r.user_id, deviceName: r.device_name, deviceType: r.device_type, isActive: r.is_active, lastActiveAt: r.last_active_at, createdAt: r.created_at };
}

function mapCallSession(r: CallSessionRow): CallSession {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    initiatorId: r.initiator_id,
    type: r.type as CallSession['type'],
    status: r.status as CallSession['status'],
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
    metadata: r.metadata,
  };
}

function mapCallParticipant(r: CallParticipantRow): CallParticipant {
  return { id: r.id, callId: r.call_id, userId: r.user_id, joinedAt: r.joined_at, leftAt: r.left_at, isMuted: r.is_muted, hasVideo: r.has_video, isScreenSharing: r.is_screen_sharing };
}

function mapCallRecording(r: CallRecordingRow): CallRecording {
  return { id: r.id, callId: r.call_id, fileUrl: r.file_url, fileSize: r.file_size, durationSeconds: r.duration_seconds, createdAt: r.created_at };
}

function mapAttachment(r: MessageAttachmentRow): MessageAttachment {
  return { id: r.id, messageId: r.message_id, fileType: r.file_type, fileUrl: r.file_url, fileName: r.file_name, fileSize: r.file_size, mimeType: r.mime_type, thumbnailUrl: r.thumbnail_url, metadata: r.metadata, createdAt: r.created_at };
}

function mapAttachmentScan(r: AttachmentScanRow): AttachmentScan {
  return { id: r.id, attachmentId: r.attachment_id, scannerName: r.scanner_name, isSafe: r.is_safe, scannedAt: r.scanned_at };
}

function mapAttachmentVersion(r: AttachmentVersionRow): AttachmentVersion {
  return { id: r.id, attachmentId: r.attachment_id, versionNumber: r.version_number, fileUrl: r.file_url, createdAt: r.created_at };
}

function mapAiAnalysis(r: MessageAiAnalysisRow): MessageAiAnalysis {
  return { id: r.id, messageId: r.message_id, sentiment: r.sentiment, isFlagged: r.is_flagged, suggestedReplies: r.suggested_replies, createdAt: r.created_at };
}

function mapAiSummary(r: ConversationAiSummaryRow): ConversationAiSummary {
  return { id: r.id, conversationId: r.conversation_id, summaryText: r.summary_text, keyActionItems: r.key_action_items, generatedAt: r.generated_at };
}

function mapTranslation(r: TranslationCacheRow): TranslationCache {
  return { id: r.id, messageId: r.message_id, targetLanguage: r.target_language, translatedText: r.translated_text, createdAt: r.created_at };
}

function mapConvKey(r: ConversationKeyRow): ConversationKey {
  return { id: r.id, conversationId: r.conversation_id, userId: r.user_id, createdAt: r.created_at };
}

function mapAuditLog(r: MessageAuditLogRow): MessageAuditLog {
  return { id: r.id, messageId: r.message_id, actorId: r.actor_id, action: r.action, createdAt: r.created_at };
}

function mapRetentionPolicy(r: MessageRetentionPolicyRow): MessageRetentionPolicy {
  return { id: r.id, conversationId: r.conversation_id, retentionDays: r.retention_days, autoDelete: r.auto_delete, updatedAt: r.updated_at };
}

function mapTask(r: ConversationTaskRow): ConversationTask {
  return { id: r.id, conversationId: r.conversation_id, creatorId: r.creator_id, title: r.title, description: r.description, status: r.status, dueDate: r.due_date, assignedTo: r.assigned_to, createdAt: r.created_at };
}

function mapEvent(r: ConversationEventRow): ConversationEvent {
  return { id: r.id, conversationId: r.conversation_id, creatorId: r.creator_id, title: r.title, description: r.description, startTime: r.start_time, endTime: r.end_time, createdAt: r.created_at };
}

function mapPoll(r: ConversationPollRow): ConversationPoll {
  return { id: r.id, conversationId: r.conversation_id, creatorId: r.creator_id, question: r.question, options: r.options, isClosed: r.is_closed, createdAt: r.created_at };
}

function mapStats(r: ConversationStatisticsRow): ConversationStatistics {
  return { conversationId: r.conversation_id, totalMessages: r.total_messages, totalCalls: r.total_calls, averageResponseTimeSeconds: r.average_response_time_seconds, lastActivityAt: r.last_activity_at };
}

// ================================================================
// === Conversations
// ================================================================

// RLS policy filters to only conversations where auth.uid() is a member.
export async function getMyConversations(
  includeArchived = false
): Promise<Conversation[]> {
  let q = supabase
    .from('conversations')
    .select('*');

  if (!includeArchived) q = q.eq('is_archived', false);

  const { data, error } = await q.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as ConversationRow[]).map(mapConversation);
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConversation(data as ConversationRow) : null;
}

export async function getConversationMembers(
  conversationId: string
): Promise<ConversationMember[]> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data as ConversationMemberRow[]).map(mapMember);
}

export async function getMyMembership(
  conversationId: string
): Promise<ConversationMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMember(data as ConversationMemberRow) : null;
}

// ================================================================
// === Messages
// ================================================================

// Creating conversations (multi-step atomic insert of conversation +
// members) and editing/deleting messages (audit trail insert + message
// update must be atomic) must go through backend/Edge Functions.

export async function getMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {}
): Promise<Message[]> {
  let q = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId);

  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as MessageRow[]).map(mapMessage).reverse();
}

export async function getMessage(
  messageId: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMessage(data as MessageRow) : null;
}

export async function sendTextMessage(
  conversationId: string,
  content: string,
  options: { replyToId?: string; type?: MessageType } = {}
): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      type: options.type ?? 'text',
      reply_to_id: options.replyToId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMessage(data as MessageRow);
}

export async function getMessageEdits(
  messageId: string
): Promise<MessageEdit[]> {
  const { data, error } = await supabase
    .from('message_edits')
    .select('*')
    .eq('message_id', messageId)
    .order('edited_at', { ascending: true });
  if (error) throw error;
  return (data as MessageEditRow[]).map(mapMessageEdit);
}

// ================================================================
// === Read Receipts & Deliveries
// ================================================================

export async function markMessageRead(messageId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('message_reads')
    .upsert(
      { message_id: messageId, user_id: user.id },
      { onConflict: 'message_id,user_id' }
    );
  if (error) throw error;
}

export async function getMessageReads(
  messageId: string
): Promise<MessageRead[]> {
  const { data, error } = await supabase
    .from('message_reads')
    .select('*')
    .eq('message_id', messageId)
    .order('read_at', { ascending: true });
  if (error) throw error;
  return (data as MessageReadRow[]).map(mapMessageRead);
}

export async function getMessageDeliveries(
  messageId: string
): Promise<MessageDelivery[]> {
  const { data, error } = await supabase
    .from('message_deliveries')
    .select('*')
    .eq('message_id', messageId);
  if (error) throw error;
  return (data as MessageDeliveryRow[]).map(mapMessageDelivery);
}

// ================================================================
// === Mentions
// ================================================================

export async function getMyMentions(
  conversationId?: string
): Promise<MessageMention[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('message_mentions')
    .select('*')
    .eq('user_id', user.id);

  if (conversationId) {
    // Filter via joined message
    q = q.eq('message_id', conversationId);
  }

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MessageMentionRow[]).map(mapMention);
}

// ================================================================
// === Reactions
// ================================================================

export async function getMessageReactions(
  messageId: string
): Promise<MessageReaction[]> {
  const { data, error } = await supabase
    .from('message_reactions')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MessageReactionRow[]).map(mapReaction);
}

export async function addReaction(
  messageId: string,
  emoji: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('message_reactions')
    .upsert(
      { message_id: messageId, user_id: user.id, emoji },
      { onConflict: 'message_id,user_id,emoji' }
    );
  if (error) throw error;
}

export async function removeReaction(
  messageId: string,
  emoji: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji);
  if (error) throw error;
}

// ================================================================
// === Presence & Typing
// ================================================================

export async function getPresence(
  userId: string
): Promise<PresenceStatus | null> {
  const { data, error } = await supabase
    .from('presence_status')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPresence(data as PresenceStatusRow) : null;
}

export async function updateMyPresence(
  state: PresenceState,
  customStatus?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('presence_status')
    .upsert(
      {
        user_id: user.id,
        state,
        custom_status: customStatus ?? null,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function getTypingUsers(
  conversationId: string
): Promise<TypingStatus[]> {
  const { data, error } = await supabase
    .from('typing_status')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_typing', true);
  if (error) throw error;
  return (data as TypingStatusRow[]).map(mapTyping);
}

export async function setTypingStatus(
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('typing_status')
    .upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id,user_id' }
    );
  if (error) throw error;
}

// ================================================================
// === Devices
// ================================================================

// Device registration (push token storage) must go through backend to
// validate and encrypt the push token before storage.

export async function getMyDevices(): Promise<UserDevice[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_devices')
    .select(USER_DEVICE_COLS)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('last_active_at', { ascending: false });
  if (error) throw error;
  return (data as UserDeviceRow[]).map(mapDevice);
}

// ================================================================
// === Calls & WebRTC
// ================================================================

// Call initiation, WebRTC signaling, and recording management must go
// through backend. Frontend reads call history only.

export async function getCallSession(
  callId: string
): Promise<CallSession | null> {
  const { data, error } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('id', callId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCallSession(data as CallSessionRow) : null;
}

export async function getMyRecentCalls(
  limit = 20
): Promise<CallSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Calls where user was initiator or participant
  const { data, error } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('initiator_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as CallSessionRow[]).map(mapCallSession);
}

export async function getCallParticipants(
  callId: string
): Promise<CallParticipant[]> {
  const { data, error } = await supabase
    .from('call_participants')
    .select('*')
    .eq('call_id', callId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data as CallParticipantRow[]).map(mapCallParticipant);
}

export async function getCallRecordings(
  callId: string
): Promise<CallRecording[]> {
  const { data, error } = await supabase
    .from('call_recordings')
    .select('*')
    .eq('call_id', callId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as CallRecordingRow[]).map(mapCallRecording);
}

// ================================================================
// === Attachments & Media
// ================================================================

// Uploading attachments must go through backend (signed URL + virus scan).

export async function getMessageAttachments(
  messageId: string
): Promise<MessageAttachment[]> {
  const { data, error } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as MessageAttachmentRow[]).map(mapAttachment);
}

export async function getAttachmentScan(
  attachmentId: string
): Promise<AttachmentScan | null> {
  const { data, error } = await supabase
    .from('attachment_scans')
    .select(ATTACHMENT_SCAN_COLS)
    .eq('attachment_id', attachmentId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAttachmentScan(data as AttachmentScanRow) : null;
}

export async function getAttachmentVersions(
  attachmentId: string
): Promise<AttachmentVersion[]> {
  const { data, error } = await supabase
    .from('attachment_versions')
    .select('*')
    .eq('attachment_id', attachmentId)
    .order('version_number', { ascending: true });
  if (error) throw error;
  return (data as AttachmentVersionRow[]).map(mapAttachmentVersion);
}

// ================================================================
// === AI Analysis & Translation
// ================================================================

// AI analysis generation and translation requests require backend API
// access. Frontend reads cached results only.

export async function getMessageAiAnalysis(
  messageId: string
): Promise<MessageAiAnalysis | null> {
  const { data, error } = await supabase
    .from('message_ai_analysis')
    .select(AI_ANALYSIS_COLS)
    .eq('message_id', messageId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiAnalysis(data as MessageAiAnalysisRow) : null;
}

export async function getConversationAiSummary(
  conversationId: string
): Promise<ConversationAiSummary | null> {
  const { data, error } = await supabase
    .from('conversation_ai_summary')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAiSummary(data as ConversationAiSummaryRow) : null;
}

export async function getMessageTranslation(
  messageId: string,
  targetLanguage: string
): Promise<TranslationCache | null> {
  const { data, error } = await supabase
    .from('translation_cache')
    .select('*')
    .eq('message_id', messageId)
    .eq('target_language', targetLanguage)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTranslation(data as TranslationCacheRow) : null;
}

// ================================================================
// === Security & Retention
// ================================================================

// encrypted_key is never returned — E2E key exchange is handled by
// backend using a proper key distribution protocol.

export async function getMyConversationKey(
  conversationId: string
): Promise<ConversationKey | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('conversation_keys')
    .select(CONV_KEY_COLS)
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConvKey(data as ConversationKeyRow) : null;
}

export async function getRetentionPolicy(
  conversationId: string
): Promise<MessageRetentionPolicy | null> {
  const { data, error } = await supabase
    .from('message_retention_policies')
    .select('*')
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRetentionPolicy(data as MessageRetentionPolicyRow) : null;
}

export async function getMessageAuditLogs(
  messageId: string
): Promise<MessageAuditLog[]> {
  const { data, error } = await supabase
    .from('message_audit_logs')
    .select(MSG_AUDIT_COLS)
    .eq('message_id', messageId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MessageAuditLogRow[]).map(mapAuditLog);
}

// ================================================================
// === Collaboration Tools
// ================================================================

export async function getConversationTasks(
  conversationId: string,
  status?: string
): Promise<ConversationTask[]> {
  let q = supabase
    .from('conversation_tasks')
    .select('*')
    .eq('conversation_id', conversationId);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ConversationTaskRow[]).map(mapTask);
}

export async function createTask(
  conversationId: string,
  input: {
    title: string;
    description?: string;
    dueDate?: string;
    assignedTo?: string;
  }
): Promise<ConversationTask> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversation_tasks')
    .insert({
      conversation_id: conversationId,
      creator_id: user.id,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      assigned_to: input.assignedTo ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTask(data as ConversationTaskRow);
}

export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  const { error } = await supabase
    .from('conversation_tasks')
    .update({ status })
    .eq('id', taskId);
  if (error) throw error;
}

export async function getConversationEvents(
  conversationId: string
): Promise<ConversationEvent[]> {
  const { data, error } = await supabase
    .from('conversation_events')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data as ConversationEventRow[]).map(mapEvent);
}

export async function createEvent(
  conversationId: string,
  input: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  }
): Promise<ConversationEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversation_events')
    .insert({
      conversation_id: conversationId,
      creator_id: user.id,
      title: input.title,
      description: input.description ?? null,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapEvent(data as ConversationEventRow);
}

export async function getConversationPolls(
  conversationId: string,
  openOnly = false
): Promise<ConversationPoll[]> {
  let q = supabase
    .from('conversation_polls')
    .select('*')
    .eq('conversation_id', conversationId);

  if (openOnly) q = q.eq('is_closed', false);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ConversationPollRow[]).map(mapPoll);
}

// ================================================================
// === Statistics
// ================================================================

export async function getConversationStats(
  conversationId: string
): Promise<ConversationStatistics | null> {
  const { data, error } = await supabase
    .from('conversation_statistics')
    .select('*')
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStats(data as ConversationStatisticsRow) : null;
}
