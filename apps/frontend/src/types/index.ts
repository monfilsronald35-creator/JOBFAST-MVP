/**
 * JOBFAST Global — Core Domain Type Definitions
 * Single source of truth for all TypeScript contracts.
 * Enterprise-grade: immutable unions, branded IDs, strict optionals.
 */

// ─── Branded Identifiers ──────────────────────────────────────────────────────
export type UserId       = string & { readonly __brand: 'UserId' };
export type JobId        = string & { readonly __brand: 'JobId' };
export type MessageId    = string & { readonly __brand: 'MessageId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type NotificationId = string & { readonly __brand: 'NotificationId' };
export type BookingId    = string & { readonly __brand: 'BookingId' };
export type WalletId     = string & { readonly __brand: 'WalletId' };
export type FileId       = string & { readonly __brand: 'FileId' };

export function asUserId(id: string): UserId { return id as UserId; }
export function asJobId(id: string): JobId { return id as JobId; }

// ─── User / Auth ──────────────────────────────────────────────────────────────
export type UserRole =
  | 'worker'
  | 'employer'
  | 'company'
  | 'admin'
  | 'super_admin'
  | 'service_provider'
  | 'enterprise';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export interface GeoCoordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface GeoLocation extends GeoCoordinates {
  readonly label: string;
  readonly city?: string;
  readonly country?: string;
  readonly countryCode?: string;
}

export interface UserProfile {
  readonly _id: string;
  readonly id?: string;
  readonly role: UserRole;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly avatar?: string;
  readonly profilePhoto?: string;
  readonly coverPhoto?: string;
  readonly coverVideo?: string;
  readonly bio?: string;
  readonly profession?: string;
  readonly category?: string;
  readonly location?: GeoLocation;
  readonly verificationStatus: VerificationStatus;
  readonly accountStatus: AccountStatus;
  readonly isAvailable?: boolean;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly completedJobs?: number;
  readonly trustScore?: number;
  readonly createdAt: string;
  readonly updatedAt?: string;
  // Extended fields
  readonly skills?: readonly string[];
  readonly languages?: readonly string[];
  readonly hourlyRate?: number;
  readonly currency?: string;
  readonly timezone?: string;
  readonly token?: string;
  readonly mfaRequired?: boolean;
  readonly suspiciousLogin?: boolean;
}

// ─── Job / Post ───────────────────────────────────────────────────────────────
export type JobStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type PaymentType = 'fixed' | 'hourly' | 'negotiable';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
export type ContactMethod = 'phone' | 'whatsapp' | 'both';

export interface JobDraftData {
  title?: string;
  category?: string;
  description?: string;
  location?: string;
  budget?: number;
  phone?: string;
  deadline?: string;
  paymentType?: PaymentType;
  isUrgent?: boolean;
  companyName?: string;
  workerNeeded?: number;
  experienceLevel?: ExperienceLevel;
  salaryVisible?: boolean;
  contactMethod?: ContactMethod;
  mediaUrls?: readonly string[];
  skills?: readonly string[];
}

export interface Job extends Required<JobDraftData> {
  readonly _id: string;
  readonly status: JobStatus;
  readonly authorId: string;
  readonly images: readonly string[];
  readonly applications?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Messaging / Chat ─────────────────────────────────────────────────────────
export type MessageStatus =
  | 'queued'
  | 'encrypting'
  | 'compressing'
  | 'uploading'
  | 'server_accepted'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'voice'
  | 'location'
  | 'contact'
  | 'system';

export interface MessageReaction {
  readonly emoji: string;
  readonly userId: string;
  readonly createdAt: string;
}

export interface MessageDelivery {
  readonly userId: string;
  readonly deliveredAt: string;
  readonly readAt?: string;
}

export interface ChatMessage {
  readonly _id: string;
  readonly clientId?: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly recipientId?: string;
  readonly content: string;
  readonly type: MessageType;
  readonly status: MessageStatus;
  readonly reactions?: readonly MessageReaction[];
  readonly deliveries?: readonly MessageDelivery[];
  readonly replyTo?: string;
  readonly editedAt?: string;
  readonly deletedAt?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
}

export type PresenceStatus =
  | 'online'
  | 'away'
  | 'busy'
  | 'in_meeting'
  | 'driving'
  | 'dnd'
  | 'invisible'
  | 'vacation'
  | 'offline';

export interface Conversation {
  readonly _id: string;
  readonly participants: readonly string[];
  readonly lastMessage?: ChatMessage;
  readonly unreadCount: number;
  readonly isGroup?: boolean;
  readonly groupName?: string;
  readonly groupAvatar?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'message'
  | 'job'
  | 'payment'
  | 'booking'
  | 'alert'
  | 'system'
  | 'achievement'
  | 'reminder'
  | 'promotion'
  | 'emergency'
  | 'social'
  | 'review';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface Notification {
  readonly _id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly isRead: boolean;
  readonly actionUrl?: string;
  readonly channel?: NotificationChannel;
  readonly category?: string;
  readonly priorityScore?: number;
  readonly minPriority?: number;
  readonly geo?: { city?: string; label?: string };
  readonly digestItems?: readonly string[];
  readonly showToast?: boolean;
  readonly soundEnabled?: boolean;
  readonly createdAt: string;
}

// ─── Upload / File ────────────────────────────────────────────────────────────
export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface UploadItem {
  readonly id: FileId;
  readonly file: File;
  readonly endpoint: string;
  readonly metadata?: Record<string, unknown>;
  readonly status: UploadStatus;
  readonly progress: number;
  readonly error?: Error;
  readonly responseUrl?: string;
}

// ─── AI / Intelligence ────────────────────────────────────────────────────────
export interface JobSuggestion {
  readonly id: string;
  readonly title: string;
  readonly confidence: number;
  readonly matchReasons: readonly string[];
  readonly category?: string;
  readonly estimatedBudget?: { min: number; max: number; currency: string };
}

export interface SalaryHint {
  readonly min: number;
  readonly max: number;
  readonly median: number;
  readonly currency: string;
  readonly source: string;
}

export interface ModerationFlag {
  readonly field: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly code: string;
}

export interface SkillSuggestion {
  readonly skill: string;
  readonly relevance: number;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
  readonly status?: number;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
  readonly cursor?: string;
}

export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly code?: string;
  readonly field?: string;
}

// ─── Security / Device ───────────────────────────────────────────────────────
export interface DeviceFingerprint {
  readonly deviceId: string;
  readonly browser: string;
  readonly os: string;
  readonly timezone: string;
  readonly locale: string;
  readonly screenResolution: string;
  readonly colorDepth: number;
  readonly hardwareConcurrency: number;
}

export interface RiskProfile {
  readonly deviceRiskScore: number;
  readonly fraudScore: number;
  readonly trustScore: number;
  readonly flags: readonly string[];
}

// ─── Plugin System ────────────────────────────────────────────────────────────
export interface PluginManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly routes: readonly string[];
  readonly permissions: readonly string[];
  readonly featureFlags: Record<string, boolean>;
  readonly dependencies: readonly string[];
  readonly entryPoint: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export type AnalyticsEventName =
  | 'listing_view'
  | 'listing_search'
  | 'listing_filter'
  | 'map_view'
  | 'call_initiated'
  | 'chat_initiated'
  | 'booking_started'
  | 'booking_completed'
  | 'payment_initiated'
  | 'payment_completed'
  | 'favorite_added'
  | 'review_submitted'
  | 'conversion'
  | 'session_start'
  | 'session_end'
  | 'performance_measure';

export interface AnalyticsEvent {
  readonly name: AnalyticsEventName | string;
  readonly properties?: Record<string, unknown>;
  readonly timestamp?: number;
}

// ─── Re-exports for convenience ───────────────────────────────────────────────
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};