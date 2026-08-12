import { supabase } from '../../lib/supabase';
import type {
  MarketplaceCategory,
  MarketplaceBrand,
  Product,
  ProductVariant,
  ProductMedia,
  ProductAttribute,
  ProductAttributeValue,
  Inventory,
  ProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from '../../types/marketplace';

// ai_embedding (VECTOR 1536) and search_vector (TSVECTOR) excluded from all
// selects — large, server-side only. ai_tags is a plain TEXT[] — included.
const PRODUCT_SELECT_COLS =
  'id, seller_id, company_id, country_id, language_id, currency_id, ' +
  'category_id, brand_id, sku, barcode, slug, title, short_description, description, ' +
  'specifications, features, metadata, ' +
  'price, compare_at_price, cost_price, tax_class, ' +
  'stock_quantity, reserved_quantity, minimum_order_quantity, maximum_order_quantity, ' +
  'weight, length, width, height, status, visibility, ' +
  'ai_tags, ai_summary, ai_category_score, ai_quality_score, ai_risk_score, ai_duplicate_score, ' +
  'published_at, is_deleted, deleted_at, version, created_at, updated_at';

// ---- Row types (snake_case) ----

type MarketplaceCategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type MarketplaceBrandRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
};

type ProductRow = {
  id: string;
  seller_id: string;
  company_id: string | null;
  country_id: string;
  language_id: string | null;
  currency_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  sku: string | null;
  barcode: string | null;
  slug: string;
  title: string;
  short_description: string | null;
  description: string;
  specifications: Record<string, unknown>;
  features: unknown[];
  metadata: Record<string, unknown>;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  tax_class: string;
  stock_quantity: number;
  reserved_quantity: number;
  minimum_order_quantity: number;
  maximum_order_quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  status: string;
  visibility: string;
  ai_tags: string[] | null;
  ai_summary: string | null;
  ai_category_score: number;
  ai_quality_score: number;
  ai_risk_score: number;
  ai_duplicate_score: number;
  published_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  title: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  attributes: Record<string, unknown>;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductMediaRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_type: string;
  file_url: string;
  thumbnail_url: string | null;
  position: number;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ProductAttributeRow = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

type ProductAttributeValueRow = {
  id: string;
  attribute_id: string;
  product_id: string;
  value: string;
  created_at: string;
};

type InventoryRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  warehouse_id: string | null;
  available_quantity: number;
  reserved_quantity: number;
  damaged_quantity: number;
  returned_quantity: number;
  incoming_quantity: number;
  reorder_level: number;
  updated_at: string;
};

// ---- Mappers ----

function mapCategory(r: MarketplaceCategoryRow): MarketplaceCategory {
  return {
    id: r.id,
    parentId: r.parent_id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    imageUrl: r.image_url,
    icon: r.icon,
    isActive: r.is_active,
    position: r.position,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapBrand(r: MarketplaceBrandRow): MarketplaceBrand {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logo_url,
    website: r.website,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    sellerId: r.seller_id,
    companyId: r.company_id,
    countryId: r.country_id,
    languageId: r.language_id,
    currencyId: r.currency_id,
    categoryId: r.category_id,
    brandId: r.brand_id,
    sku: r.sku,
    barcode: r.barcode,
    slug: r.slug,
    title: r.title,
    shortDescription: r.short_description,
    description: r.description,
    specifications: r.specifications,
    features: r.features,
    metadata: r.metadata,
    price: r.price,
    compareAtPrice: r.compare_at_price,
    costPrice: r.cost_price,
    taxClass: r.tax_class,
    stockQuantity: r.stock_quantity,
    reservedQuantity: r.reserved_quantity,
    minimumOrderQuantity: r.minimum_order_quantity,
    maximumOrderQuantity: r.maximum_order_quantity,
    weight: r.weight,
    length: r.length,
    width: r.width,
    height: r.height,
    status: r.status as Product['status'],
    visibility: r.visibility as Product['visibility'],
    aiEmbedding: null,
    searchVector: null,
    aiTags: r.ai_tags,
    aiSummary: r.ai_summary,
    aiCategoryScore: r.ai_category_score,
    aiQualityScore: r.ai_quality_score,
    aiRiskScore: r.ai_risk_score,
    aiDuplicateScore: r.ai_duplicate_score,
    publishedAt: r.published_at,
    isDeleted: r.is_deleted,
    deletedAt: r.deleted_at,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapVariant(r: ProductVariantRow): ProductVariant {
  return {
    id: r.id,
    productId: r.product_id,
    sku: r.sku,
    barcode: r.barcode,
    title: r.title,
    price: r.price,
    compareAtPrice: r.compare_at_price,
    stockQuantity: r.stock_quantity,
    attributes: r.attributes,
    imageUrl: r.image_url,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMedia(r: ProductMediaRow): ProductMedia {
  return {
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id,
    mediaType: r.media_type,
    fileUrl: r.file_url,
    thumbnailUrl: r.thumbnail_url,
    position: r.position,
    isPrimary: r.is_primary,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapAttribute(r: ProductAttributeRow): ProductAttribute {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    createdAt: r.created_at,
  };
}

function mapAttributeValue(r: ProductAttributeValueRow): ProductAttributeValue {
  return {
    id: r.id,
    attributeId: r.attribute_id,
    productId: r.product_id,
    value: r.value,
    createdAt: r.created_at,
  };
}

function mapInventory(r: InventoryRow): Inventory {
  return {
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id,
    warehouseId: r.warehouse_id,
    availableQuantity: r.available_quantity,
    reservedQuantity: r.reserved_quantity,
    damagedQuantity: r.damaged_quantity,
    returnedQuantity: r.returned_quantity,
    incomingQuantity: r.incoming_quantity,
    reorderLevel: r.reorder_level,
    updatedAt: r.updated_at,
  };
}

// ================================================================
// === Marketplace Categories
// ================================================================

export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as MarketplaceCategoryRow[]).map(mapCategory);
}

export async function getRootCategories(): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data as MarketplaceCategoryRow[]).map(mapCategory);
}

export async function getChildCategories(
  parentId: string
): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data as MarketplaceCategoryRow[]).map(mapCategory);
}

