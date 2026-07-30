/**
 * SmartCache — Unified TTL/LRU cache: API, Image, Avatar, Map, Config, Translation, Theme.
 * Backed by OfflineDB stores. Supports stale-while-revalidate, prefetch, invalidation by tag.
 */

import { dbGet, dbSet, dbDelete, dbGetAll, dbCount, type OfflineStoreName } from '../db/OfflineDB';

export type CacheNamespace =
  | 'api'
  | 'image'
  | 'avatar'
  | 'map'
  | 'config'
  | 'translation'
  | 'theme'
  | 'video';

interface CacheEntry<T> {
  data:       T;
  fetchedAt:  number;
  size?:      number;
  etag?:      string;
  headers?:   Record<string, string>;
}

interface CacheOptions {
  ttlMs?:    number;
  staleMs?:  number;
  tags?:     string[];
  priority?: number;
  etag?:     string;
}

interface CacheStats {
  hits:   number;
  misses: number;
  evictions: number;
  staleServed: number;
  size:   number;
}

const STORE_MAP: Record<CacheNamespace, OfflineStoreName> = {
  api:         'config_cache',
  image:       'profiles_cache',
  avatar:      'profiles_cache',
  map:         'map_tiles',
  config:      'config_cache',
  translation: 'config_cache',
  theme:       'config_cache',
  video:       'marketplace_cache',
};

const DEFAULT_TTL: Record<CacheNamespace, number> = {
  api:         5  * 60_000,
  image:       24 * 60 * 60_000,
  avatar:      24 * 60 * 60_000,
  map:         7  * 24 * 60 * 60_000,
  config:      60 * 60_000,
  translation: 24 * 60 * 60_000,
  theme:       24 * 60 * 60_000,
  video:       2  * 60 * 60_000,
};

const MAX_COUNTS: Record<CacheNamespace, number> = {
  api:         500,
  image:       200,
  avatar:      500,
  map:         2000,
  config:      100,
  translation: 100,
  theme:       10,
  video:       20,
};

// ─── SmartCache ───────────────────────────────────────────────────────────────

