import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  DisputeStatus,
  type Dispute, type Auction, type AuctionBid,
  type SubscriptionPlan, type Subscription, type DigitalDelivery,
} from '../types/commerce.types.js';

function toDispute(r: Record<string, unknown>): Dispute {
  const base: Dispute = {
    id: r['id'] as string, orderId: r['order_id'] as string,
    buyerId: r['buyer_id'] as string, sellerId: r['seller_id'] as string,
    type: r['type'] as Dispute['type'], status: r['status'] as DisputeStatus,
    buyerClaim: r['buyer_claim'] as string,
    evidenceBuyer:  (r['evidence_buyer']  as string[]) ?? [],
    evidenceSeller: (r['evidence_seller'] as string[]) ?? [],
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['mediator_id'])      b['mediatorId']      = r['mediator_id'];
  if (r['seller_response'])  b['sellerResponse']  = r['seller_response'];
  if (r['ai_assessment'])    b['aiAssessment']    = r['ai_assessment'];
  if (r['resolution'])       b['resolution']      = r['resolution'];
  if (r['resolution_type'])  b['resolutionType']  = r['resolution_type'];
  if (r['resolved_at'])      b['resolvedAt']      = r['resolved_at'];
  return base;
}

function toAuction(r: Record<string, unknown>): Auction {
  const base: Auction = {
    id: r['id'] as string, productId: r['product_id'] as string, sellerId: r['seller_id'] as string,
    startPrice: r['start_price'] as number, currentBid: r['current_bid'] as number,
    bidCount: r['bid_count'] as number, startAt: r['start_at'] as string, endAt: r['end_at'] as string,
    status: r['status'] as Auction['status'], currency: r['currency'] as string,
    createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['reserve_price']) b['reservePrice'] = r['reserve_price'];
  if (r['winner_id'])     b['winnerId']     = r['winner_id'];
  return base;
}

function toBid(r: Record<string, unknown>): AuctionBid {
  const base: AuctionBid = {
    id: r['id'] as string, auctionId: r['auction_id'] as string, bidderId: r['bidder_id'] as string,
    amount: r['amount'] as number, currency: r['currency'] as string,
    isWinning: r['is_winning'] as boolean, isAutoBid: r['is_auto_bid'] as boolean,
    createdAt: r['created_at'] as string,
  };
  if (r['max_auto_bid']) (base as unknown as Record<string, unknown>)['maxAutoBid'] = r['max_auto_bid'];
  return base;
}

function toPlan(r: Record<string, unknown>): SubscriptionPlan {
  const base: SubscriptionPlan = {
    id: r['id'] as string, sellerId: r['seller_id'] as string, name: r['name'] as string,
    interval: r['interval'] as SubscriptionPlan['interval'],
    price: r['price'] as number, currency: r['currency'] as string,
    trialDays: r['trial_days'] as number, features: (r['features'] as string[]) ?? [],
    isActive: r['is_active'] as boolean, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['product_id'])  b['productId']  = r['product_id'];
  if (r['description']) b['description'] = r['description'];
  return base;
}

function toSub(r: Record<string, unknown>): Subscription {
  const base: Subscription = {
    id: r['id'] as string, planId: r['plan_id'] as string,
    subscriberId: r['subscriber_id'] as string, sellerId: r['seller_id'] as string,
    status: r['status'] as Subscription['status'],
    currentPeriodStart: r['current_period_start'] as string,
    currentPeriodEnd:   r['current_period_end']   as string,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['trial_end'])    b['trialEnd']    = r['trial_end'];
  if (r['payment_ref'])  b['paymentRef']  = r['payment_ref'];
  if (r['cancel_at'])    b['cancelAt']    = r['cancel_at'];
  if (r['cancelled_at']) b['cancelledAt'] = r['cancelled_at'];
  return base;
}

function toDigital(r: Record<string, unknown>): DigitalDelivery {
  const base: DigitalDelivery = {
    id: r['id'] as string, orderId: r['order_id'] as string,
    buyerId: r['buyer_id'] as string, productId: r['product_id'] as string,
    downloadUrl: r['download_url'] as string,
    downloadCount: r['download_count'] as number,
    deliveredAt: r['delivered_at'] as string, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['order_item_id'])  b['orderItemId']  = r['order_item_id'];
  if (r['license_key'])    b['licenseKey']   = r['license_key'];
  if (r['max_downloads'])  b['maxDownloads'] = r['max_downloads'];
  if (r['expires_at'])     b['expiresAt']    = r['expires_at'];
  return base;
}

