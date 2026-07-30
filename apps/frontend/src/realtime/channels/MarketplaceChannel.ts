/**
 * MarketplaceChannel — live orders, inventory, stock, prices, auctions, offers.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type {
  LiveOrderPayload, StockUpdatePayload,
  PriceUpdatePayload, AuctionPayload,
} from '../types';

export class MarketplaceChannel extends BaseChannel {
  #watchedProducts = new Set<string>();
  #watchedAuctions = new Set<string>();

  constructor(engine: RealtimeEngine) {
    super(engine, 'marketplace');
  }

  // ── Products / Inventory ────────────────────────────────────────────────────

  watchProduct(productId: string): void {
    if (this.#watchedProducts.has(productId)) return;
    this.#watchedProducts.add(productId);
    this.engine.emit('marketplace:product:watch', { productId }, 'normal');
  }

  unwatchProduct(productId: string): void {
    this.#watchedProducts.delete(productId);
    this.engine.emit('marketplace:product:unwatch', { productId }, 'normal');
  }

  onStockUpdate(handler: (update: StockUpdatePayload) => void): () => void {
    return this.onGlobal('marketplace:stock:update', handler);
  }

  onPriceUpdate(handler: (update: PriceUpdatePayload) => void): () => void {
    return this.onGlobal('marketplace:price:update', handler);
  }

  onInventoryLow(handler: (data: { productId: string; stock: number; threshold: number }) => void): () => void {
    return this.onGlobal('marketplace:inventory:low', handler);
  }

  onProductOutOfStock(handler: (data: { productId: string }) => void): () => void {
    return this.onGlobal('marketplace:product:out_of_stock', handler);
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  subscribeToOrders(userId: string, role: 'buyer' | 'seller'): void {
    this.engine.emit('marketplace:orders:subscribe', { userId, role }, 'normal');
    this.joinRoom(`orders:${role}:${userId}`);
  }

  onNewOrder(handler: (order: LiveOrderPayload) => void): () => void {
    return this.onGlobal('marketplace:order:new', handler);
  }

  onOrderStatusUpdate(handler: (order: LiveOrderPayload) => void): () => void {
    return this.onGlobal('marketplace:order:status', handler);
  }

  confirmOrder(orderId: string, sellerId: string): void {
    this.engine.emit('marketplace:order:confirm', { orderId, sellerId }, 'critical');
  }

  updateOrderStatus(orderId: string, status: LiveOrderPayload['status']): void {
    this.engine.emit('marketplace:order:update_status', { orderId, status }, 'high');
  }

  // ── Auctions ────────────────────────────────────────────────────────────────

  joinAuction(auctionId: string): void {
    if (this.#watchedAuctions.has(auctionId)) return;
    this.#watchedAuctions.add(auctionId);
    this.engine.emit('marketplace:auction:join', { auctionId }, 'high');
    this.joinRoom(`auction:${auctionId}`);
  }

  leaveAuction(auctionId: string): void {
    this.#watchedAuctions.delete(auctionId);
    this.engine.emit('marketplace:auction:leave', { auctionId }, 'normal');
    this.leaveRoom(`auction:${auctionId}`);
  }

  placeBid(auctionId: string, bidderId: string, amountMinorUnits: number): void {
    this.engine.emit('marketplace:auction:bid', {
      auctionId, bidderId, amountMinorUnits,
    }, 'critical');
  }

  onAuctionUpdate(handler: (auction: AuctionPayload) => void): () => void {
    return this.onGlobal('marketplace:auction:update', handler);
  }

  onAuctionEnded(handler: (data: { auctionId: string; winnerId: string; finalBid: number }) => void): () => void {
    return this.onGlobal('marketplace:auction:ended', handler);
  }

  // ── Live Offers ─────────────────────────────────────────────────────────────

  onNewOffer(handler: (offer: { offerId: string; productId: string; buyerId: string; amount: number }) => void): () => void {
    return this.onGlobal('marketplace:offer:new', handler);
  }

  respondToOffer(offerId: string, action: 'accept' | 'reject' | 'counter', counterAmount?: number): void {
    this.engine.emit('marketplace:offer:respond', { offerId, action, counterAmount }, 'high');
  }

  protected override onDestroy(): void {
    this.#watchedProducts.forEach(id => this.unwatchProduct(id));
    this.#watchedAuctions.forEach(id => this.leaveAuction(id));
  }
}