class SmartCacheImpl {
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, staleServed: 0, size: 0 };
  private revalidating: Set<string> = new Set();

  private cacheKey(namespace: CacheNamespace, key: string): string {
    return `${namespace}::${key}`;
  }

  // ─── Get ──────────────────────────────────────────────────────────────────

  async get<T = unknown>(
    namespace: CacheNamespace,
    key:       string,
    fetcher?:  () => Promise<T>,
    opts:      CacheOptions = {},
  ): Promise<T | null> {
    const ck    = this.cacheKey(namespace, key);
    const store = STORE_MAP[namespace];
    const rec   = await dbGet<CacheEntry<T>>(store, ck);
    const ttl   = opts.ttlMs ?? DEFAULT_TTL[namespace];
    const stale = opts.staleMs ?? ttl * 2;
    const now   = Date.now();

    if (rec) {
      const age  = now - rec.data.fetchedAt;
      const fresh = age < ttl;
      const usable = age < stale;

      if (fresh) {
        this.stats.hits++;
        return rec.data.data;
      }

      if (usable && fetcher) {
        this.stats.staleServed++;
        if (!this.revalidating.has(ck)) {
          this.revalidating.add(ck);
          void fetcher().then(data => this.set(namespace, key, data, opts))
            .finally(() => this.revalidating.delete(ck));
        }
        return rec.data.data;
      }
    }

    this.stats.misses++;

    if (!fetcher) return null;

    try {
      const data = await fetcher();
      await this.set(namespace, key, data, opts);
      return data;
    } catch {
      return rec?.data.data ?? null;
    }
  }

  // ─── Set ──────────────────────────────────────────────────────────────────

  async set<T = unknown>(
    namespace: CacheNamespace,
    key:       string,
    data:      T,
    opts:      CacheOptions = {},
  ): Promise<void> {
    const ck    = this.cacheKey(namespace, key);
    const store = STORE_MAP[namespace];
    const ttl   = opts.ttlMs ?? DEFAULT_TTL[namespace];

    const entry: CacheEntry<T> = {
      data,
      fetchedAt: Date.now(),
      etag:      opts.etag,
      size:      JSON.stringify(data).length,
    };

    await dbSet(store, ck, entry, { ttlMs: ttl * 2, tags: opts.tags });
    await this.maybeEvict(namespace);
    this.stats.size++;
  }

  // ─── Delete / Invalidate ──────────────────────────────────────────────────

  async delete(namespace: CacheNamespace, key: string): Promise<void> {
    await dbDelete(STORE_MAP[namespace], this.cacheKey(namespace, key));
  }

  async invalidateByTag(namespace: CacheNamespace, tag: string): Promise<void> {
    const store = STORE_MAP[namespace];
    const all   = await dbGetAll<CacheEntry<unknown>>(store, {
      filterFn: r => !!r.tags?.includes(tag),
    });
    await Promise.all(all.map(r => dbDelete(store, r.id)));
  }

  async invalidateByPattern(namespace: CacheNamespace, pattern: RegExp): Promise<void> {
    const store  = STORE_MAP[namespace];
    const prefix = `${namespace}::`;
    const all    = await dbGetAll<CacheEntry<unknown>>(store, {
      filterFn: r => r.id.startsWith(prefix) && pattern.test(r.id.slice(prefix.length)),
    });
    await Promise.all(all.map(r => dbDelete(store, r.id)));
  }

  // ─── Prefetch ─────────────────────────────────────────────────────────────

  async prefetch<T>(
    namespace: CacheNamespace,
    key:       string,
    fetcher:   () => Promise<T>,
    opts:      CacheOptions = {},
  ): Promise<void> {
    const ck    = this.cacheKey(namespace, key);
    const store = STORE_MAP[namespace];
    const rec   = await dbGet<CacheEntry<T>>(store, ck);
    const ttl   = opts.ttlMs ?? DEFAULT_TTL[namespace];

    if (rec && Date.now() - rec.data.fetchedAt < ttl) return;

    try {
      const data = await fetcher();
      await this.set(namespace, key, data, opts);
    } catch { /* silent fail for prefetch */ }
  }

  async prefetchBatch<T>(
    namespace: CacheNamespace,
    items:     Array<{ key: string; fetcher: () => Promise<T>; opts?: CacheOptions }>,
  ): Promise<void> {
    await Promise.allSettled(items.map(i => this.prefetch(namespace, i.key, i.fetcher, i.opts)));
  }

  // ─── Fetch with cache (convenience) ──────────────────────────────────────

  async fetchCached<T>(
    namespace: CacheNamespace,
    url:       string,
    init?:     RequestInit,
    opts?:     CacheOptions,
  ): Promise<T | null> {
    return this.get<T>(namespace, url, async () => {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }, opts);
  }

  // ─── Image as data URL ────────────────────────────────────────────────────

  async getImageDataUrl(url: string): Promise<string | null> {
    return this.get<string>('image', url, async () => {
      const res    = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob   = await res.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    }, { ttlMs: DEFAULT_TTL.image });
  }

  // ─── Map tile (binary) ────────────────────────────────────────────────────

  async getMapTile(tileUrl: string): Promise<string | null> {
    return this.get<string>('map', tileUrl, async () => {
      const res  = await fetch(tileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    }, { ttlMs: DEFAULT_TTL.map });
  }

  // ─── Eviction (LRU-ish — remove oldest when over limit) ──────────────────

  private async maybeEvict(namespace: CacheNamespace): Promise<void> {
    const store  = STORE_MAP[namespace];
    const prefix = `${namespace}::`;
    const count  = await dbCount(store);
    const max    = MAX_COUNTS[namespace];

    if (count <= max) return;

    const all = await dbGetAll(store, {
      filterFn: r => r.id.startsWith(prefix),
    });
    all.sort((a, b) => a.updatedAt - b.updatedAt);
    const toEvict = all.slice(0, count - max + 10);
    await Promise.all(toEvict.map(r => dbDelete(store, r.id)));
    this.stats.evictions += toEvict.length;
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  getStats(): CacheStats { return { ...this.stats }; }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, staleServed: 0, size: 0 };
  }
}

export const SmartCache = new SmartCacheImpl();