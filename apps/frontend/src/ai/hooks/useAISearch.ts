import { useState, useCallback, useRef } from 'react';
import type { AISearchResult, AISearchRequest } from '../types';
import { SearchEngine } from '../engines/SearchEngine';

export function useAISearch(defaultDomain?: string) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<AISearchResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string, options?: Partial<AISearchRequest>) => {
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const res = await SearchEngine.search({ query: q, domain: defaultDomain, ...options });
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [defaultDomain]);

  const suggest = useCallback((partial: string) => {
    clearTimeout(debounceRef.current);
    if (partial.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const s = await SearchEngine.suggest(partial, defaultDomain).catch(() => []);
      setSuggestions(s);
    }, 300);
  }, [defaultDomain]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
    setError(null);
  }, []);

  return { query, results, loading, error, suggestions, search, suggest, clear };
}