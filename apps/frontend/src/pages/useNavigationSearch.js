import { useState, useCallback } from 'react';
import API from '../api/axios';

/**
 * useNavigationSearch — search for map destinations via backend.
 */
export function useNavigationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async (searchQuery) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await API.get('/navigation/search', { params: { q } });
      setResults(res.data?.results ?? res.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  return { query, setQuery, results, searching, error, handleSearch, setResults };
}