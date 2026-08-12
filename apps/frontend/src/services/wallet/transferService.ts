import { supabase } from '../../lib/supabase';
import type { TransactionStatus, TransactionDirection, RiskLevel } from '../../types/wallet';
import type {
  WalletTransfer,
  EscrowAccount,
  EscrowTransaction,
  EscrowDispute,
  EscrowReleaseHistory,
  EscrowEvent,
  EscrowLog,
  TransferLog,
  TransferFailure,
  TransferRetryQueueEntry,
  EscrowStatus,
  EscrowDisputeStatus,
} from '../../types/transfers';

// All wallet transfer and escrow WRITE operations (create transfer, hold, release,
// refund, cancel) must go through the backend/Edge Functions to guarantee ACID atomicity.
// This service provides read-only views of transfer and escrow state for the frontend.

// ---- Row types (snake_case) ----

type WalletTransferRow = {
  id: string;
  sender_wallet_id: string | null;
  receiver_wallet_id: string | null;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency_id: string | null;
  currency_code: string;
  exchange_rate: number;
  status: string;
  reference_id: string | null;
  external_reference: string | null;
  idempotency_key: string | null;
  fraud_score: number;
  aml_score: number;
  risk_level: string;
  note: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type EscrowAccountRow = {
  id: string;
  buyer_wallet_id: string;
  seller_wallet_id: string;
  amount: number;
  platform_fee: number;
  processor_fee: number;
  tax_amount: number;
  seller_amount: number;
  buyer_amount: number;
  currency_id: string | null;
  currency_code: string;
  status: string;
  reference_type: string | null;
  reference_id: string | null;
  auto_release_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type EscrowTransactionRow = {
  id: string;
  escrow_id: string;
  transaction_id: string | null;
  action: string;
  amount: number;
  currency_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type EscrowDisputeRow = {
  id: string;
  escrow_id: string;
  raised_by: string;
  assigned_to: string | null;
  priority: string;
  reason: string;
  status: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  attachments: unknown[];
  metadata: Record<string, unknown>;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

type EscrowReleaseHistoryRow = {
  id: string;
  escrow_id: string;
  transaction_id: string | null;
  released_to: string;
  amount: number;
  currency_id: string | null;
  released_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type EscrowEventRow = {
  id: string;
  escrow_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type EscrowLogRow = {
  id: string;
  escrow_id: string;
  action: string;
  actor_id: string | null;
  notes: string | null;
  created_at: string;
};

type TransferLogRow = {
  id: string;
  transfer_id: string;
  status: string;
  response_payload: Record<string, unknown>;
  created_at: string;
};

type TransferFailureRow = {
  id: string;
  transfer_id: string;
  error_code: string | null;
  error_message: string;
  retry_count: number;
  created_at: string;
};

type TransferRetryQueueRow = {
  id: string;
  transfer_id: string;
  next_retry_at: string;
  status: string;
  created_at: string;
};

// ---- Mappers ----

function mapTransfer(r: WalletTransferRow): WalletTransfer {
  return {
    id: r.id,
    senderWalletId: r.sender_wallet_id,
    receiverWalletId: r.receiver_wallet_id,
    amount: r.amount,
    feeAmount: r.fee_amount,
    netAmount: r.net_amount,
    currencyId: r.currency_id,
    currencyCode: r.currency_code,
    exchangeRate: r.exchange_rate,
    status: r.status as TransactionStatus,
    referenceId: r.reference_id,
    externalReference: r.external_reference,
    idempotencyKey: r.idempotency_key,
    fraudScore: r.fraud_score,
    amlScore: r.aml_score,
    riskLevel: r.risk_level as RiskLevel,
    note: r.note,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapEscrow(r: EscrowAccountRow): EscrowAccount {
  return {
    id: r.id,
    buyerWalletId: r.buyer_wallet_id,
    sellerWalletId: r.seller_wallet_id,
    amount: r.amount,
    platformFee: r.platform_fee,
    processorFee: r.processor_fee,
    taxAmount: r.tax_amount,
    sellerAmount: r.seller_amount,
    buyerAmount: r.buyer_amount,
    currencyId: r.currency_id,
    currencyCode: r.currency_code,
    status: r.status as EscrowStatus,
    referenceType: r.reference_type as EscrowAccount['referenceType'],
    referenceId: r.reference_id,
    autoReleaseAt: r.auto_release_at,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapEscrowTransaction(r: EscrowTransactionRow): EscrowTransaction {
  return {
    id: r.id,
    escrowId: r.escrow_id,
    transactionId: r.transaction_id,
    action: r.action as EscrowTransaction['action'],
    amount: r.amount,
    currencyId: r.currency_id,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapEscrowDispute(r: EscrowDisputeRow): EscrowDispute {
  return {
    id: r.id,
    escrowId: r.escrow_id,
    raisedBy: r.raised_by,
    assignedTo: r.assigned_to,
    priority: r.priority,
    reason: r.reason,
    status: r.status as EscrowDisputeStatus,
    resolutionType: r.resolution_type,
    resolutionNotes: r.resolution_notes,
    attachments: r.attachments,
    metadata: r.metadata,
    closedAt: r.closed_at,
    closedBy: r.closed_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapReleaseHistory(r: EscrowReleaseHistoryRow): EscrowReleaseHistory {
  return {
    id: r.id,
    escrowId: r.escrow_id,
    transactionId: r.transaction_id,
    releasedTo: r.released_to,
    amount: r.amount,
    currencyId: r.currency_id,
    releasedBy: r.released_by,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapEscrowEvent(r: EscrowEventRow): EscrowEvent {
  return {
    id: r.id,
    escrowId: r.escrow_id,
    eventType: r.event_type,
    payload: r.payload,
    createdAt: r.created_at,
  };
}

function mapEscrowLog(r: EscrowLogRow): EscrowLog {
  return {
    id: r.id,
    escrowId: r.escrow_id,
    action: r.action,
    actorId: r.actor_id,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapTransferLog(r: TransferLogRow): TransferLog {
  return {
    id: r.id,
    transferId: r.transfer_id,
    status: r.status,
    responsePayload: r.response_payload,
    createdAt: r.created_at,
  };
}

function mapTransferFailure(r: TransferFailureRow): TransferFailure {
  return {
    id: r.id,
    transferId: r.transfer_id,
    errorCode: r.error_code,
    errorMessage: r.error_message,
    retryCount: r.retry_count,
    createdAt: r.created_at,
  };
}

function mapRetryQueueEntry(r: TransferRetryQueueRow): TransferRetryQueueEntry {
  return {
    id: r.id,
    transferId: r.transfer_id,
    nextRetryAt: r.next_retry_at,
    status: r.status,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Wallet Transfers
// ================================================================

type GetTransfersOptions = {
  status?: TransactionStatus;
  direction?: 'sent' | 'received';
  currencyCode?: string;
  limit?: number;
};

export async function getWalletTransfers(
  walletId: string,
  options: GetTransfersOptions = {}
): Promise<WalletTransfer[]> {
  let q = supabase
    .from('wallet_transfers')
    .select('*')
    .is('deleted_at', null);

  if (options.direction === 'sent') {
    q = q.eq('sender_wallet_id', walletId);
  } else if (options.direction === 'received') {
    q = q.eq('receiver_wallet_id', walletId);
  } else {
    q = q.or(`sender_wallet_id.eq.${walletId},receiver_wallet_id.eq.${walletId}`);
  }

  if (options.status) q = q.eq('status', options.status);
  if (options.currencyCode) q = q.eq('currency_code', options.currencyCode.toUpperCase());

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WalletTransferRow[]).map(mapTransfer);
}

export async function getTransferById(
  transferId: string
): Promise<WalletTransfer | null> {
  const { data, error } = await supabase
    .from('wallet_transfers')
    .select('*')
    .eq('id', transferId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTransfer(data as WalletTransferRow) : null;
}

export async function getTransferByIdempotencyKey(
  idempotencyKey: string
): Promise<WalletTransfer | null> {
  const { data, error } = await supabase
    .from('wallet_transfers')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTransfer(data as WalletTransferRow) : null;
}

export async function getTransferLogs(
  transferId: string
): Promise<TransferLog[]> {
  const { data, error } = await supabase
    .from('transfer_logs')
    .select('*')
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as TransferLogRow[]).map(mapTransferLog);
}

export async function getTransferFailures(
  transferId: string
): Promise<TransferFailure[]> {
  const { data, error } = await supabase
    .from('transfer_failures')
    .select('*')
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TransferFailureRow[]).map(mapTransferFailure);
}

// ================================================================
// === Escrow Accounts
// ================================================================

export async function getMyEscrowsAsBuyer(
  walletId: string,
  status?: EscrowStatus
): Promise<EscrowAccount[]> {
  let q = supabase
    .from('escrow_accounts')
    .select('*')
    .eq('buyer_wallet_id', walletId)
    .is('deleted_at', null);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowAccountRow[]).map(mapEscrow);
}

export async function getMyEscrowsAsSeller(
  walletId: string,
  status?: EscrowStatus
): Promise<EscrowAccount[]> {
  let q = supabase
    .from('escrow_accounts')
    .select('*')
    .eq('seller_wallet_id', walletId)
    .is('deleted_at', null);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowAccountRow[]).map(mapEscrow);
}

export async function getEscrowById(
  escrowId: string
): Promise<EscrowAccount | null> {
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .eq('id', escrowId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEscrow(data as EscrowAccountRow) : null;
}

export async function getEscrowByReference(
  referenceType: string,
  referenceId: string
): Promise<EscrowAccount | null> {
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEscrow(data as EscrowAccountRow) : null;
}

// ================================================================
// === Escrow Transactions
// ================================================================

export async function getEscrowTransactions(
  escrowId: string
): Promise<EscrowTransaction[]> {
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as EscrowTransactionRow[]).map(mapEscrowTransaction);
}

// ================================================================
// === Escrow Disputes
// ================================================================

export async function getEscrowDisputes(
  escrowId: string
): Promise<EscrowDispute[]> {
  const { data, error } = await supabase
    .from('escrow_disputes')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowDisputeRow[]).map(mapEscrowDispute);
}

export async function getMyRaisedDisputes(): Promise<EscrowDispute[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('escrow_disputes')
    .select('*')
    .eq('raised_by', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowDisputeRow[]).map(mapEscrowDispute);
}

// ================================================================
// === Escrow Release History
// ================================================================

export async function getEscrowReleaseHistory(
  escrowId: string
): Promise<EscrowReleaseHistory[]> {
  const { data, error } = await supabase
    .from('escrow_release_history')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EscrowReleaseHistoryRow[]).map(mapReleaseHistory);
}

// ================================================================
// === Escrow Events & Logs
// ================================================================

export async function getEscrowEvents(
  escrowId: string
): Promise<EscrowEvent[]> {
  const { data, error } = await supabase
    .from('escrow_events')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as EscrowEventRow[]).map(mapEscrowEvent);
}

export async function getEscrowLogs(escrowId: string): Promise<EscrowLog[]> {
  const { data, error } = await supabase
    .from('escrow_logs')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as EscrowLogRow[]).map(mapEscrowLog);
}

// ================================================================
// === Transfer Retry Queue (read-only — scheduler manages writes)
// ================================================================

export async function getTransferRetryQueue(
  transferId: string
): Promise<TransferRetryQueueEntry[]> {
  const { data, error } = await supabase
    .from('transfer_retry_queue')
    .select('*')
    .eq('transfer_id', transferId)
    .order('next_retry_at', { ascending: true });
  if (error) throw error;
  return (data as TransferRetryQueueRow[]).map(mapRetryQueueEntry);
}
