/**
 * JOBFAST Enterprise Realtime Engine — Public API
 *
 * Usage:
 *   // 1. Wrap app in provider (once)
 *   import { RealtimeProvider } from '@/realtime';
 *   <RealtimeProvider userId={user._id}><App /></RealtimeProvider>
 *
 *   // 2. Use domain hooks
 *   import { useChat, usePresence, useJobFeed, useWallet, useGPS } from '@/realtime';
 *
 *   // 3. Raw engine access
 *   import { realtimeEngine } from '@/realtime';
 */

// ── Provider ─────────────────────────────────────────────────────────────────
export { RealtimeProvider, useRealtimeContext } from './providers/RealtimeProvider';
export type { RealtimeProviderProps, RealtimeContextValue } from './providers/RealtimeProvider';

// ── Engine ────────────────────────────────────────────────────────────────────
export { realtimeEngine, RealtimeEngine } from './core/RealtimeEngine';

// ── Channels (direct access for advanced use) ─────────────────────────────────
export { ChatChannel }          from './channels/ChatChannel';
export { PresenceChannel }      from './channels/PresenceChannel';
export { JobChannel }           from './channels/JobChannel';
export { MarketplaceChannel }   from './channels/MarketplaceChannel';
export { WalletChannel }        from './channels/WalletChannel';
export { GPSChannel }           from './channels/GPSChannel';
export { DashboardChannel }     from './channels/DashboardChannel';
export { NotificationChannel }  from './channels/NotificationChannel';
export { CollaborationChannel } from './channels/CollaborationChannel';
export { SyncChannel }          from './channels/SyncChannel';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useRealtimeEngine } from './hooks/useRealtimeEngine';
export { useChat }           from './hooks/useChat';
export { usePresence }       from './hooks/usePresence';
export { useJobFeed }        from './hooks/useJobFeed';
export { useWallet }         from './hooks/useWallet';
export { useGPS }            from './hooks/useGPS';
export { useDashboard }      from './hooks/useDashboard';
export { useNotifications }  from './hooks/useNotifications';

// ── Core subsystems (advanced) ────────────────────────────────────────────────
export { ReconnectStrategy }  from './core/ReconnectStrategy';
export { RateLimiter }        from './core/RateLimiter';
export { EncryptionLayer }    from './core/EncryptionLayer';
export { NetworkDetector }    from './core/NetworkDetector';
export { MessageQueue }       from './core/MessageQueue';
export { Compressor }         from './core/Compressor';
export { TelemetryEngine }    from './telemetry/TelemetryEngine';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  // Engine
  RealtimeConfig, ConnectionState, TransportType,
  NetworkQuality, ChannelNamespace, EngineMetrics,
  QueuedMessage, LogLevel, LogEntry, Span, MetricPoint,

  // Chat
  TypingPayload, ReactionPayload, ReadReceiptPayload,
  DeliveryReceiptPayload, FileSharePayload,

  // Presence
  PresencePayload,

  // Jobs
  LiveJobPayload, JobMatchPayload,
  ApplicationUpdatePayload, AvailabilityPayload,

  // Marketplace
  LiveOrderPayload, StockUpdatePayload,
  PriceUpdatePayload, AuctionPayload,

  // Wallet
  WalletBalancePayload, LiveTransactionPayload, EscrowPayload,

  // GPS
  LocationPayload, ETAPayload, RouteUpdatePayload, GeofenceEvent,

  // Dashboard
  KPIPayload, LiveAnalyticsPayload, LiveAlertPayload,

  // Collaboration
  DocumentOperation, TaskUpdatePayload, TeamPresencePayload,

  // Sync
  SyncPayload, SessionSyncPayload,

  // Notifications
  PushRegistrationPayload,
} from './types';