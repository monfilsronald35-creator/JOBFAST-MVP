import { supabase } from '../../lib/supabase';
import type {
  ChatConversation,
  ChatConvType,
  ChatParticipant,
  ChatMessage,
  ChatMessageStatus,
  ChatContentType,
  ChatMessageEdit,
  ChatReaction,
  ChatPoll,
  ChatPollVote,
  ChatBookmark,
  ChatAttachment,
  ChatPresence,
  ChatPresenceStatus,
  ChatDevice,
  ChatDeliveryReceipt,
  ChatLiveLocation,
  ChatCall,
  ChatCallStatus,
  ChatCallParticipant,
  ChatAiAgent,
  ChatAiInsight,
  ChatNotification,
  ChatWebhook,
} from '../../types/chat';

// Backend-only tables — zero frontend code (6 of 25 tables):
//   chat_search_index    — embedding vector(1536) = NEVER; search_vector = internal FTS
//   chat_e2ee_keys       — one_time_pre_keys require atomic backend consume-and-delete; race-condition risk
//   chat_offline_queue   — internal delivery queue
//   chat_moderation_queue — internal content moderation
//   chat_audit_logs      — ip_address (NEVER: PII); security compliance data
//   chat_event_outbox    — outbox pattern = backend-internal

// ── Column constants ───────────────────────────────────────────────────────

const CONV_COLS = [
  'id', 'conversation_type', 'title', 'avatar_url', 'description',
  'context_type', 'context_id', 'listing_price', 'listing_currency', 'listing_status',
  'is_encrypted', 'encryption_algorithm', 'is_public', 'invite_link', 'max_participants',
  'settings', 'business_settings', 'created_at', 'updated_at',
].join(', ');
// key_version excluded — internal E2EE key rotation counter

const PARTICIPANT_COLS = [
  'id', 'conversation_id', 'user_id', 'role', 'permissions', 'is_admin', 'nickname',
  'joined_at', 'left_at', 'last_read_message_id', 'last_read_at',
  'mute_until', 'is_muted', 'is_pinned', 'is_archived', 'is_favorite',
  'wallpaper_url', 'notification_preferences',
].join(', ');

const MESSAGE_COLS = [
  'id', 'conversation_id', 'sender_id', 'parent_message_id',
  'forwarded_from_message_id', 'forwarded_from_user_id', 'forwarded_from_chat_id',
  'content_type', 'body', 'status', 'moderation_status',
  'client_message_id', 'is_encrypted', 'scheduled_for', 'is_scheduled',
  'created_at', 'updated_at',
].join(', ');
// spam_score, fraud_score, toxicity_score excluded — NEVER (AI moderation signals)
// device_id excluded — internal sync device tracking

const EDIT_COLS = 'id, message_id, original_body, new_body, edited_at';
const REACTION_COLS = 'id, message_id, user_id, emoji, created_at';
const POLL_COLS = 'id, message_id, question, options, is_multiple_choice, is_anonymous, expires_at, created_at';
const POLL_VOTE_COLS = 'id, poll_id, user_id, selected_option_index, created_at';
const BOOKMARK_COLS = 'id, user_id, message_id, note, created_at';

const ATTACHMENT_COLS = [
  'id', 'message_id', 'file_type', 'file_url', 'cdn_url', 'thumbnail_url',
  'file_name', 'file_size', 'mime_type', 'width', 'height', 'duration',
  'processing_status', 'created_at',
].join(', ');
// storage_provider excluded — internal cloud infrastructure
// ai_analysis_status, ai_labels excluded — NEVER (NSFW/malware detection signals)

const PRESENCE_COLS = 'user_id, status, device_type, platform, country, city, timezone, updated_at';
// region, socket_id, app_version, network_type, battery_level, last_heartbeat excluded — internal telemetry

const DEVICE_COLS = 'id, user_id, device_id, device_name, device_type, last_active_at';
// push_token excluded — ABSOLUTE NEVER (unauthorized push notification delivery)
// sync_cursor excluded — internal sync offset

const DELIVERY_COLS = 'message_id, user_id, delivered_at, read_at';
// device_id excluded — internal device routing

const LIVE_LOC_COLS = 'id, user_id, conversation_id, latitude, longitude, accuracy, expires_at, updated_at';

const CALL_COLS = 'id, conversation_id, initiator_id, call_type, status, started_at, ended_at';
// metadata excluded — may contain WebRTC ICE candidates / TURN server tokens

