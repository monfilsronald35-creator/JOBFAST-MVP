import { ProductRepository }                                 from '../repositories/ProductRepository.js';
import { AppError }                                          from '../../../core/errors/AppError.js';
import { ProductStatus, type Store, type Product, type ProductVariant, type ProductMedia, type ProductSearchQuery } from '../types/product.types.js';

async function requireProduct(id: string, sellerId: string): Promise<Product> {
  const p = await ProductRepository.findById(id);
  if (!p) throw new AppError('Product not found', 404, 'NOT_FOUND');
  if (p.sellerId !== sellerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return p;
}

export const ProductService = {
  // ——— Stores ——————————————————————————————————————————————————————————————
  async createStore(ownerId: string, data: Omit<Store, 'id' | 'ownerId' | 'rating' | 'reviewCount' | 'verified' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    return ProductRepository.createStore(ownerId, data);
  },

  async getStore(id: string): Promise<Store> {
    const s = await ProductRepository.findStoreById(id);
    if (!s) throw new AppError('Store not found', 404, 'NOT_FOUND');
    return s;
  },

  async updateStore(id: string, ownerId: string, data: Partial<Store>): Promise<Store> {
    const s = await ProductRepository.findStoreById(id);
    if (!s) throw new AppError('Store not found', 404, 'NOT_FOUND');
    if (s.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return ProductRepository.updateStore(id, data);
  },

  // ——— Products ————————————————————————————————————————————————————————————
  async create(sellerId: string, data: Omit<Product, 'id' | 'sellerId' | 'viewsCount' | 'ordersCount' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return ProductRepository.create(sellerId, data);
  },

  async getById(id: string): Promise<Product> {
    const p = await ProductRepository.findById(id);
    if (!p) throw new AppError('Product not found', 404, 'NOT_FOUND');
    await ProductRepository.incrementViews(id).catch(() => undefined);
    return p;
  },

  async update(id: string, sellerId: string, data: Partial<Product>): Promise<Product> {
    await requireProduct(id, sellerId);
    return ProductRepository.update(id, data);
  },

  async publish(id: string, sellerId: string): Promise<Product> {
    await requireProduct(id, sellerId);
    return ProductRepository.update(id, { status: ProductStatus.Active });
  },

  async pause(id: string, sellerId: string): Promise<Product> {
    await requireProduct(id, sellerId);
    return ProductRepository.update(id, { status: ProductStatus.Paused });
  },

  async archive(id: string, sellerId: string): Promise<Product> {
    await requireProduct(id, sellerId);
    return ProductRepository.update(id, { status: ProductStatus.Archived });
  },

  async listBySeller(sellerId: string, status?: ProductStatus): Promise<Product[]> {
    return ProductRepository.listBySeller(sellerId, status);
  },

  async search(query: ProductSearchQuery): Promise<Product[]> {
    return ProductRepository.search(query);
  },

  // ——— Variants ————————————————————————————————————————————————————————————
  async addVariant(productId: string, sellerId: string, data: Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>): Promise<ProductVariant> {
    await requireProduct(productId, sellerId);
    return ProductRepository.addVariant({ ...data, productId });
  },

  async listVariants(productId: string): Promise<ProductVariant[]> {
    return ProductRepository.listVariants(productId);
  },

  // ——— Media ———————————————————————————————————————————————————————————————
  async addMedia(productId: string, sellerId: string, data: Omit<ProductMedia, 'id' | 'productId' | 'createdAt'>): Promise<ProductMedia> {
    await requireProduct(productId, sellerId);
    return ProductRepository.addMedia({ ...data, productId });
  },

  async listMedia(productId: string): Promise<ProductMedia[]> {
    return ProductRepository.listMedia(productId);
  },

  // ——— Inventory ———————————————————————————————————————————————————————————
  async setStock(productId: string, sellerId: string, qty: number, variantId?: string): Promise<void> {
    await requireProduct(productId, sellerId);
    await ProductRepository.upsertInventory(productId, qty, variantId);
  },

  async adjustStock(productId: string, delta: number, variantId?: string): Promise<void> {
    await ProductRepository.adjustInventory(productId, delta, variantId);
  },

  async getInventory(productId: string, variantId?: string) {
    return ProductRepository.getInventory(productId, variantId);
  },
};
