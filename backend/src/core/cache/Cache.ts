// Cache abstraction — backed by in-memory LRU for MVP; swap for Redis when needed

interface CacheEntry<T> { value: T; expiresAt: number }

const MAX_ENTRIES = 5_000;

class InMemoryCache {
  private readonly _store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this._store.size >= MAX_ENTRIES) {
      // Evict oldest
      const first = this._store.keys().next().value as string | undefined;
      if (first) this._store.delete(first);
    }
    this._store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  get<T>(key: string): T | null {
    const entry = this._store.get(key);
    if (!entry)                         return null;
    if (entry.expiresAt < Date.now()) { this._store.delete(key); return null; }
    return entry.value as T;
  }

  del(key: string): void { this._store.delete(key); }

  delPattern(prefix: string): void {
    for (const k of this._store.keys()) {
      if (k.startsWith(prefix)) this._store.delete(k);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    this.set(key, value, ttlSeconds);
    return value;
  }

  size(): number { return this._store.size; }

  flush(): void { this._store.clear(); }
}

export const Cache = new InMemoryCache();

// Cache key builders — prevents collisions between modules
export const CacheKeys = {
  user:         (id: string)   => `user:${id}`,
  userEmail:    (email: string) => `user:email:${email}`,
  job:          (id: string)   => `job:${id}`,
  jobList:      (page: number) => `job:list:${page}`,
  media:        (id: string)   => `media:${id}`,
  profile:      (id: string)   => `profile:${id}`,
  session:      (token: string) => `session:${token}`,
  notification: (userId: string) => `notif:${userId}`,
};
