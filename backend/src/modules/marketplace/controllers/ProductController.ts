import type { Request, Response, NextFunction } from 'express';
import { ProductService }        from '../services/ProductService.js';
import { AIMarketplaceEngine }   from '../services/AIMarketplaceEngine.js';
import { ProductStatus, ProductType, type ProductSearchQuery } from '../types/product.types.js';

export const ProductController = {
  // ——— Stores ——————————————————————————————————————————————————————————————
  createStore: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const store = await ProductService.createStore(req.user!.sub, {
        name:   body['name']   as string,
        slug:   body['slug']   as string,
        type:   (body['type']  as never) ?? 'individual',
        status: (body['status']as never) ?? 'active',
        ...(body['description'] ? { description: body['description'] as string } : {}),
        ...(body['logoUrl']     ? { logoUrl:      body['logoUrl']     as string } : {}),
        ...(body['bannerUrl']   ? { bannerUrl:    body['bannerUrl']   as string } : {}),
        ...(body['country']     ? { country:      body['country']     as string } : {}),
        ...(body['city']        ? { city:         body['city']        as string } : {}),
      });
      res.status(201).json({ success: true, data: store });
    } catch (err) { next(err); }
  },

  getStore: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const store = await ProductService.getStore(req.params['id']!);
      res.json({ success: true, data: store });
    } catch (err) { next(err); }
  },

  updateStore: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const store = await ProductService.updateStore(req.params['id']!, req.user!.sub, req.body as never);
      res.json({ success: true, data: store });
    } catch (err) { next(err); }
  },

  // ——— Products ————————————————————————————————————————————————————————————
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const title       = body['title']       as string;
      const description = body['description'] as string;
      const autoTags    = AIMarketplaceEngine.generateTags(title, description);
      const autoCategory = AIMarketplaceEngine.classifyProduct(title, description);

      const product = await ProductService.create(req.user!.sub, {
        title, description,
        type:              (body['type']     as ProductType)   ?? ProductType.Physical,
        status:            ProductStatus.Draft,
        category:          (body['category'] as string)        ?? autoCategory,
        tags:              (body['tags']     as string[])       ?? autoTags,
        currency:          (body['currency'] as string)        ?? 'HTG',
        basePrice:         (body['basePrice']as number)        ?? 0,
        isPriceNegotiable: Boolean(body['isPriceNegotiable']),
        languages:         (body['languages']as string[])       ?? [],
        isInternational:   Boolean(body['isInternational']),
        isFeatured:        false,
        isSponsored:       false,
        ...(body['storeId']     ? { storeId:     body['storeId']     as string } : {}),
        ...(body['subcategory'] ? { subcategory: body['subcategory'] as string } : {}),
        ...(body['country']     ? { country:     body['country']     as string } : {}),
        ...(body['city']        ? { city:        body['city']        as string } : {}),
        ...(body['lat'] !== undefined ? { lat: Number(body['lat']) } : {}),
        ...(body['lng'] !== undefined ? { lng: Number(body['lng']) } : {}),
        ...(body['radiusKm']    ? { radiusKm:    Number(body['radiusKm']) } : {}),
      });
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductService.getById(req.params['id']!);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductService.update(req.params['id']!, req.user!.sub, req.body as never);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  publish: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductService.publish(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  pause: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductService.pause(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  archive: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await ProductService.archive(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  myProducts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query as { status?: string };
      const products = await ProductService.listBySeller(req.user!.sub, status as ProductStatus | undefined);
      res.json({ success: true, data: products, count: products.length });
    } catch (err) { next(err); }
  },

  search: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const query: ProductSearchQuery = {};
      if (q['type'])          query.type        = q['type'] as ProductType;
      if (q['category'])      query.category    = q['category'];
      if (q['country'])       query.country     = q['country'];
      if (q['city'])          query.city        = q['city'];
      if (q['minPrice'])      query.minPrice    = parseInt(q['minPrice'],  10);
      if (q['maxPrice'])      query.maxPrice    = parseInt(q['maxPrice'],  10);
      if (q['tags'])          query.tags        = q['tags']!.split(',').filter(Boolean);
      if (q['isInternational']) query.isInternational = q['isInternational'] === 'true';
      if (q['isFeatured'])    query.isFeatured  = q['isFeatured'] === 'true';
      if (q['sellerId'])      query.sellerId    = q['sellerId'];
      if (q['storeId'])       query.storeId     = q['storeId'];
      if (q['limit'])         query.limit       = parseInt(q['limit'], 10);
      const products = await ProductService.search(query);
      res.json({ success: true, data: products, count: products.length });
    } catch (err) { next(err); }
  },

  recommended: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await AIMarketplaceEngine.computeRecommendations(req.user!.sub, { limit: 20 });
      res.json({ success: true, data: products });
    } catch (err) { next(err); }
  },

  // ——— Variants ————————————————————————————————————————————————————————————
  addVariant: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const variant = await ProductService.addVariant(req.params['id']!, req.user!.sub, {
        name:          body['name']       as string,
        attributes:    (body['attributes']as Record<string, string>) ?? {},
        priceModifier: (body['priceModifier'] as number) ?? 0,
        stockQty:      (body['stockQty']  as number)     ?? 0,
        isAvailable:   body['isAvailable'] !== false,
        ...(body['sku'] ? { sku: body['sku'] as string } : {}),
      });
      res.status(201).json({ success: true, data: variant });
    } catch (err) { next(err); }
  },

  listVariants: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const variants = await ProductService.listVariants(req.params['id']!);
      res.json({ success: true, data: variants });
    } catch (err) { next(err); }
  },

  // ——— Media ———————————————————————————————————————————————————————————————
  addMedia: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const media = await ProductService.addMedia(req.params['id']!, req.user!.sub, {
        type:      (body['type']  as 'image' | 'video' | 'document') ?? 'image',
        url:        body['url']   as string,
        sortOrder: (body['sortOrder'] as number) ?? 0,
        ...(body['thumbnailUrl'] ? { thumbnailUrl: body['thumbnailUrl'] as string } : {}),
        ...(body['caption']      ? { caption:      body['caption']      as string } : {}),
      });
      res.status(201).json({ success: true, data: media });
    } catch (err) { next(err); }
  },

  listMedia: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const media = await ProductService.listMedia(req.params['id']!);
      res.json({ success: true, data: media });
    } catch (err) { next(err); }
  },

  // ——— Inventory ———————————————————————————————————————————————————————————
  setStock: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { qty, variantId } = req.body as { qty: number; variantId?: string };
      await ProductService.setStock(req.params['id']!, req.user!.sub, qty, variantId);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  getInventory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { variantId } = req.query as { variantId?: string };
      const inv = await ProductService.getInventory(req.params['id']!, variantId);
      res.json({ success: true, data: inv });
    } catch (err) { next(err); }
  },
};
