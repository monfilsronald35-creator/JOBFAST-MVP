export enum SearchSource {
  Jobs           = 'jobs',
  Products       = 'products',
  Services       = 'services',
  Companies      = 'companies',
  Workers        = 'workers',
  Hotels         = 'hotels',
  Restaurants    = 'restaurants',
  Hospitals      = 'hospitals',
  Schools        = 'schools',
  Universities   = 'universities',
  GovServices    = 'gov_services',
  Telecom        = 'telecom',
  Flights        = 'flights',
  Cars           = 'cars',
  Properties     = 'properties',
  Events         = 'events',
  Documents      = 'documents',
  KnowledgeBase  = 'knowledge_base',
}

export enum SearchMode {
  Text       = 'text',
  Geo        = 'geo',
  AI         = 'ai',
  Vector     = 'vector',
  Fuzzy      = 'fuzzy',
  Hybrid     = 'hybrid',
}

export enum GeoRadius {
  OneKm       = 1,
  FiveKm      = 5,
  TenKm       = 10,
  FiftyKm     = 50,
  SameCity    = 0,
  SameCountry = -1,
  Worldwide   = -2,
}

export interface SearchLocation {
  lat:       number;
  lng:       number;
  radiusKm?: number | undefined;
  city?:     string | undefined;
  country?:  string | undefined;
}

export interface SearchFilters {
  // Common
  priceMin?:      number | undefined;
  priceMax?:      number | undefined;
  currency?:      string | undefined;
  rating?:        number | undefined;
  verified?:      boolean | undefined;
  lang?:          string | undefined;
  country?:       string | undefined;
  // Jobs
  salaryMin?:     number | undefined;
  salaryMax?:     number | undefined;
  remote?:        boolean | undefined;
  jobType?:       string | undefined;
  experienceLevel?: string | undefined;
  publishedAfter?: string | undefined;
  // Products
  brand?:         string | undefined;
  color?:         string | undefined;
  size?:          string | undefined;
  inStock?:       boolean | undefined;
  hasDelivery?:   boolean | undefined;
  // Hotels
  stars?:         number | undefined;
  hasWifi?:       boolean | undefined;
  hasPool?:       boolean | undefined;
  hasBreakfast?:  boolean | undefined;
  hasParking?:    boolean | undefined;
  // General
  sortBy?:        string | undefined;
  sortDir?:       'asc' | 'desc' | undefined;
}

export interface SearchQuery {
  q:           string;
  sources?:    SearchSource[] | undefined;
  mode?:       SearchMode | undefined;
  location?:   SearchLocation | undefined;
  filters?:    SearchFilters | undefined;
  userId?:     string | undefined;
  limit?:      number | undefined;
  cursor?:     string | undefined;
  lang?:       string | undefined;
}

export interface SearchResult {
  id:            string;
  source:        SearchSource;
  sourceId:      string;
  title:         string;
  description:   string;
  imageUrl?:     string | undefined;
  actionUrl?:    string | undefined;
  price?:        number | undefined;
  currency?:     string | undefined;
  rating?:       number | undefined;
  isVerified:    boolean;
  lat?:          number | undefined;
  lng?:          number | undefined;
  distanceKm?:   number | undefined;
  country?:      string | undefined;
  city?:         string | undefined;
  tags?:         string[] | undefined;
  metadata?:     Record<string, unknown> | undefined;
  score:         number;
  rankingFactors?: Record<string, number> | undefined;
  createdAt:     string;
}

export interface SearchResponse {
  results:    SearchResult[];
  total:      number;
  nextCursor?: string | undefined;
  suggestions?: string[] | undefined;
  mode:       SearchMode;
  took:       number;
}

export interface AutocompleteSuggestion {
  term:   string;
  source: SearchSource;
  count:  number;
}

export interface RankingFactors {
  relevance:      number;
  distance:       number;
  rating:         number;
  verification:   number;
  availability:   number;
  priceScore:     number;
  popularity:     number;
  completionRate: number;
  premiumBoost:   number;
}

// Weights sum to 1.0
export const RANKING_WEIGHTS: Record<keyof RankingFactors, number> = {
  relevance:      0.35,
  distance:       0.20,
  rating:         0.15,
  verification:   0.10,
  availability:   0.08,
  priceScore:     0.04,
  popularity:     0.04,
  completionRate: 0.02,
  premiumBoost:   0.02,
};

export interface SearchIndexEntry {
  id:          string;
  source:      SearchSource;
  sourceId:    string;
  title:       string;
  description: string;
  tags?:       string[] | undefined;
  imageUrl?:   string | undefined;
  actionUrl?:  string | undefined;
  lat?:        number | undefined;
  lng?:        number | undefined;
  country?:    string | undefined;
  city?:       string | undefined;
  price?:      number | undefined;
  currency?:   string | undefined;
  rating?:     number | undefined;
  isVerified:  boolean;
  isPremium:   boolean;
  isAvailable: boolean;
  popularity:  number;
  completionRate: number;
  metadata?:   Record<string, unknown> | undefined;
  updatedAt:   string;
}