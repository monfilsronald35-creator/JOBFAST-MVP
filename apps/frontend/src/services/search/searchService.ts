import { supabase } from '../../lib/supabase';
import type {
  SearchHistory,
  SearchSavedQuery,
  RecentSearch,
  SearchPreferences,
  SearchAutocompleteSuggestion,
  SearchSpellingSuggestion,
  TrendingSearch,
  PopularKeyword,
  Recommendation,
  RecommendationFeedback,
  SearchFilter,
  SearchFacet,
  SearchCollection,
  SearchTag,
  AiSearchQuery,
  NearbySearch,
  SearchClick,
  VoiceSearch,
  ImageSearch,
  QrSearch,
  BarcodeSearch,
  PersonalizationProfile,
  SearchVariant,
  RecommendationFeedbackAction,
} from '../../types/search';

// Backend-only (never exposed here):
//   - search_indexes, search_documents, search_aliases, search_synonyms, search_stopwords — index management
//   - recommendation_models, recommendation_events — ML models
//   - ai_search_embeddings, ai_search_cache, ai_search_context — vector search infra
//   - semantic_embeddings, embedding_models, reranking_models, vector_indexes — ML infra
//   - user_interest_vectors.interest_vector — ML embedding
//   - search_analytics, search_statistics, search_performance, search_errors — server monitoring
//   - search_jobs, search_queue, search_reindex_jobs, search_snapshots — indexing jobs
//   - search_permissions, search_tenants, enterprise_global_indexes — multi-tenant admin
//   - search_api_keys (api_key_hash), search_webhooks (secret_key) — API management
//   - search_audit_logs (ip_address), search_event_store, immutable_search_logs — audit chain
//   - search_cache, search_cache_statistics, distributed_search_nodes, search_cluster_health — infra
//   - search_ml_training, ranking_experiments, search_ab_tests (config) — ML/A/B admin
//   - geo_search_index, location_search_cache, search_radius_profiles — geo infra
//   - search_impressions — populated by backend when returning results
//   - search_conversion_events — tracked by backend on purchase/conversion
//   - voice/image searches: uploads go through backend (signed URL + AI processing)

// ── Row types (snake_case) ─────────────────────────────────────────────────

type SearchHistoryRow = {
  id: string; user_id: string; session_id: string | null; query_text: string;
  filters_applied: Record<string, unknown>; results_count: number;
  execution_time_ms: number; created_at: string;
};

type SearchSavedQueryRow = {
  id: string; user_id: string; title: string; query_text: string;
  filters_applied: Record<string, unknown>; alert_enabled: boolean; created_at: string;
};

type RecentSearchRow = {
  id: string; user_id: string; query_text: string; device_type: string; searched_at: string;
};

type SearchPreferencesRow = {
  id: string; user_id: string; default_language: string; safe_search: boolean;
  results_per_page: number; preferred_channels: string[]; updated_at: string;
};

type AutocompleteRow = {
  id: string; prefix: string; suggestion: string; weight: number;
  language_code: string; category: string;
};

type SpellingSuggestionRow = {
  id: string; original_query: string; corrected_query: string;
  confidence_score: number; correction_type: string; created_at: string;
};

type TrendingSearchRow = {
  id: string; query_text: string; score: number; velocity_rate: number;
  region: string; updated_at: string;
};

type PopularKeywordRow = {
  id: string; keyword: string; search_count: number;
  growth_percentage: number; updated_at: string;
};

type RecommendationRow = {
  id: string; user_id: string; model_id: string; item_id: string;
  score: number; context_payload: Record<string, unknown>;
  expires_at: string | null; created_at: string;
};

type RecommendationFeedbackRow = {
  id: string; recommendation_id: string; user_id: string;
  action: string; feedback_reason: string | null; created_at: string;
};

type SearchFilterRow = {
  id: string; filter_name: string; display_label: string;
  data_type: string; is_faceted: boolean;
};

type SearchFacetRow = {
  id: string; filter_id: string; facet_value: string;
  item_count: number; bucket_range: Record<string, unknown>;
};

