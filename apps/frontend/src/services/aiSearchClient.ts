/**
 * AI Search Client — Enterprise backend-driven search engine.
 * Supports: semantic search, vector similarity, intent detection,
 * multi-language (Kreyòl/FR/EN/ES), voice query, geo-ranked results.
 */
import API from '../api/axios';
import type { ApiResponse, PaginatedResponse, GeoCoordinates } from '../types';

export interface SearchQuery {
  readonly text: string;
  readonly language?: string;
  readonly intent?: 'hire' | 'buy' | 'rent' | 'book' | 'general';
  readonly geo?: GeoCoordinates;
  readonly categoryId?: string;
  readonly filters?: Record<string, unknown>;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface SearchResult {
  readonly id: string;
  readonly type: 'worker' | 'job' | 'listing' | 'company' | 'event';
  readonly title: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly score: number;
  readonly distance?: number;
  readonly metadata: Record<string, unknown>;
}

export interface AutocompleteResult {
  readonly suggestions: readonly string[];
  readonly intents: readonly string[];
}

const aiSearchClient = {
  /** Semantic full-text search with AI ranking */
  search: async (query: SearchQuery): Promise<PaginatedResponse<SearchResult>> => {
    const res = await API.post<ApiResponse<PaginatedResponse<SearchResult>>>('/ai/search', query);
    return res.data.data;
  },

  /** Autocomplete / typeahead suggestions */
  autocomplete: async (text: string, language?: string): Promise<AutocompleteResult> => {
    const res = await API.get<ApiResponse<AutocompleteResult>>('/ai/search/autocomplete', {
      params: { text, language },
    });
    return res.data.data;
  },

  /** Voice-to-text then search */
  voiceSearch: async (audioBlob: Blob, geo?: GeoCoordinates): Promise<PaginatedResponse<SearchResult>> => {
    const form = new FormData();
    form.append('audio', audioBlob, 'query.webm');
    if (geo) {
      form.append('lat', String(geo.lat));
      form.append('lng', String(geo.lng));
    }
    const res = await API.post<ApiResponse<PaginatedResponse<SearchResult>>>('/ai/search/voice', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  /** Log a search event for personalization */
  trackSearch: async (query: string, selectedId?: string): Promise<void> => {
    await API.post('/ai/search/track', { query, selectedId }).catch(() => {});
  },

  /** Get personalized search history */
  getHistory: async (limit = 20): Promise<readonly string[]> => {
    const res = await API.get<ApiResponse<readonly string[]>>('/ai/search/history', {
      params: { limit },
    });
    return res.data.data;
  },

  /** Clear search history */
  clearHistory: async (): Promise<void> => {
    await API.delete('/ai/search/history');
  },
};

export { aiSearchClient };
export default aiSearchClient;