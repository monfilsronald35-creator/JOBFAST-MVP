export const WALLET_STATUSES = [
  'active',
  'suspended',
  'frozen',
  'closed',
  'pending_kyc',
] as const;

export type WalletStatus = typeof WALLET_STATUSES[number];

export const WALLET_TYPES = [
  'personal',
  'business',
  'merchant',
  'escrow',
  'system',
] as const;

export type WalletType = typeof WALLET_TYPES[number];

export const TRANSACTION_TYPES = [
  'deposit',
  'withdrawal',
  'transfer',
  'payment',
  'refund',
  'chargeback',
  'payout',
  'fee',
  'adjustment',
] as const;

export type TransactionType = typeof TRANSACTION_TYPES[number];

export const TRANSACTION_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'reversed',
] as const;

export type TransactionStatus = typeof TRANSACTION_STATUSES[number];

export const TRANSACTION_DIRECTIONS = ['credit', 'debit'] as const;

export type TransactionDirection = typeof TRANSACTION_DIRECTIONS[number];

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export type RiskLevel = typeof RISK_LEVELS[number];

// ---- Entity interfaces ----

export interface Wallet {
  id: string;
  publicId: string;
  userId: string;
  companyId: string | null;
  countryId: string | null;
  walletNumber: string;
  walletType: WalletType;
  status: WalletStatus;
  riskScore: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WalletBalance {
  id: string;
  walletId: string;
  currencyId: string | null;
  currencyCode: string;
  currencyPrecision: number;
  availableBalance: number;
  pendingBalance: number;
  lockedBalance: number;
  totalBalance: number;
  updatedAt: string;
}

export interface WalletHold {
  id: string;
  walletId: string;
  amount: number;
  currencyCode: string;
  reason: string;
  referenceId: string | null;
  status: string;
  releasedAt: string | null;
  releasedBy: string | null;
  capturedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface WalletReserve {
  id: string;
  walletId: string;
  reserveAmount: number;
  currencyCode: string;
  percentage: number;
  releaseDate: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  sourceWalletId: string | null;
  destinationWalletId: string | null;
  referenceId: string | null;
  externalReference: string | null;
  idempotencyKey: string | null;
  type: TransactionType;
  direction: TransactionDirection;
  status: TransactionStatus;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currencyCode: string;
  exchangeRate: number;
  balanceAfter: number;
  description: string | null;
  fraudScore: number;
  amlScore: number;
  velocityScore: number;
  duplicateScore: number;
  riskLevel: RiskLevel;
  countryCode: string | null;
  ipAddress: string | null;
  deviceId: string | null;
  userAgent: string | null;
  geoLocation: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WalletTransactionLog {
  id: string;
  transactionId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
