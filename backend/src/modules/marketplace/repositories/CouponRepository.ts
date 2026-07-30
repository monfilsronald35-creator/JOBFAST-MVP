import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import { type Coupon, type CouponUsage } from '../types/commerce.types.js';

function toCoupon(r: Record<string, unknown>): Coupon {
  const base: Coupon = {
    id: r['id'] as string, code: r['code'] as string,
    type: r['type'] as Coupon['type'], value: r['value'] as number,
    usedCount: r['used_count'] as number, isActive: r['is_active'] as boolean,
    validFrom: r['valid_from'] as string, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['seller_id'])        b['sellerId']       = r['seller_id'];
  if (r['currency'])         b['currency']       = r['currency'];
  if (r['min_order_amount']) b['minOrderAmount'] = r['min_order_amount'];
  if (r['max_discount'])     b['maxDiscount']    = r['max_discount'];
  if (r['usage_limit'])      b['usageLimit']     = r['usage_limit'];
  if (r['product_ids'])      b['productIds']     = r['product_ids'];
  if (r['valid_until'])      b['validUntil']     = r['valid_until'];
  return base;
}

export const CouponRepository = {
  async create(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Promise<Coupon> {
    const row: Record<string, unknown> = {
      code: data.code, type: data.type, value: data.value,
      is_active: data.isActive, valid_from: data.validFrom,
    };
    if (data.sellerId)       row['seller_id']        = data.sellerId;
    if (data.currency)       row['currency']         = data.currency;
    if (data.minOrderAmount !== undefined) row['min_order_amount'] = data.minOrderAmount;
    if (data.maxDiscount    !== undefined) row['max_discount']     = data.maxDiscount;
    if (data.usageLimit     !== undefined) row['usage_limit']      = data.usageLimit;
    if (data.productIds?.length) row['product_ids'] = data.productIds;
    if (data.validUntil)     row['valid_until']      = data.validUntil;
    const { data: saved, error } = await db.client()
      .from('mp_coupons').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create coupon', 500, 'DB_ERROR');
    return toCoupon(saved);
  },

  async findByCode(code: string): Promise<Coupon | null> {
    const { data } = await db.client().from('mp_coupons').select('*').eq('code', code.toUpperCase())
      .single<Record<string, unknown>>();
    return data ? toCoupon(data) : null;
  },

  async findById(id: string): Promise<Coupon | null> {
    const { data } = await db.client().from('mp_coupons').select('*').eq('id', id)
      .single<Record<string, unknown>>();
    return data ? toCoupon(data) : null;
  },

  async incrementUsage(id: string): Promise<void> {
    const { data } = await db.client().from('mp_coupons').select('used_count').eq('id', id)
      .single<Record<string, unknown>>();
    if (!data) return;
    await db.client().from('mp_coupons')
      .update({ used_count: (data['used_count'] as number ?? 0) + 1 })
      .eq('id', id).throwOnError();
  },

  async recordUsage(couponId: string, userId: string, discountApplied: number, orderId?: string): Promise<CouponUsage> {
    const row: Record<string, unknown> = {
      coupon_id: couponId, user_id: userId, discount_applied: discountApplied,
    };
    if (orderId) row['order_id'] = orderId;
    const { data, error } = await db.client().from('mp_coupon_usage')
      .insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to record coupon usage', 500, 'DB_ERROR');
    return {
      id: data['id'] as string, couponId: data['coupon_id'] as string,
      userId: data['user_id'] as string, discountApplied: data['discount_applied'] as number,
      usedAt: data['used_at'] as string,
      ...(data['order_id'] ? { orderId: data['order_id'] as string } : {}),
    };
  },

  async hasUsed(couponId: string, userId: string): Promise<boolean> {
    const { count } = await db.client().from('mp_coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId).eq('user_id', userId);
    return (count ?? 0) > 0;
  },
};
