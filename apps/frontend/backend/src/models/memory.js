// src/models/memory.js

class MemoryStore {
  constructor(options = {}) {
    this.store = new Map();
    this.defaultTTL = options.defaultTTL ?? 1000 * 60 * 10;
    this.cleanupInterval = options.cleanupInterval ?? 1000 * 60 * 5;
    this.maxSize = options.maxSize ?? 5000;
    this.hits = 0;
    this.misses = 0;
    this._timer = null;

    this._startCleanup();
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this._evictOldest();
    }

    const now = Date.now();

    this.store.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccess: now,
    });

    return true;
  }

  get(key) {
    const data = this.store.get(key);

    if (!data) {
      this.misses++;
      return null;
    }

    if (Date.now() > data.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    data.accessCount += 1;
    data.lastAccess = Date.now();
    this.hits += 1;

    return data.value;
  }

  has(key) {
    const data = this.store.get(key);
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  keys() {
    return [...this.store.keys()];
  }

  size() {
    return this.store.size;
  }

  cleanup() {
    const now = Date.now();

    for (const [key, data] of this.store.entries()) {
      if (now > data.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  _evictOldest() {
    const oldestKey = this.store.keys().next().value;
    if (oldestKey !== undefined) {
      this.store.delete(oldestKey);
    }
  }

  _startCleanup() {
    this._timer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);

    if (this._timer?.unref) {
      this._timer.unref();
    }
  }

  dispose() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  stats() {
    const total = this.hits + this.misses;

    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Number(((this.hits / total) * 100).toFixed(2)),
    };
  }

  dump() {
    const now = Date.now();

    return [...this.store.entries()].map(([key, data]) => ({
      key,
      value: data.value,
      ttlLeft: Math.max(0, data.expiresAt - now),
      accessCount: data.accessCount,
      createdAt: data.createdAt,
      lastAccess: data.lastAccess,
    }));
  }
}

const memory = new MemoryStore();

export default memory;
