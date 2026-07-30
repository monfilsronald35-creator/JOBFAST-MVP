import { useState, useEffect } from 'react';
import type { Cart, Listing, Variant } from '../types';
import { CartEngine } from '../engines/CartEngine';

export function useCart() {
  const [cart,    setCart]    = useState<Cart>(CartEngine.getCart());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => CartEngine.onChange(setCart), []);

  const add = async (listing: Listing, variant?: Variant, qty = 1) => {
    setLoading(true); setError(null);
    try {
      await CartEngine.add(listing, variant, qty);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (itemId: string) => {
    setLoading(true); setError(null);
    try {
      await CartEngine.remove(itemId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    setLoading(true); setError(null);
    try {
      await CartEngine.updateQuantity(itemId, qty);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    setLoading(true); setError(null);
    try {
      await CartEngine.applyCoupon(code);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    itemCount:    CartEngine.getItemCount(),
    total:        CartEngine.getTotal(),
    currency:     CartEngine.getCurrency(),
    add,
    remove,
    updateQty,
    clear:        () => CartEngine.clear(),
    applyCoupon,
    removeCoupon: () => CartEngine.removeCoupon(),
    loading,
    error,
  };
}