import { useState, useEffect, useCallback } from 'react';
import type { RecommendationItem, RecommendationRequest } from '../types';
import { RecommendationEngine } from '../engines/RecommendationEngine';

export function useRecommendations(userId: string, domain: RecommendationRequest['domain'], limit = 10) {
  const [items,   setItems]   = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async (context?: RecommendationRequest['context']) => {
    setLoading(true);
    setError(null);
    try {
      const results = await RecommendationEngine.recommend({ userId, domain, limit, context });
      setItems(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, domain, limit]);

  useEffect(() => { void load(); }, [load]);

  return { items, loading, error, refresh: load };
}

export function useSimilarItems(itemId: string, domain: string, limit = 5) {
  const [items,   setItems]   = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    RecommendationEngine.getSimilarItems(itemId, domain, limit)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [itemId, domain, limit]);

  return { items, loading };
}