export const MarketRepository = {
  // ——— Disputes ——————————————————————————————————————————————————————————————
  async createDispute(data: Pick<Dispute, 'orderId' | 'buyerId' | 'sellerId' | 'type' | 'buyerClaim'>): Promise<Dispute> {
    const { data: saved, error } = await db.client().from('mp_disputes')
      .insert({ order_id: data.orderId, buyer_id: data.buyerId, seller_id: data.sellerId,
                type: data.type, buyer_claim: data.buyerClaim })
      .select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to open dispute', 500, 'DB_ERROR');
    return toDispute(saved);
  },

  async updateDispute(id: string, row: Record<string, unknown>): Promise<Dispute> {
    const { data, error } = await db.client().from('mp_disputes')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update dispute', 500, 'DB_ERROR');
    return toDispute(data);
  },

  async findDispute(id: string): Promise<Dispute | null> {
    const { data } = await db.client().from('mp_disputes').select('*').eq('id', id)
      .single<Record<string, unknown>>();
    return data ? toDispute(data) : null;
  },

  async listOpenDisputes(): Promise<Dispute[]> {
    const { data, error } = await db.client().from('mp_disputes').select('*')
      .in('status', [DisputeStatus.Open, DisputeStatus.Investigating])
      .order('created_at').returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list disputes', 500, 'DB_ERROR');
    return (data ?? []).map(toDispute);
  },

  // ——— Auctions ——————————————————————————————————————————————————————————————
  async createAuction(data: Omit<Auction, 'id' | 'currentBid' | 'bidCount' | 'createdAt'>): Promise<Auction> {
    const row: Record<string, unknown> = {
      product_id: data.productId, seller_id: data.sellerId,
      start_price: data.startPrice, start_at: data.startAt, end_at: data.endAt,
      status: data.status, currency: data.currency,
    };
    if (data.reservePrice !== undefined) row['reserve_price'] = data.reservePrice;
    const { data: saved, error } = await db.client()
      .from('mp_auctions').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create auction', 500, 'DB_ERROR');
    return toAuction(saved);
  },

  async placeBid(auctionId: string, bidderId: string, amount: number, currency: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await db.client()
      .rpc('mp_place_bid', { p_auction_id: auctionId, p_bidder_id: bidderId, p_amount: amount, p_currency: currency })
      .single<Record<string, unknown>>();
    if (error) throw new AppError('Bid failed', 500, 'DB_ERROR');
    return { success: data!['success'] as boolean, message: data!['message'] as string };
  },

  async listBids(auctionId: string): Promise<AuctionBid[]> {
    const { data, error } = await db.client().from('mp_auction_bids').select('*')
      .eq('auction_id', auctionId).order('amount', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list bids', 500, 'DB_ERROR');
    return (data ?? []).map(toBid);
  },

  async findAuction(id: string): Promise<Auction | null> {
    const { data } = await db.client().from('mp_auctions').select('*').eq('id', id)
      .single<Record<string, unknown>>();
    return data ? toAuction(data) : null;
  },

  async listActiveAuctions(): Promise<Auction[]> {
    const { data, error } = await db.client().from('mp_auctions').select('*')
      .eq('status', 'active').order('end_at').returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list auctions', 500, 'DB_ERROR');
    return (data ?? []).map(toAuction);
  },

  // ——— Subscriptions ————————————————————————————————————————————————————————
  async createPlan(data: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<SubscriptionPlan> {
    const row: Record<string, unknown> = {
      seller_id: data.sellerId, name: data.name, interval: data.interval,
      price: data.price, currency: data.currency, trial_days: data.trialDays,
      features: data.features, is_active: data.isActive,
    };
    if (data.productId)   row['product_id']  = data.productId;
    if (data.description) row['description'] = data.description;
    const { data: saved, error } = await db.client()
      .from('mp_subscription_plans').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create plan', 500, 'DB_ERROR');
    return toPlan(saved);
  },

  async findPlan(id: string): Promise<SubscriptionPlan | null> {
    const { data } = await db.client().from('mp_subscription_plans').select('*').eq('id', id)
      .single<Record<string, unknown>>();
    return data ? toPlan(data) : null;
  },

  async createSubscription(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const row: Record<string, unknown> = {
      plan_id: data.planId, subscriber_id: data.subscriberId, seller_id: data.sellerId,
      status: data.status, current_period_start: data.currentPeriodStart,
      current_period_end: data.currentPeriodEnd,
    };
    if (data.trialEnd)    row['trial_end']   = data.trialEnd;
    if (data.paymentRef)  row['payment_ref'] = data.paymentRef;
    const { data: saved, error } = await db.client()
      .from('mp_subscriptions').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create subscription', 500, 'DB_ERROR');
    return toSub(saved);
  },

  async updateSubscription(id: string, row: Record<string, unknown>): Promise<Subscription> {
    const { data, error } = await db.client().from('mp_subscriptions')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update subscription', 500, 'DB_ERROR');
    return toSub(data);
  },

  async listSubscriptions(subscriberId: string): Promise<Subscription[]> {
    const { data, error } = await db.client().from('mp_subscriptions').select('*')
      .eq('subscriber_id', subscriberId).order('created_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list subscriptions', 500, 'DB_ERROR');
    return (data ?? []).map(toSub);
  },

  // ——— Digital Deliveries ───────────────────────────────────────────────────
  async createDelivery(data: Omit<DigitalDelivery, 'id' | 'downloadCount' | 'deliveredAt' | 'createdAt'>): Promise<DigitalDelivery> {
    const row: Record<string, unknown> = {
      order_id: data.orderId, buyer_id: data.buyerId, product_id: data.productId,
      download_url: data.downloadUrl,
    };
    if (data.orderItemId)  row['order_item_id']  = data.orderItemId;
    if (data.licenseKey)   row['license_key']    = data.licenseKey;
    if (data.maxDownloads !== undefined) row['max_downloads'] = data.maxDownloads;
    if (data.expiresAt)    row['expires_at']     = data.expiresAt;
    const { data: saved, error } = await db.client()
      .from('mp_digital_deliveries').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create delivery', 500, 'DB_ERROR');
    return toDigital(saved);
  },

  async listDeliveries(buyerId: string): Promise<DigitalDelivery[]> {
    const { data, error } = await db.client().from('mp_digital_deliveries').select('*')
      .eq('buyer_id', buyerId).order('created_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list deliveries', 500, 'DB_ERROR');
    return (data ?? []).map(toDigital);
  },

  async incrementDownload(id: string): Promise<void> {
    const { data } = await db.client().from('mp_digital_deliveries')
      .select('download_count').eq('id', id).single<Record<string, unknown>>();
    if (!data) return;
    await db.client().from('mp_digital_deliveries')
      .update({ download_count: (data['download_count'] as number ?? 0) + 1 })
      .eq('id', id).throwOnError();
  },
};