type SearchCollectionRow = {
  id: string; collection_name: string; display_title: string;
  description: string | null; curated_item_ids: string[]; created_at: string;
};

type SearchTagRow = {
  id: string; tag_name: string; category: string; usage_count: number;
};

type AiSearchQueryRow = {
  id: string; user_id: string; raw_query: string; interpreted_intent: string;
  extracted_filters: Record<string, unknown>; tokens_consumed: number; created_at: string;
};

type NearbySearchRow = {
  id: string; user_id: string; latitude: number; longitude: number;
  radius_meters: number; category_filter: string | null; searched_at: string;
};

type SearchClickRow = {
  id: string; impression_id: string; document_id: string;
  dwell_time_ms: number; clicked_at: string;
};

type VoiceSearchRow = {
  id: string; user_id: string; audio_file_url: string;
  transcribed_text: string | null; confidence: number; created_at: string;
};

type ImageSearchRow = {
  id: string; user_id: string; image_url: string;
  detected_labels: unknown[]; dominant_colors: string[]; created_at: string;
};

type QrSearchRow = {
  id: string; user_id: string; qr_payload: string;
  parsed_metadata: Record<string, unknown>; scanned_at: string;
};

type BarcodeSearchRow = {
  id: string; user_id: string; barcode_number: string;
  barcode_format: string; scanned_at: string;
};

type PersonalizationProfileRow = {
  id: string; user_id: string; profile_data: Record<string, unknown>;
  segment_tags: string[]; updated_at: string;
};

