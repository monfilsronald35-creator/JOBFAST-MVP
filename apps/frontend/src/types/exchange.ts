export const EXCHANGE_STATUSES = [
  'quoted',
  'locked',
  'processing',
  'completed',
  'expired',
  'failed',
  'cancelled',
] as const;

export type ExchangeStatus = typeof EXCHANGE_STATUSES[number];

export const RATE_SOURCE_TYPES = ['manual', 'api', 'market', 'crypto'] as const;

export type RateSourceType = typeof RATE_SOURCE_TYPES[number];

// ---- Entity interfaces ----

// api_key excluded — server-side privileged operation only
export interface ExchangeProvider {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// provider_response excluded — large JSONB blob from external APIs
export interface ExchangeRate {
  id: string;
  providerId: string | null;
  baseCurrencyId: string | null;
  targetCurrencyId: string | null;
  baseCurrency: string;
  targetCurrency: string;
  currencyPair: string;
  rate: number;
  sourceType: RateSourceType;
  provider: string;
  providerReference: string | null;
  metadata: Record<string, unknown>;
  effectiveAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeQuote {
  id: string;
  walletId: string;
  fromCurrencyId: string | null;
  toCurrencyId: string | null;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  status: string;
  expiresAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CurrencyExchange {
  id: string;
  walletId: string;
  walletTransactionId: string | null;
  quoteId: string | null;
  fromCurrencyId: string | null;
  toCurrencyId: string | null;
  fromCurrency: string;
  toCurrency: string;
  currencyPair: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  feeAmount: number;
  spreadAmount: number;
  platformFee: number;
  providerFee: number;
  taxAmount: number;
  exchangeReference: string | null;
  externalReference: string | null;
  idempotencyKey: string | null;
  status: ExchangeStatus;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExchangeHistory {
  id: string;
  exchangeId: string;
  oldStatus: ExchangeStatus | null;
  newStatus: ExchangeStatus;
  statusMessage: string;
  payload: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface ExchangeLimit {
  id: string;
  currencyPair: string;
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  updatedAt: string;
}

export interface ExchangePair {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  currencyPair: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExchangeSpread {
  id: string;
  currencyPair: string;
  spreadPercentage: number;
  updatedAt: string;
}
