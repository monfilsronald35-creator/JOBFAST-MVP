import { useState, useCallback } from 'react';
import type { Vendor, VendorType, VendorMetrics } from '../types';
import { VendorRegistry } from '../vendor/VendorRegistry';

export function useVendor(vendorId?: string) {
  const [vendor,  setVendor]  = useState<Vendor | null>(null);
  const [metrics, setMetrics] = useState<VendorMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const loadVendor = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const v = await VendorRegistry.getVendor(id);
      setVendor(v);
      return v;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async (id: string, period?: 'day' | 'week' | 'month' | 'year') => {
    setLoading(true); setError(null);
    try {
      const m = await VendorRegistry.getMetrics(id, period);
      setMetrics(m);
      return m;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: Parameters<typeof VendorRegistry.register>[0]): Promise<Vendor | null> => {
    setLoading(true); setError(null);
    try {
      const v = await VendorRegistry.register(data);
      setVendor(v);
      return v;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<Vendor>): Promise<Vendor | null> => {
    setLoading(true); setError(null);
    try {
      const v = await VendorRegistry.update(id, data);
      setVendor(v);
      return v;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { vendor, metrics, loading, error, loadVendor, loadMetrics, register, update };
}