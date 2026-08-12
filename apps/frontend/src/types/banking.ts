import type { RiskLevel } from './wallet';

export const BANK_ACCOUNT_STATUSES = [
  'pending',
  'micro_deposit_sent',
  'verified',
  'failed',
  'expired',
] as const;

export type BankAccountStatus = typeof BANK_ACCOUNT_STATUSES[number];

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover'] as const;

export type CardBrand = typeof CARD_BRANDS[number];

export const VIRTUAL_CARD_STATUSES = [
  'active',
  'inactive',
  'frozen',
  'blocked',
  'expired',
  'cancelled',
  'pending_activation',
] as const;

export type VirtualCardStatus = typeof VIRTUAL_CARD_STATUSES[number];

export const CARD_TRANSACTION_STATUSES = [
  'pending',
  'approved',
  'declined',
  'reversed',
  'settled',
  'refunded',
] as const;

export type CardTransactionStatus = typeof CARD_TRANSACTION_STATUSES[number];

// ---- Entity interfaces ----

// account_token excluded — privileged server-side operation only
export interface BankAccount {
  id: string;
  walletId: string;
  countryId: string | null;
  currencyId: string | null;
  bankName: string;
  branchCode: string | null;
  bankCode: string | null;
  accountHolderName: string;
  accountNumberMasked: string;
  accountType: string;
  routingNumber: string | null;
  swiftBic: string | null;
  iban: string | null;
  currencyCode: string;
  status: BankAccountStatus;
  isVerified: boolean;
  isDefault: boolean;
  externalReference: string | null;
  metadata: Record<string, unknown>;
  verifiedAt: string | null;
  verifiedBy: string | null;
  failureReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// micro_deposits excluded — server-side verification only
export interface BankAccountVerification {
  id: string;
  bankAccountId: string;
  status: BankAccountStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// cvv_hash excluded — never leaves the server
export interface VirtualCard {
  id: string;
  walletId: string;
  currencyId: string | null;
  countryId: string | null;
  cardBrand: CardBrand;
  cardholderName: string;
  cardNumberMasked: string;
  providerCardId: string | null;
  expiryMonth: number;
  expiryYear: number;
  lastFour: string;
  network: string;
  processor: string;
  billingAddress: Record<string, unknown>;
  status: VirtualCardStatus;
  externalReference: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface VirtualCardControls {
  id: string;
  virtualCardId: string;
  allowAtm: boolean;
  allowOnline: boolean;
  allowInternational: boolean;
  allowContactless: boolean;
  allowCashAdvance: boolean;
  allowGambling: boolean;
  allowCrypto: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VirtualCardLimits {
  id: string;
  virtualCardId: string;
  perTransactionLimit: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  yearlyLimit: number;
  atmLimit: number;
  internationalLimit: number;
  onlineLimit: number;
  contactlessLimit: number;
  updatedAt: string;
}

export interface VirtualCardTransaction {
  id: string;
  virtualCardId: string;
  walletTransactionId: string | null;
  amount: number;
  feeAmount: number;
  exchangeRate: number;
  currencyCode: string;
  merchantName: string;
  merchantCategory: string | null;
  merchantId: string | null;
  merchantCity: string | null;
  merchantCountry: string | null;
  authorizationCode: string | null;
  referenceId: string | null;
  status: CardTransactionStatus;
  fraudScore: number;
  amlScore: number;
  riskLevel: RiskLevel;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CardAuthorization {
  id: string;
  virtualCardId: string;
  amount: number;
  currencyCode: string;
  merchantName: string | null;
  status: string;
  createdAt: string;
}

export interface CardSettlement {
  id: string;
  virtualCardId: string;
  amount: number;
  clearingDate: string | null;
  createdAt: string;
}

export interface CardDispute {
  id: string;
  virtualCardId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface CardChargeback {
  id: string;
  cardTransactionId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface CardReplacement {
  id: string;
  virtualCardId: string;
  reason: string;
  newCardId: string | null;
  createdAt: string;
}

export interface CardPinChange {
  id: string;
  virtualCardId: string;
  status: string;
  createdAt: string;
}

export interface CardToken {
  id: string;
  virtualCardId: string;
  deviceType: string | null;
  tokenReference: string;
  status: string;
  createdAt: string;
}

export interface CardLimitsHistory {
  id: string;
  virtualCardId: string;
  oldLimits: Record<string, unknown>;
  newLimits: Record<string, unknown>;
  changedBy: string | null;
  createdAt: string;
}

export interface CardEvent {
  id: string;
  virtualCardId: string;
  eventName: string;
  details: Record<string, unknown>;
  createdAt: string;
}

// PCI card token vault — wallet-scoped stored payment methods.
// token_hash excluded — used server-side only for payment processing.
export interface SavedPaymentCard {
  id: string;
  walletId: string;
  cardBrand: string;
  lastFour: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}
