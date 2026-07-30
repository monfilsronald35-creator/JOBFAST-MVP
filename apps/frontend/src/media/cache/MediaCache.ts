// 5-level cache: memory → browser Cache API → IndexedDB → ServiceWorker → network

const MEM_MAX_ENTRIES = 500;
const MEM_TTL_MS      = 5 * 60 * 1000;       // 5 min
const CACHE_NAME      = 'media-v1';
const IDB_MEDIA_DB    = 'media_blob_cache';
const IDB_MEDIA_STORE = 'blobs';
const IDB_VERSION     = 1;

interface MemEntry { blob: Blob; expiresAt: number }

const _mem = new Map<string, MemEntry>();

// ——— Level 1: Memory ——————————————————————————————————————————————————————

function memGet(url: string): Blob | null {
  const entry = _mem.get(url);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { _mem.delete(url); return null; }
  return entry.blob;
}

function memSet(url: string, blob: Blob): void {
  if (_mem.size >= MEM_MAX_ENTRIES) {
    // evict oldest entry
    const firstKey = _mem.keys().next().value as string | undefined;
    if (firstKey) _mem.delete(firstKey);
  }
  _mem.set(url, { blob, expiresAt: Date.now() + MEM_TTL_MS });
}

// ——— Level 2: Browser Cache API ——————————————————————————————————————————

async function cacheApiGet(url: string): Promise<Blob | null> {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const hit   = await cache.match(url);
    return hit ? hit.blob() : null;
  } catch { return null; }
}

async function cacheApiSet(url: string, blob: Blob): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const cache    = await caches.open(CACHE_NAME);
    const response = new Response(blob, { headers: { 'Content-Type': blob.type, 'Cache-Control': 'max-age=86400' } });
    await cache.put(url, response);
  } catch { /* non-fatal */ }
}

// ——— Level 3: IndexedDB (large blobs, offline) ——————————————————————————

function openMediaIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_MEDIA_DB, IDB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_MEDIA_STORE, { keyPath: 'url' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGet(url: string): Promise<Blob | null> {
  try {
    const db    = await openMediaIDB();
    const tx    = db.transaction(IDB_MEDIA_STORE, 'readonly');
    const entry = await new Promise<{ url: string; blob: Blob; expiresAt: number } | undefined>((resolve, reject) => {
      const req = tx.objectStore(IDB_MEDIA_STORE).get(url);
      req.onsuccess = () => resolve(req.result as { url: string; blob: Blob; expiresAt: number } | undefined);
      req.onerror   = () => reject(req.error);
    });
    db.close();
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.blob;
  } catch { return null; }
}

async function idbSet(url: string, blob: Blob, ttlMs = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db  = await openMediaIDB();
    const tx  = db.transaction(IDB_MEDIA_STORE, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = tx.objectStore(IDB_MEDIA_STORE).put({ url, blob, expiresAt: Date.now() + ttlMs });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
    db.close();
  } catch { /* non-fatal */ }
}

// ——— Public API ——————————————————————————————————————————————————————————

async function get(url: string): Promise<Blob | null> {
  const mem = memGet(url);
  if (mem) return mem;

  const cacheHit = await cacheApiGet(url);
  if (cacheHit) { memSet(url, cacheHit); return cacheHit; }

  const idbHit = await idbGet(url);
  if (idbHit) { memSet(url, idbHit); void cacheApiSet(url, idbHit); return idbHit; }

  return null;
}

async function fetchAndCache(url: string, ttlMs?: number): Promise<Blob> {
  const cached = await get(url);
  if (cached) return cached;

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  const blob = await res.blob();

  memSet(url, blob);
  void cacheApiSet(url, blob);
  void idbSet(url, blob, ttlMs);

  return blob;
}

async function evict(url: string): Promise<void> {
  _mem.delete(url);
  if ('caches' in window) {
    try { const c = await caches.open(CACHE_NAME); await c.delete(url); } catch { /* ignore */ }
  }
  try {
    const db = await openMediaIDB();
    const tx = db.transaction(IDB_MEDIA_STORE, 'readwrite');
    tx.objectStore(IDB_MEDIA_STORE).delete(url);
    db.close();
  } catch { /* ignore */ }
}

async function clearAll(): Promise<void> {
  _mem.clear();
  if ('caches' in window) {
    try { await caches.delete(CACHE_NAME); } catch { /* ignore */ }
  }
  try {
    const db = await openMediaIDB();
    const tx = db.transaction(IDB_MEDIA_STORE, 'readwrite');
    tx.objectStore(IDB_MEDIA_STORE).clear();
    db.close();
  } catch { /* ignore */ }
}

export const MediaCache = {
  get,
  fetchAndCache,
  evict,
  clearAll,
};
