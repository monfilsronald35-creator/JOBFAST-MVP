import { CouponRepository }          from '../repositories/CouponRepository.js';
import { AppError }                  from '../../../core/errors/AppError.js';
import { type Coupon, type CouponUsage } from '../types/commerce.types.js';

export const CouponService = {
  async create(sellerId: string, data: Omit<Coupon, 'id' | 'sellerId' | 'usedCount' | 'createdAt'>): Promise<Coupon> {
    const existing = await CouponRepository.findByCode(data.code);
    if (existing) throw new AppError('Coupon code already exists', 409, 'CONFLICT');
    return CouponRepository.create({ ...data, sellerId });
  },

  async validate(code: string, buyerId: string, orderAmount: number): Promise<{ valid: boolean; discount: number; coupon?: Coupon; reason?: string }> {
    const coupon = await CouponRepository.findByCode(code);
    if (!coupon)           return { valid: false, discount: 0, reason: 'Coupon not found' };
    if (!coupon.isActive)  return { valid: false, discount: 0, reason: 'Coupon is inactive' };
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date())
      return { valid: false, discount: 0, reason: 'Coupon expired' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return { valid: false, discount: 0, reason: 'Coupon usage limit reached' };
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount)
      return { valid: false, discount: 0, reason: `Minimum order amount is ${coupon.minOrderAmount}` };

    const alreadyUsed = await CouponRepository.hasUsed(coupon.id, buyerId);
    if (alreadyUsed) return { valid: false, discount: 0, reason: 'Coupon already used' };

    let discount = 0;
    if (coupon.type === 'percent_off') {
      discount = Math.floor(orderAmount * coupon.value / 10000);
    } else if (coupon.type === 'amount_off') {
      discount = coupon.value;
    }
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    return { valid: true, discount, coupon };
  },

  async getByCode(code: string): Promise<Coupon | null> {
    return CouponRepository.findByCode(code);
  },

  async recordUsage(couponId: string, userId: string, discountApplied: number, orderId?: string): Promise<CouponUsage> {
    await CouponRepository.incrementUsage(couponId);
    return CouponRepository.recordUsage(couponId, userId, discountApplied, orderId);
  },
};