const CALL_PARTICIPANT_COLS = 'id, call_id, user_id, joined_at, left_at, status';
const AI_AGENT_COLS = 'id, conversation_id, agent_type, is_active';
// config excluded — NEVER (may contain system prompts, API keys)

const AI_INSIGHT_COLS = 'id, conversation_id, conversation_summary, language_detected, updated_at';
// translation_cache excluded — internal optimization cache
// sentiment, spam_score, fraud_score, toxicity_score excluded — AI behavioral signals / NEVER

const NOTIFICATION_COLS = 'id, user_id, title, body, type, payload, is_read, created_at';

const WEBHOOK_COLS = 'id, business_id, url, subscribed_events, is_active, created_at';
// secret excluded — ABSOLUTE NEVER (HMAC webhook signing secret)

// ── Row types ─────────────────────────────────────────────────────────────

type ConvRow = { id: string; conversation_type: ChatConvType; title: string | null; avatar_url: string | null; description: string | null; context_type: string | null; context_id: string | null; listing_price: number | null; listing_currency: string; listing_status: string; is_encrypted: boolean; encryption_algorithm: string; is_public: boolean; invite_link: string | null; max_participants: number; settings: Record<string, unknown>; business_settings: Record<string, unknown>; created_at: string; updated_at: string; };
type ParticipantRow = { id: string; conversation_id: string; user_id: string; role: ChatParticipant['role']; permissions: Record<string, unknown>; is_admin: boolean; nickname: string | null; joined_at: string; left_at: string | null; last_read_message_id: string | null; last_read_at: string; mute_until: string | null; is_muted: boolean; is_pinned: boolean; is_archived: boolean; is_favorite: boolean; wallpaper_url: string | null; notification_preferences: Record<string, unknown>; };
type MessageRow = { id: string; conversation_id: string; sender_id: string; parent_message_id: string | null; forwarded_from_message_id: string | null; forwarded_from_user_id: string | null; forwarded_from_chat_id: string | null; content_type: ChatContentType; body: string | null; status: ChatMessageStatus; moderation_status: ChatMessage['moderationStatus']; client_message_id: string | null; is_encrypted: boolean; scheduled_for: string | null; is_scheduled: boolean; created_at: string; updated_at: string; };
type EditRow = { id: string; message_id: string; original_body: string; new_body: string; edited_at: string; };
type ReactionRow = { id: string; message_id: string; user_id: string; emoji: string; created_at: string; };
type PollRow = { id: string; message_id: string; question: string; options: unknown[]; is_multiple_choice: boolean; is_anonymous: boolean; expires_at: string | null; created_at: string; };
type PollVoteRow = { id: string; poll_id: string; user_id: string; selected_option_index: number; created_at: string; };
type BookmarkRow = { id: string; user_id: string; message_id: string; note: string | null; created_at: string; };
type AttachmentRow = { id: string; message_id: string | null; file_type: ChatAttachment['fileType']; file_url: string; cdn_url: string | null; thumbnail_url: string | null; file_name: string | null; file_size: number | null; mime_type: string | null; width: number | null; height: number | null; duration: number | null; processing_status: ChatAttachment['processingStatus']; created_at: string; };
type PresenceRow = { user_id: string; status: ChatPresenceStatus; device_type: string | null; platform: string | null; country: string | null; city: string | null; timezone: string | null; updated_at: string; };
type DeviceRow = { id: string; user_id: string; device_id: string; device_name: string | null; device_type: string | null; last_active_at: string; };
type DeliveryRow = { message_id: string; user_id: string; delivered_at: string | null; read_at: string | null; };
type LiveLocRow = { id: string; user_id: string; conversation_id: string; latitude: number; longitude: number; accuracy: number | null; expires_at: string; updated_at: string; };
type CallRow = { id: string; conversation_id: string; initiator_id: string | null; call_type: ChatCall['callType']; status: ChatCallStatus; started_at: string; ended_at: string | null; };
type CallParticipantRow = { id: string; call_id: string; user_id: string; joined_at: string; left_at: string | null; status: string; };
type AiAgentRow = { id: string; conversation_id: string; agent_type: string | null; is_active: boolean; };
type AiInsightRow = { id: string; conversation_id: string; conversation_summary: string | null; language_detected: string | null; updated_at: string; };
type NotificationRow = { id: string; user_id: string; title: string | null; body: string | null; type: string | null; payload: Record<string, unknown>; is_read: boolean; created_at: string; };
type WebhookRow = { id: string; business_id: string | null; url: string; subscribed_events: unknown[]; is_active: boolean; created_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapConv = (r: ConvRow): ChatConversation => ({ id: r.id, conversationType: r.conversation_type, title: r.title, avatarUrl: r.avatar_url, description: r.description, contextType: r.context_type, contextId: r.context_id, listingPrice: r.listing_price, listingCurrency: r.listing_currency, listingStatus: r.listing_status, isEncrypted: r.is_encrypted, encryptionAlgorithm: r.encryption_algorithm, isPublic: r.is_public, inviteLink: r.invite_link, maxParticipants: r.max_participants, settings: r.settings, businessSettings: r.business_settings, createdAt: r.created_at, updatedAt: r.updated_at });
const mapParticipant = (r: ParticipantRow): ChatParticipant => ({ id: r.id, conversationId: r.conversation_id, userId: r.user_id, role: r.role, permissions: r.permissions, isAdmin: r.is_admin, nickname: r.nickname, joinedAt: r.joined_at, leftAt: r.left_at, lastReadMessageId: r.last_read_message_id, lastReadAt: r.last_read_at, muteUntil: r.mute_until, isMuted: r.is_muted, isPinned: r.is_pinned, isArchived: r.is_archived, isFavorite: r.is_favorite, wallpaperUrl: r.wallpaper_url, notificationPreferences: r.notification_preferences });
const mapMessage = (r: MessageRow): ChatMessage => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, parentMessageId: r.parent_message_id, forwardedFromMessageId: r.forwarded_from_message_id, forwardedFromUserId: r.forwarded_from_user_id, forwardedFromChatId: r.forwarded_from_chat_id, contentType: r.content_type, body: r.body, status: r.status, moderationStatus: r.moderation_status, clientMessageId: r.client_message_id, isEncrypted: r.is_encrypted, scheduledFor: r.scheduled_for, isScheduled: r.is_scheduled, createdAt: r.created_at, updatedAt: r.updated_at });
const mapEdit = (r: EditRow): ChatMessageEdit => ({ id: r.id, messageId: r.message_id, originalBody: r.original_body, newBody: r.new_body, editedAt: r.edited_at });
const mapReaction = (r: ReactionRow): ChatReaction => ({ id: r.id, messageId: r.message_id, userId: r.user_id, emoji: r.emoji, createdAt: r.created_at });
const mapPoll = (r: PollRow): ChatPoll => ({ id: r.id, messageId: r.message_id, question: r.question, options: r.options, isMultipleChoice: r.is_multiple_choice, isAnonymous: r.is_anonymous, expiresAt: r.expires_at, createdAt: r.created_at });
const mapPollVote = (r: PollVoteRow): ChatPollVote => ({ id: r.id, pollId: r.poll_id, userId: r.user_id, selectedOptionIndex: r.selected_option_index, createdAt: r.created_at });
const mapBookmark = (r: BookmarkRow): ChatBookmark => ({ id: r.id, userId: r.user_id, messageId: r.message_id, note: r.note, createdAt: r.created_at });
const mapAttachment = (r: AttachmentRow): ChatAttachment => ({ id: r.id, messageId: r.message_id, fileType: r.file_type, fileUrl: r.file_url, cdnUrl: r.cdn_url, thumbnailUrl: r.thumbnail_url, fileName: r.file_name, fileSize: r.file_size, mimeType: r.mime_type, width: r.width, height: r.height, duration: r.duration, processingStatus: r.processing_status, createdAt: r.created_at });
const mapPresence = (r: PresenceRow): ChatPresence => ({ userId: r.user_id, status: r.status, deviceType: r.device_type, platform: r.platform, country: r.country, city: r.city, timezone: r.timezone, updatedAt: r.updated_at });
const mapDevice = (r: DeviceRow): ChatDevice => ({ id: r.id, userId: r.user_id, deviceId: r.device_id, deviceName: r.device_name, deviceType: r.device_type, lastActiveAt: r.last_active_at });
const mapDelivery = (r: DeliveryRow): ChatDeliveryReceipt => ({ messageId: r.message_id, userId: r.user_id, deliveredAt: r.delivered_at, readAt: r.read_at });
const mapLiveLoc = (r: LiveLocRow): ChatLiveLocation => ({ id: r.id, userId: r.user_id, conversationId: r.conversation_id, latitude: r.latitude, longitude: r.longitude, accuracy: r.accuracy, expiresAt: r.expires_at, updatedAt: r.updated_at });
const mapCall = (r: CallRow): ChatCall => ({ id: r.id, conversationId: r.conversation_id, initiatorId: r.initiator_id, callType: r.call_type, status: r.status, startedAt: r.started_at, endedAt: r.ended_at });
const mapCallParticipant = (r: CallParticipantRow): ChatCallParticipant => ({ id: r.id, callId: r.call_id, userId: r.user_id, joinedAt: r.joined_at, leftAt: r.left_at, status: r.status });
const mapAiAgent = (r: AiAgentRow): ChatAiAgent => ({ id: r.id, conversationId: r.conversation_id, agentType: r.agent_type, isActive: r.is_active });
const mapAiInsight = (r: AiInsightRow): ChatAiInsight => ({ id: r.id, conversationId: r.conversation_id, conversationSummary: r.conversation_summary, languageDetected: r.language_detected, updatedAt: r.updated_at });
const mapNotification = (r: NotificationRow): ChatNotification => ({ id: r.id, userId: r.user_id, title: r.title, body: r.body, type: r.type, payload: r.payload, isRead: r.is_read, createdAt: r.created_at });
const mapWebhook = (r: WebhookRow): ChatWebhook => ({ id: r.id, businessId: r.business_id, url: r.url, subscribedEvents: r.subscribed_events, isActive: r.is_active, createdAt: r.created_at });

