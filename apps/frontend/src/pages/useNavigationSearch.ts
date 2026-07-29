import { useState, useCallback } from 'react';
import API from '../api/axios';

export function useNavigationSearch() {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<unknown[]>([]);
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await API.get<{ results?: unknown[] } | unknown[]>('/navigation/search', { params: { q } });
      const data = res.data;
      setResults(Array.isArray(data) ? data : ((data as { results?: unknown[] }).results ?? []));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  return { query, setQuery, results, searching, error, handleSearch, setResults };
}