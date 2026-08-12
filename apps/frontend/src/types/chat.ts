// ── Enums ──────────────────────────────────────────────────────────────────

export const CONVERSATION_TYPES = [
  'direct', 'group', 'channel', 'marketplace_order',
  'support_ticket', 'dispute', 'secret',
] as const;
export type ConversationType = typeof CONVERSATION_TYPES[number];

export const MESSAGE_TYPES = [
  'text', 'image', 'video', 'audio', 'voice_note', 'document',
  'cad_file', 'location', 'contact', 'qr', 'sticker', 'gif',
  'system', 'payment_request', 'invoice', 'order_update',
] as const;
export type MessageType = typeof MESSAGE_TYPES[number];

export const MESSAGE_STATUSES = [
  'sending', 'sent', 'delivered', 'read', 'failed',
] as const;
export type MessageStatus = typeof MESSAGE_STATUSES[number];

export const CALL_TYPES = [
  'voice', 'video', 'group_voice', 'group_video', 'screen_share',
] as const;
export type CallType = typeof CALL_TYPES[number];

export const CALL_STATUSES = [
  'initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected',
] as const;
export type CallStatus = typeof CALL_STATUSES[number];

export const PRESENCE_STATES = [
  'online', 'offline', 'away', 'busy', 'in_call', 'in_meeting',
] as const;
export type PresenceState = typeof PRESENCE_STATES[number];

// ── Core Messaging ─────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string | null;
  type: ConversationType;
  avatarUrl: string | null;
  isEncrypted: boolean;
  isArchived: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: string; // owner | admin | moderator | member
  nickname: string | null;
  lastReadAt: string;
  isMuted: boolean;
  isPinned: boolean;
  isHidden: boolean;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  replyToId: string | null;
  type: MessageType;
  content: string;
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  jobId: string | null;
  orderId: string | null;
  walletTransactionId: string | null;
  escrowId: string | null;
  invoiceId: string | null;
  paymentIntentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface MessageDelivery {
  id: string;
  messageId: string;
  userId: string;
  deliveredAt: string;
}

