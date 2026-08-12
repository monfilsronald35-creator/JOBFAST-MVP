// ── Enums ──────────────────────────────────────────────────────────────────

export const LEDGER_ENTRY_TYPES = ['debit', 'credit'] as const;
export type LedgerEntryType = typeof LEDGER_ENTRY_TYPES[number];

export const PAYMENT_INTENT_STATUSES = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'succeeded',
  'cancelled',
] as const;
export type PaymentIntentStatus = typeof PAYMENT_INTENT_STATUSES[number];

export const AML_RISK_LEVELS = ['low', 'medium', 'high', 'blocked'] as const;
export type AmlRiskLevel = typeof AML_RISK_LEVELS[number];

// ── Double-Entry Ledger ────────────────────────────────────────────────────

export interface LedgerAccount {
  id: string;
  walletId: string | null;
  accountNumber: string;
  accountName: string;
  accountType: string; // asset | liability | equity | revenue | expense
  currencyCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  referenceId: string | null;
  description: string;
  status: string; // pending | posted | reversed
  postedAt: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  journalId: string;
  ledgerAccountId: string;
  amount: number;
  entryType: LedgerEntryType;
  currencyCode: string;
  createdAt: string;
}

// ── Payment Intents ────────────────────────────────────────────────────────

export interface PaymentIntent {
  id: string;
  walletId: string;
  amount: number;
  currencyCode: string;
  status: PaymentIntentStatus;
  gatewayUsed: string | null;
  clientSecret: string; // needed by frontend for payment confirmation flow
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  // config excluded — contains API keys/credentials (backend only)
}

// ── KYC & AML ─────────────────────────────────────────────────────────────

export interface WalletKycDocument {
  id: string;
  walletId: string;
  documentType: string; // passport | national_id | license | selfie | proof_of_address
  fileUrl: string;
  status: string; // pending | verified | rejected
  reviewedAt: string | null;
  createdAt: string;
}

export interface WalletAmlCheck {
  id: string;
  walletId: string;
  screeningProvider: string; // worldcheck | ofac | sanctions
  riskLevel: AmlRiskLevel;
  matchFound: boolean;
  checkedAt: string;
  // payload excluded — raw screening provider response (backend only)
}

// ── Beneficiaries ─────────────────────────────────────────────────────────

export interface WalletBeneficiary {
  id: string;
  walletId: string;
  name: string;
  accountNumber: string;
  bankName: string | null;
  swiftCode: string | null;
  countryCode: string;
  createdAt: string;
}

// ── Scheduled Payments ────────────────────────────────────────────────────

export interface WalletScheduledPayment {
  id: string;
  walletId: string;
  amount: number;
  currencyCode: string;
  frequency: string; // daily | weekly | monthly
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
}

// ── QR Payments ───────────────────────────────────────────────────────────

export interface WalletQrPayment {
  id: string;
  walletId: string;
  qrCodeData: string;
  amount: number | null;
  isUsed: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// ── Settlements ───────────────────────────────────────────────────────────

export interface WalletSettlement {
  id: string;
  walletId: string;
  amount: number;
  currencyCode: string;
  settlementCycle: string; // T+0 | T+1 | weekly
  status: string; // pending | completed | failed
  settledAt: string | null;
  createdAt: string;
}

// ── Webhooks ──────────────────────────────────────────────────────────────

export interface WalletWebhook {
  id: string;
  walletId: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

// ── Immutable Audit Trail ─────────────────────────────────────────────────

export interface ImmutableAuditLog {
  id: string;
  walletId: string | null;
  actorId: string | null;
  action: string;
  createdAt: string;
  // old_state, new_state, previous_hash, signature excluded — cryptographic chain (backend only)
}
