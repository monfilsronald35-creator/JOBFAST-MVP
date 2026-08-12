export const INVOICE_STATUSES = [
  'draft',
  'pending',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'void',
] as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const REFUND_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'rejected',
] as const;

export type RefundStatus = typeof REFUND_STATUSES[number];

export const CHARGEBACK_STATUSES = [
  'open',
  'under_review',
  'won',
  'lost',
  'accepted',
] as const;

export type ChargebackStatus = typeof CHARGEBACK_STATUSES[number];

export const PAYOUT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
] as const;

export type PayoutStatus = typeof PAYOUT_STATUSES[number];

// ---- Entity interfaces ----

export interface Invoice {
  id: string;
  walletId: string;
  currencyId: string | null;
  customerId: string | null;
  companyId: string | null;
  walletTransactionId: string | null;
  invoiceNumber: string;
  invoiceType: string;
  referenceId: string | null;
  externalReference: string | null;
  customerName: string;
  customerEmail: string | null;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currencyCode: string;
  status: InvoiceStatus;
  pdfUrl: string | null;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  total: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  walletTransactionId: string | null;
  amount: number;
  createdAt: string;
}

export interface TaxRecord {
  id: string;
  countryId: string | null;
  currencyId: string | null;
  taxName: string;
  taxCode: string;
  taxAuthorityId: string | null;
  percentage: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Fee {
  id: string;
  countryId: string | null;
  currencyId: string | null;
  transactionType: string;
  provider: string | null;
  walletType: string | null;
  feePercentage: number;
  fixedFee: number;
  minFee: number;
  maxFee: number | null;
  minimumAmount: number;
  maximumAmount: number | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WalletLimits {
  id: string;
  walletId: string;
  depositLimit: number;
  withdrawalLimit: number;
  transferLimit: number;
  exchangeLimit: number;
  paymentLimit: number;
  payoutLimit: number;
  cryptoLimit: number;
  cardLimit: number;
  periodType: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WalletLimitHistory {
  id: string;
  walletId: string;
  changedBy: string | null;
  limitType: string;
  oldValue: number;
  newValue: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  changedAt: string;
}

export interface WalletLimitUsage {
  id: string;
  walletId: string;
  limitType: string;
  currentUsage: number;
  resetAt: string | null;
  createdAt: string;
}

export interface WalletLimitException {
  id: string;
  walletId: string;
  limitType: string;
  extendedLimit: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface WalletRefund {
  id: string;
  transactionId: string;
  walletTransactionId: string | null;
  processedBy: string | null;
  refundReference: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WalletChargeback {
  id: string;
  transactionId: string;
  chargebackCode: string;
  providerReference: string | null;
  amount: number;
  reason: string;
  resolution: string | null;
  status: ChargebackStatus;
  evidence: Record<string, unknown>;
  openedAt: string;
  closedAt: string | null;
  resolvedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ChargebackEvidence {
  id: string;
  chargebackId: string;
  fileUrl: string;
  fileType: string | null;
  createdAt: string;
}

export interface PayoutBatch {
  id: string;
  provider: string;
  providerBatchId: string | null;
  totalAmount: number;
  currencyCode: string;
  status: PayoutStatus;
  processedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WalletPayout {
  id: string;
  batchId: string | null;
  walletId: string;
  bankAccountId: string | null;
  walletTransactionId: string | null;
  providerReference: string | null;
  externalReference: string | null;
  amount: number;
  netAmount: number;
  feeAmount: number;
  exchangeRate: number;
  currencyCode: string;
  status: PayoutStatus;
  processedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PayoutEvent {
  id: string;
  payoutId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
