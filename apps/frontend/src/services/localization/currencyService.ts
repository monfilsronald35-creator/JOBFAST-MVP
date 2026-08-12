import { supabase } from '../../lib/supabase';
import type {
  Currency,
  CountryCurrency,
  CurrencySymbol,
  CurrencyDecimalRule,
  CurrencyFormat,
  ExchangeRate,
  ExchangeRateHistory,
  RoundingMode,
  SymbolPosition,
} from '../../types/currency';

// ─── Row Types ────────────────────────────────────────────────────────────────

type CurrencyRow = {
  id: string;
  code: string;
  numeric_code: string | null;
  iso_name: string | null;
  entity_name: string | null;
  name: string;
  native_name: string | null;
  symbol: string | null;
  symbol_native: string | null;
  minor_unit: number;
  cash_minor_unit: number;
  decimal_digits: number;
  rounding_factor: number;
  is_crypto: boolean;
  is_fiat: boolean;
  blockchain_network: string | null;
  contract_address: string | null;
  token_standard: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  updated_device: string | null;
  created_at: string;
  updated_at: string;
};

type CountryCurrencyRow = {
  id: string;
  country_id: string;
  currency_id: string;
  is_default: boolean;
  valid_from: string;
  valid_to: string | null;
  priority: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type CurrencySymbolRow = {
  id: string;
  currency_id: string;
  symbol: string;
  symbol_native: string | null;
  unicode_symbol: string | null;
  html_entity: string | null;
  position: SymbolPosition;
  space_between: boolean;
  display_priority: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

type CurrencyDecimalRuleRow = {
  id: string;
  currency_id: string;
  country_id: string | null;
  min_amount: number;
  max_amount: number | null;
  step_increment: number;
  cash_rounding: number | null;
  tax_rounding: number | null;
  invoice_rounding: number | null;
  rounding_mode: RoundingMode;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_at: string;
  updated_at: string;
};

type CurrencyFormatRow = {
  id: string;
  currency_id: string;
  language_id: string | null;
  country_id: string | null;
  pattern: string;
  positive_pattern: string | null;
  negative_pattern: string | null;
  currency_spacing_rule: Record<string, unknown> | null;
  grouping_size: number;
  secondary_grouping_size: number;
  decimal_separator: string;
  thousands_separator: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type ExchangeRateRow = {
  id: string;
  base_currency_id: string;
  target_currency_id: string;
  rate: number;
  inverse_rate: number | null;
  provider: string;
  provider_reference: string | null;
  confidence_score: number | null;
  is_official: boolean;
  retrieved_at: string;
  expires_at: string | null;
  api_response: Record<string, unknown> | null;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  updated_device: string | null;
  created_at: string;
  updated_at: string;
};

type ExchangeRateHistoryRow = {
  id: string;
  exchange_rate_id: string | null;
  base_currency_id: string;
  target_currency_id: string;
  rate: number;
  inverse_rate: number | null;
  provider: string | null;
  valid_from: string | null;
  valid_to: string | null;
  archived_at: string;
  metadata: Record<string, unknown>;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapCurrency(row: CurrencyRow): Currency {
  return {
    id:               row.id,
    code:             row.code,
    numericCode:      row.numeric_code,
    isoName:          row.iso_name,
    entityName:       row.entity_name,
    name:             row.name,
    nativeName:       row.native_name,
    symbol:           row.symbol,
    symbolNative:     row.symbol_native,
    minorUnit:        row.minor_unit,
    cashMinorUnit:    row.cash_minor_unit,
    decimalDigits:    row.decimal_digits,
    roundingFactor:   row.rounding_factor,
    isCrypto:         row.is_crypto,
    isFiat:           row.is_fiat,
    blockchainNetwork: row.blockchain_network,
    contractAddress:  row.contract_address,
    tokenStandard:    row.token_standard,
    isActive:         row.is_active,
    isDeleted:        row.is_deleted,
    deletedAt:        row.deleted_at,
    deletedReason:    row.deleted_reason,
    version:          row.version,
    metadata:         row.metadata,
    searchVector:     row.search_vector,
    createdBy:        row.created_by,
    updatedBy:        row.updated_by,
    deletedBy:        row.deleted_by,
    createdIp:        row.created_ip,
    updatedIp:        row.updated_ip,
    createdDevice:    row.created_device,
    updatedDevice:    row.updated_device,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

function mapCountryCurrency(row: CountryCurrencyRow): CountryCurrency {
  return {
    id:            row.id,
    countryId:     row.country_id,
    currencyId:    row.currency_id,
    isDefault:     row.is_default,
    validFrom:     row.valid_from,
    validTo:       row.valid_to,
    priority:      row.priority,
    isDeleted:     row.is_deleted,
    deletedAt:     row.deleted_at,
    deletedReason: row.deleted_reason,
    version:       row.version,
    metadata:      row.metadata,
    createdBy:     row.created_by,
    updatedBy:     row.updated_by,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

function mapCurrencySymbol(row: CurrencySymbolRow): CurrencySymbol {
  return {
    id:              row.id,
    currencyId:      row.currency_id,
    symbol:          row.symbol,
    symbolNative:    row.symbol_native,
    unicodeSymbol:   row.unicode_symbol,
    htmlEntity:      row.html_entity,
    position:        row.position,
    spaceBetween:    row.space_between,
    displayPriority: row.display_priority,
    isDeleted:       row.is_deleted,
    deletedAt:       row.deleted_at,
    deletedReason:   row.deleted_reason,
    version:         row.version,
    metadata:        row.metadata,
    createdBy:       row.created_by,
    updatedBy:       row.updated_by,
    deletedBy:       row.deleted_by,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

function mapCurrencyDecimalRule(row: CurrencyDecimalRuleRow): CurrencyDecimalRule {
  return {
    id:              row.id,
    currencyId:      row.currency_id,
    countryId:       row.country_id,
    minAmount:       row.min_amount,
    maxAmount:       row.max_amount,
    stepIncrement:   row.step_increment,
    cashRounding:    row.cash_rounding,
    taxRounding:     row.tax_rounding,
    invoiceRounding: row.invoice_rounding,
    roundingMode:    row.rounding_mode,
    isDeleted:       row.is_deleted,
    deletedAt:       row.deleted_at,
    deletedReason:   row.deleted_reason,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
  };
}

function mapCurrencyFormat(row: CurrencyFormatRow): CurrencyFormat {
  return {
    id:                   row.id,
    currencyId:           row.currency_id,
    languageId:           row.language_id,
    countryId:            row.country_id,
    pattern:              row.pattern,
    positivePattern:      row.positive_pattern,
    negativePattern:      row.negative_pattern,
    currencySpacingRule:  row.currency_spacing_rule,
    groupingSize:         row.grouping_size,
    secondaryGroupingSize: row.secondary_grouping_size,
    decimalSeparator:     row.decimal_separator,
    thousandsSeparator:   row.thousands_separator,
    isDefault:            row.is_default,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

function mapExchangeRate(row: ExchangeRateRow): ExchangeRate {
  return {
    id:                row.id,
    baseCurrencyId:    row.base_currency_id,
    targetCurrencyId:  row.target_currency_id,
    rate:              row.rate,
    inverseRate:       row.inverse_rate,
    provider:          row.provider,
    providerReference: row.provider_reference,
    confidenceScore:   row.confidence_score,
    isOfficial:        row.is_official,
    retrievedAt:       row.retrieved_at,
    expiresAt:         row.expires_at,
    apiResponse:       row.api_response,
    validFrom:         row.valid_from,
    validTo:           row.valid_to,
    isActive:          row.is_active,
    isDeleted:         row.is_deleted,
    deletedAt:         row.deleted_at,
    deletedReason:     row.deleted_reason,
    version:           row.version,
    metadata:          row.metadata,
    createdBy:         row.created_by,
    updatedBy:         row.updated_by,
    deletedBy:         row.deleted_by,
    createdIp:         row.created_ip,
    updatedIp:         row.updated_ip,
    createdDevice:     row.created_device,
    updatedDevice:     row.updated_device,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

function mapExchangeRateHistory(row: ExchangeRateHistoryRow): ExchangeRateHistory {
  return {
    id:                row.id,
    exchangeRateId:    row.exchange_rate_id,
    baseCurrencyId:    row.base_currency_id,
    targetCurrencyId:  row.target_currency_id,
    rate:              row.rate,
    inverseRate:       row.inverse_rate,
    provider:          row.provider,
    validFrom:         row.valid_from,
    validTo:           row.valid_to,
    archivedAt:        row.archived_at,
    metadata:          row.metadata,
  };
}

// ─── Currencies ───────────────────────────────────────────────────────────────

export async function getCurrencies(): Promise<Currency[]> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to load currencies: ${error.message}`);
  return (data ?? []).map((row) => mapCurrency(row as CurrencyRow));
}

export async function getFiatCurrencies(): Promise<Currency[]> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_fiat', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to load fiat currencies: ${error.message}`);
  return (data ?? []).map((row) => mapCurrency(row as CurrencyRow));
}

export async function getCryptoCurrencies(): Promise<Currency[]> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_crypto', true)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to load crypto currencies: ${error.message}`);
  return (data ?? []).map((row) => mapCurrency(row as CurrencyRow));
}

export async function getCurrencyByCode(code: string): Promise<Currency | null> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load currency: ${error.message}`);
  if (!data) return null;
  return mapCurrency(data as CurrencyRow);
}

export async function searchCurrencies(query: string): Promise<Currency[]> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('code', { ascending: true });

  if (error) throw new Error(`Failed to search currencies: ${error.message}`);
  return (data ?? []).map((row) => mapCurrency(row as CurrencyRow));
}

// ─── Country Currencies ───────────────────────────────────────────────────────

export async function getCountryCurrencies(countryId: string): Promise<CountryCurrency[]> {
  const { data, error } = await supabase
    .from('country_currencies')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('priority', { ascending: false });

  if (error) throw new Error(`Failed to load country currencies: ${error.message}`);
  return (data ?? []).map((row) => mapCountryCurrency(row as CountryCurrencyRow));
}

// ─── Currency Symbols ─────────────────────────────────────────────────────────

export async function getCurrencySymbols(currencyId: string): Promise<CurrencySymbol[]> {
  const { data, error } = await supabase
    .from('currency_symbols')
    .select('*')
    .eq('currency_id', currencyId)
    .eq('is_deleted', false)
    .order('display_priority', { ascending: false });

  if (error) throw new Error(`Failed to load currency symbols: ${error.message}`);
  return (data ?? []).map((row) => mapCurrencySymbol(row as CurrencySymbolRow));
}

// ─── Currency Decimal Rules ───────────────────────────────────────────────────

export async function getCurrencyDecimalRules(currencyId: string): Promise<CurrencyDecimalRule[]> {
  const { data, error } = await supabase
    .from('currency_decimal_rules')
    .select('*')
    .eq('currency_id', currencyId)
    .eq('is_deleted', false);

  if (error) throw new Error(`Failed to load decimal rules: ${error.message}`);
  return (data ?? []).map((row) => mapCurrencyDecimalRule(row as CurrencyDecimalRuleRow));
}

// ─── Currency Formats ─────────────────────────────────────────────────────────

export async function getCurrencyFormats(currencyId: string): Promise<CurrencyFormat[]> {
  const { data, error } = await supabase
    .from('currency_formats')
    .select('*')
    .eq('currency_id', currencyId)
    .order('is_default', { ascending: false });

  if (error) throw new Error(`Failed to load currency formats: ${error.message}`);
  return (data ?? []).map((row) => mapCurrencyFormat(row as CurrencyFormatRow));
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export async function getExchangeRates(baseCurrencyId: string): Promise<ExchangeRate[]> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency_id', baseCurrencyId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('valid_from', { ascending: false });

  if (error) throw new Error(`Failed to load exchange rates: ${error.message}`);
  return (data ?? []).map((row) => mapExchangeRate(row as ExchangeRateRow));
}

export async function getExchangeRate(
  baseCurrencyId: string,
  targetCurrencyId: string
): Promise<ExchangeRate | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency_id', baseCurrencyId)
    .eq('target_currency_id', targetCurrencyId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load exchange rate: ${error.message}`);
  if (!data) return null;
  return mapExchangeRate(data as ExchangeRateRow);
}

// ─── Exchange Rate History ────────────────────────────────────────────────────

export async function getExchangeRateHistory(
  baseCurrencyId: string,
  targetCurrencyId: string,
  limit = 50
): Promise<ExchangeRateHistory[]> {
  const { data, error } = await supabase
    .from('exchange_rate_history')
    .select('*')
    .eq('base_currency_id', baseCurrencyId)
    .eq('target_currency_id', targetCurrencyId)
    .order('archived_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load exchange rate history: ${error.message}`);
  return (data ?? []).map((row) => mapExchangeRateHistory(row as ExchangeRateHistoryRow));
}
