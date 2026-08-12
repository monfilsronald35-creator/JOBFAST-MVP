import { supabase } from '../../lib/supabase';
import type {
  MarketplaceListing,
  EntityType,
  ListingCategory,
  ListingAttribute,
  ListingFavorite,
  ListingReview,
  ListingReport,
  ReportStatus,
} from '../../types/marketplace';

// Backend-only tables — zero frontend code (2 of 8 tables):
//   marketplace_events — analytics/tracking table; session_id + result_position internal;
//                        voice_transcript is behavioral data collected for AI training
//   marketplace_cache  — internal query cache; result_payload is raw cached results blob

// ── Column constants ───────────────────────────────────────────────────────

const LISTING_COLS = [
  'id', 'entity_type', 'entity_id', 'external_source', 'external_id',
  'title', 'description', 'short_description', 'image_url', 'gallery_urls',
  'country_code', 'city_code', 'postal_code', 'address', 'latitude', 'longitude',
  'price', 'currency', 'price_unit', 'popularity_score', 'rating_score',
  'is_verified', 'is_featured', 'is_active', 'is_available', 'language_code',
  'created_at', 'updated_at',
].join(', ');
// embedding excluded — NEVER (1536-dim AI vector; server-side HNSW only; ~12KB per row in JSON)
// search_vector excluded — internal FTS index; never selected by clients
// ai_score, trust_score, engagement_score, geo_score, freshness_score excluded — internal ranking signals

const CATEGORY_COLS =
  'id, parent_id, category_key, name, icon, entity_type, sort_order, is_active, language_code';

const ATTRIBUTE_COLS =
  'id, entity_type, entity_id, attribute_key, attribute_value, created_at, updated_at';

const FAVORITE_COLS =
  'id, user_id, entity_type, entity_id, created_at';

const REVIEW_COLS =
  'id, user_id, entity_type, entity_id, rating, review_text, is_verified, created_at, updated_at';

const REPORT_COLS =
  'id, user_id, entity_type, entity_id, reason, description, status, created_at, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type ListingRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  external_source: string;
  external_id: string | null;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  gallery_urls: string[];
  country_code: string;
  city_code: string;
  postal_code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number;
  currency: string;
  price_unit: string;
  popularity_score: number;
  rating_score: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  is_available: boolean;
  language_code: string;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  parent_id: string | null;
  category_key: string;
  name: string;
  icon: string | null;
  entity_type: string;
  sort_order: number;
  is_active: boolean;
  language_code: string;
};

type AttributeRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  attribute_key: string;
  attribute_value: unknown;
  created_at: string;
  updated_at: string;
};

