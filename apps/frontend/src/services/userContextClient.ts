/**
 * User Context Client — Single API call for full user context.
 * Returns: profile, subscription, wallet, permissions, geo, behavior,
 * risk/trust scores, language, currency, timezone, weather, traffic, live events.
 *
 * Designed to replace multiple browser API calls with one backend call
 * (faster, server-side enrichment, no CORS issues, privacy-safe).
 */
import API from '../api/axios';
import type { ApiResponse, GeoLocation, RiskProfile } from '../types';

export interface WeatherContext {
  readonly condition: string;
  readonly temperature: number;
  readonly unit: 'C' | 'F';
  readonly icon: string;
}

export interface TrafficContext {
  readonly level: 'low' | 'moderate' | 'heavy';
  readonly label: string;
  readonly avgDelayMinutes: number;
}

export interface MarketplaceUserContext {
  readonly profile: Record<string, unknown>;
  readonly subscription: {
    readonly tier: 'free' | 'basic' | 'pro' | 'enterprise';
    readonly expiresAt?: string;
    readonly features: readonly string[];
  };
  readonly wallet: {
    readonly balance: number;
    readonly currency: string;
    readonly hasCard: boolean;
  };
  readonly permission: Record<string, boolean>;
  readonly country: string;
  readonly city: string;
  readonly geo: GeoLocation | null;
  readonly nearbyJobs: readonly unknown[];
  readonly nearbyHotels: readonly unknown[];
  readonly nearbyTaxis: readonly unknown[];
  readonly bookingHistory: readonly unknown[];
  readonly searchHistory: readonly string[];
  readonly favoriteCategories: readonly string[];
  readonly riskProfile: RiskProfile;
  readonly language: string;
  readonly currency: string;
  readonly timezone: string;
  readonly weather?: WeatherContext;
  readonly traffic?: TrafficContext;
  readonly liveEvents: readonly unknown[];
}

const userContextClient = {
  /** Load full user context enriched by backend (replaces multiple browser calls) */
  getContextForMarketplace: async (params: {
    categoryId: string;
  }): Promise<MarketplaceUserContext> => {
    const res = await API.get<ApiResponse<MarketplaceUserContext>>('/user-context/marketplace', {
      params,
    });
    return res.data.data;
  },

  /** Refresh partial context (e.g., after a location change) */
  refreshGeoContext: async (geo: { lat: number; lng: number }): Promise<Partial<MarketplaceUserContext>> => {
    const res = await API.post<ApiResponse<Partial<MarketplaceUserContext>>>(
      '/user-context/refresh/geo',
      geo,
    );
    return res.data.data;
  },

  /** Update preferred language for context enrichment */
  setLanguagePreference: async (language: string): Promise<void> => {
    await API.patch('/user-context/preferences/language', { language });
  },

  /** Update preferred currency */
  setCurrencyPreference: async (currency: string): Promise<void> => {
    await API.patch('/user-context/preferences/currency', { currency });
  },
};

export { userContextClient };
export default userContextClient;