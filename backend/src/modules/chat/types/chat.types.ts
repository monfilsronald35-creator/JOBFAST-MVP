export enum RoomType {
  Direct    = 'direct',
  Group     = 'group',
  Company   = 'company',
  Support   = 'support',
  Community = 'community',
  Broadcast = 'broadcast',
  Channel   = 'channel',
}

export enum MessageType {
  Text      = 'text',
  Image     = 'image',
  Video     = 'video',
  Audio     = 'audio',
  File      = 'file',
  VoiceNote = 'voice_note',
  Location  = 'location',
  Contact   = 'contact',
  GIF       = 'gif',
  Sticker   = 'sticker',
  System    = 'system',
  AI        = 'ai',
}

export enum PresenceStatus {
  Online    = 'online',
  Offline   = 'offline',
  Away      = 'away',
  Busy      = 'busy',
  InMeeting = 'in_meeting',
  Typing    = 'typing',
  Recording = 'recording',
}

export enum ReadStatus {
  Sent      = 'sent',
  Delivered = 'delivered',
  Read      = 'read',
}

export enum CallType   { Voice = 'voice',   Video = 'video'   }
export enum CallStatus {
  Ringing  = 'ringing', Active   = 'active',
  Ended    = 'ended',   Missed   = 'missed',
  Declined = 'declined', Failed  = 'failed',
}

export enum ModerationAction { None = 'none', Warn = 'warn', Hide = 'hide', Review = 'review', Block = 'block' }
export enum ModerationFlag   { Spam = 'spam', Scam = 'scam', Threat = 'threat', Harassment = 'harassment', MalwareLink = 'malware_link', InappropriateImage = 'inappropriate_image' }
export enum AttachmentType   { Image = 'image', Video = 'video', Audio = 'audio', Document = 'document', Archive = 'archive', Location = 'location', Contact = 'contact', CAD = 'cad' }

export type RoomRole = 'owner' | 'admin' | 'member';

export interface ChatRoom {
  id:             string;
  name?:          string | undefined;
  type:           RoomType;
  createdBy:      string;
  avatarUrl?:     string | undefined;
  description?:   string | undefined;
  isArchived:     boolean;
  isEncrypted:    boolean;
  jobId?:         string | undefined;
  orderId?:       string | undefined;
  lastMessageAt?: string | undefined;
  memberCount:    number;
  metadata?:      Record<string, unknown> | undefined;
  createdAt:      string;
  updatedAt:      string;
}

export interface ChatMember {
  roomId:    string;
  userId:    string;
  role:      RoomRole;
  joinedAt:  string;
  leftAt?:   string | undefined;
  isMuted:   boolean;
  nickname?: string | undefined;
}

export interface ChatMessage {
  id:               string;
  roomId:           string;
  senderId:         string;
  type:             MessageType;
  content?:         string | undefined;
  metadata?:        Record<string, unknown> | undefined;
  replyToId?:       string | undefined;
  isEdited:         boolean;
  isDeleted:        boolean;
  isPinned:         boolean;
  moderationAction: ModerationAction;
  attachments?:     ChatAttachment[] | undefined;
  reactions?:       ChatReaction[] | undefined;
  readCount?:       number | undefined;
  createdAt:        string;
  updatedAt:        string;
}

export interface ChatAttachment {
  id:         string;
  messageId:  string;
  type:       AttachmentType;
  url:        string;
  name:       string;
  size:       number;
  mimeType:   string;
  thumbnail?: string | undefined;
  duration?:  number | undefined;
  width?:     number | undefined;
  height?:    number | undefined;
  metadata?:  Record<string, unknown> | undefined;
}

export interface ChatReaction {
  messageId: string;
  userId:    string;
  emoji:     string;
  createdAt: string;
}

export interface ChatReadReceipt {
  messageId: string;
  roomId:    string;
  userId:    string;
  status:    ReadStatus;
  readAt?:   string | undefined;
}

export interface ChatPresence {
  userId:      string;
  status:      PresenceStatus;
  lastSeen:    string;
  activeRoom?: string | undefined;
  deviceId?:   string | undefined;
}

export interface ChatCall {
  id:           string;
  roomId:       string;
  callerId:     string;
  type:         CallType;
  status:       CallStatus;
  startedAt?:   string | undefined;
  endedAt?:     string | undefined;
  duration?:    number | undefined;
  participants: string[];
  metadata?:    Record<string, unknown> | undefined;
  createdAt:    string;
}

export interface ChatModerationLog {
  id:        string;
  messageId: string;
  userId:    string;
  action:    ModerationAction;
  flags:     ModerationFlag[];
  score:     number;
  createdAt: string;
}

export interface ChatTranslation {
  messageId:      string;
  targetLang:     string;
  translatedText: string;
  createdAt:      string;
}

export interface CreateMessageInput {
  roomId:      string;
  senderId:    string;
  type:        MessageType;
  content?:    string | undefined;
  replyToId?:  string | undefined;
  metadata?:   Record<string, unknown> | undefined;
  attachments?: Array<Omit<ChatAttachment, 'id' | 'messageId'>> | undefined;
}
