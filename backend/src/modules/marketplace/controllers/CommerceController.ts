import type { Request, Response, NextFunction } from 'express';
import { ReviewService }       from '../services/ReviewService.js';
import { CouponService }       from '../services/CouponService.js';
import { DisputeService }      from '../services/DisputeService.js';
import { AuctionService }      from '../services/AuctionService.js';
import { SubscriptionService } from '../services/SubscriptionService.js';
import { MarketRepository }    from '../repositories/MarketRepository.js';
import { AppError }            from '../../../core/errors/AppError.js';
import type { Favorite, ResolutionType } from '../types/commerce.types.js';

export const CommerceController = {
  // ——— Reviews ——————————————————————————————————————————————————————————————
  createReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const review = await ReviewService.create(req.user!.sub, {
        productId:          req.params['productId']!,
        sellerId:           body['sellerId'] as string,
        rating:             body['rating']   as number,
        body:               body['body']     as string,
        pros:               (body['pros']    as string[]) ?? [],
        cons:               (body['cons']    as string[]) ?? [],
        mediaUrls:          (body['mediaUrls'] as string[]) ?? [],
        isVerifiedPurchase: Boolean(body['isVerifiedPurchase']),
        ...(body['orderId'] ? { orderId: body['orderId'] as string } : {}),
        ...(body['title']   ? { title:   body['title']   as string } : {}),
      });
      res.status(201).json({ success: true, data: review });
    } catch (err) { next(err); }
  },

  listReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviews = await ReviewService.listByProduct(req.params['productId']!);
      res.json({ success: true, data: reviews, count: reviews.length });
    } catch (err) { next(err); }
  },

  markHelpful: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await ReviewService.markHelpful(req.params['reviewId']!);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  reportSpam: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await ReviewService.reportSpam(req.params['reviewId']!);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ——— Favorites ————————————————————————————————————————————————————————————
  addFavorite: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { targetType: Favorite['targetType']; targetId: string };
      const fav = await ReviewService.addFavorite(req.user!.sub, body.targetType, body.targetId);
      res.status(201).json({ success: true, data: fav });
    } catch (err) { next(err); }
  },

  removeFavorite: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetType, targetId } = req.params as { targetType: string; targetId: string };
      await ReviewService.removeFavorite(req.user!.sub, targetType as Favorite['targetType'], targetId);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  myFavorites: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const favs = await ReviewService.listFavorites(req.user!.sub);
      res.json({ success: true, data: favs, count: favs.length });
    } catch (err) { next(err); }
  },

  // ——— Coupons ——————————————————————————————————————————————————————————————
  createCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await CouponService.create(req.user!.sub, req.body as never);
      res.status(201).json({ success: true, data: coupon });
    } catch (err) { next(err); }
  },

  validateCoupon: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, orderAmount } = req.query as { code: string; orderAmount: string };
      if (!code) throw new AppError('code required', 400, 'MISSING_FIELD');
      const result = await CouponService.validate(code, req.user!.sub, parseInt(orderAmount ?? '0', 10));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ——— Disputes —————————————————————————————————————————————————————————————
  openDispute: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const dispute = await DisputeService.open(req.user!.sub, {
        orderId:    body['orderId']    as string,
        sellerId:   body['sellerId']   as string,
        type:       body['type']       as never,
        buyerClaim: body['buyerClaim'] as string,
      });
      res.status(201).json({ success: true, data: dispute });
    } catch (err) { next(err); }
  },

  respondDispute: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { response } = req.body as { response: string };
      const dispute = await DisputeService.respond(req.params['id']!, req.user!.sub, response);
      res.json({ success: true, data: dispute });
    } catch (err) { next(err); }
  },

  addDisputeEvidence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { role: 'buyer' | 'seller'; urls: string[] };
      const dispute = await DisputeService.addEvidence(req.params['id']!, body.role, req.user!.sub, body.urls);
      res.json({ success: true, data: dispute });
    } catch (err) { next(err); }
  },

  resolveDispute: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { resolution: string; resolutionType: ResolutionType };
      const dispute = await DisputeService.resolve(req.params['id']!, req.user!.sub, body.resolution, body.resolutionType);
      res.json({ success: true, data: dispute });
    } catch (err) { next(err); }
  },

  aiAssessDispute: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dispute = await DisputeService.aiAssess(req.params['id']!);
      res.json({ success: true, data: dispute });
    } catch (err) { next(err); }
  },

  // ——— Auctions —————————————————————————————————————————————————————————————
  createAuction: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auction = await AuctionService.create(req.user!.sub, req.body as never);
      res.status(201).json({ success: true, data: auction });
    } catch (err) { next(err); }
  },

  getAuction: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auction = await AuctionService.getById(req.params['id']!);
      res.json({ success: true, data: auction });
    } catch (err) { next(err); }
  },

  listAuctions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auctions = await AuctionService.listActive();
      res.json({ success: true, data: auctions, count: auctions.length });
    } catch (err) { next(err); }
  },

  placeBid: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, currency } = req.body as { amount: number; currency?: string };
      if (!amount) throw new AppError('amount required', 400, 'MISSING_FIELD');
      const result = await AuctionService.placeBid(req.params['id']!, req.user!.sub, amount, currency ?? 'HTG');
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  listBids: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bids = await AuctionService.listBids(req.params['id']!);
      res.json({ success: true, data: bids, count: bids.length });
    } catch (err) { next(err); }
  },

  // ——— Subscriptions ————————————————————————————————————————————————————————
  createPlan: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await SubscriptionService.createPlan(req.user!.sub, req.body as never);
      res.status(201).json({ success: true, data: plan });
    } catch (err) { next(err); }
  },

  subscribe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { planId } = req.body as { planId: string };
      const sub = await SubscriptionService.subscribe(req.user!.sub, planId);
      res.status(201).json({ success: true, data: sub });
    } catch (err) { next(err); }
  },

  cancelSubscription: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sub = await SubscriptionService.cancel(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: sub });
    } catch (err) { next(err); }
  },

  mySubscriptions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subs = await SubscriptionService.list(req.user!.sub);
      res.json({ success: true, data: subs, count: subs.length });
    } catch (err) { next(err); }
  },

  // ——— Digital Deliveries ───────────────────────────────────────────────────
  myDownloads: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deliveries = await MarketRepository.listDeliveries(req.user!.sub);
      res.json({ success: true, data: deliveries, count: deliveries.length });
    } catch (err) { next(err); }
  },

  incrementDownload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await MarketRepository.incrementDownload(req.params['id']!);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};
