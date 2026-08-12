import { supabase } from '../../lib/supabase';
import type {
  MarketplaceNotification,
  MarketplaceReport,
  MarketplaceAiLog,
  MarketplaceHistory,
  MarketplaceStatistics,
} from '../../types/marketplace';

// ---- Row types (snake_case) ----

type MarketplaceNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type MarketplaceReportRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
};

type MarketplaceAiLogRow = {
  id: string;
  product_id: string | null;
  action_type: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  created_at: string;
};

type MarketplaceHistoryRow = {
  id: string;
  product_id: string | null;
  actor_id: string;
  action: string;
  old_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  created_at: string;
};

type MarketplaceStatisticsRow = {
  id: string;
  seller_id: string;
  total_sales: number;
  total_orders: number;
  average_rating: number;
  updated_at: string;
};

// ---- Mappers ----

function mapNotification(r: MarketplaceNotificationRow): MarketplaceNotification {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    message: r.message,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

function mapReport(r: MarketplaceReportRow): MarketplaceReport {
  return {
    id: r.id,
    userId: r.user_id,
    productId: r.product_id,
    reason: r.reason,
    description: r.description,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapAiLog(r: MarketplaceAiLogRow): MarketplaceAiLog {
  return {
    id: r.id,
    productId: r.product_id,
    actionType: r.action_type,
    payload: r.payload,
    response: r.response,
    createdAt: r.created_at,
  };
}

function mapHistory(r: MarketplaceHistoryRow): MarketplaceHistory {
  return {
    id: r.id,
    productId: r.product_id,
    actorId: r.actor_id,
    action: r.action,
    oldState: r.old_state,
    newState: r.new_state,
    createdAt: r.created_at,
  };
}

function mapStatistics(r: MarketplaceStatisticsRow): MarketplaceStatistics {
  return {
    id: r.id,
    sellerId: r.seller_id,
    totalSales: r.total_sales,
    totalOrders: r.total_orders,
    averageRating: r.average_rating,
    updatedAt: r.updated_at,
  };
}

// ================================================================
// === Marketplace Notifications
// ================================================================

export async function getMyMarketplaceNotifications(
  limit = 30
): Promise<MarketplaceNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('marketplace_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as MarketplaceNotificationRow[]).map(mapNotification);
}

export async function markMarketplaceNotificationRead(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('marketplace_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllMarketplaceNotificationsRead(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('marketplace_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  if (error) throw error;
}

// ================================================================
// === Marketplace Reports
// ================================================================

export async function reportProduct(
  productId: string,
  reason: string,
  description?: string
): Promise<MarketplaceReport> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    user_id: user.id,
    product_id: productId,
    reason,
  };
  if (description !== undefined) payload['description'] = description;

  const { data, error } = await supabase
    .from('marketplace_reports')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapReport(data as MarketplaceReportRow);
}

export async function getMyProductReports(): Promise<MarketplaceReport[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('marketplace_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MarketplaceReportRow[]).map(mapReport);
}

// ================================================================
// === Marketplace AI Logs (read — writes happen server-side)
// ================================================================

export async function getProductAiLogs(
  productId: string
): Promise<MarketplaceAiLog[]> {
  const { data, error } = await supabase
    .from('marketplace_ai_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MarketplaceAiLogRow[]).map(mapAiLog);
}

// ================================================================
// === Marketplace History
// ================================================================

export async function getProductHistory(
  productId: string
): Promise<MarketplaceHistory[]> {
  const { data, error } = await supabase
    .from('marketplace_history')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MarketplaceHistoryRow[]).map(mapHistory);
}

// ================================================================
// === Marketplace Statistics
// ================================================================

export async function getMySellerStatistics(): Promise<MarketplaceStatistics | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('marketplace_statistics')
    .select('*')
    .eq('seller_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStatistics(data as MarketplaceStatisticsRow) : null;
}

export async function getSellerStatistics(
  sellerId: string
): Promise<MarketplaceStatistics | null> {
  const { data, error } = await supabase
    .from('marketplace_statistics')
    .select('id, seller_id, total_sales, total_orders, average_rating, updated_at')
    .eq('seller_id', sellerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStatistics(data as MarketplaceStatisticsRow) : null;
}
