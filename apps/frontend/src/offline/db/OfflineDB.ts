/**
 * JOBFAST Offline Database — Enterprise IndexedDB schema (separate from jobfast_db v2).
 * Stores: jobs, marketplace, wallet, messages, profiles, map_tiles, sync_state,
 *         conflicts, upload_queue, config_cache.
 *
 * Companion to src/lib/indexedDb.ts (which handles: offline_queue, draft_jobs,
 * chat_cache, media_cache, user_context). Never open the same store from both files.
 */

const DB_NAME    = 'jobfast_offline';
const DB_VERSION = 1;

export type OfflineStoreName =
  | 'jobs_cache'
  | 'marketplace_cache'
  | 'wallet_cache'
  | 'messages_cache'
  | 'profiles_cache'
  | 'map_tiles'
  | 'upload_queue'
  | 'sync_state'
  | 'conflicts'
  | 'config_cache';

export interface OfflineRecord<T = unknown> {
  id:        string;
  data:      T;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  version:   number;
  synced:    boolean;
  tags?:     string[];
}

export interface SyncStateRecord {
  namespace:    string;
  lastSyncAt:   number;
  lastVersion:  number;
  vectorClock:  Record<string, number>;
  pendingCount: number;
  errorCount:   number;
}

export interface ConflictRecord {
  id:          string;
  namespace:   string;
  localValue:  unknown;
  remoteValue: unknown;
  localVersion: number;
  remoteVersion: number;
  resolution:  'pending' | 'local_win' | 'remote_win' | 'merged' | 'manual';
  resolvedAt?: number;
  createdAt:   number;
}

export interface UploadQueueRecord {
  id:           string;
  fileId:       string;
  fileName:     string;
  fileSize:     number;
  mimeType:     string;
  chunks:       number;
  uploadedChunks: number;
  uploadUrl:    string;
  uploadedUrl?: string;
  status:       'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  attempts:     number;
  maxAttempts:  number;
  nextRetryAt:  number;
  createdAt:    number;
  completedAt?: number;
  error?:       string;
  priority:     'critical' | 'high' | 'normal' | 'low';
}

// ─── Schema definition ────────────────────────────────────────────────────────

interface StoreSpec {
  name: OfflineStoreName;
  keyPath: string;
  indexes: Array<{ name: string; keyPath: string; unique?: boolean; multiEntry?: boolean }>;
}

const STORES: StoreSpec[] = [
  {
    name: 'jobs_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt',  keyPath: 'updatedAt' },
      { name: 'expiresAt',  keyPath: 'expiresAt' },
      { name: 'synced',     keyPath: 'synced' },
      { name: 'tags',       keyPath: 'tags', multiEntry: true },
    ],
  },
  {
    name: 'marketplace_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'expiresAt', keyPath: 'expiresAt' },
      { name: 'synced',    keyPath: 'synced' },
    ],
  },
  {
    name: 'wallet_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'synced',    keyPath: 'synced' },
    ],
  },
  {
    name: 'messages_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt',        keyPath: 'updatedAt' },
      { name: 'expiresAt',        keyPath: 'expiresAt' },
      { name: 'conversationId',   keyPath: 'data.conversationId' },
    ],
  },
  {
    name: 'profiles_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'expiresAt', keyPath: 'expiresAt' },
    ],
  },
  {
    name: 'map_tiles',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'expiresAt', keyPath: 'expiresAt' },
      { name: 'zoom',      keyPath: 'data.zoom' },
    ],
  },
  {
    name: 'upload_queue',
    keyPath: 'id',
    indexes: [
      { name: 'status',     keyPath: 'status' },
      { name: 'priority',   keyPath: 'priority' },
      { name: 'nextRetryAt', keyPath: 'nextRetryAt' },
    ],
  },
  {
    name: 'sync_state',
    keyPath: 'namespace',
    indexes: [
      { name: 'lastSyncAt', keyPath: 'lastSyncAt' },
    ],
  },
  {
    name: 'conflicts',
    keyPath: 'id',
    indexes: [
      { name: 'namespace',  keyPath: 'namespace' },
      { name: 'resolution', keyPath: 'resolution' },
      { name: 'createdAt',  keyPath: 'createdAt' },
    ],
  },
  {
    name: 'config_cache',
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt' },
      { name: 'expiresAt', keyPath: 'expiresAt' },
    ],
  },
];