export async function getMarketplaceCategoryBySlug(
  slug: string
): Promise<MarketplaceCategory | null> {
  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCategory(data as MarketplaceCategoryRow) : null;
}

// ================================================================
// === Marketplace Brands
// ================================================================

export async function getMarketplaceBrands(): Promise<MarketplaceBrand[]> {
  const { data, error } = await supabase
    .from('marketplace_brands')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as MarketplaceBrandRow[]).map(mapBrand);
}

export async function getMarketplaceBrandBySlug(
  slug: string
): Promise<MarketplaceBrand | null> {
  const { data, error } = await supabase
    .from('marketplace_brands')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrand(data as MarketplaceBrandRow) : null;
}

// ================================================================
// === Products
// ================================================================

type GetActiveProductsOptions = {
  countryId?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};

export async function getActiveProducts(
  options: GetActiveProductsOptions = {}
): Promise<Product[]> {
  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT_COLS)
    .eq('status', 'active')
    .eq('visibility', 'public')
    .eq('is_deleted', false);

  if (options.countryId) q = q.eq('country_id', options.countryId);
  if (options.categoryId) q = q.eq('category_id', options.categoryId);
  if (options.brandId) q = q.eq('brand_id', options.brandId);
  if (options.minPrice !== undefined) q = q.gte('price', options.minPrice);
  if (options.maxPrice !== undefined) q = q.lte('price', options.maxPrice);

  const { data, error } = await q
    .order('ai_quality_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);

  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(
  countryId: string,
  slug: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_COLS)
    .eq('country_id', countryId)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function searchProducts(
  query: string,
  countryId?: string
): Promise<Product[]> {
  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT_COLS)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' });

  if (countryId) q = q.eq('country_id', countryId);

  const { data, error } = await q
    .order('ai_quality_score', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getMyProducts(status?: ProductStatus): Promise<Product[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT_COLS)
    .eq('seller_id', user.id)
    .eq('is_deleted', false);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    seller_id: user.id,
    country_id: input.countryId,
    title: input.title,
    slug: input.slug,
    description: input.description,
    price: input.price,
  };

  if (input.companyId !== undefined) payload['company_id'] = input.companyId;
  if (input.languageId !== undefined) payload['language_id'] = input.languageId;
  if (input.currencyId !== undefined) payload['currency_id'] = input.currencyId;
  if (input.categoryId !== undefined) payload['category_id'] = input.categoryId;
  if (input.brandId !== undefined) payload['brand_id'] = input.brandId;
  if (input.sku !== undefined) payload['sku'] = input.sku;
  if (input.barcode !== undefined) payload['barcode'] = input.barcode;
  if (input.shortDescription !== undefined) payload['short_description'] = input.shortDescription;
  if (input.specifications !== undefined) payload['specifications'] = input.specifications;
  if (input.features !== undefined) payload['features'] = input.features;
  if (input.compareAtPrice !== undefined) payload['compare_at_price'] = input.compareAtPrice;
  if (input.costPrice !== undefined) payload['cost_price'] = input.costPrice;
  if (input.taxClass !== undefined) payload['tax_class'] = input.taxClass;
  if (input.stockQuantity !== undefined) payload['stock_quantity'] = input.stockQuantity;
  if (input.minimumOrderQuantity !== undefined) payload['minimum_order_quantity'] = input.minimumOrderQuantity;
  if (input.maximumOrderQuantity !== undefined) payload['maximum_order_quantity'] = input.maximumOrderQuantity;
  if (input.weight !== undefined) payload['weight'] = input.weight;
  if (input.length !== undefined) payload['length'] = input.length;
  if (input.width !== undefined) payload['width'] = input.width;
  if (input.height !== undefined) payload['height'] = input.height;
  if (input.status !== undefined) payload['status'] = input.status;
  if (input.visibility !== undefined) payload['visibility'] = input.visibility;
  if (input.metadata !== undefined) payload['metadata'] = input.metadata;

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(PRODUCT_SELECT_COLS)
    .single();
  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<Product> {
  const payload: Record<string, unknown> = {};

  if (input.companyId !== undefined) payload['company_id'] = input.companyId;
  if (input.languageId !== undefined) payload['language_id'] = input.languageId;
  if (input.currencyId !== undefined) payload['currency_id'] = input.currencyId;
  if (input.categoryId !== undefined) payload['category_id'] = input.categoryId;
  if (input.brandId !== undefined) payload['brand_id'] = input.brandId;
  if (input.sku !== undefined) payload['sku'] = input.sku;
  if (input.barcode !== undefined) payload['barcode'] = input.barcode;
  if (input.title !== undefined) payload['title'] = input.title;
  if (input.shortDescription !== undefined) payload['short_description'] = input.shortDescription;
  if (input.description !== undefined) payload['description'] = input.description;
  if (input.specifications !== undefined) payload['specifications'] = input.specifications;
  if (input.features !== undefined) payload['features'] = input.features;
  if (input.price !== undefined) payload['price'] = input.price;
  if (input.compareAtPrice !== undefined) payload['compare_at_price'] = input.compareAtPrice;
  if (input.costPrice !== undefined) payload['cost_price'] = input.costPrice;
  if (input.taxClass !== undefined) payload['tax_class'] = input.taxClass;
  if (input.stockQuantity !== undefined) payload['stock_quantity'] = input.stockQuantity;
  if (input.minimumOrderQuantity !== undefined) payload['minimum_order_quantity'] = input.minimumOrderQuantity;
  if (input.maximumOrderQuantity !== undefined) payload['maximum_order_quantity'] = input.maximumOrderQuantity;
  if (input.weight !== undefined) payload['weight'] = input.weight;
  if (input.length !== undefined) payload['length'] = input.length;
  if (input.width !== undefined) payload['width'] = input.width;
  if (input.height !== undefined) payload['height'] = input.height;
  if (input.status !== undefined) payload['status'] = input.status;
  if (input.visibility !== undefined) payload['visibility'] = input.visibility;
  if (input.metadata !== undefined) payload['metadata'] = input.metadata;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select(PRODUCT_SELECT_COLS)
    .single();
  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function softDeleteProduct(
  productId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      status: 'archived',
      ...(reason ? { deleted_reason: reason } : {}),
    })
    .eq('id', productId);
  if (error) throw error;
}

