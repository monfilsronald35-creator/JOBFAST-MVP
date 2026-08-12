export const ROUNDING_MODES = [
  'half_up',
  'half_down',
  'half_even',
  'ceiling',
  'floor',
] as const;

export type RoundingMode = typeof ROUNDING_MODES[number];

export const SYMBOL_POSITIONS = ['before', 'after'] as const;

export type SymbolPosition = typeof SYMBOL_POSITIONS[number];

export interface Currency {
  id: string;
  code: string;
  numericCode: string | null;
  isoName: string | null;
  entityName: string | null;
  name: string;
  nativeName: string | null;
  symbol: string | null;
  symbolNative: string | null;
  minorUnit: number;
  cashMinorUnit: number;
  decimalDigits: number;
  roundingFactor: number;
  isCrypto: boolean;
  isFiat: boolean;
  blockchainNetwork: string | null;
  contractAddress: string | null;
  tokenStandard: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  searchVector: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  updatedDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryCurrency {
  id: string;
  countryId: string;
  currencyId: string;
  isDefault: boolean;
  validFrom: string;
  validTo: string | null;
  priority: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencySymbol {
  id: string;
  currencyId: string;
  symbol: string;
  symbolNative: string | null;
  unicodeSymbol: string | null;
  htmlEntity: string | null;
  position: SymbolPosition;
  spaceBetween: boolean;
  displayPriority: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyDecimalRule {
  id: string;
  currencyId: string;
  countryId: string | null;
  minAmount: number;
  maxAmount: number | null;
  stepIncrement: number;
  cashRounding: number | null;
  taxRounding: number | null;
  invoiceRounding: number | null;
  roundingMode: RoundingMode;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyFormat {
  id: string;
  currencyId: string;
  languageId: string | null;
  countryId: string | null;
  pattern: string;
  positivePattern: string | null;
  negativePattern: string | null;
  currencySpacingRule: Record<string, unknown> | null;
  groupingSize: number;
  secondaryGroupingSize: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrencyId: string;
  targetCurrencyId: string;
  rate: number;
  inverseRate: number | null;
  provider: string;
  providerReference: string | null;
  confidenceScore: number | null;
  isOfficial: boolean;
  retrievedAt: string;
  expiresAt: string | null;
  apiResponse: Record<string, unknown> | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  updatedDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateHistory {
  id: string;
  exchangeRateId: string | null;
  baseCurrencyId: string;
  targetCurrencyId: string;
  rate: number;
  inverseRate: number | null;
  provider: string | null;
  validFrom: string | null;
  validTo: string | null;
  archivedAt: string;
  metadata: Record<string, unknown>;
}
