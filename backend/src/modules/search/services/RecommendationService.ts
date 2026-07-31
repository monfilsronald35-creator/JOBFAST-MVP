import { db }              from '../../../core/database/SupabaseClient.js';
import type { SearchResult } from '../types/search.types.js';
import { SearchSource }    from '../types/search.types.js';

export const RecommendationService = {
  async forUser(userId: string, limit = 10): Promise<SearchResult[]> {
    // Get user's recent search queries
    const { data: recentQueries } = await db.client()
      .from('srch_queries')
      .select('query, source')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const queries = recentQueries ?? [];

    if (queries.length === 0) {
      // Cold start: return popular items
      return RecommendationService.popular(limit);
    }

    // Build search from recent query terms
    const terms = queries.map(q => String((q as Record<string, unknown>)['query'] ?? '')).join(' ');
    const tsQuery = terms.split(/\s+/).filter(Boolean).slice(0, 5).join(' | ');

    const sources = [...new Set(
      queries
        .map(q => String((q as Record<string, unknown>)['source'] ?? ''))
        .filter(Boolean) as SearchSource[]
    )];

    let q = db.client()
      .from('srch_index')
      .select('*')
      .textSearch('search_vector', tsQuery, { type: 'websearch', config: 'simple' })
      .eq('is_available', true)
      .order('popularity', { ascending: false })
      .limit(limit);

    if (sources.length > 0) q = q.in('source', sources);

    const { data } = await q;
    return (data ?? []).map(r => toBasicResult(r as Record<string, unknown>));
  },

  async popular(limit = 10): Promise<SearchResult[]> {
    const { data } = await db.client()
      .from('srch_index')
      .select('*')
      .eq('is_available', true)
      .order('popularity', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => toBasicResult(r as Record<string, unknown>));
  },

  async nearby(lat: number, lng: number, limit = 10): Promise<SearchResult[]> {
    const latDelta = 10 / 111;
    const lngDelta = 10 / (111 * Math.cos(lat * Math.PI / 180));

    const { data } = await db.client()
      .from('srch_index')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => toBasicResult(r as Record<string, unknown>));
  },

  async similar(sourceId: string, source: SearchSource, limit = 6): Promise<SearchResult[]> {
    const { data: ref } = await db.client()
      .from('srch_index')
      .select('search_vector, country, city')
      .eq('source', source)
      .eq('source_id', sourceId)
      .single();

    if (!ref) return RecommendationService.popular(limit);

    const row = ref as Record<string, unknown>;
    const { data } = await db.client()
      .from('srch_index')
      .select('*')
      .eq('source', source)
      .eq('country', String(row['country'] ?? ''))
      .neq('source_id', sourceId)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => toBasicResult(r as Record<string, unknown>));
  },
};

function toBasicResult(r: Record<string, unknown>): SearchResult {
  return {
    id:          String(r['id'] ?? ''),
    source:      r['source'] as SearchSource,
    sourceId:    String(r['source_id'] ?? ''),
    title:       String(r['title'] ?? ''),
    description: String(r['description'] ?? ''),
    imageUrl:    r['image_url'] ? String(r['image_url']) : undefined,
    actionUrl:   r['action_url'] ? String(r['action_url']) : undefined,
    price:       r['price'] != null ? Number(r['price']) : undefined,
    currency:    r['currency'] ? String(r['currency']) : undefined,
    rating:      r['rating'] != null ? Number(r['rating']) : undefined,
    isVerified:  Boolean(r['is_verified']),
    lat:         r['lat'] != null ? Number(r['lat']) : undefined,
    lng:         r['lng'] != null ? Number(r['lng']) : undefined,
    country:     r['country'] ? String(r['country']) : undefined,
    city:        r['city'] ? String(r['city']) : undefined,
    tags:        r['tags'] as string[] | undefined,
    metadata:    r['metadata'] as Record<string, unknown> | undefined,
    score:       Number(r['popularity'] ?? 0),
    createdAt:   String(r['updated_at'] ?? ''),
  };
}