/**
 * JOBFAST Enterprise Realtime Engine — Type Contracts
 * All realtime-specific types. Domain types are imported from '@/types'.
 */

// ─── Re-export domain types used by engine consumers ─────────────────────────
export type {
  ChatMessage, MessageStatus, MessageType, PresenceStatus,
  Notification, UserProfile, GeoCoordinates,
} from '../../types';

// ─── Transport & Connection ───────────────────────────────────────────────────
export type TransportType = 'websocket' | 'sse' | 'polling';
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'degraded'
  | 'failed';

export type NetworkQuality = 'offline' | 'slow' | 'good' | 'excellent';
export type ChannelNamespace =
  | 'chat' | 'presence' | 'jobs' | 'marketplace'
  | 'wallet' | 'gps' | 'dashboard' | 'notifications'
  | 'collaboration' | 'sync';

// ─── Engine Config ────────────────────────────────────────────────────────────
export interface RealtimeConfig {
  readonly url: string;
  readonly transports?: TransportType[];
  readonly auth?: () => Promise<string | null> | string | null;
  readonly reconnect?: {
    readonly maxAttempts: number;
    readonly initialDelayMs: number;
    readonly maxDelayMs: number;
    readonly jitterFactor: number;
  };
  readonly heartbeat?: {
    readonly intervalMs: number;
    readonly timeoutMs: number;
  };
  readonly rateLimit?: {
    readonly eventsPerSecond: number;
    readonly burstSize: number;
  };
  readonly encryption?: {
    readonly enabled: boolean;
    readonly sharedKey?: string;
  };
  readonly compression?: {
    readonly enabled: boolean;
    readonly minBytes: number;
  };
  readonly telemetry?: {
    readonly enabled: boolean;
    readonly sampleRate: number;
    readonly endpoint?: string;
  };
  readonly regions?: readonly string[];
}

// ─── Engine Metrics ───────────────────────────────────────────────────────────
export interface EngineMetrics {
  readonly connectionState: ConnectionState;
  readonly transport: TransportType | null;
  readonly latencyMs: number;
  readonly jitterMs: number;
  readonly messagesReceived: number;
  readonly messagesSent: number;
  readonly bytesReceived: number;
  readonly bytesSent: number;
  readonly reconnectCount: number;
  readonly queuedMessages: number;
  readonly droppedMessages: number;
  readonly errorCount: number;
  readonly connectedAt: number | null;
  readonly uptimeMs: number;
  readonly networkQuality: NetworkQuality;
}

// ─── Queued Message ───────────────────────────────────────────────────────────
export interface QueuedMessage {
  readonly id: string;
  readonly event: string;
  readonly payload: unknown;
  readonly priority: 'critical' | 'high' | 'normal' | 'low';
  readonly createdAt: number;
  attempts: number;
  readonly maxAttempts: number;
  nextRetryAt: number;
  readonly encrypted: boolean;
  readonly compressed: boolean;
}

// ─── Telemetry ────────────────────────────────────────────────────────────────
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly data?: Record<string, unknown>;
}

export interface Span {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  readonly attributes: Record<string, string | number | boolean>;
  status: 'ok' | 'error';
  error?: string;
}

export interface MetricPoint {
  readonly name: string;
  readonly value: number;
  readonly timestamp: number;
  readonly labels: Record<string, string>;
}

// ─── Chat Payloads ────────────────────────────────────────────────────────────
export interface TypingPayload {
  readonly conversationId: string;
  readonly userId: string;
  readonly isTyping: boolean;
}

export interface ReactionPayload {
  readonly messageId: string;
  readonly conversationId: string;
  readonly userId: string;
  readonly emoji: string;
  readonly action: 'add' | 'remove';
}

export interface ReadReceiptPayload {
  readonly conversationId: string;
  readonly messageIds: readonly string[];
  readonly userId: string;
  readonly timestamp: number;
}

export interface DeliveryReceiptPayload {
  readonly messageId: string;
  readonly conversationId: string;
  readonly userId: string;
  readonly deliveredAt: number;
}

export interface FileSharePayload {
  readonly conversationId: string;
  readonly messageId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly url: string;
  readonly thumbnailUrl?: string;
}

// ─── Presence Payloads ────────────────────────────────────────────────────────
export interface PresencePayload {
  readonly userId: string;
  readonly status: import('../../types').PresenceStatus;
  readonly lastSeen: number;
  readonly device?: string;
  readonly deviceCount?: number;
  readonly activeChannels?: readonly string[];
}

// ─── Job Payloads ─────────────────────────────────────────────────────────────
export interface LiveJobPayload {
  readonly _id: string;
  readonly title: string;
  readonly category: string;
  readonly lat: number;
  readonly lng: number;
  readonly budget: number;
  readonly currency: string;
  readonly status: import('../../types').JobStatus;
  readonly applicantCount: number;
  readonly postedAt: number;
  readonly isUrgent: boolean;
  readonly matchScore?: number;
  readonly distanceKm?: number;
}

export interface JobMatchPayload {
  readonly jobId: string;
  readonly workerId: string;
  readonly matchScore: number;
  readonly skills: readonly string[];
  readonly distanceKm?: number;
}

export interface ApplicationUpdatePayload {
  readonly applicationId: string;
  readonly jobId: string;
  readonly status: 'pending' | 'reviewing' | 'shortlisted' | 'hired' | 'rejected';
  readonly message?: string;
  readonly updatedAt: number;
}

