export const PRODUCT_STATUSES = [
  'draft',
  'active',
  'inactive',
  'out_of_stock',
  'archived',
] as const;

export type ProductStatus = typeof PRODUCT_STATUSES[number];

export const PRODUCT_VISIBILITIES = [
  'public',
  'private',
  'hidden',
  'catalog_only',
  'search_only',
] as const;

export type ProductVisibility = typeof PRODUCT_VISIBILITIES[number];

// ---- Entity interfaces ----

export interface MarketplaceCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  companyId: string | null;
  countryId: string;
  languageId: string | null;
  currencyId: string | null;
  categoryId: string | null;
  brandId: string | null;
  sku: string | null;
  barcode: string | null;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string;
  specifications: Record<string, unknown>;
  features: unknown[];
  metadata: Record<string, unknown>;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  taxClass: string;
  stockQuantity: number;
  reservedQuantity: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  status: ProductStatus;
  visibility: ProductVisibility;
  aiEmbedding: number[] | null;
  searchVector: string | null;
  aiTags: string[] | null;
  aiSummary: string | null;
  aiCategoryScore: number;
  aiQualityScore: number;
  aiRiskScore: number;
  aiDuplicateScore: number;
  publishedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  title: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  attributes: Record<string, unknown>;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMedia {
  id: string;
  productId: string;
  variantId: string | null;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  position: number;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface ProductAttributeValue {
  id: string;
  attributeId: string;
  productId: string;
  value: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  variantId: string | null;
  warehouseId: string | null;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  incomingQuantity: number;
  reorderLevel: number;
  updatedAt: string;
}

// ---- Input types ----

export type CreateProductInput = {
  countryId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  companyId?: string;
  languageId?: string;
  currencyId?: string;
  categoryId?: string;
  brandId?: string;
  sku?: string;
  barcode?: string;
  shortDescription?: string;
  specifications?: Record<string, unknown>;
  features?: unknown[];
  compareAtPrice?: number;
  costPrice?: number;
  taxClass?: string;
  stockQuantity?: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  metadata?: Record<string, unknown>;
};

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, 'countryId' | 'slug'>
>;

export interface MarketplaceNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface MarketplaceReport {
  id: string;
  userId: string;
  productId: string | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface MarketplaceAiLog {
  id: string;
  productId: string | null;
  actionType: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  createdAt: string;
}

export interface MarketplaceHistory {
  id: string;
  productId: string | null;
  actorId: string;
  action: string;
  oldState: Record<string, unknown>;
  newState: Record<string, unknown>;
  createdAt: string;
}

export interface MarketplaceStatistics {
  id: string;
  sellerId: string;
  totalSales: number;
  totalOrders: number;
  averageRating: number;
  updatedAt: string;
}

// ── Migration 034: Global Marketplace & Discovery Engine V4 ───────────────
//
// BREAKING CHANGE: Migration 034 DROPs marketplace_entities, marketplace_categories,
// marketplace_attributes, marketplace_favorites, marketplace_reviews, marketplace_reports
// and recreates them with a new entity_type/entity_id pattern schema. The existing
// MarketplaceCategory and MarketplaceReport interfaces above use different schemas.
//
// Backend-only tables (zero frontend types or functions):
//   marketplace_events  — analytics/tracking; session_id internal; result_position internal A/B;
//                         voice_transcript = behavioral data collected for AI training
//   marketplace_cache   — internal query cache; result_payload is raw cached results blob
//
// NEVER fields in marketplace_entities:
//   embedding vector(1536) — 1536-dim AI vector: enormous payload, server-side HNSW only
//   ai_score              — AI ranking score; exposing enables gaming of search ranking
//   trust_score           — internal trust signal; exposing enables gaming
//   engagement_score      — internal engagement metric
//   geo_score             — computed proximity signal; not a stored user-facing value
//   freshness_score       — internal freshness signal
//   search_vector         — internal FTS index; never selected by clients

export const ENTITY_TYPES = [
  'job', 'service', 'product', 'company', 'freelancer', 'transport',
  'hotel', 'restaurant', 'real_estate', 'education', 'healthcare', 'government',
] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export const PRICE_UNITS = [
  'fixed', 'hourly', 'monthly', 'night', 'project',
] as const;
export type PriceUnit = typeof PRICE_UNITS[number];

export interface MarketplaceListing {
  id: string;
  entityType: EntityType;
  entityId: string;
  externalSource: string;
  externalId: string | null;
  title: string;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  galleryUrls: string[];
  countryCode: string;
  cityCode: string;
  postalCode: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number;
  currency: string;
  priceUnit: PriceUnit;
  popularityScore: number;
  ratingScore: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isAvailable: boolean;
  languageCode: string;
  createdAt: string;
  updatedAt: string;
  // embedding excluded — NEVER (1536-dim AI vector; server-side HNSW only)
  // search_vector excluded — internal FTS index; not selected by clients
  // ai_score, trust_score, engagement_score, geo_score, freshness_score excluded — internal ranking signals
}

export interface ListingCategory {
  id: string;
  parentId: string | null;
  categoryKey: string;
  name: string;
  icon: string | null;
  entityType: string;
  sortOrder: number;
  isActive: boolean;
  languageCode: string;
}

export interface ListingAttribute {
  id: string;
  entityType: string;
  entityId: string;
  attributeKey: string;
  attributeValue: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFavorite {
  id: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  createdAt: string;
}

export interface ListingReview {
  id: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  rating: number;
  reviewText: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const REPORT_STATUSES = [
  'pending', 'reviewed', 'resolved', 'dismissed',
] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

export interface ListingReport {
  id: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
