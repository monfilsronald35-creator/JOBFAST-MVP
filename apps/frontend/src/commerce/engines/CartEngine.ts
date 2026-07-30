/**
 * CartEngine — Multi-vendor, multi-currency cart with real-time pricing.
 * Cart state lives client-side; syncs to backend for persistence.
 */

import type { Cart, CartItem, Listing, Variant, DiscountApplication } from '../types';
import { PricingEngine } from './PricingEngine';

type CartListener = (cart: Cart) => void;

function makeId(): string { return crypto.randomUUID(); }

function emptyTotals(currency: string) {
  return { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, currency, totalInMinor: 0 };
}

class CartEngineImpl {
  private cart: Cart;
  private listeners: Set<CartListener> = new Set();

  constructor() {
    const saved = sessionStorage.getItem('jf_cart');
    if (saved) {
      try {
        this.cart = JSON.parse(saved) as Cart;
      } catch {
        this.cart = this.emptyCart();
      }
    } else {
      this.cart = this.emptyCart();
    }
  }

  private emptyCart(): Cart {
    return {
      id:          makeId(),
      sessionId:   makeId(),
      items:       [],
      totals:      emptyTotals('HTG'),
      currency:    'HTG',
      countryCode: 'HT',
      expiresAt:   Date.now() + 7 * 24 * 60 * 60_000,
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
    };
  }

  // ─── Add ─────────────────────────────────────────────────────────────────

  async add(listing: Listing, variant?: Variant, quantity = 1): Promise<void> {
    const variantId  = variant?.id;
    const pricing    = variant?.pricing ?? listing.pricing;
    const inventory  = variant?.inventory ?? listing.inventory;

    if (inventory.tracked && !inventory.allowBackorder) {
      const avail = (inventory.quantity ?? 0) - inventory.reservedQty;
      if (avail < quantity) throw new Error(`Sèlman ${avail} disponib`);
    }

    const maxPer = inventory.maxPerOrder;
    const minPer = inventory.minPerOrder ?? 1;

    const existing = this.cart.items.find(
      i => i.listingId === listing.id && i.variantId === variantId,
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (maxPer && newQty > maxPer) throw new Error(`Maks ${maxPer} pa kòmand`);
      existing.quantity = newQty;
    } else {
      if (maxPer && quantity > maxPer) throw new Error(`Maks ${maxPer} pa kòmand`);
      if (quantity < minPer) throw new Error(`Min ${minPer} pa kòmand`);

      const breakdown = await PricingEngine.calculatePrice(pricing, { quantity: 1 });
      const item: CartItem = {
        id:          makeId(),
        listingId:   listing.id,
        ...(variantId ? { variantId } : {}),
        vendorId:    listing.vendorId,
        quantity,
        unitPrice:   breakdown.total,
        currency:    breakdown.currency,
        title:       listing.title,
        image:       listing.media.find(m => m.isPrimary)?.url,
        attributes:  (variant?.attributes ?? listing.attributes).map(a => ({ key: a.key, value: String(a.value) })),
        listingType: listing.type,
        availability: 'available',
        addedAt:     Date.now(),
      };
      this.cart.items.push(item);
    }

    await this.recalculate();
  }

  // ─── Remove ───────────────────────────────────────────────────────────────

  async remove(itemId: string): Promise<void> {
    this.cart.items = this.cart.items.filter(i => i.id !== itemId);
    await this.recalculate();
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) return this.remove(itemId);
    const item = this.cart.items.find(i => i.id === itemId);
    if (!item) return;
    item.quantity = quantity;
    await this.recalculate();
  }

  clear(): void {
    this.cart = this.emptyCart();
    this.save();
    this.notify();
  }

  // ─── Coupon ───────────────────────────────────────────────────────────────

  async applyCoupon(code: string): Promise<void> {
    const res = await fetch(`/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, items: this.cart.items, subtotal: this.cart.totals.subtotal }),
    });
    if (!res.ok) {
      const e = await res.json() as { message?: string };
      throw new Error(e.message ?? 'Koupyon envalid');
    }
    const discount = await res.json() as DiscountApplication;
    this.cart.couponCode = code;
    this.cart.discount   = discount;
    await this.recalculate();
  }

  removeCoupon(): void {
    delete this.cart.couponCode;
    delete this.cart.discount;
    void this.recalculate();
  }

  // ─── Recalculate ─────────────────────────────────────────────────────────

  private async recalculate(): Promise<void> {
    let subtotal = 0;
    for (const item of this.cart.items) {
      item.unitPrice  = item.unitPrice;
      subtotal       += item.unitPrice * item.quantity;
    }

    let discount = 0;
    if (this.cart.discount) {
      if (this.cart.discount.type === 'percent') {
        discount = subtotal * (this.cart.discount.value / 100);
      } else if (this.cart.discount.type === 'fixed') {
        discount = Math.min(this.cart.discount.value, subtotal);
      }
    }

    const afterDiscount = subtotal - discount;
    const total         = afterDiscount;

    this.cart.totals = {
      subtotal,
      discount,
      shipping: 0,
      tax:      0,
      total,
      currency:     this.cart.currency,
      totalInMinor: PricingEngine.toMinor(total, this.cart.currency),
    };

    this.cart.updatedAt = Date.now();
    this.save();
    this.notify();
  }

  // ─── Vendor grouping ──────────────────────────────────────────────────────

  getItemsByVendor(): Map<string, CartItem[]> {
    const map = new Map<string, CartItem[]>();
    for (const item of this.cart.items) {
      const list = map.get(item.vendorId) ?? [];
      list.push(item);
      map.set(item.vendorId, list);
    }
    return map;
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  private save(): void {
    sessionStorage.setItem('jf_cart', JSON.stringify(this.cart));
  }

  async syncToServer(): Promise<void> {
    await fetch('/api/cart', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(this.cart),
    }).catch(() => { /* offline — cart stays local */ });
  }

  // ─── Accessors ────────────────────────────────────────────────────────────

  getCart(): Cart                       { return this.cart; }
  getItemCount(): number                { return this.cart.items.reduce((n, i) => n + i.quantity, 0); }
  getTotal(): number                    { return this.cart.totals.total; }
  getCurrency(): string                 { return this.cart.currency; }
  setCurrency(c: string): void          { this.cart.currency = c; void this.recalculate(); }
  setCountry(c: string): void           { this.cart.countryCode = c; }

  onChange(fn: CartListener): () => void {
    this.listeners.add(fn);
    fn(this.cart);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn(this.cart));
  }
}

export const CartEngine = new CartEngineImpl();