// ─── Connection singleton ──────────────────────────────────────────────────────

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      for (const spec of STORES) {
        if (db.objectStoreNames.contains(spec.name)) continue;
        const store = db.createObjectStore(spec.name, { keyPath: spec.keyPath });
        for (const idx of spec.indexes) {
          store.createIndex(idx.name, idx.keyPath, {
            unique:     idx.unique     ?? false,
            multiEntry: idx.multiEntry ?? false,
          });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => {
      _dbPromise = null;
      reject(new Error(`OfflineDB open failed: ${req.error?.message}`));
    };
    req.onblocked = () => {
      console.warn('[OfflineDB] upgrade blocked — close other tabs');
    };
  });

  return _dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

async function store(name: OfflineStoreName, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

export async function dbGet<T>(storeName: OfflineStoreName, id: string): Promise<OfflineRecord<T> | null> {
  const s   = await store(storeName, 'readonly');
  const rec = await promisify<OfflineRecord<T> | undefined>(
    s.get(id) as IDBRequest<OfflineRecord<T> | undefined>,
  );
  if (!rec) return null;
  if (rec.expiresAt && rec.expiresAt < Date.now()) {
    void dbDelete(storeName, id);
    return null;
  }
  return rec;
}

export async function dbSet<T>(
  storeName: OfflineStoreName,
  id:        string,
  data:      T,
  options:   { ttlMs?: number; version?: number; synced?: boolean; tags?: string[] } = {},
): Promise<void> {
  const now = Date.now();
  const existing = await dbGet<T>(storeName, id);
  const rec: OfflineRecord<T> = {
    id,
    data,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    expiresAt: options.ttlMs ? now + options.ttlMs : existing?.expiresAt,
    version:   options.version ?? (existing?.version ?? 0) + 1,
    synced:    options.synced  ?? false,
    tags:      options.tags    ?? existing?.tags,
  };
  const s = await store(storeName, 'readwrite');
  await promisify(s.put(rec));
}

export async function dbDelete(storeName: OfflineStoreName, id: string): Promise<void> {
  const s = await store(storeName, 'readwrite');
  await promisify(s.delete(id));
}

export async function dbGetAll<T>(
  storeName: OfflineStoreName,
  options:   { limit?: number; filterFn?: (rec: OfflineRecord<T>) => boolean } = {},
): Promise<OfflineRecord<T>[]> {
  const s    = await store(storeName, 'readonly');
  const all  = await promisify<OfflineRecord<T>[]>(s.getAll() as IDBRequest<OfflineRecord<T>[]>);
  const now  = Date.now();
  const live = all.filter(r => !r.expiresAt || r.expiresAt > now);
  const filtered = options.filterFn ? live.filter(options.filterFn) : live;
  return options.limit ? filtered.slice(0, options.limit) : filtered;
}

export async function dbClear(storeName: OfflineStoreName): Promise<void> {
  const s = await store(storeName, 'readwrite');
  await promisify(s.clear());
}

export async function dbCount(storeName: OfflineStoreName): Promise<number> {
  const s = await store(storeName, 'readonly');
  return promisify(s.count());
}

// ─── Batch operations ─────────────────────────────────────────────────────────

export async function dbBatchSet<T>(
  storeName: OfflineStoreName,
  records:   Array<{ id: string; data: T; options?: Parameters<typeof dbSet>[3] }>,
): Promise<void> {
  const db   = await openDB();
  const tx   = db.transaction(storeName, 'readwrite');
  const s    = tx.objectStore(storeName);
  const now  = Date.now();

  const writes = records.map(({ id, data, options }) => {
    const rec: OfflineRecord<T> = {
      id,
      data,
      createdAt: now,
      updatedAt: now,
      expiresAt: options?.ttlMs ? now + options.ttlMs : undefined,
      version:   options?.version ?? 1,
      synced:    options?.synced ?? false,
      tags:      options?.tags,
    };
    return promisify(s.put(rec));
  });

  await Promise.all(writes);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

// ─── Sync state ──────────────────────────────────────────────────────────────

export async function getSyncState(namespace: string): Promise<SyncStateRecord | null> {
  const s   = await store('sync_state', 'readonly');
  const rec = await promisify<SyncStateRecord | undefined>(
    s.get(namespace) as IDBRequest<SyncStateRecord | undefined>,
  );
  return rec ?? null;
}

export async function setSyncState(state: SyncStateRecord): Promise<void> {
  const s = await store('sync_state', 'readwrite');
  await promisify(s.put(state));
}

// ─── Conflicts ───────────────────────────────────────────────────────────────

export async function addConflict(conflict: Omit<ConflictRecord, 'id' | 'createdAt'>): Promise<string> {
  const id  = crypto.randomUUID();
  const rec: ConflictRecord = { id, createdAt: Date.now(), ...conflict };
  const s   = await store('conflicts', 'readwrite');
  await promisify(s.put(rec));
  return id;
}

export async function getPendingConflicts(): Promise<ConflictRecord[]> {
  const s   = await store('conflicts', 'readonly');
  const all = await promisify<ConflictRecord[]>(s.getAll() as IDBRequest<ConflictRecord[]>);
  return all.filter(c => c.resolution === 'pending');
}

export async function resolveConflict(
  id:         string,
  resolution: ConflictRecord['resolution'],
): Promise<void> {
  const s   = await store('conflicts', 'readwrite');
  const rec = await promisify<ConflictRecord>(s.get(id) as IDBRequest<ConflictRecord>);
  if (!rec) return;
  await promisify(s.put({ ...rec, resolution, resolvedAt: Date.now() }));
}

// ─── Upload queue ────────────────────────────────────────────────────────────

export async function enqueueUpload(record: Omit<UploadQueueRecord, 'id' | 'createdAt' | 'attempts' | 'status' | 'uploadedChunks'>): Promise<string> {
  const id  = crypto.randomUUID();
  const rec: UploadQueueRecord = {
    id,
    attempts: 0,
    status: 'pending',
    uploadedChunks: 0,
    createdAt: Date.now(),
    ...record,
  };
  const s = await store('upload_queue', 'readwrite');
  await promisify(s.put(rec));
  return id;
}

export async function getUploadQueue(): Promise<UploadQueueRecord[]> {
  const s   = await store('upload_queue', 'readonly');
  const all = await promisify<UploadQueueRecord[]>(s.getAll() as IDBRequest<UploadQueueRecord[]>);
  return all.filter(r => r.status !== 'completed').sort((a, b) => {
    const pOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

export async function updateUploadRecord(id: string, update: Partial<UploadQueueRecord>): Promise<void> {
  const s   = await store('upload_queue', 'readwrite');
  const rec = await promisify<UploadQueueRecord>(s.get(id) as IDBRequest<UploadQueueRecord>);
  if (!rec) return;
  await promisify(s.put({ ...rec, ...update }));
}

// ─── Eviction ────────────────────────────────────────────────────────────────

export async function evictExpired(storeName: OfflineStoreName): Promise<number> {
  const s   = await store(storeName, 'readwrite');
  const all = await promisify<OfflineRecord[]>(s.getAll() as IDBRequest<OfflineRecord[]>);
  const now = Date.now();
  const expired = all.filter(r => r.expiresAt && r.expiresAt < now);
  await Promise.all(expired.map(r => promisify(s.delete(r.id))));
  return expired.length;
}

export async function getStorageStats(): Promise<Record<OfflineStoreName, number>> {
  const names: OfflineStoreName[] = [
    'jobs_cache', 'marketplace_cache', 'wallet_cache', 'messages_cache',
    'profiles_cache', 'map_tiles', 'upload_queue', 'sync_state', 'conflicts', 'config_cache',
  ];
  const counts = await Promise.all(names.map(n => dbCount(n)));
  return Object.fromEntries(names.map((n, i) => [n, counts[i]])) as Record<OfflineStoreName, number>;
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function offlineDbHealth(): Promise<{ ok: boolean; storeCount: number; error?: string }> {
  try {
    const db = await openDB();
    return { ok: true, storeCount: db.objectStoreNames.length };
  } catch (err) {
    return { ok: false, storeCount: 0, error: String(err) };
  }
}