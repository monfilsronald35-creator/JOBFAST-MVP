import { supabase } from '../../lib/supabase';
import type {
  Wallet,
  WalletBalance,
  WalletHold,
  WalletReserve,
  WalletTransaction,
  WalletTransactionLog,
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from '../../types/wallet';

// Wallet write operations (deposit, withdrawal, transfer, payout) must go through
// the backend/Edge Functions to guarantee ACID atomicity on balance updates.
// This service provides read-only views of wallet state for the frontend.

// ---- Row types (snake_case) ----

type WalletRow = {
  id: string;
  public_id: string;
  user_id: string;
  company_id: string | null;
  country_id: string | null;
  wallet_number: string;
  wallet_type: string;
  status: string;
  risk_score: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type WalletBalanceRow = {
  id: string;
  wallet_id: string;
  currency_id: string | null;
  currency_code: string;
  currency_precision: number;
  available_balance: number;
  pending_balance: number;
  locked_balance: number;
  total_balance: number;
  updated_at: string;
};

type WalletHoldRow = {
  id: string;
  wallet_id: string;
  amount: number;
  currency_code: string;
  reason: string;
  reference_id: string | null;
  status: string;
  released_at: string | null;
  released_by: string | null;
  captured_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type WalletReserveRow = {
  id: string;
  wallet_id: string;
  reserve_amount: number;
  currency_code: string;
  percentage: number;
  release_date: string | null;
  created_at: string;
};

type WalletTransactionRow = {
  id: string;
  wallet_id: string;
  source_wallet_id: string | null;
  destination_wallet_id: string | null;
  reference_id: string | null;
  external_reference: string | null;
  idempotency_key: string | null;
  type: string;
  direction: string;
  status: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency_code: string;
  exchange_rate: number;
  balance_after: number;
  description: string | null;
  fraud_score: number;
  aml_score: number;
  velocity_score: number;
  duplicate_score: number;
  risk_level: string;
  country_code: string | null;
  ip_address: string | null;
  device_id: string | null;
  user_agent: string | null;
  geo_location: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

type WalletTransactionLogRow = {
  id: string;
  transaction_id: string;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
};

// ---- Mappers ----

function mapWallet(r: WalletRow): Wallet {
  return {
    id: r.id,
    publicId: r.public_id,
    userId: r.user_id,
    companyId: r.company_id,
    countryId: r.country_id,
    walletNumber: r.wallet_number,
    walletType: r.wallet_type as Wallet['walletType'],
    status: r.status as Wallet['status'],
    riskScore: r.risk_score,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapWalletBalance(r: WalletBalanceRow): WalletBalance {
  return {
    id: r.id,
    walletId: r.wallet_id,
    currencyId: r.currency_id,
    currencyCode: r.currency_code,
    currencyPrecision: r.currency_precision,
    availableBalance: r.available_balance,
    pendingBalance: r.pending_balance,
    lockedBalance: r.locked_balance,
    totalBalance: r.total_balance,
    updatedAt: r.updated_at,
  };
}

function mapWalletHold(r: WalletHoldRow): WalletHold {
  return {
    id: r.id,
    walletId: r.wallet_id,
    amount: r.amount,
    currencyCode: r.currency_code,
    reason: r.reason,
    referenceId: r.reference_id,
    status: r.status,
    releasedAt: r.released_at,
    releasedBy: r.released_by,
    capturedAt: r.captured_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function mapWalletReserve(r: WalletReserveRow): WalletReserve {
  return {
    id: r.id,
    walletId: r.wallet_id,
    reserveAmount: r.reserve_amount,
    currencyCode: r.currency_code,
    percentage: r.percentage,
    releaseDate: r.release_date,
    createdAt: r.created_at,
  };
}

function mapWalletTransaction(r: WalletTransactionRow): WalletTransaction {
  return {
    id: r.id,
    walletId: r.wallet_id,
    sourceWalletId: r.source_wallet_id,
    destinationWalletId: r.destination_wallet_id,
    referenceId: r.reference_id,
    externalReference: r.external_reference,
    idempotencyKey: r.idempotency_key,
    type: r.type as TransactionType,
    direction: r.direction as TransactionDirection,
    status: r.status as TransactionStatus,
    amount: r.amount,
    feeAmount: r.fee_amount,
    netAmount: r.net_amount,
    currencyCode: r.currency_code,
    exchangeRate: r.exchange_rate,
    balanceAfter: r.balance_after,
    description: r.description,
    fraudScore: r.fraud_score,
    amlScore: r.aml_score,
    velocityScore: r.velocity_score,
    duplicateScore: r.duplicate_score,
    riskLevel: r.risk_level as WalletTransaction['riskLevel'],
    countryCode: r.country_code,
    ipAddress: r.ip_address,
    deviceId: r.device_id,
    userAgent: r.user_agent,
    geoLocation: r.geo_location,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapTransactionLog(r: WalletTransactionLogRow): WalletTransactionLog {
  return {
    id: r.id,
    transactionId: r.transaction_id,
    action: r.action,
    payload: r.payload,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Wallets
// ================================================================

export async function getMyWallets(): Promise<Wallet[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as WalletRow[]).map(mapWallet);
}

export async function getMyPersonalWallet(): Promise<Wallet | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .eq('wallet_type', 'personal')
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data as WalletRow) : null;
}

export async function getWalletByPublicId(
  publicId: string
): Promise<Wallet | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('id, public_id, wallet_number, wallet_type, status, created_at, updated_at, deleted_at, risk_score, metadata, user_id, company_id, country_id, created_by, updated_by')
    .eq('public_id', publicId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data as WalletRow) : null;
}

// ================================================================
// === Wallet Balances
// ================================================================

export async function getWalletBalances(walletId: string): Promise<WalletBalance[]> {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('wallet_id', walletId)
    .order('currency_code', { ascending: true });
  if (error) throw error;
  return (data as WalletBalanceRow[]).map(mapWalletBalance);
}

export async function getWalletBalance(
  walletId: string,
  currencyCode: string
): Promise<WalletBalance | null> {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('currency_code', currencyCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapWalletBalance(data as WalletBalanceRow) : null;
}

// ================================================================
// === Wallet Holds
// ================================================================

export async function getActiveWalletHolds(walletId: string): Promise<WalletHold[]> {
  const { data, error } = await supabase
    .from('wallet_holds')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletHoldRow[]).map(mapWalletHold);
}

// ================================================================
// === Wallet Reserves
// ================================================================

export async function getWalletReserves(walletId: string): Promise<WalletReserve[]> {
  const { data, error } = await supabase
    .from('wallet_reserves')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletReserveRow[]).map(mapWalletReserve);
}

// ================================================================
// === Wallet Transactions
// ================================================================

type GetTransactionsOptions = {
  type?: TransactionType;
  status?: TransactionStatus;
  direction?: TransactionDirection;
  currencyCode?: string;
  limit?: number;
};

export async function getWalletTransactions(
  walletId: string,
  options: GetTransactionsOptions = {}
): Promise<WalletTransaction[]> {
  let q = supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId);

  if (options.type) q = q.eq('type', options.type);
  if (options.status) q = q.eq('status', options.status);
  if (options.direction) q = q.eq('direction', options.direction);
  if (options.currencyCode) q = q.eq('currency_code', options.currencyCode.toUpperCase());

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WalletTransactionRow[]).map(mapWalletTransaction);
}

export async function getWalletTransactionById(
  transactionId: string
): Promise<WalletTransaction | null> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWalletTransaction(data as WalletTransactionRow) : null;
}

export async function getWalletTransactionByIdempotencyKey(
  idempotencyKey: string
): Promise<WalletTransaction | null> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWalletTransaction(data as WalletTransactionRow) : null;
}

// ================================================================
// === Transaction Logs
// ================================================================

export async function getTransactionLogs(
  transactionId: string
): Promise<WalletTransactionLog[]> {
  const { data, error } = await supabase
    .from('wallet_transaction_logs')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as WalletTransactionLogRow[]).map(mapTransactionLog);
}
