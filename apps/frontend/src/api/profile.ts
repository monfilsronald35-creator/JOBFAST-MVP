/**
 * Profile API — Enterprise client for all profile-related endpoints.
 * Backed by the primary axios instance (70 s timeout for Render cold start).
 */
import API from './axios';
import type { UserProfile, ApiResponse } from '../types';

export interface ProfileAIData {
  readonly suggestedSkills: readonly string[];
  readonly profileCompletionScore: number;
  readonly matchScore?: number;
  readonly aiInsights: readonly string[];
}

export interface TrustData {
  readonly trustScore: number;
  readonly tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  readonly verifications: readonly { type: string; verifiedAt: string }[];
  readonly badgeIds: readonly string[];
}

export interface AnalyticsData {
  readonly profileViews: number;
  readonly searchAppearances: number;
  readonly hireRate: number;
  readonly responseTime: number;
  readonly conversionRate: number;
  readonly weeklyStats: readonly { date: string; views: number; contacts: number }[];
}

export interface ReviewData {
  readonly reviews: readonly {
    _id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    rating: number;
    comment: string;
    jobTitle?: string;
    createdAt: string;
  }[];
  readonly averageRating: number;
  readonly totalCount: number;
  readonly ratingDistribution: Record<string, number>;
}

export interface PortfolioData {
  readonly items: readonly {
    _id: string;
    title: string;
    description?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    category?: string;
    createdAt: string;
  }[];
}

export interface MediaData {
  readonly photos: readonly { _id: string; url: string; caption?: string; createdAt: string }[];
  readonly videos: readonly { _id: string; url: string; thumbnail?: string; duration?: number; createdAt: string }[];
}

export interface BookingData {
  readonly upcoming: readonly unknown[];
  readonly past: readonly unknown[];
  readonly availability: {
    readonly slots: readonly { date: string; available: boolean }[];
    readonly timezone: string;
  };
}

const profileApi = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    const res = await API.get<ApiResponse<UserProfile>>(`/profiles/${userId}`);
    return res.data.data;
  },

  getAI: async (userId: string): Promise<ProfileAIData> => {
    const res = await API.get<ApiResponse<ProfileAIData>>(`/profiles/${userId}/ai`);
    return res.data.data;
  },

  getTrust: async (userId: string): Promise<TrustData> => {
    const res = await API.get<ApiResponse<TrustData>>(`/profiles/${userId}/trust`);
    return res.data.data;
  },

  getAnalytics: async (userId: string): Promise<AnalyticsData> => {
    const res = await API.get<ApiResponse<AnalyticsData>>(`/profiles/${userId}/analytics`);
    return res.data.data;
  },

  getReviews: async (userId: string, page = 1, limit = 20): Promise<ReviewData> => {
    const res = await API.get<ApiResponse<ReviewData>>(`/profiles/${userId}/reviews`, {
      params: { page, limit },
    });
    return res.data.data;
  },

  getPortfolio: async (userId: string): Promise<PortfolioData> => {
    const res = await API.get<ApiResponse<PortfolioData>>(`/profiles/${userId}/portfolio`);
    return res.data.data;
  },

  getMedia: async (userId: string): Promise<MediaData> => {
    const res = await API.get<ApiResponse<MediaData>>(`/profiles/${userId}/media`);
    return res.data.data;
  },

  getBookings: async (userId: string): Promise<BookingData> => {
    const res = await API.get<ApiResponse<BookingData>>(`/profiles/${userId}/bookings`);
    return res.data.data;
  },

  updateProfile: async (userId: string, patch: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await API.patch<ApiResponse<UserProfile>>(`/profiles/${userId}`, patch);
    return res.data.data;
  },

  uploadAvatar: async (userId: string, file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await API.post<ApiResponse<{ url: string }>>(`/profiles/${userId}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};

export { profileApi };
export default profileApi;