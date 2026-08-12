export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;

export type DiscountType = typeof DISCOUNT_TYPES[number];

// ---- Entity interfaces ----

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumSpend: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface FlashSale {
  id: string;
  productId: string;
  flashPrice: number;
  stockLimit: number;
  soldCount: number;
  startsAt: string;
  endsAt: string;
}

export interface Bundle {
  id: string;
  name: string;
  discountPercentage: number;
  products: unknown[];
  createdAt: string;
}

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  recipientEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
}
