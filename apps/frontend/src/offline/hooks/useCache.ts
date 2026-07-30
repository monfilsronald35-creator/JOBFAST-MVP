import { useCallback, useEffect, useRef, useState } from 'react';
import { SmartCache, type CacheNamespace } from '../cache/SmartCache';

export interface UseCacheOptions<T> {
  namespace:   CacheNamespace;
  key:         string;
  fetcher?:    () => Promise<T>;
  ttlMs?:      number;
  tags?:       string[];
  autoFetch?:  boolean;
}

export interface UseCacheReturn<T> {
  data:        T | null;
  isLoading:   boolean;
  error:       string | null;
  refetch:     () => Promise<void>;
  invalidate:  () => Promise<void>;
  set:         (data: T) => Promise<void>;
  prefetch:    () => Promise<void>;
}

export function useCache<T = unknown>(opts: UseCacheOptions<T>): UseCacheReturn<T> {
  const { namespace, key, fetcher, ttlMs, tags, autoFetch = true } = opts;

  const [data,      setData]      = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await SmartCache.get<T>(namespace, key, fetcher, { ttlMs, tags });
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [namespace, key, fetcher, ttlMs, tags]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch) void fetch_();
    return () => { mountedRef.current = false; };
  }, [fetch_, autoFetch]);

  const invalidate = useCallback(async () => {
    await SmartCache.delete(namespace, key);
    if (autoFetch) await fetch_();
  }, [namespace, key, autoFetch, fetch_]);

  const set = useCallback(async (newData: T) => {
    await SmartCache.set(namespace, key, newData, { ttlMs, tags });
    setData(newData);
  }, [namespace, key, ttlMs, tags]);

  const prefetch = useCallback(async () => {
    if (!fetcher) return;
    await SmartCache.prefetch(namespace, key, fetcher, { ttlMs, tags });
  }, [namespace, key, fetcher, ttlMs, tags]);

  return { data, isLoading, error, refetch: fetch_, invalidate, set, prefetch };
}