// ── Chat Conversation functions ───────────────────────────────────────────

export async function getMyConversations(options: {
  conversationType?: ChatConvType;
  isArchived?: boolean;
  limit?: number;
  before?: string;
} = {}): Promise<ChatConversation[]> {
  let q = supabase.from('chat_conversations').select(CONV_COLS);
  if (options.conversationType) q = q.eq('conversation_type', options.conversationType);
  if (options.before) q = q.lt('updated_at', options.before);
  const { data, error } = await q.order('updated_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ConvRow[]).map(mapConv);
}

export async function getConversation(id: string): Promise<ChatConversation | null> {
  const { data, error } = await supabase.from('chat_conversations').select(CONV_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapConv(data as ConvRow) : null;
}

export async function getPublicChannels(options: { limit?: number } = {}): Promise<ChatConversation[]> {
  const { data, error } = await supabase.from('chat_conversations').select(CONV_COLS).eq('conversation_type', 'channel').eq('is_public', true).order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ConvRow[]).map(mapConv);
}

// ── Chat Participant functions ─────────────────────────────────────────────

export async function getConversationParticipants(conversationId: string): Promise<ChatParticipant[]> {
  const { data, error } = await supabase.from('chat_participants').select(PARTICIPANT_COLS).eq('conversation_id', conversationId).is('left_at', null);
  if (error) throw error;
  return (data as ParticipantRow[]).map(mapParticipant);
}

export async function getMyParticipantRecord(conversationId: string): Promise<ChatParticipant | null> {
  const { data, error } = await supabase.from('chat_participants').select(PARTICIPANT_COLS).eq('conversation_id', conversationId).single();
  if (error) throw error;
  return data ? mapParticipant(data as ParticipantRow) : null;
}

export async function getMyPinnedConversations(): Promise<ChatParticipant[]> {
  const { data, error } = await supabase.from('chat_participants').select(PARTICIPANT_COLS).eq('is_pinned', true).eq('is_archived', false).order('conversation_id');
  if (error) throw error;
  return (data as ParticipantRow[]).map(mapParticipant);
}

// ── Chat Message functions ────────────────────────────────────────────────

export async function getConversationMessages(conversationId: string, options: { limit?: number; before?: string; contentType?: ChatContentType } = {}): Promise<ChatMessage[]> {
  let q = supabase.from('chat_messages').select(MESSAGE_COLS).eq('conversation_id', conversationId).neq('status', 'deleted');
  if (options.contentType) q = q.eq('content_type', options.contentType);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as MessageRow[]).map(mapMessage);
}

