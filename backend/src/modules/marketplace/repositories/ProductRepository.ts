import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  ProductStatus,
  type Store, type Product, type ProductVariant, type ProductMedia,
  type Warehouse, type InventoryRecord, type ProductSearchQuery,
} from '../types/product.types.js';

function toStore(r: Record<string, unknown>): Store {
  const base: Store = {
    id: r['id'] as string, ownerId: r['owner_id'] as string,
    name: r['name'] as string, slug: r['slug'] as string,
    type: r['type'] as Store['type'], status: r['status'] as Store['status'],
    rating: Number(r['rating']), reviewCount: r['review_count'] as number,
    verified: r['verified'] as boolean,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['description']) b['description'] = r['description'];
  if (r['logo_url'])    b['logoUrl']     = r['logo_url'];
  if (r['banner_url'])  b['bannerUrl']   = r['banner_url'];
  if (r['country'])     b['country']     = r['country'];
  if (r['city'])        b['city']        = r['city'];
  if (r['address'])     b['address']     = r['address'];
  if (r['lat'] !== null && r['lat'] !== undefined) b['lat'] = Number(r['lat']);
  if (r['lng'] !== null && r['lng'] !== undefined) b['lng'] = Number(r['lng']);
  return base;
}

function toProduct(r: Record<string, unknown>): Product {
  const base: Product = {
    id: r['id'] as string, sellerId: r['seller_id'] as string,
    title: r['title'] as string, description: r['description'] as string,
    type: r['type'] as Product['type'], status: r['status'] as ProductStatus,
    category: r['category'] as string, tags: (r['tags'] as string[]) ?? [],
    currency: r['currency'] as string, basePrice: r['base_price'] as number,
    isPriceNegotiable: r['is_price_negotiable'] as boolean,
    languages: (r['languages'] as string[]) ?? [],
    isInternational: r['is_international'] as boolean,
    isFeatured: r['is_featured'] as boolean, isSponsored: r['is_sponsored'] as boolean,
    viewsCount: r['views_count'] as number, ordersCount: r['orders_count'] as number,
    rating: Number(r['rating']), reviewCount: r['review_count'] as number,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['store_id'])    b['storeId']    = r['store_id'];
  if (r['subcategory']) b['subcategory'] = r['subcategory'];
  if (r['country'])     b['country']    = r['country'];
  if (r['city'])        b['city']       = r['city'];
  if (r['lat'] !== null && r['lat'] !== undefined) b['lat'] = Number(r['lat']);
  if (r['lng'] !== null && r['lng'] !== undefined) b['lng'] = Number(r['lng']);
  if (r['radius_km'])   b['radiusKm']   = r['radius_km'];
  return base;
}

function toVariant(r: Record<string, unknown>): ProductVariant {
  const base: ProductVariant = {
    id: r['id'] as string, productId: r['product_id'] as string,
    name: r['name'] as string, attributes: (r['attributes'] as Record<string, string>) ?? {},
    priceModifier: r['price_modifier'] as number,
    stockQty: r['stock_qty'] as number, isAvailable: r['is_available'] as boolean,
    createdAt: r['created_at'] as string,
  };
  if (r['sku']) (base as unknown as Record<string, unknown>)['sku'] = r['sku'];
  return base;
}

function toMedia(r: Record<string, unknown>): ProductMedia {
  const base: ProductMedia = {
    id: r['id'] as string, productId: r['product_id'] as string,
    type: r['type'] as ProductMedia['type'], url: r['url'] as string,
    sortOrder: r['sort_order'] as number, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['thumbnail_url']) b['thumbnailUrl'] = r['thumbnail_url'];
  if (r['caption'])       b['caption']      = r['caption'];
  return base;
}

function toInventory(r: Record<string, unknown>): InventoryRecord {
  const base: InventoryRecord = {
    id: r['id'] as string, productId: r['product_id'] as string,
    qtyAvailable: r['qty_available'] as number,
    qtyReserved: r['qty_reserved'] as number, qtySold: r['qty_sold'] as number,
    serialNumbers: (r['serial_numbers'] as string[]) ?? [],
    updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['variant_id'])       b['variantId']      = r['variant_id'];
  if (r['warehouse_id'])     b['warehouseId']    = r['warehouse_id'];
  if (r['barcode'])          b['barcode']        = r['barcode'];
  if (r['qr_code'])          b['qrCode']         = r['qr_code'];
  if (r['expiration_date'])  b['expirationDate'] = r['expiration_date'];
  if (r['batch_number'])     b['batchNumber']    = r['batch_number'];
  if (r['supplier_id'])      b['supplierId']     = r['supplier_id'];
  return base;
}

