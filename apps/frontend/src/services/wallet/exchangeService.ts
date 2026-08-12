import { supabase } from '../../lib/supabase';
import type {
  ExchangeProvider,
  ExchangeRate,
  ExchangeQuote,
  CurrencyExchange,
  ExchangeHistory,
  ExchangeLimit,
  ExchangePair,
  ExchangeSpread,
  ExchangeStatus,
} from '../../types/exchange';

// Security: api_key is never selected from exchange_providers.
// provider_response is never selected from exchange_rates (large external API blob).
// exchange_provider_logs and exchange_webhooks are server-side only — not exposed here.
// Currency exchange execute operations must go through backend/Edge Functions (ACID).

const EXCHANGE_PROVIDER_COLS =
  'id, name, priority, is_active, created_by, updated_by, created_at, updated_at, deleted_at';

const EXCHANGE_RATE_COLS =
  'id, provider_id, base_currency_id, target_currency_id, base_currency, target_currency, currency_pair, rate, source_type, provider, provider_reference, metadata, effective_at, expires_at, created_at, updated_at';

// ---- Row types (snake_case) ----

type ExchangeProviderRow = {
  id: string;
  name: string;
  priority: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ExchangeRateRow = {
  id: string;
  provider_id: string | null;
  base_currency_id: string | null;
  target_currency_id: string | null;
  base_currency: string;
  target_currency: string;
  currency_pair: string;
  rate: number;
  source_type: string;
  provider: string;
  provider_reference: string | null;
  metadata: Record<string, unknown>;
  effective_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type ExchangeQuoteRow = {
  id: string;
  wallet_id: string;
  from_currency_id: string | null;
  to_currency_id: string | null;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  status: string;
  expires_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type CurrencyExchangeRow = {
  id: string;
  wallet_id: string;
  wallet_transaction_id: string | null;
  quote_id: string | null;
  from_currency_id: string | null;
  to_currency_id: string | null;
  from_currency: string;
  to_currency: string;
  currency_pair: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fee_amount: number;
  spread_amount: number;
  platform_fee: number;
  provider_fee: number;
  tax_amount: number;
  exchange_reference: string | null;
  external_reference: string | null;
  idempotency_key: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ExchangeHistoryRow = {
  id: string;
  exchange_id: string;
  old_status: string | null;
  new_status: string;
  status_message: string;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

type ExchangeLimitRow = {
  id: string;
  currency_pair: string;
  min_amount: number;
  max_amount: number;
  daily_limit: number;
  updated_at: string;
};

type ExchangePairRow = {
  id: string;
  base_currency: string;
  target_currency: string;
  currency_pair: string;
  is_active: boolean;
  created_at: string;
};

type ExchangeSpreadRow = {
  id: string;
  currency_pair: string;
  spread_percentage: number;
  updated_at: string;
};

// ---- Mappers ----

function mapProvider(r: ExchangeProviderRow): ExchangeProvider {
  return {
    id: r.id,
    name: r.name,
    priority: r.priority,
    isActive: r.is_active,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapRate(r: ExchangeRateRow): ExchangeRate {
  return {
    id: r.id,
    providerId: r.provider_id,
    baseCurrencyId: r.base_currency_id,
    targetCurrencyId: r.target_currency_id,
    baseCurrency: r.base_currency,
    targetCurrency: r.target_currency,
    currencyPair: r.currency_pair,
    rate: r.rate,
    sourceType: r.source_type as ExchangeRate['sourceType'],
    provider: r.provider,
    providerReference: r.provider_reference,
    metadata: r.metadata,
    effectiveAt: r.effective_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapQuote(r: ExchangeQuoteRow): ExchangeQuote {
  return {
    id: r.id,
    walletId: r.wallet_id,
    fromCurrencyId: r.from_currency_id,
    toCurrencyId: r.to_currency_id,
    fromCurrency: r.from_currency,
    toCurrency: r.to_currency,
    fromAmount: r.from_amount,
    toAmount: r.to_amount,
    exchangeRate: r.exchange_rate,
    status: r.status,
    expiresAt: r.expires_at,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapExchange(r: CurrencyExchangeRow): CurrencyExchange {
  return {
    id: r.id,
    walletId: r.wallet_id,
    walletTransactionId: r.wallet_transaction_id,
    quoteId: r.quote_id,
    fromCurrencyId: r.from_currency_id,
    toCurrencyId: r.to_currency_id,
    fromCurrency: r.from_currency,
    toCurrency: r.to_currency,
    currencyPair: r.currency_pair,
    fromAmount: r.from_amount,
    toAmount: r.to_amount,
    exchangeRate: r.exchange_rate,
    feeAmount: r.fee_amount,
    spreadAmount: r.spread_amount,
    platformFee: r.platform_fee,
    providerFee: r.provider_fee,
    taxAmount: r.tax_amount,
    exchangeReference: r.exchange_reference,
    externalReference: r.external_reference,
    idempotencyKey: r.idempotency_key,
    status: r.status as ExchangeStatus,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapHistory(r: ExchangeHistoryRow): ExchangeHistory {
  return {
    id: r.id,
    exchangeId: r.exchange_id,
    oldStatus: r.old_status as ExchangeHistory['oldStatus'],
    newStatus: r.new_status as ExchangeHistory['newStatus'],
    statusMessage: r.status_message,
    payload: r.payload,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function mapLimit(r: ExchangeLimitRow): ExchangeLimit {
  return {
    id: r.id,
    currencyPair: r.currency_pair,
    minAmount: r.min_amount,
    maxAmount: r.max_amount,
    dailyLimit: r.daily_limit,
    updatedAt: r.updated_at,
  };
}

function mapPair(r: ExchangePairRow): ExchangePair {
  return {
    id: r.id,
    baseCurrency: r.base_currency,
    targetCurrency: r.target_currency,
    currencyPair: r.currency_pair,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapSpread(r: ExchangeSpreadRow): ExchangeSpread {
  return {
    id: r.id,
    currencyPair: r.currency_pair,
    spreadPercentage: r.spread_percentage,
    updatedAt: r.updated_at,
  };
}

// ================================================================
// === Exchange Providers
// ================================================================

export async function getExchangeProviders(): Promise<ExchangeProvider[]> {
  const { data, error } = await supabase
    .from('exchange_providers')
    .select(EXCHANGE_PROVIDER_COLS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data as ExchangeProviderRow[]).map(mapProvider);
}

// ================================================================
// === Exchange Rates
// ================================================================

export async function getCurrentRate(
  baseCurrency: string,
  targetCurrency: string
): Promise<ExchangeRate | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('exchange_rates')
    .select(EXCHANGE_RATE_COLS)
    .eq('base_currency', baseCurrency.toUpperCase())
    .eq('target_currency', targetCurrency.toUpperCase())
    .lte('effective_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRate(data as ExchangeRateRow) : null;
}

export async function getExchangeRates(
  baseCurrency?: string
): Promise<ExchangeRate[]> {
  let q = supabase
    .from('exchange_rates')
    .select(EXCHANGE_RATE_COLS)
    .is('deleted_at', null);

  if (baseCurrency) q = q.eq('base_currency', baseCurrency.toUpperCase());

  const { data, error } = await q.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as ExchangeRateRow[]).map(mapRate);
}

// ================================================================
// === Exchange Quotes
// ================================================================

export async function getMyExchangeQuotes(
  walletId: string
): Promise<ExchangeQuote[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('exchange_quotes')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('status', 'active')
    .gt('expires_at', now)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ExchangeQuoteRow[]).map(mapQuote);
}

export async function getExchangeQuoteById(
  quoteId: string
): Promise<ExchangeQuote | null> {
  const { data, error } = await supabase
    .from('exchange_quotes')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapQuote(data as ExchangeQuoteRow) : null;
}

// ================================================================
// === Currency Exchange Orders
// ================================================================

type GetExchangesOptions = {
  status?: ExchangeStatus;
  fromCurrency?: string;
  toCurrency?: string;
  limit?: number;
};

export async function getMyExchanges(
  walletId: string,
  options: GetExchangesOptions = {}
): Promise<CurrencyExchange[]> {
  let q = supabase
    .from('currency_exchange')
    .select('*')
    .eq('wallet_id', walletId)
    .is('deleted_at', null);

  if (options.status) q = q.eq('status', options.status);
  if (options.fromCurrency) q = q.eq('from_currency', options.fromCurrency.toUpperCase());
  if (options.toCurrency) q = q.eq('to_currency', options.toCurrency.toUpperCase());

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CurrencyExchangeRow[]).map(mapExchange);
}

export async function getExchangeById(
  exchangeId: string
): Promise<CurrencyExchange | null> {
  const { data, error } = await supabase
    .from('currency_exchange')
    .select('*')
    .eq('id', exchangeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapExchange(data as CurrencyExchangeRow) : null;
}

export async function getExchangeByIdempotencyKey(
  idempotencyKey: string
): Promise<CurrencyExchange | null> {
  const { data, error } = await supabase
    .from('currency_exchange')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  if (error) throw error;
  return data ? mapExchange(data as CurrencyExchangeRow) : null;
}

// ================================================================
// === Exchange History
// ================================================================

export async function getExchangeHistory(
  exchangeId: string
): Promise<ExchangeHistory[]> {
  const { data, error } = await supabase
    .from('exchange_history')
    .select('*')
    .eq('exchange_id', exchangeId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ExchangeHistoryRow[]).map(mapHistory);
}

// ================================================================
// === Exchange Config (Limits, Pairs, Spreads)
// ================================================================

export async function getExchangeLimits(
  currencyPair?: string
): Promise<ExchangeLimit[]> {
  let q = supabase.from('exchange_limits').select('*');
  if (currencyPair) q = q.eq('currency_pair', currencyPair.toUpperCase());
  const { data, error } = await q;
  if (error) throw error;
  return (data as ExchangeLimitRow[]).map(mapLimit);
}

export async function getActivePairs(): Promise<ExchangePair[]> {
  const { data, error } = await supabase
    .from('exchange_pairs')
    .select('*')
    .eq('is_active', true)
    .order('currency_pair', { ascending: true });
  if (error) throw error;
  return (data as ExchangePairRow[]).map(mapPair);
}

export async function getExchangeSpreads(): Promise<ExchangeSpread[]> {
  const { data, error } = await supabase
    .from('exchange_spreads')
    .select('*')
    .order('currency_pair', { ascending: true });
  if (error) throw error;
  return (data as ExchangeSpreadRow[]).map(mapSpread);
}

export async function getSpreadForPair(
  currencyPair: string
): Promise<ExchangeSpread | null> {
  const { data, error } = await supabase
    .from('exchange_spreads')
    .select('*')
    .eq('currency_pair', currencyPair.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapSpread(data as ExchangeSpreadRow) : null;
}
