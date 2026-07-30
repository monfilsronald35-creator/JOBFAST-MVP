/**
 * PricingEngine — Multi-currency, tax, VAT, discount, volume pricing.
 * All amounts in minor units internally. Display amounts in major units.
 */

import type { Pricing, TaxRule, CurrencyConfig, DiscountApplication } from '../types';

const MINOR_UNITS: Record<string, number> = {
  HTG: 100, USD: 100, EUR: 100, GBP: 100,
  KES: 100, NGN: 100, GHS: 100, ZAR: 100,
  JPY: 1,   KRW: 1,   CLP: 1,   IDR: 1,
  BTC: 1e8, ETH: 1e18,
};

function toMinor(amount: number, currency: string): number {
  const factor = MINOR_UNITS[currency] ?? 100;
  return Math.round(amount * factor);
}

function fromMinor(amountMinor: number, currency: string): number {
  const factor = MINOR_UNITS[currency] ?? 100;
  return amountMinor / factor;
}

// ─── Exchange rate provider (pluggable) ───────────────────────────────────────

type ExchangeRateFetcher = (from: string, to: string) => Promise<number>;
let _rateFetcher: ExchangeRateFetcher | null = null;
const _rateCache: Map<string, { rate: number; at: number }> = new Map();
const RATE_CACHE_MS = 5 * 60_000;

export function registerExchangeRateFetcher(fn: ExchangeRateFetcher): void {
  _rateFetcher = fn;
}

async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const key = `${from}-${to}`;
  const cached = _rateCache.get(key);
  if (cached && Date.now() - cached.at < RATE_CACHE_MS) return cached.rate;

  if (_rateFetcher) {
    try {
      const rate = await _rateFetcher(from, to);
      _rateCache.set(key, { rate, at: Date.now() });
      return rate;
    } catch { /* fall through */ }
  }
  return 1;
}

// ─── PricingEngine ────────────────────────────────────────────────────────────

export interface PriceBreakdown {
  basePrice:    number;
  discount:     number;
  subtotal:     number;
  tax:          number;
  total:        number;
  currency:     string;
  exchangeRate: number;
  taxRate:      number;
  taxInclusive: boolean;
  inMinor:      number;
}

export interface PricingContext {
  quantity?:      number;
  couponDiscount?: DiscountApplication;
  taxRules?:      TaxRule[];
  targetCurrency?: string;
  membershipLevel?: string;
}

export const PricingEngine = {
  async calculatePrice(
    pricing: Pricing,
    ctx:     PricingContext = {},
  ): Promise<PriceBreakdown> {
    const qty          = ctx.quantity ?? 1;
    const currency     = pricing.currency;
    const targetCur    = ctx.targetCurrency ?? currency;

    let unitPrice = pricing.basePrice;

    if (pricing.pricingRules && qty > 1) {
      const applicable = pricing.pricingRules
        .filter(r => qty >= r.minQty && (r.maxQty === undefined || qty <= r.maxQty))
        .sort((a, b) => b.minQty - a.minQty);
      if (applicable.length > 0 && applicable[0]) unitPrice = applicable[0].price;
    }

    let subtotal = unitPrice * qty;
    let discount = 0;

    if (pricing.comparePrice && pricing.comparePrice > unitPrice) {
      // already on sale, comparePrice is the original
    }
    if (ctx.couponDiscount) {
      if (ctx.couponDiscount.type === 'percent') {
        discount = subtotal * (ctx.couponDiscount.value / 100);
      } else if (ctx.couponDiscount.type === 'fixed') {
        discount = Math.min(ctx.couponDiscount.value, subtotal);
      }
    }

    const afterDiscount = subtotal - discount;

    let tax     = 0;
    let taxRate = pricing.taxRate ?? 0;

    if (ctx.taxRules && ctx.taxRules.length > 0) {
      taxRate = ctx.taxRules.reduce((acc, r) => acc + r.rate, 0);
    }

    if (taxRate > 0) {
      if (pricing.taxInclusive) {
        tax = afterDiscount - afterDiscount / (1 + taxRate / 100);
      } else {
        tax = afterDiscount * (taxRate / 100);
      }
    }

    const total = pricing.taxInclusive ? afterDiscount : afterDiscount + tax;

    const exchangeRate = await getRate(currency, targetCur);
    const totalConverted = total * exchangeRate;

    return {
      basePrice:    subtotal,
      discount:     discount * exchangeRate,
      subtotal:     afterDiscount * exchangeRate,
      tax:          tax * exchangeRate,
      total:        totalConverted,
      currency:     targetCur,
      exchangeRate,
      taxRate,
      taxInclusive: pricing.taxInclusive,
      inMinor:      toMinor(totalConverted, targetCur),
    };
  },

  format(amount: number, currency: string, locale = 'fr-HT'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style:    'currency',
        currency,
        minimumFractionDigits: MINOR_UNITS[currency] === 1 ? 0 : 2,
        maximumFractionDigits: MINOR_UNITS[currency] === 1 ? 0 : 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  },

  toMinor,
  fromMinor,

  compareDisplay(pricing: Pricing): { original?: number; sale?: number; savings?: number; savingsPct?: number } {
    if (!pricing.comparePrice || pricing.comparePrice <= pricing.basePrice) return {};
    const savings    = pricing.comparePrice - pricing.basePrice;
    const savingsPct = Math.round((savings / pricing.comparePrice) * 100);
    return { original: pricing.comparePrice, sale: pricing.basePrice, savings, savingsPct };
  },

  applyCommission(amount: number, commissionRate: number): { gross: number; commission: number; net: number } {
    const commission = amount * (commissionRate / 100);
    return { gross: amount, commission, net: amount - commission };
  },
};