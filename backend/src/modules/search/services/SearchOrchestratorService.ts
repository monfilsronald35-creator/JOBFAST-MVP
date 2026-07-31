import { SearchRepository }           from '../repositories/SearchRepository.js';
import { SearchAnalyticsRepository }  from '../repositories/SearchAnalyticsRepository.js';
import { RankingEngine }             from './RankingEngine.js';
import { AISearchService }           from './AISearchService.js';
import { AutocompleteService }       from './AutocompleteService.js';
import {
  SearchMode, SearchSource,
} from '../types/search.types.js';
import type { SearchQuery, SearchResponse, SearchResult } from '../types/search.types.js';

const ALL_SOURCES = Object.values(SearchSource);
const DEFAULT_LIMIT = 20;

export const SearchOrchestratorService = {
  async search(query: SearchQuery): Promise<SearchResponse> {
    const start = Date.now();
    const q     = query.q.trim();

    if (q.length < 2) {
      return { results: [], total: 0, mode: SearchMode.Text, took: 0 };
    }

    const mode    = query.mode ?? SearchMode.Hybrid;
    const sources = query.sources ?? [];
    const filters = query.filters ?? {};
    const limit   = Math.min(query.limit ?? DEFAULT_LIMIT, 50);
    const lang    = query.lang ?? 'ht';

    let results: SearchResult[] = [];

    if (mode === SearchMode.Geo && query.location) {
      const loc = query.location;
      if (loc.radiusKm && loc.radiusKm > 0) {
        results = await SearchRepository.geoSearch(loc.lat, loc.lng, loc.radiusKm, sources, filters, limit);
      } else if (loc.city || loc.country) {
        results = await SearchRepository.searchByCountryOrCity(
          loc.country ?? 'HT', loc.city, sources, limit,
        );
      }
    } else if (mode === SearchMode.AI) {
      const enhanced = AISearchService.enhance(query, q);
      const fts = await SearchRepository.fullTextSearch(
        enhanced.q, enhanced.sources ?? sources, filters, limit, query.cursor,
      );
      // Try synonyms if no results
      if (fts.length === 0) {
        const synonyms = AISearchService.synonymExpand(q);
        if (synonyms.length > 0) {
          const synQuery = synonyms.join(' | ');
          const synResults = await SearchRepository.fullTextSearch(synQuery, sources, filters, limit, query.cursor);
          results = synResults;
        }
      } else {
        results = fts;
      }
    } else if (mode === SearchMode.Fuzzy) {
      results = await SearchRepository.fuzzySearch(q, sources, limit);
    } else {
      // Hybrid: FTS + geo reranking
      const [textResults, geoResults] = await Promise.all([
        SearchRepository.fullTextSearch(q, sources, filters, limit, query.cursor),
        query.location?.lat
          ? SearchRepository.geoSearch(query.location.lat, query.location.lng, query.location.radiusKm ?? 10, sources, filters, limit)
          : Promise.resolve([] as SearchResult[]),
      ]);

      // Merge deduped
      const seen = new Set<string>();
      for (const r of [...geoResults, ...textResults]) {
        if (!seen.has(r.id)) { seen.add(r.id); results.push(r); }
      }
    }

    // Apply ranking
    results = RankingEngine.rank(results, query.location?.lat, query.location?.lng);

    // Log async
    const took = Date.now() - start;
    void SearchAnalyticsRepository.logQuery({
      userId:       query.userId,
      query:        q,
      source:       sources[0],
      resultsCount: results.length,
      tookMs:       took,
      lat:          query.location?.lat,
      lng:          query.location?.lng,
      country:      query.location?.country ?? filters.country,
      lang,
    });

    // Record autocomplete suggestion async
    if (results.length > 0) {
      void AutocompleteService.record(q, sources[0] ?? 'all', lang);
    }

    const nextCursor = results.length === limit
      ? results[results.length - 1]?.createdAt
      : undefined;

    return {
      results: results.slice(0, limit),
      total:   results.length,
      mode,
      took,
      nextCursor,
    };
  },

  async multiSourceSearch(query: SearchQuery): Promise<Record<string, SearchResult[]>> {
    const q       = query.q.trim();
    const sources = query.sources?.length ? query.sources : ALL_SOURCES;
    const limit   = 5; // top 5 per source
    const result: Record<string, SearchResult[]> = {};

    await Promise.all(
      sources.map(async src => {
        const partial = await SearchRepository.fullTextSearch(q, [src], query.filters ?? {}, limit);
        if (partial.length > 0) result[src] = RankingEngine.rank(partial);
      }),
    );

    return result;
  },
};