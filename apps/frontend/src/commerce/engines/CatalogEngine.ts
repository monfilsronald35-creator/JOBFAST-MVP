/**
 * CatalogEngine — Universal catalog: 17 listing types, dynamic attributes, search, facets.
 * Talks to the backend API. Does NOT enforce business logic on its own.
 */

import type { Listing, ListingType, SearchQuery, SearchResult, Category, Variant } from '../types';
import { attributeEngine } from './AttributeEngine';

function getAuth(): string | null {
  try {
    const raw = localStorage.getItem('jobfast_user');
    if (!raw) return null;
    const u = JSON.parse(raw) as { token?: string };
    return u.token ? `Bearer ${u.token}` : null;
  } catch { return null; }
}

async function apiFetch<T>(
  path:   string,
  init:   RequestInit = {},
): Promise<T> {
  const auth = getAuth();
  const res  = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` })) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const CatalogEngine = {
  // ─── Listings ────────────────────────────────────────────────────────────

  async getListing(id: string): Promise<Listing> {
    return apiFetch<Listing>(`/listings/${id}`);
  },

  async getListings(ids: string[]): Promise<Listing[]> {
    return apiFetch<Listing[]>(`/listings?ids=${ids.join(',')}`);
  },

  async createListing(data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'totalSales' | 'viewCount'>): Promise<Listing> {
    const validated = attributeEngine.validate(
      data.attributes,
      attributeEngine.getTemplate(data.type),
    );
    if (!validated.valid) throw new Error(`Atribi envalid: ${JSON.stringify(validated.errors)}`);
    return apiFetch<Listing>('/listings', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    return apiFetch<Listing>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteListing(id: string): Promise<void> {
    await apiFetch(`/listings/${id}`, { method: 'DELETE' });
  },

  async publishListing(id: string): Promise<Listing> {
    return apiFetch<Listing>(`/listings/${id}/publish`, { method: 'POST' });
  },

  async pauseListing(id: string): Promise<Listing> {
    return apiFetch<Listing>(`/listings/${id}/pause`, { method: 'POST' });
  },

  async duplicateListing(id: string): Promise<Listing> {
    return apiFetch<Listing>(`/listings/${id}/duplicate`, { method: 'POST' });
  },

  // ─── Variants ────────────────────────────────────────────────────────────

  async addVariant(listingId: string, variant: Omit<Variant, 'id' | 'listingId'>): Promise<Variant> {
    return apiFetch<Variant>(`/listings/${listingId}/variants`, { method: 'POST', body: JSON.stringify(variant) });
  },

  async updateVariant(listingId: string, variantId: string, data: Partial<Variant>): Promise<Variant> {
    return apiFetch<Variant>(`/listings/${listingId}/variants/${variantId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteVariant(listingId: string, variantId: string): Promise<void> {
    await apiFetch(`/listings/${listingId}/variants/${variantId}`, { method: 'DELETE' });
  },

  // ─── Categories ───────────────────────────────────────────────────────────

  async getCategories(parentId?: string): Promise<Category[]> {
    return apiFetch<Category[]>(`/categories${parentId ? `?parentId=${parentId}` : ''}`);
  },

  async getCategory(id: string): Promise<Category> {
    return apiFetch<Category>(`/categories/${id}`);
  },

  async getCategoryTree(): Promise<Category[]> {
    return apiFetch<Category[]>('/categories/tree');
  },

  // ─── Search ───────────────────────────────────────────────────────────────

  async search(query: SearchQuery): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (query.text)        params.set('q',            query.text);
    if (query.categoryId)  params.set('categoryId',   query.categoryId);
    if (query.vendorId)    params.set('vendorId',      query.vendorId);
    if (query.listingType) params.set('type',          query.listingType);
    if (query.minPrice)    params.set('minPrice',      String(query.minPrice));
    if (query.maxPrice)    params.set('maxPrice',      String(query.maxPrice));
    if (query.currency)    params.set('currency',      query.currency);
    if (query.countryCode) params.set('country',       query.countryCode);
    if (query.sortBy)      params.set('sortBy',        query.sortBy);
    if (query.page)        params.set('page',          String(query.page));
    if (query.limit)       params.set('limit',         String(query.limit));

    if (query.filters) {
      params.set('filters', JSON.stringify(query.filters));
    }

    return apiFetch<SearchResult>(`/listings/search?${params.toString()}`);
  },

  async getSuggestions(text: string, limit = 5): Promise<string[]> {
    return apiFetch<string[]>(`/listings/suggest?q=${encodeURIComponent(text)}&limit=${limit}`);
  },

  // ─── Vendor listings ──────────────────────────────────────────────────────

  async getVendorListings(
    vendorId: string,
    options?: { status?: string; type?: ListingType; page?: number; limit?: number },
  ): Promise<{ listings: Listing[]; total: number }> {
    const params = new URLSearchParams({ vendorId });
    if (options?.status) params.set('status', options.status);
    if (options?.type)   params.set('type',   options.type);
    if (options?.page)   params.set('page',   String(options.page));
    if (options?.limit)  params.set('limit',  String(options.limit));
    return apiFetch(`/listings?${params.toString()}`);
  },

  // ─── Inventory ───────────────────────────────────────────────────────────

  async updateInventory(listingId: string, variantId: string | null, delta: number): Promise<void> {
    await apiFetch(`/listings/${listingId}/inventory`, {
      method: 'PATCH',
      body:   JSON.stringify({ variantId, delta }),
    });
  },

  async bulkUpdateInventory(updates: Array<{ listingId: string; variantId?: string; quantity: number }>): Promise<void> {
    await apiFetch('/listings/inventory/bulk', { method: 'POST', body: JSON.stringify({ updates }) });
  },

  // ─── Import / Export ──────────────────────────────────────────────────────

  async importFromCsv(vendorId: string, csv: string, listingType: ListingType): Promise<{ imported: number; errors: string[] }> {
    return apiFetch('/listings/import', {
      method: 'POST',
      body:   JSON.stringify({ vendorId, csv, listingType }),
    });
  },

  async exportToCsv(vendorId: string, filters?: Record<string, unknown>): Promise<string> {
    const res = await fetch(`/api/listings/export?vendorId=${vendorId}`, {
      headers: { ...(getAuth() ? { Authorization: getAuth()! } : {}) },
    });
    return res.text();
  },
};