export async function getMessage(id: string): Promise<ChatMessage | null> {
  const { data, error } = await supabase.from('chat_messages').select(MESSAGE_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapMessage(data as MessageRow) : null;
}

export async function getScheduledMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase.from('chat_messages').select(MESSAGE_COLS).eq('conversation_id', conversationId).eq('is_scheduled', true).order('scheduled_for', { ascending: true });
  if (error) throw error;
  return (data as MessageRow[]).map(mapMessage);
}

// ── Message Edit functions ────────────────────────────────────────────────

export async function getMessageEdits(messageId: string): Promise<ChatMessageEdit[]> {
  const { data, error } = await supabase.from('chat_message_edits').select(EDIT_COLS).eq('message_id', messageId).order('edited_at', { ascending: true });
  if (error) throw error;
  return (data as EditRow[]).map(mapEdit);
}

// ── Reaction functions ────────────────────────────────────────────────────

export async function getMessageReactions(messageId: string): Promise<ChatReaction[]> {
  const { data, error } = await supabase.from('chat_message_reactions').select(REACTION_COLS).eq('message_id', messageId);
  if (error) throw error;
  return (data as ReactionRow[]).map(mapReaction);
}

export async function getMyReactionOnMessage(messageId: string): Promise<ChatReaction | null> {
  const { data, error } = await supabase.from('chat_message_reactions').select(REACTION_COLS).eq('message_id', messageId).maybeSingle();
  if (error) throw error;
  return data ? mapReaction(data as ReactionRow) : null;
}

