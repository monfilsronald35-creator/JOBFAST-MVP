import { db }              from '../../../core/database/SupabaseClient.js';
import type {
  SearchIndexEntry, SearchResult, SearchSource, SearchFilters,
} from '../types/search.types.js';

function toResult(r: Record<string, unknown>, distanceKm?: number | undefined, score?: number | undefined): SearchResult {
  return {
    id:            String(r['id'] ?? ''),
    source:        r['source'] as SearchSource,
    sourceId:      String(r['source_id'] ?? ''),
    title:         String(r['title'] ?? ''),
    description:   String(r['description'] ?? ''),
    imageUrl:      r['image_url'] ? String(r['image_url']) : undefined,
    actionUrl:     r['action_url'] ? String(r['action_url']) : undefined,
    price:         r['price'] != null ? Number(r['price']) : undefined,
    currency:      r['currency'] ? String(r['currency']) : undefined,
    rating:        r['rating'] != null ? Number(r['rating']) : undefined,
    isVerified:    Boolean(r['is_verified']),
    lat:           r['lat'] != null ? Number(r['lat']) : undefined,
    lng:           r['lng'] != null ? Number(r['lng']) : undefined,
    distanceKm,
    country:       r['country'] ? String(r['country']) : undefined,
    city:          r['city'] ? String(r['city']) : undefined,
    tags:          r['tags'] as string[] | undefined,
    metadata:      r['metadata'] as Record<string, unknown> | undefined,
    score:         score ?? Number(r['score'] ?? 0),
    createdAt:     String(r['updated_at'] ?? ''),
  };
}

export const SearchRepository = {
  async fullTextSearch(query: string, sources: SearchSource[], filters: SearchFilters, limit: number, cursor?: string | undefined): Promise<SearchResult[]> {
    const tsQuery = query.split(/\s+/).filter(Boolean).join(' & ');

    let q = db.client()
      .from('srch_index')
      .select('*, ts_rank(search_vector, to_tsquery(\'simple\', $1)) as score')
      .textSearch('search_vector', tsQuery, { type: 'websearch', config: 'simple' })
      .eq('is_available', true)
      .order('score', { ascending: false })
      .limit(limit);

    if (sources.length > 0) q = q.in('source', sources);
    if (filters.country)   q = q.eq('country', filters.country);
    if (filters.verified)  q = q.eq('is_verified', true);
    if (filters.rating)    q = q.gte('rating', filters.rating);
    if (filters.priceMin)  q = q.gte('price', filters.priceMin);
    if (filters.priceMax)  q = q.lte('price', filters.priceMax);
    if (cursor)            q = q.lt('updated_at', cursor);

    const { data } = await q;
    return (data ?? []).map(r => toResult(r as Record<string, unknown>));
  },

  async fuzzySearch(query: string, sources: SearchSource[], limit: number): Promise<SearchResult[]> {
    // Build wildcard variants for fuzzy matching via pg_trgm ilike
    const words = query.trim().split(/\s+/).filter(Boolean);
    const pattern = words.map(w => `%${w}%`).join('');

    let q = db.client()
      .from('srch_index')
      .select('*')
      .ilike('title', pattern)
      .eq('is_available', true)
      .limit(limit);

    if (sources.length > 0) q = q.in('source', sources);

    const { data } = await q;
    const rows = data ?? [];
    // Score by how much of the query appears in the title
    return rows.map(r => {
      const row   = r as Record<string, unknown>;
      const title = String(row['title'] ?? '').toLowerCase();
      const matchCount = words.filter(w => title.includes(w.toLowerCase())).length;
      const score = words.length > 0 ? (matchCount / words.length) * 100 : 50;
      return toResult(row, undefined, score);
    }).sort((a, b) => b.score - a.score);
  },

  async geoSearch(lat: number, lng: number, radiusKm: number, sources: SearchSource[], filters: SearchFilters, limit: number): Promise<SearchResult[]> {
    // Haversine approximation: 1 degree latitude ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    let q = db.client()
      .from('srch_index')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .eq('is_available', true)
      .limit(limit * 2); // over-fetch to allow distance sort

    if (sources.length > 0) q = q.in('source', sources);
    if (filters.country)   q = q.eq('country', filters.country);
    if (filters.verified)  q = q.eq('is_verified', true);

    const { data } = await q;
    const rows = data ?? [];

    return rows
      .map(r => {
        const row = r as Record<string, unknown>;
        const rLat = Number(row['lat'] ?? 0);
        const rLng = Number(row['lng'] ?? 0);
        const dist = haversine(lat, lng, rLat, rLng);
        const score = dist <= radiusKm ? Math.max(0, 100 - (dist / radiusKm) * 100) : 0;
        const result = toResult(row, dist);
        result.score = score;
        return result;
      })
      .filter(r => r.score > 0)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, limit);
  },

  async searchByCountryOrCity(country: string, city: string | undefined, sources: SearchSource[], limit: number): Promise<SearchResult[]> {
    let q = db.client()
      .from('srch_index')
      .select('*')
      .eq('country', country)
      .eq('is_available', true)
      .limit(limit);

    if (city) q = q.eq('city', city);
    if (sources.length > 0) q = q.in('source', sources);

    const { data } = await q;
    return (data ?? []).map(r => toResult(r as Record<string, unknown>));
  },

  async upsertEntry(entry: SearchIndexEntry): Promise<void> {
    const row: Record<string, unknown> = {
      source:          entry.source,
      source_id:       entry.sourceId,
      title:           entry.title,
      description:     entry.description,
      is_verified:     entry.isVerified,
      is_premium:      entry.isPremium,
      is_available:    entry.isAvailable,
      popularity:      entry.popularity,
      completion_rate: entry.completionRate,
    };
    if (entry.tags)          row['tags']        = entry.tags;
    if (entry.imageUrl)      row['image_url']   = entry.imageUrl;
    if (entry.actionUrl)     row['action_url']  = entry.actionUrl;
    if (entry.lat != null)   row['lat']         = entry.lat;
    if (entry.lng != null)   row['lng']         = entry.lng;
    if (entry.country)       row['country']     = entry.country;
    if (entry.city)          row['city']        = entry.city;
    if (entry.price != null) row['price']       = entry.price;
    if (entry.currency)      row['currency']    = entry.currency;
    if (entry.rating != null) row['rating']     = entry.rating;
    if (entry.metadata)      row['metadata']    = entry.metadata;

    await db.client()
      .from('srch_index')
      .upsert(row, { onConflict: 'source,source_id' });
  },

  async removeEntry(source: SearchSource, sourceId: string): Promise<void> {
    await db.client()
      .from('srch_index')
      .delete()
      .eq('source', source)
      .eq('source_id', sourceId);
  },

  async getAutocomplete(prefix: string, lang: string, limit: number): Promise<Array<{ term: string; source: string; count: number }>> {
    const { data } = await db.client()
      .from('srch_suggestions')
      .select('term, source, count')
      .ilike('term', `${prefix}%`)
      .eq('lang', lang)
      .order('count', { ascending: false })
      .limit(limit);
    return (data ?? []).map(r => ({
      term:   String((r as Record<string, unknown>)['term'] ?? ''),
      source: String((r as Record<string, unknown>)['source'] ?? ''),
      count:  Number((r as Record<string, unknown>)['count'] ?? 0),
    }));
  },

  async incrementSuggestion(term: string, source: string, lang: string): Promise<void> {
    await db.client()
      .from('srch_suggestions')
      .upsert({ term, source, lang, count: 1 }, { onConflict: 'term,source,lang' });
  },
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a   = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}