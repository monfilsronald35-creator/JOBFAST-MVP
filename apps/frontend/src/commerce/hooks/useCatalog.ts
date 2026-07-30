import { useState, useCallback, useRef } from 'react';
import type { Listing, SearchQuery, SearchResult, Category } from '../types';
import { CatalogEngine } from '../engines/CatalogEngine';

export function useCatalog() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const search = useCallback(async (query: SearchQuery): Promise<SearchResult | null> => {
    abort.current?.abort();
    abort.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const r = await CatalogEngine.search(query);
      return r;
    } catch (e) {
      if ((e as { name?: string }).name !== 'AbortError') setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getListing = useCallback(async (id: string): Promise<Listing | null> => {
    setLoading(true); setError(null);
    try {
      return await CatalogEngine.getListing(id);
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (parentId?: string): Promise<Category[]> => {
    setLoading(true); setError(null);
    try {
      return await CatalogEngine.getCategories(parentId);
    } catch (e) {
      setError((e as Error).message); return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createListing = useCallback(async (
    data: Parameters<typeof CatalogEngine.createListing>[0],
  ): Promise<Listing | null> => {
    setLoading(true); setError(null);
    try {
      return await CatalogEngine.createListing(data);
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, getListing, getCategories, createListing, loading, error };
}