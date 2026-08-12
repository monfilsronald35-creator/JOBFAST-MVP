// ── Enterprise Financial & Partner Settlement Grid ────────────────────────
//
// Backend-only tables (no frontend types):
//   ledger_accounts — internal double-entry chart of accounts; bookkeeping infrastructure
//   ledger_entries  — internal debit/credit journal entries; financial reconciliation
//
// NEVER fields:
//   partners.tax_id                   — NEVER (sensitive financial identifier; EIN equivalent)
//   partners.payout_destination_config — NEVER (may contain bank/routing numbers,
//                                        IBAN, crypto wallet addresses, wire credentials)
//   partners.api_signing_secret_hash  — ABSOLUTE NEVER (API signing secret hash)
//   partners.risk_score               — NEVER (fraud/risk scoring signal; enables gaming)
//   partners.metadata                 — excluded (JSONB with no type contract)
//
// Excluded (non-NEVER):
//   partner_revenues.previous_ledger_hash — internal audit chain integrity hash
//   partner_revenues.ledger_hash          — internal audit chain integrity hash
//   partner_revenues.metadata             — JSONB with no type contract

// ── Partners ──────────────────────────────────────────────────────────────

export interface Partner {
  id: string;
  profileId: string;
  companyName: string;
  slug: string;
  // tax_id excluded — NEVER (sensitive financial identifier; EIN equivalent)
  tier: string;
  status: string;
  kycStatus: string;
  revenueShareModel: string;
  payoutCurrency: string;
  payoutMethod: string;
  // payout_destination_config excluded — NEVER (may contain bank account/routing
  //   numbers, IBAN, crypto wallet addresses, wire transfer credentials)
  // api_signing_secret_hash excluded — ABSOLUTE NEVER (API signing secret hash)
  // risk_score excluded — NEVER (fraud/risk scoring signal; enables gaming)
  // metadata excluded — JSONB with no type contract
  createdAt: string;
  updatedAt: string;
}

export interface PartnerOrganization {
  id: string;
  partnerId: string;
  organizationId: string;
  roleInOrg: string;
  createdAt: string;
}

// ── Partner Wallet ─────────────────────────────────────────────────────────

export interface PartnerWallet {
  id: string;
  partnerId: string;
  currency: string;
  balanceAvailable: number;
  balancePending: number;
  balanceReserve: number;
  updatedAt: string;
}

// ── Commission History ─────────────────────────────────────────────────────

export interface PartnerCommissionHistory {
  id: string;
  partnerId: string;
  commissionRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
}

// ── Payout Batches ─────────────────────────────────────────────────────────

export interface PartnerPayoutBatch {
  id: string;
  currency: string;
  status: string;
  bankReference: string | null;
  totalAmount: number;
  createdBy: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  createdAt: string;
}

// ── Partner Revenues ───────────────────────────────────────────────────────

export interface PartnerRevenue {
  id: string;
  partnerId: string;
  transactionId: string;
  referenceType: string;
  grossAmount: number;
  commissionRateApplied: number;
  commissionAmount: number;
  netPartnerAmount: number;
  currency: string;
  exchangeRateUsed: number;
  convertedAmount: number;
  taxAmount: number;
  taxType: string | null;
  status: string;
  payoutBatchId: string | null;
  settledAt: string | null;
  // previous_ledger_hash excluded — internal audit chain integrity hash
  // ledger_hash excluded — internal audit chain integrity hash
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── Partner Contracts ──────────────────────────────────────────────────────

export interface PartnerContract {
  id: string;
  partnerId: string;
  contractVersion: string;
  pdfUrl: string;
  signedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── API Usage ──────────────────────────────────────────────────────────────

export interface PartnerApiUsage {
  id: string;
  partnerId: string;
  requestsCount: number;
  bandwidthBytes: number;
  storageBytes: number;
  aiTokensUsed: number;
  totalCost: number;
  usageDate: string;
}

// ── Daily Metrics ──────────────────────────────────────────────────────────

export interface PartnerDailyMetrics {
  id: string;
  partnerId: string;
  metricDate: string;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  averageSaleAmount: number;
}