export interface AvailabilityPayload {
  readonly userId: string;
  readonly isAvailable: boolean;
  readonly availableUntil?: number;
  readonly radius?: number;
  readonly updatedAt: number;
}

// ─── Marketplace Payloads ─────────────────────────────────────────────────────
export interface LiveOrderPayload {
  readonly _id: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly total: number;
  readonly currency: string;
  readonly status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  readonly updatedAt: number;
}

export interface StockUpdatePayload {
  readonly productId: string;
  readonly stock: number;
  readonly reserved: number;
  readonly available: number;
}

export interface PriceUpdatePayload {
  readonly productId: string;
  readonly price: number;
  readonly salePrice?: number;
  readonly currency: string;
  readonly updatedAt: number;
}

export interface AuctionPayload {
  readonly auctionId: string;
  readonly currentBid: number;
  readonly bidCount: number;
  readonly highBidderId: string;
  readonly endsAt: number;
  readonly status: 'active' | 'ending_soon' | 'ended';
}

// ─── Wallet Payloads ──────────────────────────────────────────────────────────
export interface WalletBalancePayload {
  readonly userId: string;
  readonly availableMinorUnits: number;
  readonly escrowMinorUnits: number;
  readonly pendingMinorUnits: number;
  readonly currency: string;
  readonly updatedAt: number;
}

export interface LiveTransactionPayload {
  readonly _id: string;
  readonly type: 'credit' | 'debit' | 'transfer' | 'escrow_lock' | 'escrow_release' | 'refund' | 'fee';
  readonly status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly fromUserId?: string;
  readonly toUserId?: string;
  readonly description: string;
  readonly createdAt: number;
  readonly completedAt?: number;
}

export interface EscrowPayload {
  readonly escrowId: string;
  readonly jobId: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly status: 'held' | 'releasing' | 'released' | 'disputed';
  readonly releaseAt?: number;
}

// ─── GPS Payloads ─────────────────────────────────────────────────────────────
export interface LocationPayload {
  readonly userId: string;
  readonly role: 'driver' | 'worker' | 'customer';
  readonly lat: number;
  readonly lng: number;
  readonly accuracy: number;
  readonly heading?: number;
  readonly speed?: number;
  readonly timestamp: number;
}

export interface ETAPayload {
  readonly trackingId: string;
  readonly etaMs: number;
  readonly distanceM: number;
  readonly updatedAt: number;
}

export interface RouteUpdatePayload {
  readonly trackingId: string;
  readonly encodedPolyline: string;
  readonly distanceRemainingM: number;
  readonly durationRemainingMs: number;
}

export interface GeofenceEvent {
  readonly geofenceId: string;
  readonly userId: string;
  readonly action: 'enter' | 'exit' | 'dwell';
  readonly lat: number;
  readonly lng: number;
  readonly timestamp: number;
}

// ─── Dashboard Payloads ───────────────────────────────────────────────────────
export interface KPIPayload {
  readonly metric: string;
  readonly value: number;
  readonly previousValue: number;
  readonly changePercent: number;
  readonly unit: string;
  readonly updatedAt: number;
}

export interface LiveAnalyticsPayload {
  readonly activeVisitors: number;
  readonly pageViewsPerMin: number;
  readonly conversionsPerHour: number;
  readonly revenueMinorUnits: number;
  readonly openJobs: number;
  readonly activeOrders: number;
  readonly updatedAt: number;
}

export interface LiveAlertPayload {
  readonly _id: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly title: string;
  readonly message: string;
  readonly category: string;
  readonly createdAt: number;
  readonly acknowledged?: boolean;
}

// ─── Collaboration Payloads ───────────────────────────────────────────────────
export interface DocumentOperation {
  readonly docId: string;
  readonly userId: string;
  readonly type: 'insert' | 'delete' | 'retain' | 'format';
  readonly position: number;
  readonly content?: string;
  readonly length?: number;
  readonly attributes?: Record<string, unknown>;
  readonly version: number;
  readonly timestamp: number;
}

export interface TaskUpdatePayload {
  readonly taskId: string;
  readonly boardId: string;
  readonly userId: string;
  readonly changes: Partial<{
    readonly title: string;
    readonly status: string;
    readonly assigneeId: string;
    readonly dueDate: number;
    readonly position: number;
  }>;
  readonly updatedAt: number;
}

export interface TeamPresencePayload {
  readonly roomId: string;
  readonly members: ReadonlyArray<{
    readonly userId: string;
    readonly status: import('../../types').PresenceStatus;
    readonly cursor?: { readonly x: number; readonly y: number };
  }>;
}

// ─── Sync Payloads ────────────────────────────────────────────────────────────
export interface SyncPayload {
  readonly sessionId: string;
  readonly deviceId: string;
  readonly namespace: string;
  readonly key: string;
  readonly value: unknown;
  readonly version: number;
  readonly timestamp: number;
}

export interface SessionSyncPayload {
  readonly userId: string;
  readonly sessionId: string;
  readonly deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  readonly action: 'joined' | 'left' | 'active';
  readonly timestamp: number;
}

// ─── Notification Payloads ───────────────────────────────────────────────────
export interface PushRegistrationPayload {
  readonly userId: string;
  readonly deviceToken: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly endpoint?: string;
  readonly p256dh?: string;
  readonly auth?: string;
}