// ================================================================
// === Product Variants
// ================================================================

export async function getProductVariants(
  productId: string
): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data as ProductVariantRow[]).map(mapVariant);
}

// ================================================================
// === Product Media
// ================================================================

export async function getProductMedia(
  productId: string
): Promise<ProductMedia[]> {
  const { data, error } = await supabase
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data as ProductMediaRow[]).map(mapMedia);
}

// ================================================================
// === Product Attributes
// ================================================================

export async function getProductAttributes(
  productId: string
): Promise<ProductAttributeValue[]> {
  const { data, error } = await supabase
    .from('product_attribute_values')
    .select('*')
    .eq('product_id', productId);
  if (error) throw error;
  return (data as ProductAttributeValueRow[]).map(mapAttributeValue);
}

export async function getAllAttributes(): Promise<ProductAttribute[]> {
  const { data, error } = await supabase
    .from('product_attributes')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as ProductAttributeRow[]).map(mapAttribute);
}

// ================================================================
// === Inventory
// ================================================================

export async function getInventory(
  productId: string,
  variantId?: string
): Promise<Inventory[]> {
  let q = supabase
    .from('inventory')
    .select('*')
    .eq('product_id', productId);

  if (variantId) q = q.eq('variant_id', variantId);

  const { data, error } = await q;
  if (error) throw error;
  return (data as InventoryRow[]).map(mapInventory);
}
