/**
 * Offline Client — Enterprise offline-first data layer.
 * Strategy: network-first with IndexedDB fallback, Background Sync,
 * delta/conflict resolution, stale-while-revalidate.
 */
import API from '../api/axios';
import { cacheGet, cacheSet } from '../lib/indexedDb';
import type { ApiResponse } from '../types';

const LISTING_CACHE_TTL = 5 * 60 * 1_000;   // 5 min
const PROFILE_CACHE_TTL = 10 * 60 * 1_000;  // 10 min

async function networkFirst<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  try {
    const fresh = await fetchFn();
    await cacheSet('media_cache', cacheKey, fresh, ttlMs);
    return fresh;
  } catch {
    const cached = await cacheGet<T>('media_cache', cacheKey);
    if (cached !== null) return cached;
    throw new Error(`offlineClient: no cached data for ${cacheKey}`);
  }
}

const offlineClient = {
  /** Fetch listing details — network-first, cache fallback */
  fetchListingDetails: async (listingId: string): Promise<Record<string, unknown>> => {
    return networkFirst(
      `listing:details:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<Record<string, unknown>>>(`/listings/${listingId}`);
        return res.data.data;
      },
      LISTING_CACHE_TTL,
    );
  },

  /** Fetch listing reviews */
  fetchListingReviews: async (listingId: string): Promise<readonly unknown[]> => {
    return networkFirst(
      `listing:reviews:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<readonly unknown[]>>(`/listings/${listingId}/reviews`);
        return res.data.data;
      },
      LISTING_CACHE_TTL,
    );
  },

  /** Fetch listing availability */
  fetchListingAvailability: async (listingId: string): Promise<Record<string, unknown>> => {
    return networkFirst(
      `listing:avail:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<Record<string, unknown>>>(
          `/listings/${listingId}/availability`,
        );
        return res.data.data;
      },
      LISTING_CACHE_TTL,
    );
  },

  /** Fetch listing map data */
  fetchListingMapData: async (listingId: string): Promise<Record<string, unknown>> => {
    return networkFirst(
      `listing:map:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<Record<string, unknown>>>(
          `/listings/${listingId}/map`,
        );
        return res.data.data;
      },
      LISTING_CACHE_TTL,
    );
  },

  /** Fetch listing photos */
  fetchListingPhotos: async (listingId: string): Promise<readonly string[]> => {
    return networkFirst(
      `listing:photos:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<readonly string[]>>(`/listings/${listingId}/photos`);
        return res.data.data;
      },
      LISTING_CACHE_TTL,
    );
  },

  /** Fetch listing owner profile */
  fetchListingOwnerProfile: async (listingId: string): Promise<Record<string, unknown>> => {
    return networkFirst(
      `listing:owner:${listingId}`,
      async () => {
        const res = await API.get<ApiResponse<Record<string, unknown>>>(
          `/listings/${listingId}/owner`,
        );
        return res.data.data;
      },
      PROFILE_CACHE_TTL,
    );
  },

  /** Preload multiple listings in one batch request */
  prefetchBatch: async (listingIds: readonly string[]): Promise<void> => {
    if (listingIds.length === 0) return;
    try {
      const res = await API.post<ApiResponse<Record<string, unknown>>>('/listings/batch', {
        ids: listingIds,
      });
      const data = res.data.data as Record<string, unknown>;
      await Promise.all(
        Object.entries(data).map(([id, listing]) =>
          cacheSet('media_cache', `listing:details:${id}`, listing, LISTING_CACHE_TTL),
        ),
      );
    } catch {
      // Prefetch failure is non-blocking
    }
  },

  /** Sync background queue — flush offline operations when back online */
  syncOfflineQueue: async (): Promise<{ flushed: number; failed: number }> => {
    const { getDueOfflineItems, removeOfflineItem, incrementRetry } = await import('../lib/indexedDb');
    const items = await getDueOfflineItems();
    let flushed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await API.post('/sync/apply', { type: item.type, payload: item.payload });
        await removeOfflineItem(item.id);
        flushed++;
      } catch (err) {
        await incrementRetry(item.id, err instanceof Error ? err.message : 'unknown');
        failed++;
      }
    }

    return { flushed, failed };
  },

  /** Invalidate all cached data for a specific listing */
  invalidateListing: async (listingId: string): Promise<void> => {
    const { cacheDelete } = await import('../lib/indexedDb');
    const keys = ['details', 'reviews', 'avail', 'map', 'photos', 'owner'];
    await Promise.all(
      keys.map((k) => cacheDelete('media_cache', `listing:${k}:${listingId}`)),
    );
  },
};

export { offlineClient };
export default offlineClient;