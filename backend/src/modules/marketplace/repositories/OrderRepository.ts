import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  OrderStatus, ReturnStatus,
  type Order, type OrderItem, type OrderTracking, type ReturnRequest,
} from '../types/order.types.js';

function toOrder(r: Record<string, unknown>): Order {
  const base: Order = {
    id: r['id'] as string, buyerId: r['buyer_id'] as string, sellerId: r['seller_id'] as string,
    status: r['status'] as OrderStatus, type: r['type'] as Order['type'],
    totalAmount: r['total_amount'] as number, subtotalAmount: r['subtotal_amount'] as number,
    shippingAmount: r['shipping_amount'] as number, discountAmount: r['discount_amount'] as number,
    taxAmount: r['tax_amount'] as number, currency: r['currency'] as string,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['store_id'])         b['storeId']         = r['store_id'];
  if (r['coupon_id'])        b['couponId']        = r['coupon_id'];
  if (r['coupon_code'])      b['couponCode']      = r['coupon_code'];
  if (r['escrow_id'])        b['escrowId']        = r['escrow_id'];
  if (r['payment_ref'])      b['paymentRef']      = r['payment_ref'];
  if (r['shipping_address']) b['shippingAddress'] = r['shipping_address'];
  if (r['billing_address'])  b['billingAddress']  = r['billing_address'];
  if (r['notes'])            b['notes']           = r['notes'];
  if (r['completed_at'])     b['completedAt']     = r['completed_at'];
  if (r['cancelled_at'])     b['cancelledAt']     = r['cancelled_at'];
  return base;
}