type SearchVariantRow = {
  id: string; test_id: string; user_id: string;
  assigned_variant: string; assigned_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapHistory(r: SearchHistoryRow): SearchHistory {
  return { id: r.id, userId: r.user_id, sessionId: r.session_id, queryText: r.query_text, filtersApplied: r.filters_applied, resultsCount: r.results_count, executionTimeMs: r.execution_time_ms, createdAt: r.created_at };
}

function mapSavedQuery(r: SearchSavedQueryRow): SearchSavedQuery {
  return { id: r.id, userId: r.user_id, title: r.title, queryText: r.query_text, filtersApplied: r.filters_applied, alertEnabled: r.alert_enabled, createdAt: r.created_at };
}

function mapRecentSearch(r: RecentSearchRow): RecentSearch {
  return { id: r.id, userId: r.user_id, queryText: r.query_text, deviceType: r.device_type, searchedAt: r.searched_at };
}

function mapPreferences(r: SearchPreferencesRow): SearchPreferences {
  return { id: r.id, userId: r.user_id, defaultLanguage: r.default_language, safeSearch: r.safe_search, resultsPerPage: r.results_per_page, preferredChannels: r.preferred_channels, updatedAt: r.updated_at };
}

function mapAutocomplete(r: AutocompleteRow): SearchAutocompleteSuggestion {
  return { id: r.id, prefix: r.prefix, suggestion: r.suggestion, weight: r.weight, languageCode: r.language_code, category: r.category };
}

function mapSpellingSuggestion(r: SpellingSuggestionRow): SearchSpellingSuggestion {
  return { id: r.id, originalQuery: r.original_query, correctedQuery: r.corrected_query, confidenceScore: r.confidence_score, correctionType: r.correction_type, createdAt: r.created_at };
}

function mapTrending(r: TrendingSearchRow): TrendingSearch {
  return { id: r.id, queryText: r.query_text, score: r.score, velocityRate: r.velocity_rate, region: r.region, updatedAt: r.updated_at };
}

function mapKeyword(r: PopularKeywordRow): PopularKeyword {
  return { id: r.id, keyword: r.keyword, searchCount: r.search_count, growthPercentage: r.growth_percentage, updatedAt: r.updated_at };
}

function mapRecommendation(r: RecommendationRow): Recommendation {
  return { id: r.id, userId: r.user_id, modelId: r.model_id, itemId: r.item_id, score: r.score, contextPayload: r.context_payload, expiresAt: r.expires_at, createdAt: r.created_at };
}

function mapFeedback(r: RecommendationFeedbackRow): RecommendationFeedback {
  return { id: r.id, recommendationId: r.recommendation_id, userId: r.user_id, action: r.action as RecommendationFeedbackAction, feedbackReason: r.feedback_reason, createdAt: r.created_at };
}

function mapFilter(r: SearchFilterRow): SearchFilter {
  return { id: r.id, filterName: r.filter_name, displayLabel: r.display_label, dataType: r.data_type as SearchFilter['dataType'], isFaceted: r.is_faceted };
}

function mapFacet(r: SearchFacetRow): SearchFacet {
  return { id: r.id, filterId: r.filter_id, facetValue: r.facet_value, itemCount: r.item_count, bucketRange: r.bucket_range };
}

function mapCollection(r: SearchCollectionRow): SearchCollection {
  return { id: r.id, collectionName: r.collection_name, displayTitle: r.display_title, description: r.description, curatedItemIds: r.curated_item_ids, createdAt: r.created_at };
}

function mapTag(r: SearchTagRow): SearchTag {
  return { id: r.id, tagName: r.tag_name, category: r.category, usageCount: r.usage_count };
}

function mapAiQuery(r: AiSearchQueryRow): AiSearchQuery {
  return { id: r.id, userId: r.user_id, rawQuery: r.raw_query, interpretedIntent: r.interpreted_intent, extractedFilters: r.extracted_filters, tokensConsumed: r.tokens_consumed, createdAt: r.created_at };
}

function mapNearby(r: NearbySearchRow): NearbySearch {
  return { id: r.id, userId: r.user_id, latitude: r.latitude, longitude: r.longitude, radiusMeters: r.radius_meters, categoryFilter: r.category_filter, searchedAt: r.searched_at };
}

function mapClick(r: SearchClickRow): SearchClick {
  return { id: r.id, impressionId: r.impression_id, documentId: r.document_id, dwellTimeMs: r.dwell_time_ms, clickedAt: r.clicked_at };
}

function mapVoice(r: VoiceSearchRow): VoiceSearch {
  return { id: r.id, userId: r.user_id, audioFileUrl: r.audio_file_url, transcribedText: r.transcribed_text, confidence: r.confidence, createdAt: r.created_at };
}

function mapImage(r: ImageSearchRow): ImageSearch {
  return { id: r.id, userId: r.user_id, imageUrl: r.image_url, detectedLabels: r.detected_labels, dominantColors: r.dominant_colors, createdAt: r.created_at };
}

function mapQr(r: QrSearchRow): QrSearch {
  return { id: r.id, userId: r.user_id, qrPayload: r.qr_payload, parsedMetadata: r.parsed_metadata, scannedAt: r.scanned_at };
}

function mapBarcode(r: BarcodeSearchRow): BarcodeSearch {
  return { id: r.id, userId: r.user_id, barcodeNumber: r.barcode_number, barcodeFormat: r.barcode_format, scannedAt: r.scanned_at };
}

function mapProfile(r: PersonalizationProfileRow): PersonalizationProfile {
  return { id: r.id, userId: r.user_id, profileData: r.profile_data, segmentTags: r.segment_tags, updatedAt: r.updated_at };
}

function mapVariant(r: SearchVariantRow): SearchVariant {
  return { id: r.id, testId: r.test_id, userId: r.user_id, assignedVariant: r.assigned_variant, assignedAt: r.assigned_at };
}

// ================================================================
// === Search History
// ================================================================

export async function getMySearchHistory(
  limit = 50
): Promise<SearchHistory[]> {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as SearchHistoryRow[]).map(mapHistory);
}

export async function clearSearchHistory(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('search_history')
    .delete()
    .eq('user_id', user.id);
  if (error) throw error;
}

// ================================================================
// === Recent Searches
// ================================================================

