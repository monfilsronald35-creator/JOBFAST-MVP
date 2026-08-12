import { supabase } from '../../lib/supabase';
import type { RiskLevel } from '../../types/wallet';
import type {
  BankAccount,
  BankAccountVerification,
  BankAccountStatus,
  VirtualCard,
  VirtualCardControls,
  VirtualCardLimits,
  VirtualCardTransaction,
  VirtualCardStatus,
  CardTransactionStatus,
  CardBrand,
  CardAuthorization,
  CardSettlement,
  CardDispute,
  CardChargeback,
  CardReplacement,
  CardPinChange,
  CardToken,
  CardLimitsHistory,
  CardEvent,
  SavedPaymentCard,
} from '../../types/banking';

// Security: account_token, cvv_hash, and micro_deposits are never selected.
// All card/bank write operations (add, verify, freeze, update limits) must
// go through the backend/Edge Functions.

// Explicit columns exclude sensitive fields
const BANK_ACCOUNT_COLS =
  'id, wallet_id, country_id, currency_id, bank_name, branch_code, bank_code, account_holder_name, account_number_masked, account_type, routing_number, swift_bic, iban, currency_code, status, is_verified, is_default, external_reference, metadata, verified_at, verified_by, failure_reason, created_by, updated_by, created_at, updated_at, deleted_at';

const BANK_VERIFICATION_COLS =
  'id, bank_account_id, status, created_by, updated_by, created_at, updated_at';

const VIRTUAL_CARD_COLS =
  'id, wallet_id, currency_id, country_id, card_brand, cardholder_name, card_number_masked, provider_card_id, expiry_month, expiry_year, last_four, network, processor, billing_address, status, external_reference, metadata, created_by, updated_by, created_at, updated_at, deleted_at';

// ---- Row types (snake_case, matching explicit selects) ----