type FavoriteRow = {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type ReportRow = {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapListing(r: ListingRow): MarketplaceListing {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    externalSource: r.external_source,
    externalId: r.external_id,
    title: r.title,
    description: r.description,
    shortDescription: r.short_description,
    imageUrl: r.image_url,
    galleryUrls: r.gallery_urls,
    countryCode: r.country_code,
    cityCode: r.city_code,
    postalCode: r.postal_code,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    price: r.price,
    currency: r.currency,
    priceUnit: r.price_unit as MarketplaceListing['priceUnit'],
    popularityScore: r.popularity_score,
    ratingScore: r.rating_score,
    isVerified: r.is_verified,
    isFeatured: r.is_featured,
    isActive: r.is_active,
    isAvailable: r.is_available,
    languageCode: r.language_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapCategory(r: CategoryRow): ListingCategory {
  return {
    id: r.id,
    parentId: r.parent_id,
    categoryKey: r.category_key,
    name: r.name,
    icon: r.icon,
    entityType: r.entity_type,
    sortOrder: r.sort_order,
    isActive: r.is_active,
    languageCode: r.language_code,
  };
}

function mapAttribute(r: AttributeRow): ListingAttribute {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    attributeKey: r.attribute_key,
    attributeValue: r.attribute_value,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapFavorite(r: FavoriteRow): ListingFavorite {
  return {
    id: r.id,
    userId: r.user_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    createdAt: r.created_at,
  };
}

function mapReview(r: ReviewRow): ListingReview {
  return {
    id: r.id,
    userId: r.user_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    rating: r.rating,
    reviewText: r.review_text,
    isVerified: r.is_verified,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapReport(r: ReportRow): ListingReport {
  return {
    id: r.id,
    userId: r.user_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    reason: r.reason,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Marketplace Listing (marketplace_entities) functions ──────────────────

export async function searchListings(options: {
  entityType?: EntityType;
  countryCode?: string;
  cityCode?: string;
  languageCode?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  orderBy?: 'price' | 'rating_score' | 'popularity_score' | 'created_at';
  ascending?: boolean;
  limit?: number;
  before?: string;
} = {}): Promise<MarketplaceListing[]> {
  let q = supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .eq('is_active', true);

  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.countryCode) q = q.eq('country_code', options.countryCode);
  if (options.cityCode) q = q.eq('city_code', options.cityCode);
  if (options.languageCode) q = q.eq('language_code', options.languageCode);
  if (options.minPrice !== undefined) q = q.gte('price', options.minPrice);
  if (options.maxPrice !== undefined) q = q.lte('price', options.maxPrice);
  if (options.isAvailable !== undefined) q = q.eq('is_available', options.isAvailable);
  if (options.isFeatured !== undefined) q = q.eq('is_featured', options.isFeatured);
  if (options.isVerified !== undefined) q = q.eq('is_verified', options.isVerified);
  if (options.before) q = q.lt('created_at', options.before);

  const col = options.orderBy ?? 'popularity_score';
  const asc = options.ascending ?? false;

  const { data, error } = await q
    .order(col, { ascending: asc })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function getListing(
  entityType: EntityType,
  entityId: string
): Promise<MarketplaceListing | null> {
  const { data, error } = await supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();
  if (error) throw error;
  return data ? mapListing(data as ListingRow) : null;
}

export async function getListingById(id: string): Promise<MarketplaceListing | null> {
  const { data, error } = await supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapListing(data as ListingRow) : null;
}

export async function getFeaturedListings(options: {
  entityType?: EntityType;
  countryCode?: string;
  limit?: number;
} = {}): Promise<MarketplaceListing[]> {
  let q = supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .eq('is_featured', true)
    .eq('is_active', true)
    .eq('is_available', true);

  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.countryCode) q = q.eq('country_code', options.countryCode);

  const { data, error } = await q
    .order('popularity_score', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function getListingsByLocation(
  countryCode: string,
  cityCode: string,
  options: { entityType?: EntityType; limit?: number } = {}
): Promise<MarketplaceListing[]> {
  let q = supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .eq('country_code', countryCode)
    .eq('city_code', cityCode)
    .eq('is_active', true);

  if (options.entityType) q = q.eq('entity_type', options.entityType);

  const { data, error } = await q
    .order('popularity_score', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function fullTextSearchListings(
  query: string,
  options: {
    entityType?: EntityType;
    countryCode?: string;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<MarketplaceListing[]> {
  let q = supabase
    .from('marketplace_entities')
    .select(LISTING_COLS)
    .textSearch('search_vector', query, { type: 'websearch' })
    .eq('is_active', true);

  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.countryCode) q = q.eq('country_code', options.countryCode);
  if (options.languageCode) q = q.eq('language_code', options.languageCode);

  const { data, error } = await q
    .order('popularity_score', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

// ── Marketplace Category (marketplace_categories) functions ───────────────

export async function getCategories(options: {
  entityType?: string;
  languageCode?: string;
  parentId?: string | null;
} = {}): Promise<ListingCategory[]> {
  let q = supabase
    .from('marketplace_categories')
    .select(CATEGORY_COLS)
    .eq('is_active', true);

  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.languageCode) q = q.eq('language_code', options.languageCode);
  if (options.parentId !== undefined) {
    q = options.parentId === null
      ? q.is('parent_id', null)
      : q.eq('parent_id', options.parentId);
  }

  const { data, error } = await q.order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getTopLevelCategories(
  entityType: string,
  languageCode = 'all'
): Promise<ListingCategory[]> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select(CATEGORY_COLS)
    .eq('entity_type', entityType)
    .eq('language_code', languageCode)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getCategoryChildren(parentId: string): Promise<ListingCategory[]> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select(CATEGORY_COLS)
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getCategory(id: string): Promise<ListingCategory | null> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select(CATEGORY_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCategory(data as CategoryRow) : null;
}

// ── Listing Attribute (marketplace_attributes) functions ──────────────────

export async function getEntityAttributes(
  entityType: string,
  entityId: string
): Promise<ListingAttribute[]> {
  const { data, error } = await supabase
    .from('marketplace_attributes')
    .select(ATTRIBUTE_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) throw error;
  return (data as AttributeRow[]).map(mapAttribute);
}

export async function getAttribute(
  entityType: string,
  entityId: string,
  attributeKey: string
): Promise<ListingAttribute | null> {
  const { data, error } = await supabase
    .from('marketplace_attributes')
    .select(ATTRIBUTE_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('attribute_key', attributeKey)
    .single();
  if (error) throw error;
  return data ? mapAttribute(data as AttributeRow) : null;
}

// ── Listing Favorite (marketplace_favorites) functions ────────────────────

export async function getMyFavorites(options: {
  entityType?: EntityType;
  limit?: number;
  before?: string;
} = {}): Promise<ListingFavorite[]> {
  let q = supabase
    .from('marketplace_favorites')
    .select(FAVORITE_COLS);

  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FavoriteRow[]).map(mapFavorite);
}

export async function getMyFavoritesByType(
  entityType: EntityType
): Promise<ListingFavorite[]> {
  const { data, error } = await supabase
    .from('marketplace_favorites')
    .select(FAVORITE_COLS)
    .eq('entity_type', entityType)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FavoriteRow[]).map(mapFavorite);
}

export async function isFavorited(
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('marketplace_favorites')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

// ── Listing Review (marketplace_reviews) functions ────────────────────────

export async function getEntityReviews(
  entityType: string,
  entityId: string,
  options: { minRating?: number; limit?: number; before?: string } = {}
): Promise<ListingReview[]> {
  let q = supabase
    .from('marketplace_reviews')
    .select(REVIEW_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (options.minRating !== undefined) q = q.gte('rating', options.minRating);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getMyReviews(options: {
  limit?: number;
  before?: string;
} = {}): Promise<ListingReview[]> {
  let q = supabase
    .from('marketplace_reviews')
    .select(REVIEW_COLS);

  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getVerifiedReviews(
  entityType: string,
  entityId: string,
  options: { limit?: number } = {}
): Promise<ListingReview[]> {
  const { data, error } = await supabase
    .from('marketplace_reviews')
    .select(REVIEW_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

// ── Listing Report (marketplace_reports) functions ────────────────────────

export async function getMyReports(options: {
  status?: ReportStatus;
  limit?: number;
  before?: string;
} = {}): Promise<ListingReport[]> {
  let q = supabase
    .from('marketplace_reports')
    .select(REPORT_COLS);

  if (options.status) q = q.eq('status', options.status);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReportRow[]).map(mapReport);
}

export async function getReport(id: string): Promise<ListingReport | null> {
  const { data, error } = await supabase
    .from('marketplace_reports')
    .select(REPORT_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapReport(data as ReportRow) : null;
}