// ── Poll functions ────────────────────────────────────────────────────────

export async function getPoll(messageId: string): Promise<ChatPoll | null> {
  const { data, error } = await supabase.from('chat_polls').select(POLL_COLS).eq('message_id', messageId).single();
  if (error) throw error;
  return data ? mapPoll(data as PollRow) : null;
}

export async function getMyPollVote(pollId: string): Promise<ChatPollVote | null> {
  const { data, error } = await supabase.from('chat_poll_votes').select(POLL_VOTE_COLS).eq('poll_id', pollId).maybeSingle();
  if (error) throw error;
  return data ? mapPollVote(data as PollVoteRow) : null;
}

export async function getPollVotes(pollId: string): Promise<ChatPollVote[]> {
  const { data, error } = await supabase.from('chat_poll_votes').select(POLL_VOTE_COLS).eq('poll_id', pollId);
  if (error) throw error;
  return (data as PollVoteRow[]).map(mapPollVote);
}

// ── Bookmark functions ────────────────────────────────────────────────────

export async function getMyBookmarks(options: { limit?: number; before?: string } = {}): Promise<ChatBookmark[]> {
  let q = supabase.from('chat_bookmarks').select(BOOKMARK_COLS);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as BookmarkRow[]).map(mapBookmark);
}

// ── Attachment functions ──────────────────────────────────────────────────

export async function getMessageAttachments(messageId: string): Promise<ChatAttachment[]> {
  const { data, error } = await supabase.from('chat_attachments').select(ATTACHMENT_COLS).eq('message_id', messageId);
  if (error) throw error;
  return (data as AttachmentRow[]).map(mapAttachment);
}

export async function getConversationMedia(conversationId: string, options: { fileType?: ChatAttachment['fileType']; limit?: number } = {}): Promise<ChatAttachment[]> {
  let q = supabase.from('chat_attachments').select(`${ATTACHMENT_COLS}, chat_messages!inner(conversation_id)`).eq('chat_messages.conversation_id', conversationId).eq('processing_status', 'optimized');
  if (options.fileType) q = q.eq('file_type', options.fileType);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AttachmentRow[]).map(mapAttachment);
}

// ── Presence functions ────────────────────────────────────────────────────

export async function getUserPresence(userId: string): Promise<ChatPresence | null> {
  const { data, error } = await supabase.from('chat_presence_global').select(PRESENCE_COLS).eq('user_id', userId).single();
  if (error) throw error;
  return data ? mapPresence(data as PresenceRow) : null;
}

