/**
 * Core Cache Manager — in-memory LRU with TTL, Redis-compatible interface
 * Drop-in: replace get/set/del with ioredis calls when Redis is provisioned
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES    = 2000;

class MemoryCache {
  constructor({ maxEntries = MAX_ENTRIES, defaultTtl = DEFAULT_TTL_MS } = {}) {
    this._store      = new Map();
    this._maxEntries = maxEntries;
    this._defaultTtl = defaultTtl;
    this._hits       = 0;
    this._misses     = 0;

    // Periodic sweep of expired entries every 2 minutes
    setInterval(() => this._sweep(), 2 * 60_000).unref();
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) { this._misses++; return null; }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      this._misses++;
      return null;
    }
    // LRU: refresh position
    this._store.delete(key);
    this._store.set(key, entry);
    this._hits++;
    return entry.value;
  }

  set(key, value, ttlMs = this._defaultTtl) {
    if (this._store.has(key)) this._store.delete(key);
    else if (this._store.size >= this._maxEntries) {
      // Evict oldest entry
      this._store.delete(this._store.keys().next().value);
    }
    this._store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
      createdAt: Date.now(),
    });
    return true;
  }

  del(key) { return this._store.delete(key); }

  flush() { this._store.clear(); }

  has(key) { return this.get(key) !== null; }

  // Invalidate all keys matching a prefix
  invalidatePrefix(prefix) {
    let count = 0;
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) { this._store.delete(key); count++; }
    }
    return count;
  }

  stats() {
    const total = this._hits + this._misses;
    return {
      entries:  this._store.size,
      maxEntries: this._maxEntries,
      hits:     this._hits,
      misses:   this._misses,
      hitRate:  total ? ((this._hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }

  _sweep() {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (entry.expiresAt && now > entry.expiresAt) this._store.delete(key);
    }
  }
}

// Cache namespaces with different TTLs
export const cache = {
  // Short-lived (1 min) — search results, feeds
  short:    new MemoryCache({ defaultTtl: 60_000 }),
  // Medium (5 min) — user profiles, categories
  medium:   new MemoryCache({ defaultTtl: 5 * 60_000 }),
  // Long (30 min) — static config, categories list
  long:     new MemoryCache({ defaultTtl: 30 * 60_000 }),
  // Session (15 min) — rate limit state, tokens
  session:  new MemoryCache({ defaultTtl: 15 * 60_000, maxEntries: 5000 }),
};

// Helper: cache-aside pattern
export async function withCache(cacheInstance, key, fetchFn, ttlMs) {
  const cached = cacheInstance.get(key);
  if (cached !== null) return cached;
  const fresh = await fetchFn();
  if (fresh !== null && fresh !== undefined) cacheInstance.set(key, fresh, ttlMs);
  return fresh;
}

export default cache;
