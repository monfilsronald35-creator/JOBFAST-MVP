/**
 * Frontend Cache — in-memory + localStorage with TTL
 * Reduces API calls; invalidated on logout or stale data events
 */

const MEM = new Map();
const LS_PREFIX = 'jf_cache_';

function memSet(key, value, ttlMs) {
  MEM.set(key, { value, exp: ttlMs > 0 ? Date.now() + ttlMs : null });
}

function memGet(key) {
  const entry = MEM.get(key);
  if (!entry) return null;
  if (entry.exp && Date.now() > entry.exp) { MEM.delete(key); return null; }
  return entry.value;
}

function lsSet(key, value, ttlMs) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ value, exp: Date.now() + ttlMs }));
  } catch { /* quota exceeded — skip */ }
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.exp) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return parsed.value;
  } catch { return null; }
}

export const cache = {
  // Memory only — fast, cleared on page reload
  mem: {
    get: key => memGet(key),
    set: (key, value, ttlMs = 60_000) => memSet(key, value, ttlMs),
    del: key => MEM.delete(key),
    flush: () => MEM.clear(),
  },

  // localStorage — persists across page reloads
  local: {
    get: key => lsGet(key),
    set: (key, value, ttlMs = 5 * 60_000) => lsSet(key, value, ttlMs),
    del: key => { try { localStorage.removeItem(LS_PREFIX + key); } catch {} },
    flush: () => {
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
      } catch {}
    },
  },
};

// Cache-aside helper
export async function withCache(cacheInstance, key, fetchFn, ttlMs) {
  const cached = cacheInstance.get(key);
  if (cached !== null) return cached;
  const fresh = await fetchFn();
  if (fresh !== null && fresh !== undefined) cacheInstance.set(key, fresh, ttlMs);
  return fresh;
}

// Clear all caches on logout
window.addEventListener('jf:logout', () => {
  cache.mem.flush();
  cache.local.flush();
});

export default cache;
