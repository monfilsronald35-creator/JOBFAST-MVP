import { OrderRepository }                          from '../repositories/OrderRepository.js';
import { ProductRepository }                          from '../repositories/ProductRepository.js';
import { CouponRepository }                           from '../repositories/CouponRepository.js';
import { MarketRepository }                           from '../repositories/MarketRepository.js';
import { AppError }                                   from '../../../core/errors/AppError.js';
import { OrderStatus, type Order, type OrderItem, type CreateOrderInput, type ReturnRequest, ReturnStatus } from '../types/order.types.js';
import { ProductType }                                from '../types/product.types.js';

export const OrderService = {
  async create(buyerId: string, input: CreateOrderInput): Promise<{ order: Order; items: OrderItem[] }> {
    const currency  = input.currency ?? 'HTG';
    let subtotal    = 0;
    const itemsData: Omit<OrderItem, 'id'>[] = [];

    for (const li of input.items) {
      const product = await ProductRepository.findById(li.productId);
      if (!product) throw new AppError(`Product ${li.productId} not found`, 404, 'NOT_FOUND');
      if (product.status !== 'active') throw new AppError('Product is not available', 400, 'NOT_AVAILABLE');
      const lineTotal = li.unitPrice * li.quantity;
      subtotal += lineTotal;
      itemsData.push({
        orderId: '', productId: li.productId, quantity: li.quantity,
        unitPrice: li.unitPrice, totalPrice: lineTotal, currency,
        titleSnapshot: product.title,
        ...(li.variantId ? { variantId: li.variantId } : {}),
      });
    }

    let discountAmount = 0;
    let couponId: string | undefined;
    let couponCode: string | undefined;

    if (input.couponCode) {
      const coupon = await CouponRepository.findByCode(input.couponCode);
      if (coupon && coupon.isActive) {
        if (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) {
          couponId   = coupon.id;
          couponCode = coupon.code;
          if (coupon.type === 'percent_off') {
            discountAmount = Math.floor(subtotal * coupon.value / 10000);
          } else if (coupon.type === 'amount_off') {
            discountAmount = coupon.value;
          }
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        }
      }
    }

    const shippingAmount = input.shippingAmount ?? 0;
    const taxAmount      = input.taxAmount      ?? 0;

    const order = await OrderRepository.create(buyerId, input.sellerId, {
      type: input.type, currency, subtotalAmount: subtotal,
      shippingAmount, discountAmount, taxAmount,
      couponId, couponCode,
      shippingAddress: input.shippingAddress,
      billingAddress:  input.billingAddress,
      notes:           input.notes,
    });

    const items = await OrderRepository.addItems(
      itemsData.map(i => ({ ...i, orderId: order.id }))
    );

    if (couponId) {
      await CouponRepository.incrementUsage(couponId);
      await CouponRepository.recordUsage(couponId, buyerId, discountAmount, order.id);
    }

    // Auto-deliver digital products
    const firstItem = itemsData[0];
    if (firstItem) {
      const product = await ProductRepository.findById(firstItem.productId);
      if (product?.type === ProductType.Digital) {
        await MarketRepository.createDelivery({
          orderId: order.id, orderItemId: items[0]?.id,
          buyerId, productId: firstItem.productId,
          downloadUrl: '',
        });
      }
    }

    return { order, items };
  },

  async getById(id: string): Promise<{ order: Order; items: OrderItem[] }> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    const items = await OrderRepository.findItems(id);
    return { order, items };
  },

  async confirm(id: string, sellerId: string): Promise<Order> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.sellerId !== sellerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return OrderRepository.updateStatus(id, OrderStatus.Confirmed);
  },

  async ship(id: string, sellerId: string, tracking: { carrier: string; trackingNumber: string; estimatedDelivery?: string }): Promise<Order> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.sellerId !== sellerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    await OrderRepository.addTracking({ orderId: id, ...tracking, status: 'shipped' });
    return OrderRepository.updateStatus(id, OrderStatus.Shipped);
  },

  async deliver(id: string, sellerId: string): Promise<Order> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.sellerId !== sellerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return OrderRepository.updateStatus(id, OrderStatus.Delivered);
  },

  async complete(id: string, buyerId: string): Promise<Order> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.buyerId !== buyerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return OrderRepository.updateStatus(id, OrderStatus.Completed, { completed_at: new Date().toISOString() });
  },

  async cancel(id: string, userId: string): Promise<Order> {
    const order = await OrderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.buyerId !== userId && order.sellerId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if ([OrderStatus.Shipped, OrderStatus.Completed].includes(order.status)) {
      throw new AppError('Cannot cancel a shipped or completed order', 400, 'INVALID_STATUS');
    }
    return OrderRepository.updateStatus(id, OrderStatus.Cancelled, { cancelled_at: new Date().toISOString() });
  },

  async listByBuyer(buyerId: string): Promise<Order[]> {
    return OrderRepository.listByBuyer(buyerId);
  },

  async listBySeller(sellerId: string, status?: OrderStatus): Promise<Order[]> {
    return OrderRepository.listBySeller(sellerId, status);
  },

  async requestReturn(buyerId: string, data: { orderId: string; reason: string; orderItemId?: string; description?: string }): Promise<ReturnRequest> {
    const order = await OrderRepository.findById(data.orderId);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.buyerId !== buyerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return OrderRepository.createReturn({
      orderId: data.orderId, buyerId, sellerId: order.sellerId,
      reason: data.reason, orderItemId: data.orderItemId, description: data.description,
    });
  },

  async resolveReturn(returnId: string, sellerId: string, status: ReturnStatus, notes?: string, refundAmount?: number): Promise<ReturnRequest> {
    return OrderRepository.updateReturn(returnId, status, notes, refundAmount);
  },
};
