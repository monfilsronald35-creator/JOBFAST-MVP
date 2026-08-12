import { supabase } from '../../lib/supabase';
import type {
  Coupon,
  Promotion,
  FlashSale,
  Bundle,
  GiftCard,
} from '../../types/promotions';

// ---- Row types (snake_case) ----

type CouponRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_spend: number;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type FlashSaleRow = {
  id: string;
  product_id: string;
  flash_price: number;
  stock_limit: number;
  sold_count: number;
  starts_at: string;
  ends_at: string;
};

type BundleRow = {
  id: string;
  name: string;
  discount_percentage: number;
  products: unknown[];
  created_at: string;
};

type GiftCardRow = {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  recipient_email: string | null;
  expires_at: string | null;
  created_at: string;
};

// ---- Mappers ----

function mapCoupon(r: CouponRow): Coupon {
  return {
    id: r.id,
    code: r.code,
    discountType: r.discount_type as Coupon['discountType'],
    discountValue: r.discount_value,
    minimumSpend: r.minimum_spend,
    usageLimit: r.usage_limit,
    usedCount: r.used_count,
    expiresAt: r.expires_at,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapPromotion(r: PromotionRow): Promotion {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    bannerUrl: r.banner_url,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    isActive: r.is_active,
  };
}

function mapFlashSale(r: FlashSaleRow): FlashSale {
  return {
    id: r.id,
    productId: r.product_id,
    flashPrice: r.flash_price,
    stockLimit: r.stock_limit,
    soldCount: r.sold_count,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  };
}

function mapBundle(r: BundleRow): Bundle {
  return {
    id: r.id,
    name: r.name,
    discountPercentage: r.discount_percentage,
    products: r.products,
    createdAt: r.created_at,
  };
}

function mapGiftCard(r: GiftCardRow): GiftCard {
  return {
    id: r.id,
    code: r.code,
    initialBalance: r.initial_balance,
    currentBalance: r.current_balance,
    recipientEmail: r.recipient_email,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Coupons
// ================================================================

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCoupon(data as CouponRow) : null;
}

// ================================================================
// === Promotions
// ================================================================

export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data as PromotionRow[]).map(mapPromotion);
}

// ================================================================
// === Flash Sales
// ================================================================

export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('ends_at', { ascending: true });
  if (error) throw error;
  return (data as FlashSaleRow[]).map(mapFlashSale);
}

export async function getFlashSaleByProduct(
  productId: string
): Promise<FlashSale | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('product_id', productId)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFlashSale(data as FlashSaleRow) : null;
}

// ================================================================
// === Bundles
// ================================================================

export async function getBundles(): Promise<Bundle[]> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .order('discount_percentage', { ascending: false });
  if (error) throw error;
  return (data as BundleRow[]).map(mapBundle);
}

export async function getBundleById(bundleId: string): Promise<Bundle | null> {
  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('id', bundleId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBundle(data as BundleRow) : null;
}

// ================================================================
// === Gift Cards
// ================================================================

export async function getGiftCardByCode(
  code: string
): Promise<GiftCard | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('gift_cards')
    .select('id, code, initial_balance, current_balance, recipient_email, expires_at, created_at')
    .eq('code', code.toUpperCase())
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGiftCard(data as GiftCardRow) : null;
}