function toItem(r: Record<string, unknown>): OrderItem {
  const base: OrderItem = {
    id: r['id'] as string, orderId: r['order_id'] as string,
    productId: r['product_id'] as string,
    quantity: r['quantity'] as number, unitPrice: r['unit_price'] as number,
    totalPrice: r['total_price'] as number, currency: r['currency'] as string,
    titleSnapshot: r['title_snapshot'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['variant_id'])       b['variantId']       = r['variant_id'];
  if (r['variant_snapshot']) b['variantSnapshot'] = r['variant_snapshot'];
  return base;
}

function toTracking(r: Record<string, unknown>): OrderTracking {
  const base: OrderTracking = {
    id: r['id'] as string, orderId: r['order_id'] as string,
    carrier: r['carrier'] as string, trackingNumber: r['tracking_number'] as string,
    status: r['status'] as string, events: (r['events'] as Record<string, unknown>[]) ?? [],
    updatedAt: r['updated_at'] as string,
  };
  if (r['estimated_delivery']) {
    (base as unknown as Record<string, unknown>)['estimatedDelivery'] = r['estimated_delivery'];
  }
  return base;
}

function toReturn(r: Record<string, unknown>): ReturnRequest {
  const base: ReturnRequest = {
    id: r['id'] as string, orderId: r['order_id'] as string,
    buyerId: r['buyer_id'] as string, sellerId: r['seller_id'] as string,
    reason: r['reason'] as string, status: r['status'] as ReturnStatus,
    evidenceUrls: (r['evidence_urls'] as string[]) ?? [],
    requestedAt: r['requested_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['order_item_id'])     b['orderItemId']     = r['order_item_id'];
  if (r['description'])       b['description']     = r['description'];
  if (r['refund_amount'])     b['refundAmount']    = r['refund_amount'];
  if (r['resolution_notes'])  b['resolutionNotes'] = r['resolution_notes'];
  if (r['resolved_at'])       b['resolvedAt']      = r['resolved_at'];
  return base;
}

export const OrderRepository = {
  async create(buyerId: string, sellerId: string, data: {
    type?: string; currency?: string; storeId?: string;
    subtotalAmount: number; shippingAmount: number; discountAmount: number; taxAmount: number;
    couponId?: string; couponCode?: string; shippingAddress?: Record<string, unknown>;
    billingAddress?: Record<string, unknown>; notes?: string;
  }): Promise<Order> {
    const row: Record<string, unknown> = {
      buyer_id: buyerId, seller_id: sellerId,
      type: data.type ?? 'purchase', currency: data.currency ?? 'HTG',
      subtotal_amount: data.subtotalAmount, shipping_amount: data.shippingAmount,
      discount_amount: data.discountAmount, tax_amount: data.taxAmount,
      total_amount: data.subtotalAmount + data.shippingAmount - data.discountAmount + data.taxAmount,
    };
    if (data.storeId)         row['store_id']        = data.storeId;
    if (data.couponId)        row['coupon_id']       = data.couponId;
    if (data.couponCode)      row['coupon_code']     = data.couponCode;
    if (data.shippingAddress) row['shipping_address']= data.shippingAddress;
    if (data.billingAddress)  row['billing_address'] = data.billingAddress;
    if (data.notes)           row['notes']           = data.notes;
    const { data: saved, error } = await db.client()
      .from('mp_orders').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create order', 500, 'DB_ERROR');
    return toOrder(saved);
  },

  async addItems(items: Omit<OrderItem, 'id'>[]): Promise<OrderItem[]> {
    const rows = items.map(item => ({
      order_id: item.orderId, product_id: item.productId, quantity: item.quantity,
      unit_price: item.unitPrice, total_price: item.totalPrice,
      currency: item.currency, title_snapshot: item.titleSnapshot,
      ...(item.variantId ? { variant_id: item.variantId } : {}),
      ...(item.variantSnapshot ? { variant_snapshot: item.variantSnapshot } : {}),
    }));
    const { data, error } = await db.client()
      .from('mp_order_items').insert(rows).select('*').returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to add order items', 500, 'DB_ERROR');
    return (data ?? []).map(toItem);
  },

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await db.client()
      .from('mp_orders').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load order', 500, 'DB_ERROR');
    return data ? toOrder(data) : null;
  },

  async findItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await db.client()
      .from('mp_order_items').select('*').eq('order_id', orderId)
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to load order items', 500, 'DB_ERROR');
    return (data ?? []).map(toItem);
  },

  async updateStatus(id: string, status: OrderStatus, extra?: Record<string, unknown>): Promise<Order> {
    const row: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...(extra ?? {}) };
    const { data, error } = await db.client()
      .from('mp_orders').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update order', 500, 'DB_ERROR');
    return toOrder(data);
  },

  async listByBuyer(buyerId: string): Promise<Order[]> {
    const { data, error } = await db.client().from('mp_orders').select('*').eq('buyer_id', buyerId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list orders', 500, 'DB_ERROR');
    return (data ?? []).map(toOrder);
  },

  async listBySeller(sellerId: string, status?: OrderStatus): Promise<Order[]> {
    let q = db.client().from('mp_orders').select('*').eq('seller_id', sellerId)
              .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list orders', 500, 'DB_ERROR');
    return (data ?? []).map(toOrder);
  },

  async addTracking(data: Omit<OrderTracking, 'id' | 'events' | 'updatedAt'>): Promise<OrderTracking> {
    const { data: saved, error } = await db.client().from('mp_order_tracking').insert({
      order_id: data.orderId, carrier: data.carrier,
      tracking_number: data.trackingNumber, status: data.status,
      ...(data.estimatedDelivery ? { estimated_delivery: data.estimatedDelivery } : {}),
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to add tracking', 500, 'DB_ERROR');
    return toTracking(saved);
  },

  async createReturn(data: Omit<ReturnRequest, 'id' | 'status' | 'evidenceUrls' | 'requestedAt'>): Promise<ReturnRequest> {
    const row: Record<string, unknown> = {
      order_id: data.orderId, buyer_id: data.buyerId, seller_id: data.sellerId,
      reason: data.reason,
    };
    if (data.orderItemId) row['order_item_id'] = data.orderItemId;
    if (data.description) row['description']   = data.description;
    const { data: saved, error } = await db.client()
      .from('mp_returns').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create return', 500, 'DB_ERROR');
    return toReturn(saved);
  },

  async updateReturn(id: string, status: ReturnStatus, notes?: string, refundAmount?: number): Promise<ReturnRequest> {
    const row: Record<string, unknown> = { status, resolved_at: new Date().toISOString() };
    if (notes !== undefined)        row['resolution_notes'] = notes;
    if (refundAmount !== undefined) row['refund_amount']    = refundAmount;
    const { data, error } = await db.client()
      .from('mp_returns').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update return', 500, 'DB_ERROR');
    return toReturn(data);
  },
};
