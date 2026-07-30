import { Router } from 'express';
import { ProductController }  from '../controllers/ProductController.js';
import { OrderController }    from '../controllers/OrderController.js';
import { CommerceController } from '../controllers/CommerceController.js';
import { requireAuth } from '../../../core/middleware/auth.middleware.js';

export function createMarketplaceRouter(): Router {
  const r = Router();

  // ——— Public: product discovery ————————————————————————————————————————————
  r.get('/products/search',               ProductController.search);
  r.get('/products/:id',                  ProductController.getById);
  r.get('/products/:id/variants',         ProductController.listVariants);
  r.get('/products/:id/media',            ProductController.listMedia);
  r.get('/products/:id/inventory',        ProductController.getInventory);
  r.get('/products/:productId/reviews',   CommerceController.listReviews);

  // ——— Public: auctions ————————————————————————————————————————————————————
  r.get('/auctions',                      CommerceController.listAuctions);
  r.get('/auctions/:id',                  CommerceController.getAuction);
  r.get('/auctions/:id/bids',             CommerceController.listBids);

  // ——— Stores ——————————————————————————————————————————————————————————————
  r.post('/stores',        requireAuth,   ProductController.createStore);
  r.get ('/stores/:id',                   ProductController.getStore);
  r.patch('/stores/:id',   requireAuth,   ProductController.updateStore);

  // ——— Seller: product management ——————————————————————————————————————————
  r.post  ('/products',              requireAuth, ProductController.create);
  r.patch ('/products/:id',          requireAuth, ProductController.update);
  r.post  ('/products/:id/publish',  requireAuth, ProductController.publish);
  r.post  ('/products/:id/pause',    requireAuth, ProductController.pause);
  r.post  ('/products/:id/archive',  requireAuth, ProductController.archive);
  r.get   ('/products/my',           requireAuth, ProductController.myProducts);
  r.post  ('/products/:id/variants', requireAuth, ProductController.addVariant);
  r.post  ('/products/:id/media',    requireAuth, ProductController.addMedia);
  r.put   ('/products/:id/inventory',requireAuth, ProductController.setStock);

  // ——— AI recommendations ——————————————————————————————————————————————————
  r.get('/products/recommended', requireAuth, ProductController.recommended);

  // ——— Orders ——————————————————————————————————————————————————————————————
  r.post  ('/orders',                    requireAuth, OrderController.create);
  r.get   ('/orders',                    requireAuth, OrderController.myOrders);
  r.get   ('/orders/selling',            requireAuth, OrderController.sellerOrders);
  r.get   ('/orders/:id',                requireAuth, OrderController.getById);
  r.post  ('/orders/:id/confirm',        requireAuth, OrderController.confirm);
  r.post  ('/orders/:id/ship',           requireAuth, OrderController.ship);
  r.post  ('/orders/:id/deliver',        requireAuth, OrderController.deliver);
  r.post  ('/orders/:id/complete',       requireAuth, OrderController.complete);
  r.post  ('/orders/:id/cancel',         requireAuth, OrderController.cancel);
  r.post  ('/orders/:id/return',         requireAuth, OrderController.requestReturn);
  r.patch ('/returns/:returnId',         requireAuth, OrderController.resolveReturn);

  // ——— Reviews ——————————————————————————————————————————————————————————————
  r.post  ('/products/:productId/reviews',          requireAuth, CommerceController.createReview);
  r.post  ('/reviews/:reviewId/helpful',            requireAuth, CommerceController.markHelpful);
  r.post  ('/reviews/:reviewId/report',             requireAuth, CommerceController.reportSpam);

  // ——— Favorites ————————————————————————————————————————————————————————————
  r.post  ('/favorites',                            requireAuth, CommerceController.addFavorite);
  r.delete('/favorites/:targetType/:targetId',      requireAuth, CommerceController.removeFavorite);
  r.get   ('/favorites',                            requireAuth, CommerceController.myFavorites);

  // ——— Coupons ——————————————————————————————————————————————————————————————
  r.post  ('/coupons',                              requireAuth, CommerceController.createCoupon);
  r.get   ('/coupons/validate',                     requireAuth, CommerceController.validateCoupon);

  // ——— Disputes —————————————————————————————————————————————————————————————
  r.post  ('/disputes',                             requireAuth, CommerceController.openDispute);
  r.post  ('/disputes/:id/respond',                 requireAuth, CommerceController.respondDispute);
  r.post  ('/disputes/:id/evidence',                requireAuth, CommerceController.addDisputeEvidence);
  r.post  ('/disputes/:id/resolve',                 requireAuth, CommerceController.resolveDispute);
  r.post  ('/disputes/:id/ai-assess',               requireAuth, CommerceController.aiAssessDispute);

  // ——— Auctions ————————————————————————————————————————————————————————————
  r.post  ('/auctions',                             requireAuth, CommerceController.createAuction);
  r.post  ('/auctions/:id/bid',                     requireAuth, CommerceController.placeBid);

  // ——— Subscriptions ————————————————————————————————————————————————————————
  r.post  ('/plans',                                requireAuth, CommerceController.createPlan);
  r.post  ('/subscriptions',                        requireAuth, CommerceController.subscribe);
  r.get   ('/subscriptions',                        requireAuth, CommerceController.mySubscriptions);
  r.delete('/subscriptions/:id',                    requireAuth, CommerceController.cancelSubscription);

  // ——— Digital Deliveries ———————————————————————————————————————————————————
  r.get   ('/downloads',                            requireAuth, CommerceController.myDownloads);
  r.post  ('/downloads/:id/increment',              requireAuth, CommerceController.incrementDownload);

  return r;
}