type BankAccountRow = {
  id: string;
  wallet_id: string;
  country_id: string | null;
  currency_id: string | null;
  bank_name: string;
  branch_code: string | null;
  bank_code: string | null;
  account_holder_name: string;
  account_number_masked: string;
  account_type: string;
  routing_number: string | null;
  swift_bic: string | null;
  iban: string | null;
  currency_code: string;
  status: string;
  is_verified: boolean;
  is_default: boolean;
  external_reference: string | null;
  metadata: Record<string, unknown>;
  verified_at: string | null;
  verified_by: string | null;
  failure_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type BankVerificationRow = {
  id: string;
  bank_account_id: string;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type VirtualCardRow = {
  id: string;
  wallet_id: string;
  currency_id: string | null;
  country_id: string | null;
  card_brand: string;
  cardholder_name: string;
  card_number_masked: string;
  provider_card_id: string | null;
  expiry_month: number;
  expiry_year: number;
  last_four: string;
  network: string;
  processor: string;
  billing_address: Record<string, unknown>;
  status: string;
  external_reference: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type VirtualCardControlsRow = {
  id: string;
  virtual_card_id: string;
  allow_atm: boolean;
  allow_online: boolean;
  allow_international: boolean;
  allow_contactless: boolean;
  allow_cash_advance: boolean;
  allow_gambling: boolean;
  allow_crypto: boolean;
  created_at: string;
  updated_at: string;
};

type VirtualCardLimitsRow = {
  id: string;
  virtual_card_id: string;
  per_transaction_limit: number;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  yearly_limit: number;
  atm_limit: number;
  international_limit: number;
  online_limit: number;
  contactless_limit: number;
  updated_at: string;
};

type VirtualCardTransactionRow = {
  id: string;
  virtual_card_id: string;
  wallet_transaction_id: string | null;
  amount: number;
  fee_amount: number;
  exchange_rate: number;
  currency_code: string;
  merchant_name: string;
  merchant_category: string | null;
  merchant_id: string | null;
  merchant_city: string | null;
  merchant_country: string | null;
  authorization_code: string | null;
  reference_id: string | null;
  status: string;
  fraud_score: number;
  aml_score: number;
  risk_level: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type CardAuthorizationRow = {
  id: string;
  virtual_card_id: string;
  amount: number;
  currency_code: string;
  merchant_name: string | null;
  status: string;
  created_at: string;
};

type CardSettlementRow = {
  id: string;
  virtual_card_id: string;
  amount: number;
  clearing_date: string | null;
  created_at: string;
};

type CardDisputeRow = {
  id: string;
  virtual_card_id: string;
  reason: string;
  status: string;
  created_at: string;
};

type CardChargebackRow = {
  id: string;
  card_transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
};

type CardReplacementRow = {
  id: string;
  virtual_card_id: string;
  reason: string;
  new_card_id: string | null;
  created_at: string;
};

type CardPinChangeRow = {
  id: string;
  virtual_card_id: string;
  status: string;
  created_at: string;
};

type CardTokenRow = {
  id: string;
  virtual_card_id: string;
  device_type: string | null;
  token_reference: string;
  status: string;
  created_at: string;
};

type CardLimitsHistoryRow = {
  id: string;
  virtual_card_id: string;
  old_limits: Record<string, unknown>;
  new_limits: Record<string, unknown>;
  changed_by: string | null;
  created_at: string;
};

type CardEventRow = {
  id: string;
  virtual_card_id: string;
  event_name: string;
  details: Record<string, unknown>;
  created_at: string;
};

// ---- Mappers ----

function mapBankAccount(r: BankAccountRow): BankAccount {
  return {
    id: r.id,
    walletId: r.wallet_id,
    countryId: r.country_id,
    currencyId: r.currency_id,
    bankName: r.bank_name,
    branchCode: r.branch_code,
    bankCode: r.bank_code,
    accountHolderName: r.account_holder_name,
    accountNumberMasked: r.account_number_masked,
    accountType: r.account_type,
    routingNumber: r.routing_number,
    swiftBic: r.swift_bic,
    iban: r.iban,
    currencyCode: r.currency_code,
    status: r.status as BankAccountStatus,
    isVerified: r.is_verified,
    isDefault: r.is_default,
    externalReference: r.external_reference,
    metadata: r.metadata,
    verifiedAt: r.verified_at,
    verifiedBy: r.verified_by,
    failureReason: r.failure_reason,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapBankVerification(r: BankVerificationRow): BankAccountVerification {
  return {
    id: r.id,
    bankAccountId: r.bank_account_id,
    status: r.status as BankAccountStatus,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapVirtualCard(r: VirtualCardRow): VirtualCard {
  return {
    id: r.id,
    walletId: r.wallet_id,
    currencyId: r.currency_id,
    countryId: r.country_id,
    cardBrand: r.card_brand as CardBrand,
    cardholderName: r.cardholder_name,
    cardNumberMasked: r.card_number_masked,
    providerCardId: r.provider_card_id,
    expiryMonth: r.expiry_month,
    expiryYear: r.expiry_year,
    lastFour: r.last_four,
    network: r.network,
    processor: r.processor,
    billingAddress: r.billing_address,
    status: r.status as VirtualCardStatus,
    externalReference: r.external_reference,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapControls(r: VirtualCardControlsRow): VirtualCardControls {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    allowAtm: r.allow_atm,
    allowOnline: r.allow_online,
    allowInternational: r.allow_international,
    allowContactless: r.allow_contactless,
    allowCashAdvance: r.allow_cash_advance,
    allowGambling: r.allow_gambling,
    allowCrypto: r.allow_crypto,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLimits(r: VirtualCardLimitsRow): VirtualCardLimits {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    perTransactionLimit: r.per_transaction_limit,
    dailyLimit: r.daily_limit,
    weeklyLimit: r.weekly_limit,
    monthlyLimit: r.monthly_limit,
    yearlyLimit: r.yearly_limit,
    atmLimit: r.atm_limit,
    internationalLimit: r.international_limit,
    onlineLimit: r.online_limit,
    contactlessLimit: r.contactless_limit,
    updatedAt: r.updated_at,
  };
}

function mapCardTransaction(r: VirtualCardTransactionRow): VirtualCardTransaction {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    walletTransactionId: r.wallet_transaction_id,
    amount: r.amount,
    feeAmount: r.fee_amount,
    exchangeRate: r.exchange_rate,
    currencyCode: r.currency_code,
    merchantName: r.merchant_name,
    merchantCategory: r.merchant_category,
    merchantId: r.merchant_id,
    merchantCity: r.merchant_city,
    merchantCountry: r.merchant_country,
    authorizationCode: r.authorization_code,
    referenceId: r.reference_id,
    status: r.status as CardTransactionStatus,
    fraudScore: r.fraud_score,
    amlScore: r.aml_score,
    riskLevel: r.risk_level as RiskLevel,
    metadata: r.metadata,
    createdAt: r.created_at,
  };
}

function mapAuthorization(r: CardAuthorizationRow): CardAuthorization {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    amount: r.amount,
    currencyCode: r.currency_code,
    merchantName: r.merchant_name,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapSettlement(r: CardSettlementRow): CardSettlement {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    amount: r.amount,
    clearingDate: r.clearing_date,
    createdAt: r.created_at,
  };
}

function mapCardDispute(r: CardDisputeRow): CardDispute {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapChargeback(r: CardChargebackRow): CardChargeback {
  return {
    id: r.id,
    cardTransactionId: r.card_transaction_id,
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapReplacement(r: CardReplacementRow): CardReplacement {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    reason: r.reason,
    newCardId: r.new_card_id,
    createdAt: r.created_at,
  };
}

function mapPinChange(r: CardPinChangeRow): CardPinChange {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapCardToken(r: CardTokenRow): CardToken {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    deviceType: r.device_type,
    tokenReference: r.token_reference,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapLimitsHistory(r: CardLimitsHistoryRow): CardLimitsHistory {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    oldLimits: r.old_limits,
    newLimits: r.new_limits,
    changedBy: r.changed_by,
    createdAt: r.created_at,
  };
}

function mapCardEvent(r: CardEventRow): CardEvent {
  return {
    id: r.id,
    virtualCardId: r.virtual_card_id,
    eventName: r.event_name,
    details: r.details,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Bank Accounts
// ================================================================

export async function getMyBankAccounts(walletId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select(BANK_ACCOUNT_COLS)
    .eq('wallet_id', walletId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as BankAccountRow[]).map(mapBankAccount);
}

export async function getDefaultBankAccount(
  walletId: string
): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select(BANK_ACCOUNT_COLS)
    .eq('wallet_id', walletId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBankAccount(data as BankAccountRow) : null;
}

export async function getBankAccountById(
  accountId: string
): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select(BANK_ACCOUNT_COLS)
    .eq('id', accountId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBankAccount(data as BankAccountRow) : null;
}

export async function getBankAccountVerification(
  bankAccountId: string
): Promise<BankAccountVerification | null> {
  const { data, error } = await supabase
    .from('bank_account_verifications')
    .select(BANK_VERIFICATION_COLS)
    .eq('bank_account_id', bankAccountId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBankVerification(data as BankVerificationRow) : null;
}

// ================================================================
// === Virtual Cards
// ================================================================

export async function getMyVirtualCards(walletId: string): Promise<VirtualCard[]> {
  const { data, error } = await supabase
    .from('virtual_cards')
    .select(VIRTUAL_CARD_COLS)
    .eq('wallet_id', walletId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as VirtualCardRow[]).map(mapVirtualCard);
}

export async function getActiveVirtualCards(walletId: string): Promise<VirtualCard[]> {
  const { data, error } = await supabase
    .from('virtual_cards')
    .select(VIRTUAL_CARD_COLS)
    .eq('wallet_id', walletId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as VirtualCardRow[]).map(mapVirtualCard);
}

export async function getVirtualCardById(
  cardId: string
): Promise<VirtualCard | null> {
  const { data, error } = await supabase
    .from('virtual_cards')
    .select(VIRTUAL_CARD_COLS)
    .eq('id', cardId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapVirtualCard(data as VirtualCardRow) : null;
}

export async function getVirtualCardControls(
  cardId: string
): Promise<VirtualCardControls | null> {
  const { data, error } = await supabase
    .from('virtual_card_controls')
    .select('*')
    .eq('virtual_card_id', cardId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapControls(data as VirtualCardControlsRow) : null;
}

export async function getVirtualCardLimits(
  cardId: string
): Promise<VirtualCardLimits | null> {
  const { data, error } = await supabase
    .from('virtual_card_limits')
    .select('*')
    .eq('virtual_card_id', cardId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLimits(data as VirtualCardLimitsRow) : null;
}

// ================================================================
// === Virtual Card Transactions
// ================================================================

type GetCardTransactionsOptions = {
  status?: CardTransactionStatus;
  currencyCode?: string;
  limit?: number;
};

export async function getVirtualCardTransactions(
  cardId: string,
  options: GetCardTransactionsOptions = {}
): Promise<VirtualCardTransaction[]> {
  let q = supabase
    .from('virtual_card_transactions')
    .select('*')
    .eq('virtual_card_id', cardId);

  if (options.status) q = q.eq('status', options.status);
  if (options.currencyCode) q = q.eq('currency_code', options.currencyCode.toUpperCase());

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as VirtualCardTransactionRow[]).map(mapCardTransaction);
}

// ================================================================
// === Card Authorizations, Settlements, Disputes & Chargebacks
// ================================================================

export async function getCardAuthorizations(
  cardId: string
): Promise<CardAuthorization[]> {
  const { data, error } = await supabase
    .from('card_authorizations')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardAuthorizationRow[]).map(mapAuthorization);
}

export async function getCardSettlements(
  cardId: string
): Promise<CardSettlement[]> {
  const { data, error } = await supabase
    .from('card_settlements')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardSettlementRow[]).map(mapSettlement);
}

export async function getCardDisputes(cardId: string): Promise<CardDispute[]> {
  const { data, error } = await supabase
    .from('card_disputes')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardDisputeRow[]).map(mapCardDispute);
}

export async function getCardChargebacks(
  transactionId: string
): Promise<CardChargeback[]> {
  const { data, error } = await supabase
    .from('card_chargebacks')
    .select('*')
    .eq('card_transaction_id', transactionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardChargebackRow[]).map(mapChargeback);
}

// ================================================================
// === Card Lifecycle (Replacements, PIN Changes)
// ================================================================

export async function getCardReplacements(
  cardId: string
): Promise<CardReplacement[]> {
  const { data, error } = await supabase
    .from('card_replacements')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardReplacementRow[]).map(mapReplacement);
}

export async function getCardPinChanges(cardId: string): Promise<CardPinChange[]> {
  const { data, error } = await supabase
    .from('card_pin_changes')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardPinChangeRow[]).map(mapPinChange);
}

// ================================================================
// === Card Tokens (Apple Pay, Google Pay)
// ================================================================

export async function getCardTokens(cardId: string): Promise<CardToken[]> {
  const { data, error } = await supabase
    .from('card_tokens')
    .select('*')
    .eq('virtual_card_id', cardId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardTokenRow[]).map(mapCardToken);
}

// ================================================================
// === Card Limits History & Events
// ================================================================

export async function getCardLimitsHistory(
  cardId: string
): Promise<CardLimitsHistory[]> {
  const { data, error } = await supabase
    .from('card_limits_history')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardLimitsHistoryRow[]).map(mapLimitsHistory);
}

export async function getCardEvents(cardId: string): Promise<CardEvent[]> {
  const { data, error } = await supabase
    .from('card_events')
    .select('*')
    .eq('virtual_card_id', cardId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CardEventRow[]).map(mapCardEvent);
}

// ================================================================
// === Saved Payment Cards (PCI Token Vault — wallet-scoped)
// ================================================================

// token_hash is intentionally excluded — server-side only
const SAVED_CARD_COLS = 'id, wallet_id, card_brand, last_four, exp_month, exp_year, is_default, created_at';

type SavedPaymentCardRow = {
  id: string;
  wallet_id: string;
  card_brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
};

function mapSavedCard(r: SavedPaymentCardRow): SavedPaymentCard {
  return {
    id: r.id,
    walletId: r.wallet_id,
    cardBrand: r.card_brand,
    lastFour: r.last_four,
    expMonth: r.exp_month,
    expYear: r.exp_year,
    isDefault: r.is_default,
    createdAt: r.created_at,
  };
}

export async function getWalletSavedCards(
  walletId: string
): Promise<SavedPaymentCard[]> {
  const { data, error } = await supabase
    .from('card_tokens')
    .select(SAVED_CARD_COLS)
    .eq('wallet_id', walletId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as SavedPaymentCardRow[]).map(mapSavedCard);
}

export async function getDefaultSavedCard(
  walletId: string
): Promise<SavedPaymentCard | null> {
  const { data, error } = await supabase
    .from('card_tokens')
    .select(SAVED_CARD_COLS)
    .eq('wallet_id', walletId)
    .eq('is_default', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSavedCard(data as SavedPaymentCardRow) : null;
}
