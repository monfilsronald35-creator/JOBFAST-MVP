// ── Search History & Preferences ──────────────────────────────────────────

export interface SearchHistory {
  id: string;
  userId: string;
  sessionId: string | null;
  queryText: string;
  filtersApplied: Record<string, unknown>;
  resultsCount: number;
  executionTimeMs: number;
  createdAt: string;
}

export interface SearchSavedQuery {
  id: string;
  userId: string;
  title: string;
  queryText: string;
  filtersApplied: Record<string, unknown>;
  alertEnabled: boolean;
  createdAt: string;
}

export interface RecentSearch {
  id: string;
  userId: string;
  queryText: string;
  deviceType: string;
  searchedAt: string;
}

export interface SearchPreferences {
  id: string;
  userId: string;
  defaultLanguage: string;
  safeSearch: boolean;
  resultsPerPage: number;
  preferredChannels: string[];
  updatedAt: string;
}

// ── Autocomplete, Suggestions & Trending ──────────────────────────────────

export interface SearchAutocompleteSuggestion {
  id: string;
  prefix: string;
  suggestion: string;
  weight: number;
  languageCode: string;
  category: string;
}

export interface SearchSpellingSuggestion {
  id: string;
  originalQuery: string;
  correctedQuery: string;
  confidenceScore: number;
  correctionType: string;
  createdAt: string;
}

export interface TrendingSearch {
  id: string;
  queryText: string;
  score: number;
  velocityRate: number;
  region: string;
  updatedAt: string;
}

export interface PopularKeyword {
  id: string;
  keyword: string;
  searchCount: number;
  growthPercentage: number;
  updatedAt: string;
}

// ── Recommendations ────────────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  userId: string;
  modelId: string;
  itemId: string;
  score: number;
  contextPayload: Record<string, unknown>;
  expiresAt: string | null;
  createdAt: string;
}

export const RECOMMENDATION_FEEDBACK_ACTIONS = [
  'clicked', 'dismissed', 'purchased', 'ignored', 'saved',
] as const;
export type RecommendationFeedbackAction = typeof RECOMMENDATION_FEEDBACK_ACTIONS[number];

export interface RecommendationFeedback {
  id: string;
  recommendationId: string;
  userId: string;
  action: RecommendationFeedbackAction;
  feedbackReason: string | null;
  createdAt: string;
}

// ── Filters, Facets, Collections & Tags ───────────────────────────────────

export interface SearchFilter {
  id: string;
  filterName: string;
  displayLabel: string;
  dataType: 'string' | 'number' | 'boolean' | 'range' | 'date';
  isFaceted: boolean;
}

export interface SearchFacet {
  id: string;
  filterId: string;
  facetValue: string;
  itemCount: number;
  bucketRange: Record<string, unknown>;
}

export interface SearchCollection {
  id: string;
  collectionName: string;
  displayTitle: string;
  description: string | null;
  curatedItemIds: string[];
  createdAt: string;
}

export interface SearchTag {
  id: string;
  tagName: string;
  category: string;
  usageCount: number;
}

// ── AI Search ──────────────────────────────────────────────────────────────

export interface AiSearchQuery {
  id: string;
  userId: string;
  rawQuery: string;
  interpretedIntent: string;
  extractedFilters: Record<string, unknown>;
  tokensConsumed: number;
  createdAt: string;
}

// ── Geo Search ─────────────────────────────────────────────────────────────

export interface NearbySearch {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categoryFilter: string | null;
  searchedAt: string;
}

// ── Click Tracking ─────────────────────────────────────────────────────────

export interface SearchClick {
  id: string;
  impressionId: string;
  documentId: string;
  dwellTimeMs: number;
  clickedAt: string;
}

// ── Multimodal Search ──────────────────────────────────────────────────────

export interface VoiceSearch {
  id: string;
  userId: string;
  audioFileUrl: string;
  transcribedText: string | null;
  confidence: number;
  createdAt: string;
}

export interface ImageSearch {
  id: string;
  userId: string;
  imageUrl: string;
  detectedLabels: unknown[];
  dominantColors: string[];
  createdAt: string;
}

export interface QrSearch {
  id: string;
  userId: string;
  qrPayload: string;
  parsedMetadata: Record<string, unknown>;
  scannedAt: string;
}

export interface BarcodeSearch {
  id: string;
  userId: string;
  barcodeNumber: string;
  barcodeFormat: string;
  scannedAt: string;
}

// ── Personalization ────────────────────────────────────────────────────────

export interface PersonalizationProfile {
  id: string;
  userId: string;
  profileData: Record<string, unknown>;
  segmentTags: string[];
  updatedAt: string;
  // interest_vector excluded — ML embedding data (backend only)
}

// ── A/B Test Variant Assignment ────────────────────────────────────────────

export interface SearchVariant {
  id: string;
  testId: string;
  userId: string;
  assignedVariant: string;
  assignedAt: string;
}
