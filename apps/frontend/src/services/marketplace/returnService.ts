import { supabase } from '../../lib/supabase';
import type {
  Return,
  ReturnItem,
  Refund,
  Dispute,
  ReturnStatus,
  DisputeStatus,
} from '../../types/orders';

// ---- Row types (snake_case) ----

type ReturnRow = {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type ReturnItemRow = {
  id: string;
  return_id: string;
  order_item_id: string;
  quantity: number;
  condition: string | null;
};

type RefundRow = {
  id: string;
  return_id: string | null;
  order_id: string;
  amount: number;
  gateway_refund_id: string | null;
  status: string;
  created_at: string;
};

type DisputeRow = {
  id: string;
  order_id: string;
  raised_by: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---- Mappers ----

function mapReturn(r: ReturnRow): Return {
  return {
    id: r.id,
    orderId: r.order_id,
    customerId: r.customer_id,
    reason: r.reason,
    status: r.status as ReturnStatus,
    createdAt: r.created_at,
  };
}

function mapReturnItem(r: ReturnItemRow): ReturnItem {
  return {
    id: r.id,
    returnId: r.return_id,
    orderItemId: r.order_item_id,
    quantity: r.quantity,
    condition: r.condition,
  };
}

function mapRefund(r: RefundRow): Refund {
  return {
    id: r.id,
    returnId: r.return_id,
    orderId: r.order_id,
    amount: r.amount,
    gatewayRefundId: r.gateway_refund_id,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapDispute(r: DisputeRow): Dispute {
  return {
    id: r.id,
    orderId: r.order_id,
    raisedBy: r.raised_by,
    reason: r.reason,
    status: r.status as DisputeStatus,
    resolutionNotes: r.resolution_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ================================================================
// === Returns
// ================================================================

export async function getMyReturns(status?: ReturnStatus): Promise<Return[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('returns')
    .select('*')
    .eq('customer_id', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReturnRow[]).map(mapReturn);
}

export async function createReturn(
  orderId: string,
  reason: string,
  items: Array<{ orderItemId: string; quantity: number; condition?: string }>
): Promise<Return> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .insert({ order_id: orderId, customer_id: user.id, reason })
    .select('*')
    .single();
  if (returnError) throw returnError;

  const returnRecord = mapReturn(returnData as ReturnRow);

  const returnItemRows = items.map((item) => {
    const row: Record<string, unknown> = {
      return_id: returnRecord.id,
      order_item_id: item.orderItemId,
      quantity: item.quantity,
    };
    if (item.condition !== undefined) row['condition'] = item.condition;
    return row;
  });

  const { error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItemRows);
  if (itemsError) throw itemsError;

  return returnRecord;
}

export async function getReturnItems(returnId: string): Promise<ReturnItem[]> {
  const { data, error } = await supabase
    .from('return_items')
    .select('*')
    .eq('return_id', returnId);
  if (error) throw error;
  return (data as ReturnItemRow[]).map(mapReturnItem);
}

// ================================================================
// === Refunds
// ================================================================

export async function getOrderRefunds(orderId: string): Promise<Refund[]> {
  const { data, error } = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RefundRow[]).map(mapRefund);
}

// ================================================================
// === Disputes
// ================================================================

export async function getMyDisputes(status?: DisputeStatus): Promise<Dispute[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('disputes')
    .select('*')
    .eq('raised_by', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DisputeRow[]).map(mapDispute);
}

export async function createDispute(
  orderId: string,
  reason: string
): Promise<Dispute> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('disputes')
    .insert({ order_id: orderId, raised_by: user.id, reason })
    .select('*')
    .single();
  if (error) throw error;
  return mapDispute(data as DisputeRow);
}

export async function getDisputeByOrder(
  orderId: string
): Promise<Dispute | null> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDispute(data as DisputeRow) : null;
}
