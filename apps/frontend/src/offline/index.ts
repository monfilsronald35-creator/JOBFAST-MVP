/**
 * JOBFAST Offline First Architecture — Public API
 *
 * Usage:
 *   // 1. Wrap app (inside RealtimeProvider)
 *   import { OfflineProvider } from '@/offline';
 *   <OfflineProvider><App /></OfflineProvider>
 *
 *   // 2. Domain queues
 *   import { CreateQueue, PaymentQueue, JobQueue } from '@/offline';
 *   await CreateQueue.enqueue('/api/jobs', body);
 *
 *   // 3. Smart cache
 *   import { SmartCache } from '@/offline';
 *   const jobs = await SmartCache.get('api', '/api/jobs');
 *
 *   // 4. React hooks
 *   import { useOffline, useSync, useCache, useUpload } from '@/offline';
 */

// ── Provider ─────────────────────────────────────────────────────────────────
export { OfflineProvider, useOfflineContext }  from './providers/OfflineProvider';
export type { OfflineProviderProps, OfflineContextValue } from './providers/OfflineProvider';

// ── Database ──────────────────────────────────────────────────────────────────
export {
  dbGet, dbSet, dbDelete, dbGetAll, dbClear, dbCount, dbBatchSet,
  getSyncState, setSyncState,
  addConflict, getPendingConflicts, resolveConflict,
  enqueueUpload, getUploadQueue, updateUploadRecord,
  evictExpired, getStorageStats, offlineDbHealth,
} from './db/OfflineDB';
export type {
  OfflineStoreName, OfflineRecord, SyncStateRecord,
  ConflictRecord, UploadQueueRecord,
} from './db/OfflineDB';

export {
  deriveKey, clearDerivedKey, encrypt, decrypt,
  setSecure, getSecure, removeSecure,
  SecureTokenStore,
  setEncryptedBlob, getEncryptedBlob,
} from './db/EncryptedStorage';

// ── Queue ─────────────────────────────────────────────────────────────────────
export {
  CreateQueue, UpdateQueue, DeleteQueue,
  PaymentQueue, UploadQueue, NotificationQueue,
  JobQueue, MarketplaceQueue,
  getQueueStats, getDueItems, sortByPriority,
  removeOfflineItem, markRetry, getTotalPending,
} from './queue/DomainQueues';
export type { QueueDomain, QueuePriority, QueuePayload, QueueItem, EnqueueOptions } from './queue/DomainQueues';

export { queueProcessor, QueueProcessor }  from './queue/QueueProcessor';
export type { ProcessorConfig, ProcessorStats } from './queue/QueueProcessor';

// ── Sync ──────────────────────────────────────────────────────────────────────
export { syncEngine, SyncEngine }  from './sync/SyncEngine';
export type { SyncStatus, SyncMode, SyncNamespace, SyncResult, SyncEngineState } from './sync/SyncEngine';

export {
  resolveLWW, mergeVectorClocks, compareVectorClocks,
  threeWayMerge, mergeArrays,
  rollbackManager, RollbackManager,
  resolve,
} from './sync/ConflictResolver';
export type { MergeStrategy, VersionedValue, MergeResult } from './sync/ConflictResolver';

// ── Cache ─────────────────────────────────────────────────────────────────────
export { SmartCache }  from './cache/SmartCache';
export type { CacheNamespace } from './cache/SmartCache';

// ── Network ───────────────────────────────────────────────────────────────────
export { NetworkIntelligence }  from './network/NetworkIntelligence';
export type { BandwidthClass, NetworkProfile, AdaptiveConfig, RetryOptions } from './network/NetworkIntelligence';

// ── Upload ────────────────────────────────────────────────────────────────────
export { FileUploadEngine }  from './upload/FileUploadEngine';
export type { UploadTask, UploadOptions, UploadStatus } from './upload/FileUploadEngine';

// ── Security ──────────────────────────────────────────────────────────────────
export { OfflineAuth, BiometricAuth }  from './security/OfflineAuth';
export type { OfflineAuthState, BiometricCapability } from './security/OfflineAuth';

export { DeviceIntegrity }  from './security/DeviceIntegrity';
export type { DeviceInfo, IntegrityReport } from './security/DeviceIntegrity';

// ── Monitoring ────────────────────────────────────────────────────────────────
export { OfflineMonitor }  from './monitoring/OfflineMonitor';
export type { OfflineHealthReport, OfflineMetrics } from './monitoring/OfflineMonitor';

// ── SW registration ───────────────────────────────────────────────────────────
export { registerSW, onSWStateChange, applyUpdate, getState as getSWState } from './sw/register';
export type { SWStatus, SWRegistrationState } from './sw/register';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useOffline }         from './hooks/useOffline';
export { useSync }            from './hooks/useSync';
export { useCache }           from './hooks/useCache';
export { useQueue }           from './hooks/useQueue';
export { useUpload }          from './hooks/useUpload';
export { useOfflineMonitor }  from './hooks/useOfflineMonitor';

export type { UseOfflineReturn }       from './hooks/useOffline';
export type { UseSyncReturn }          from './hooks/useSync';
export type { UseCacheOptions, UseCacheReturn } from './hooks/useCache';
export type { UseQueueReturn }         from './hooks/useQueue';
export type { UseUploadReturn }        from './hooks/useUpload';
export type { UseOfflineMonitorReturn } from './hooks/useOfflineMonitor';