export interface MessageMention {
  id: string;
  messageId: string;
  userId: string;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MessageEdit {
  id: string;
  messageId: string;
  oldContent: string;
  newContent: string;
  editedAt: string;
}

export interface MessageDelete {
  id: string;
  messageId: string;
  deletedBy: string;
  deletedAt: string;
}

// ── Presence & Devices ─────────────────────────────────────────────────────

export interface PresenceStatus {
  userId: string;
  state: PresenceState;
  customStatus: string | null;
  lastSeenAt: string;
  updatedAt: string;
}

export interface TypingStatus {
  id: string;
  conversationId: string;
  userId: string;
  isTyping: boolean;
  updatedAt: string;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string; // web | ios | android | desktop
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
  // push_token excluded — security/PII
}

// ── Calls & WebRTC ─────────────────────────────────────────────────────────

export interface CallSession {
  id: string;
  conversationId: string | null;
  initiatorId: string;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  metadata: Record<string, unknown>;
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  isMuted: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
}

export interface CallRecording {
  id: string;
  callId: string;
  fileUrl: string;
  fileSize: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

// ── Attachments & Media ────────────────────────────────────────────────────

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AttachmentScan {
  id: string;
  attachmentId: string;
  scannerName: string;
  isSafe: boolean;
  scannedAt: string;
  // threat_details excluded — internal security info
}

export interface AttachmentVersion {
  id: string;
  attachmentId: string;
  versionNumber: number;
  fileUrl: string;
  createdAt: string;
}

// ── AI, Search & Translation ───────────────────────────────────────────────

export interface MessageAiAnalysis {
  id: string;
  messageId: string;
  sentiment: string | null; // positive | neutral | negative
  isFlagged: boolean;
  suggestedReplies: string[];
  createdAt: string;
  // toxicity_score, spam_score excluded — internal moderation data
}

export interface ConversationAiSummary {
  id: string;
  conversationId: string;
  summaryText: string;
  keyActionItems: unknown[];
  generatedAt: string;
}

export interface TranslationCache {
  id: string;
  messageId: string;
  targetLanguage: string;
  translatedText: string;
  createdAt: string;
}

// ── Security & Retention ───────────────────────────────────────────────────

export interface ConversationKey {
  id: string;
  conversationId: string;
  userId: string;
  createdAt: string;
  // encrypted_key excluded — cryptographic key material, never sent over REST
}

export interface MessageAuditLog {
  id: string;
  messageId: string | null;
  actorId: string;
  action: string; // viewed | decrypted | exported | flagged
  createdAt: string;
  // ip_address excluded — PII
}

export interface MessageRetentionPolicy {
  id: string;
  conversationId: string | null;
  retentionDays: number;
  autoDelete: boolean;
  updatedAt: string;
}

// ── Collaboration Tools ────────────────────────────────────────────────────

export interface ConversationTask {
  id: string;
  conversationId: string;
  creatorId: string;
  title: string;
  description: string | null;
  status: string; // pending | in_progress | completed
  dueDate: string | null;
  assignedTo: string | null;
  createdAt: string;
}

export interface ConversationEvent {
  id: string;
  conversationId: string;
  creatorId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface ConversationPoll {
  id: string;
  conversationId: string;
  creatorId: string;
  question: string;
  options: unknown[];
  isClosed: boolean;
  createdAt: string;
}

// ── Statistics ─────────────────────────────────────────────────────────────

export interface ConversationStatistics {
  conversationId: string;
  totalMessages: number;
  totalCalls: number;
  averageResponseTimeSeconds: number;
  lastActivityAt: string;
}

// ── Chat Engine V4 (chat_* prefixed tables) ───────────────────────────────
// NOTE: V4 tables use the `chat_` prefix and coexist with the old schema above.
// The old chatService.ts queries `conversations`, `messages`, etc. (no prefix).
// This section adds types for the new enterprise chat_* tables only.
//
// Backend-only tables (zero frontend types or functions):
//   chat_search_index   — embedding vector(1536) = NEVER; search_vector = internal FTS
//   chat_e2ee_keys      — one_time_pre_keys require atomic backend consume-and-delete
//   chat_offline_queue  — internal delivery queue
//   chat_moderation_queue — internal content moderation
//   chat_audit_logs     — ip_address (NEVER: PII); security compliance data
//   chat_event_outbox   — outbox pattern = backend-internal

export const CHAT_CONV_TYPES = [
  'direct', 'group', 'channel', 'business', 'ai_assistant', 'marketplace', 'job_application', 'support',
] as const;
export type ChatConvType = typeof CHAT_CONV_TYPES[number];

export interface ChatConversation {
  id: string;
  conversationType: ChatConvType;
  title: string | null;
  avatarUrl: string | null;
  description: string | null;
  contextType: string | null;
  contextId: string | null;
  listingPrice: number | null;
  listingCurrency: string;
  listingStatus: string;
  isEncrypted: boolean;
  encryptionAlgorithm: string;
  isPublic: boolean;
  inviteLink: string | null;
  maxParticipants: number;
  settings: Record<string, unknown>;
  businessSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // key_version excluded — internal E2EE key rotation counter
}

export const CHAT_PARTICIPANT_ROLES = [
  'owner', 'admin', 'moderator', 'member', 'agent', 'readonly',
] as const;
export type ChatParticipantRole = typeof CHAT_PARTICIPANT_ROLES[number];

export interface ChatParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ChatParticipantRole;
  permissions: Record<string, unknown>;
  isAdmin: boolean;
  nickname: string | null;
  joinedAt: string;
  leftAt: string | null;
  lastReadMessageId: string | null;
  lastReadAt: string;
  muteUntil: string | null;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  wallpaperUrl: string | null;
  notificationPreferences: Record<string, unknown>;
}

export const CHAT_CONTENT_TYPES = [
  'text', 'image', 'video', 'audio', 'voice_note', 'document', 'pdf',
  'contact_card', 'location', 'live_location', 'sticker', 'gif', 'poll',
  'shared_listing', 'system', 'scheduled',
] as const;
export type ChatContentType = typeof CHAT_CONTENT_TYPES[number];

export const CHAT_MESSAGE_STATUSES = [
  'sending', 'sent', 'delivered', 'seen', 'failed', 'edited', 'deleted', 'scheduled',
] as const;
export type ChatMessageStatus = typeof CHAT_MESSAGE_STATUSES[number];

export const CHAT_MODERATION_STATUSES = [
  'pending', 'approved', 'flagged', 'blocked',
] as const;
export type ChatModerationStatus = typeof CHAT_MODERATION_STATUSES[number];

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  parentMessageId: string | null;
  forwardedFromMessageId: string | null;
  forwardedFromUserId: string | null;
  forwardedFromChatId: string | null;
  contentType: ChatContentType;
  body: string | null;
  status: ChatMessageStatus;
  moderationStatus: ChatModerationStatus;
  clientMessageId: string | null;
  isEncrypted: boolean;
  scheduledFor: string | null;
  isScheduled: boolean;
  createdAt: string;
  updatedAt: string;
  // spam_score, fraud_score, toxicity_score excluded — NEVER (AI moderation signals)
  // device_id excluded — internal sync device tracking
}

export interface ChatMessageEdit {
  id: string;
  messageId: string;
  originalBody: string;
  newBody: string;
  editedAt: string;
}

export interface ChatReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface ChatPoll {
  id: string;
  messageId: string;
  question: string;
  options: unknown[];
  isMultipleChoice: boolean;
  isAnonymous: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface ChatPollVote {
  id: string;
  pollId: string;
  userId: string;
  selectedOptionIndex: number;
  createdAt: string;
}

export interface ChatBookmark {
  id: string;
  userId: string;
  messageId: string;
  note: string | null;
  createdAt: string;
}

export const CHAT_FILE_TYPES = [
  'image', 'video', 'audio', 'pdf', 'word', 'excel', 'zip', 'cad', '3d_file',
] as const;
export type ChatFileType = typeof CHAT_FILE_TYPES[number];

export const CHAT_PROCESSING_STATUSES = [
  'uploaded', 'processing', 'optimized', 'scanned_safe', 'infected', 'failed',
] as const;
export type ChatProcessingStatus = typeof CHAT_PROCESSING_STATUSES[number];

export interface ChatAttachment {
  id: string;
  messageId: string | null;
  fileType: ChatFileType;
  fileUrl: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  processingStatus: ChatProcessingStatus;
  createdAt: string;
  // storage_provider excluded — internal cloud infrastructure
  // ai_analysis_status excluded — internal AI pipeline state
  // ai_labels excluded — NEVER (NSFW/malware detection signals; exposing enables moderation evasion)
}

export const CHAT_PRESENCE_STATUSES = [
  'online', 'offline', 'invisible', 'busy', 'away',
] as const;
export type ChatPresenceStatus = typeof CHAT_PRESENCE_STATUSES[number];

export interface ChatPresence {
  userId: string;
  status: ChatPresenceStatus;
  deviceType: string | null;
  platform: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  updatedAt: string;
  // region, socket_id, app_version, network_type, battery_level, last_heartbeat excluded — internal infra/telemetry
}

export interface ChatDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  lastActiveAt: string;
  // push_token excluded — ABSOLUTE NEVER (unauthorized push notification delivery)
  // sync_cursor excluded — internal sync offset
}

export interface ChatDeliveryReceipt {
  messageId: string;
  userId: string;
  deliveredAt: string | null;
  readAt: string | null;
  // device_id excluded — internal device routing
}

export interface ChatLiveLocation {
  id: string;
  userId: string;
  conversationId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  expiresAt: string;
  updatedAt: string;
}

export const CHAT_CALL_TYPES = [
  'voice', 'video', 'group', 'screen_share',
] as const;
export type ChatCallType = typeof CHAT_CALL_TYPES[number];

export const CHAT_CALL_STATUSES = [
  'ringing', 'ongoing', 'ended', 'missed', 'rejected',
] as const;
export type ChatCallStatus = typeof CHAT_CALL_STATUSES[number];

export interface ChatCall {
  id: string;
  conversationId: string;
  initiatorId: string | null;
  callType: ChatCallType;
  status: ChatCallStatus;
  startedAt: string;
  endedAt: string | null;
  // metadata excluded — may contain WebRTC ICE candidates / TURN server tokens
}

export interface ChatCallParticipant {
  id: string;
  callId: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  status: string;
}

export interface ChatAiAgent {
  id: string;
  conversationId: string;
  agentType: string | null;
  isActive: boolean;
  // config excluded — NEVER (may contain system prompts, API keys; exposing enables prompt injection)
}

export interface ChatAiInsight {
  id: string;
  conversationId: string;
  conversationSummary: string | null;
  languageDetected: string | null;
  updatedAt: string;
  // translation_cache excluded — internal optimization cache
  // sentiment excluded — AI behavioral classification (BACKEND ONLY)
  // spam_score, fraud_score, toxicity_score excluded — NEVER (AI moderation signals)
}

export interface ChatNotification {
  id: string;
  userId: string;
  title: string | null;
  body: string | null;
  type: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface ChatWebhook {
  id: string;
  businessId: string | null;
  url: string;
  subscribedEvents: unknown[];
  isActive: boolean;
  createdAt: string;
  // secret excluded — ABSOLUTE NEVER (HMAC webhook signing secret)
}