export async function getOnlineUsers(options: { status?: ChatPresenceStatus; limit?: number } = {}): Promise<ChatPresence[]> {
  let q = supabase.from('chat_presence_global').select(PRESENCE_COLS).in('status', ['online', 'busy']);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('updated_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as PresenceRow[]).map(mapPresence);
}

// ── Device functions ──────────────────────────────────────────────────────

export async function getMyDevices(): Promise<ChatDevice[]> {
  const { data, error } = await supabase.from('chat_devices').select(DEVICE_COLS).order('last_active_at', { ascending: false });
  if (error) throw error;
  return (data as DeviceRow[]).map(mapDevice);
}

// ── Delivery Tracking functions ───────────────────────────────────────────

export async function getMessageDeliveryReceipts(messageId: string): Promise<ChatDeliveryReceipt[]> {
  const { data, error } = await supabase.from('chat_delivery_tracking').select(DELIVERY_COLS).eq('message_id', messageId);
  if (error) throw error;
  return (data as DeliveryRow[]).map(mapDelivery);
}

export async function getUnreadDeliveries(conversationId: string): Promise<ChatDeliveryReceipt[]> {
  const { data, error } = await supabase.from('chat_delivery_tracking').select(`${DELIVERY_COLS}, chat_messages!inner(conversation_id)`).eq('chat_messages.conversation_id', conversationId).is('read_at', null).not('delivered_at', 'is', null);
  if (error) throw error;
  return (data as DeliveryRow[]).map(mapDelivery);
}

// ── Live Location functions ───────────────────────────────────────────────

export async function getActiveSharedLocations(conversationId: string): Promise<ChatLiveLocation[]> {
  const { data, error } = await supabase.from('chat_live_locations').select(LIVE_LOC_COLS).eq('conversation_id', conversationId).gt('expires_at', new Date().toISOString()).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as LiveLocRow[]).map(mapLiveLoc);
}

export async function getMySharedLocation(conversationId: string): Promise<ChatLiveLocation | null> {
  const { data, error } = await supabase.from('chat_live_locations').select(LIVE_LOC_COLS).eq('conversation_id', conversationId).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw error;
  return data ? mapLiveLoc(data as LiveLocRow) : null;
}

// ── Call functions ────────────────────────────────────────────────────────

export async function getConversationCalls(conversationId: string, options: { limit?: number } = {}): Promise<ChatCall[]> {
  const { data, error } = await supabase.from('chat_calls').select(CALL_COLS).eq('conversation_id', conversationId).order('started_at', { ascending: false }).limit(options.limit ?? 20);
  if (error) throw error;
  return (data as CallRow[]).map(mapCall);
}

export async function getActiveCall(conversationId: string): Promise<ChatCall | null> {
  const { data, error } = await supabase.from('chat_calls').select(CALL_COLS).eq('conversation_id', conversationId).in('status', ['ringing', 'ongoing']).maybeSingle();
  if (error) throw error;
  return data ? mapCall(data as CallRow) : null;
}

export async function getCallParticipants(callId: string): Promise<ChatCallParticipant[]> {
  const { data, error } = await supabase.from('chat_call_participants').select(CALL_PARTICIPANT_COLS).eq('call_id', callId);
  if (error) throw error;
  return (data as CallParticipantRow[]).map(mapCallParticipant);
}

// ── AI Agent functions ────────────────────────────────────────────────────

export async function getConversationAgents(conversationId: string): Promise<ChatAiAgent[]> {
  const { data, error } = await supabase.from('chat_ai_agents').select(AI_AGENT_COLS).eq('conversation_id', conversationId).eq('is_active', true);
  if (error) throw error;
  return (data as AiAgentRow[]).map(mapAiAgent);
}

// ── AI Insight functions ──────────────────────────────────────────────────

export async function getConversationInsight(conversationId: string): Promise<ChatAiInsight | null> {
  const { data, error } = await supabase.from('chat_ai_insights').select(AI_INSIGHT_COLS).eq('conversation_id', conversationId).single();
  if (error) throw error;
  return data ? mapAiInsight(data as AiInsightRow) : null;
}

// ── Notification functions ────────────────────────────────────────────────

export async function getMyNotifications(options: { isRead?: boolean; limit?: number; before?: string } = {}): Promise<ChatNotification[]> {
  let q = supabase.from('chat_notifications').select(NOTIFICATION_COLS);
  if (options.isRead !== undefined) q = q.eq('is_read', options.isRead);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as NotificationRow[]).map(mapNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase.from('chat_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

// ── Webhook functions ─────────────────────────────────────────────────────

export async function getMyWebhooks(businessId: string, options: { isActive?: boolean } = {}): Promise<ChatWebhook[]> {
  let q = supabase.from('chat_webhooks').select(WEBHOOK_COLS).eq('business_id', businessId);
  if (options.isActive !== undefined) q = q.eq('is_active', options.isActive);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WebhookRow[]).map(mapWebhook);
}

export async function getWebhook(id: string): Promise<ChatWebhook | null> {
  const { data, error } = await supabase.from('chat_webhooks').select(WEBHOOK_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapWebhook(data as WebhookRow) : null;
}