export async function getRecentSearches(limit = 10): Promise<RecentSearch[]> {
  const { data, error } = await supabase
    .from('recent_searches')
    .select('*')
    .order('searched_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as RecentSearchRow[]).map(mapRecentSearch);
}

export async function addRecentSearch(
  queryText: string,
  deviceType = 'web'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('recent_searches')
    .upsert(
      { user_id: user.id, query_text: queryText, device_type: deviceType, searched_at: new Date().toISOString() },
      { onConflict: 'user_id,query_text' }
    );
  if (error) throw error;
}

export async function removeRecentSearch(queryText: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('recent_searches')
    .delete()
    .eq('user_id', user.id)
    .eq('query_text', queryText);
  if (error) throw error;
}

// ================================================================
// === Saved Queries
// ================================================================

export async function getMySavedQueries(): Promise<SearchSavedQuery[]> {
  const { data, error } = await supabase
    .from('search_saved_queries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SearchSavedQueryRow[]).map(mapSavedQuery);
}

export async function saveSearchQuery(
  title: string,
  queryText: string,
  filtersApplied: Record<string, unknown> = {},
  alertEnabled = false
): Promise<SearchSavedQuery> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('search_saved_queries')
    .insert({
      user_id: user.id,
      title,
      query_text: queryText,
      filters_applied: filtersApplied,
      alert_enabled: alertEnabled,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapSavedQuery(data as SearchSavedQueryRow);
}

export async function deleteSavedQuery(queryId: string): Promise<void> {
  const { error } = await supabase
    .from('search_saved_queries')
    .delete()
    .eq('id', queryId);
  if (error) throw error;
}

// ================================================================
// === Search Preferences
// ================================================================

export async function getMySearchPreferences(): Promise<SearchPreferences | null> {
  const { data, error } = await supabase
    .from('search_preferences')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapPreferences(data as SearchPreferencesRow) : null;
}

export async function updateSearchPreferences(
  input: Partial<{
    defaultLanguage: string;
    safeSearch: boolean;
    resultsPerPage: number;
    preferredChannels: string[];
  }>
): Promise<SearchPreferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('search_preferences')
    .upsert(
      {
        user_id: user.id,
        ...(input.defaultLanguage !== undefined && { default_language: input.defaultLanguage }),
        ...(input.safeSearch !== undefined && { safe_search: input.safeSearch }),
        ...(input.resultsPerPage !== undefined && { results_per_page: input.resultsPerPage }),
        ...(input.preferredChannels !== undefined && { preferred_channels: input.preferredChannels }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapPreferences(data as SearchPreferencesRow);
}

// ================================================================
// === Autocomplete, Suggestions & Trending
// ================================================================

export async function getAutocompleteSuggestions(
  prefix: string,
  languageCode = 'en',
  category = 'global',
  limit = 10
): Promise<SearchAutocompleteSuggestion[]> {
  const { data, error } = await supabase
    .from('search_autocomplete')
    .select('*')
    .ilike('prefix', `${prefix}%`)
    .eq('language_code', languageCode)
    .eq('category', category)
    .order('weight', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as AutocompleteRow[]).map(mapAutocomplete);
}

export async function getSpellingSuggestion(
  query: string
): Promise<SearchSpellingSuggestion | null> {
  const { data, error } = await supabase
    .from('search_suggestions')
    .select('*')
    .eq('original_query', query)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSpellingSuggestion(data as SpellingSuggestionRow) : null;
}

export async function getTrendingSearches(
  region = 'ALL',
  limit = 20
): Promise<TrendingSearch[]> {
  const { data, error } = await supabase
    .from('trending_searches')
    .select('*')
    .eq('region', region)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as TrendingSearchRow[]).map(mapTrending);
}

export async function getPopularKeywords(
  limit = 20
): Promise<PopularKeyword[]> {
  const { data, error } = await supabase
    .from('popular_keywords')
    .select('*')
    .order('search_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as PopularKeywordRow[]).map(mapKeyword);
}

// ================================================================
// === Recommendations
// ================================================================

export async function getMyRecommendations(
  limit = 20
): Promise<Recommendation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', user.id)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as RecommendationRow[]).map(mapRecommendation);
}

export async function submitRecommendationFeedback(
  recommendationId: string,
  action: RecommendationFeedbackAction,
  feedbackReason?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('recommendation_feedback')
    .insert({
      recommendation_id: recommendationId,
      user_id: user.id,
      action,
      feedback_reason: feedbackReason ?? null,
    });
  if (error) throw error;
}

// ================================================================
// === Filters, Facets, Collections & Tags
// ================================================================

export async function getSearchFilters(): Promise<SearchFilter[]> {
  const { data, error } = await supabase
    .from('search_filters')
    .select('*')
    .order('display_label', { ascending: true });
  if (error) throw error;
  return (data as SearchFilterRow[]).map(mapFilter);
}

export async function getSearchFacets(
  filterId?: string
): Promise<SearchFacet[]> {
  let q = supabase
    .from('search_facets')
    .select('*');

  if (filterId) q = q.eq('filter_id', filterId);

  const { data, error } = await q.order('item_count', { ascending: false });
  if (error) throw error;
  return (data as SearchFacetRow[]).map(mapFacet);
}

export async function getSearchCollections(): Promise<SearchCollection[]> {
  const { data, error } = await supabase
    .from('search_collections')
    .select('*')
    .order('display_title', { ascending: true });
  if (error) throw error;
  return (data as SearchCollectionRow[]).map(mapCollection);
}

export async function getSearchTags(
  category?: string,
  limit = 50
): Promise<SearchTag[]> {
  let q = supabase
    .from('search_tags')
    .select('*');

  if (category) q = q.eq('category', category);

  const { data, error } = await q
    .order('usage_count', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as SearchTagRow[]).map(mapTag);
}

// ================================================================
// === AI Search History
// ================================================================

export async function getMyAiSearchHistory(
  limit = 20
): Promise<AiSearchQuery[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ai_search_queries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as AiSearchQueryRow[]).map(mapAiQuery);
}

// ================================================================
// === Geo / Nearby Searches
// ================================================================

export async function saveNearbySearch(
  latitude: number,
  longitude: number,
  radiusMeters = 5000,
  categoryFilter?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('nearby_searches')
    .insert({
      user_id: user.id,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      category_filter: categoryFilter ?? null,
    });
  if (error) throw error;
}

export async function getMyNearbySearches(
  limit = 20
): Promise<NearbySearch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('nearby_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as NearbySearchRow[]).map(mapNearby);
}

// ================================================================
// === Click Tracking
// ================================================================

// impression_id comes from the backend search result response.
// Frontend reports the click with dwell time for NDCG ranking signals.

export async function trackSearchClick(
  impressionId: string,
  documentId: string,
  dwellTimeMs = 0
): Promise<SearchClick> {
  const { data, error } = await supabase
    .from('search_clicks')
    .insert({ impression_id: impressionId, document_id: documentId, dwell_time_ms: dwellTimeMs })
    .select('*')
    .single();
  if (error) throw error;
  return mapClick(data as SearchClickRow);
}

// ================================================================
// === Multimodal Search History
// ================================================================

// Voice/image uploads go through backend (AI processing + signed URLs).
// Frontend reads processed results from these tables.

export async function getMyVoiceSearches(
  limit = 10
): Promise<VoiceSearch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('voice_search')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as VoiceSearchRow[]).map(mapVoice);
}

export async function getMyImageSearches(
  limit = 10
): Promise<ImageSearch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('image_search')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ImageSearchRow[]).map(mapImage);
}

export async function getMyQrScans(limit = 20): Promise<QrSearch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('qr_search')
    .select('*')
    .eq('user_id', user.id)
    .order('scanned_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as QrSearchRow[]).map(mapQr);
}

export async function getMyBarcodeScans(limit = 20): Promise<BarcodeSearch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('barcode_search')
    .select('*')
    .eq('user_id', user.id)
    .order('scanned_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BarcodeSearchRow[]).map(mapBarcode);
}

// ================================================================
// === Personalization
// ================================================================

export async function getMyPersonalizationProfile(): Promise<PersonalizationProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('personalization_profiles')
    .select('id, user_id, profile_data, segment_tags, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as PersonalizationProfileRow) : null;
}

// ================================================================
// === A/B Test Variant
// ================================================================

export async function getMySearchVariant(
  testId: string
): Promise<SearchVariant | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('search_variants')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVariant(data as SearchVariantRow) : null;
}
