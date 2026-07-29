interface MemEntry<T> { value: T; exp: number | null; }

const MEM = new Map<string, MemEntry<unknown>>();
const LS_PREFIX = 'jf_cache_';

function memSet<T>(key: string, value: T, ttlMs: number): void {
  MEM.set(key, { value, exp: ttlMs > 0 ? Date.now() + ttlMs : null });
}

function memGet<T>(key: string): T | null {
  const entry = MEM.get(key) as MemEntry<T> | undefined;
  if (!entry) return null;
  if (entry.exp !== null && Date.now() > entry.exp) { MEM.delete(key); return null; }
  return entry.value;
}

function lsSet<T>(key: string, value: T, ttlMs: number): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ value, exp: Date.now() + ttlMs }));
  } catch { /* quota exceeded — skip */ }
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: T; exp: number };
    if (Date.now() > parsed.exp) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return parsed.value;
  } catch { return null; }
}

export interface CacheLayer {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T, ttlMs?: number) => void;
  del: (key: string) => void;
  flush: () => void;
}

export const cache = {
  mem: {
    get:   <T>(key: string)                          => memGet<T>(key),
    set:   <T>(key: string, value: T, ttlMs = 60_000) => memSet(key, value, ttlMs),
    del:   (key: string)                             => MEM.delete(key),
    flush: ()                                        => MEM.clear(),
  } satisfies CacheLayer,

  local: {
    get:   <T>(key: string)                                => lsGet<T>(key),
    set:   <T>(key: string, value: T, ttlMs = 5 * 60_000) => lsSet(key, value, ttlMs),
    del:   (key: string)                                   => { try { localStorage.removeItem(LS_PREFIX + key); } catch {} },
    flush: () => {
      try {
        Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX)).forEach((k) => localStorage.removeItem(k));
      } catch {}
    },
  } satisfies CacheLayer,
};

export async function withCache<T>(
  cacheLayer: CacheLayer,
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = cacheLayer.get<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetchFn();
  if (fresh !== null && fresh !== undefined) cacheLayer.set(key, fresh, ttlMs);
  return fresh;
}

window.addEventListener('jf:logout', () => {
  cache.mem.flush();
  cache.local.flush();
});

export default cache;