export const ProductRepository = {
  // ——— Stores ———————————————————————————————————————————————————————————————
  async createStore(ownerId: string, data: Omit<Store, 'id' | 'ownerId' | 'rating' | 'reviewCount' | 'verified' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    const row: Record<string, unknown> = {
      owner_id: ownerId, name: data.name, slug: data.slug,
      type: data.type, status: data.status,
    };
    if (data.description) row['description'] = data.description;
    if (data.logoUrl)     row['logo_url']    = data.logoUrl;
    if (data.bannerUrl)   row['banner_url']  = data.bannerUrl;
    if (data.country)     row['country']     = data.country;
    if (data.city)        row['city']        = data.city;
    if (data.address)     row['address']     = data.address;
    if (data.lat !== undefined) row['lat']   = data.lat;
    if (data.lng !== undefined) row['lng']   = data.lng;
    const { data: saved, error } = await db.client()
      .from('mp_stores').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create store', 500, 'DB_ERROR');
    return toStore(saved);
  },

  async findStoreById(id: string): Promise<Store | null> {
    const { data, error } = await db.client()
      .from('mp_stores').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load store', 500, 'DB_ERROR');
    return data ? toStore(data) : null;
  },

  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name        !== undefined) row['name']        = data.name;
    if (data.description !== undefined) row['description'] = data.description;
    if (data.logoUrl     !== undefined) row['logo_url']    = data.logoUrl;
    if (data.bannerUrl   !== undefined) row['banner_url']  = data.bannerUrl;
    if (data.status      !== undefined) row['status']      = data.status;
    if (data.country     !== undefined) row['country']     = data.country;
    if (data.city        !== undefined) row['city']        = data.city;
    const { data: saved, error } = await db.client()
      .from('mp_stores').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to update store', 500, 'DB_ERROR');
    return toStore(saved);
  },

  // ——— Products ——————————————————————————————————————————————————————————————
  async create(sellerId: string, data: Omit<Product, 'id' | 'sellerId' | 'viewsCount' | 'ordersCount' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const row: Record<string, unknown> = {
      seller_id: sellerId, title: data.title, description: data.description,
      type: data.type, status: data.status, category: data.category,
      tags: data.tags, currency: data.currency, base_price: data.basePrice,
      is_price_negotiable: data.isPriceNegotiable, languages: data.languages,
      is_international: data.isInternational, is_featured: data.isFeatured,
      is_sponsored: data.isSponsored,
    };
    if (data.storeId)     row['store_id']    = data.storeId;
    if (data.subcategory) row['subcategory'] = data.subcategory;
    if (data.country)     row['country']     = data.country;
    if (data.city)        row['city']        = data.city;
    if (data.lat !== undefined) row['lat']   = data.lat;
    if (data.lng !== undefined) row['lng']   = data.lng;
    if (data.radiusKm)    row['radius_km']   = data.radiusKm;
    const { data: saved, error } = await db.client()
      .from('mp_products').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create product', 500, 'DB_ERROR');
    return toProduct(saved);
  },

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await db.client()
      .from('mp_products').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load product', 500, 'DB_ERROR');
    return data ? toProduct(data) : null;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title              !== undefined) row['title']              = data.title;
    if (data.description        !== undefined) row['description']        = data.description;
    if (data.status             !== undefined) row['status']             = data.status;
    if (data.category           !== undefined) row['category']           = data.category;
    if (data.subcategory        !== undefined) row['subcategory']        = data.subcategory;
    if (data.tags               !== undefined) row['tags']               = data.tags;
    if (data.basePrice          !== undefined) row['base_price']         = data.basePrice;
    if (data.isPriceNegotiable  !== undefined) row['is_price_negotiable']= data.isPriceNegotiable;
    if (data.currency           !== undefined) row['currency']           = data.currency;
    if (data.languages          !== undefined) row['languages']          = data.languages;
    if (data.isInternational    !== undefined) row['is_international']   = data.isInternational;
    if (data.isFeatured         !== undefined) row['is_featured']        = data.isFeatured;
    if (data.isSponsored        !== undefined) row['is_sponsored']       = data.isSponsored;
    if (data.country            !== undefined) row['country']            = data.country;
    if (data.city               !== undefined) row['city']               = data.city;
    if (data.lat                !== undefined) row['lat']                = data.lat;
    if (data.lng                !== undefined) row['lng']                = data.lng;
    if (data.radiusKm           !== undefined) row['radius_km']          = data.radiusKm;
    const { data: saved, error } = await db.client()
      .from('mp_products').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to update product', 500, 'DB_ERROR');
    return toProduct(saved);
  },

  async listBySeller(sellerId: string, status?: ProductStatus): Promise<Product[]> {
    let q = db.client().from('mp_products').select('*').eq('seller_id', sellerId)
              .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list products', 500, 'DB_ERROR');
    return (data ?? []).map(toProduct);
  },

  async search(query: ProductSearchQuery): Promise<Product[]> {
    let q = db.client().from('mp_products').select('*').eq('status', 'active');
    if (query.type)          q = q.eq('type', query.type);
    if (query.category)      q = q.eq('category', query.category);
    if (query.country)       q = q.eq('country', query.country);
    if (query.city)          q = q.eq('city', query.city);
    if (query.isInternational) q = q.eq('is_international', true);
    if (query.isFeatured)    q = q.eq('is_featured', true);
    if (query.sellerId)      q = q.eq('seller_id', query.sellerId);
    if (query.storeId)       q = q.eq('store_id', query.storeId);
    if (query.minPrice !== undefined) q = q.gte('base_price', query.minPrice);
    if (query.maxPrice !== undefined) q = q.lte('base_price', query.maxPrice);
    if (query.tags?.length)  q = q.overlaps('tags', query.tags);
    q = q.order('is_sponsored', { ascending: false })
         .order('is_featured',  { ascending: false })
         .order('created_at',   { ascending: false })
         .limit(query.limit ?? 20);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Search failed', 500, 'DB_ERROR');
    return (data ?? []).map(toProduct);
  },

  async incrementViews(id: string): Promise<void> {
    await db.client().rpc('increment_mp_product_views', { p_id: id }).throwOnError();
  },

  // ——— Variants ——————————————————————————————————————————————————————————————
  async addVariant(data: Omit<ProductVariant, 'id' | 'createdAt'>): Promise<ProductVariant> {
    const row: Record<string, unknown> = {
      product_id: data.productId, name: data.name, attributes: data.attributes,
      price_modifier: data.priceModifier, stock_qty: data.stockQty,
      is_available: data.isAvailable,
    };
    if (data.sku) row['sku'] = data.sku;
    const { data: saved, error } = await db.client()
      .from('mp_product_variants').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to add variant', 500, 'DB_ERROR');
    return toVariant(saved);
  },

  async listVariants(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await db.client().from('mp_product_variants')
      .select('*').eq('product_id', productId).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list variants', 500, 'DB_ERROR');
    return (data ?? []).map(toVariant);
  },

  // ——— Media ————————————————————————————————————————————————————————————————
  async addMedia(data: Omit<ProductMedia, 'id' | 'createdAt'>): Promise<ProductMedia> {
    const row: Record<string, unknown> = {
      product_id: data.productId, type: data.type, url: data.url,
      sort_order: data.sortOrder,
    };
    if (data.thumbnailUrl) row['thumbnail_url'] = data.thumbnailUrl;
    if (data.caption)      row['caption']       = data.caption;
    const { data: saved, error } = await db.client()
      .from('mp_product_media').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to add media', 500, 'DB_ERROR');
    return toMedia(saved);
  },

  async listMedia(productId: string): Promise<ProductMedia[]> {
    const { data, error } = await db.client().from('mp_product_media')
      .select('*').eq('product_id', productId)
      .order('sort_order').returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list media', 500, 'DB_ERROR');
    return (data ?? []).map(toMedia);
  },

  // ——— Inventory ————————————————————————————————————————————————————————————
  async upsertInventory(productId: string, qty: number, variantId?: string, warehouseId?: string): Promise<InventoryRecord> {
    const conflict = 'product_id,variant_id,warehouse_id';
    const { data, error } = await db.client().from('mp_inventory').upsert({
      product_id:    productId,
      variant_id:    variantId  ?? null,
      warehouse_id:  warehouseId ?? null,
      qty_available: qty,
      updated_at:    new Date().toISOString(),
    }, { onConflict: conflict }).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to upsert inventory', 500, 'DB_ERROR');
    return toInventory(data);
  },

  async getInventory(productId: string, variantId?: string): Promise<InventoryRecord | null> {
    let q = db.client().from('mp_inventory').select('*').eq('product_id', productId);
    if (variantId) q = q.eq('variant_id', variantId);
    const { data } = await q.single<Record<string, unknown>>();
    return data ? toInventory(data) : null;
  },

  async adjustInventory(productId: string, delta: number, variantId?: string): Promise<void> {
    const inv = await ProductRepository.getInventory(productId, variantId);
    if (!inv) return;
    await db.client().from('mp_inventory')
      .update({ qty_available: Math.max(0, inv.qtyAvailable + delta), updated_at: new Date().toISOString() })
      .eq('id', inv.id).throwOnError();
  },
};
