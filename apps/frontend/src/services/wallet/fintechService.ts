import { supabase } from '../../lib/supabase';
import type {
  LedgerAccount,
  JournalEntry,
  LedgerEntry,
  PaymentIntent,
  PaymentGateway,
  WalletKycDocument,
  WalletAmlCheck,
  WalletBeneficiary,
  WalletScheduledPayment,
  WalletQrPayment,
  WalletSettlement,
  WalletWebhook,
  ImmutableAuditLog,
  PaymentIntentStatus,
} from '../../types/fintech';

// Write operations that involve money movement (scheduled payment execution,
// settlement triggers, reconciliation) must go through backend/Edge Functions
// to guarantee ACID atomicity.
// wallet_reconciliation + webhook_deliveries are admin/backend-only — not exposed here.

// ── Column constants (sensitive fields excluded) ───────────────────────────

const GATEWAY_COLS =
  'id, name, is_active, priority, created_at';

const AML_CHECK_COLS =
  'id, wallet_id, screening_provider, risk_level, match_found, checked_at';

const AUDIT_LOG_COLS =
  'id, wallet_id, actor_id, action, created_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type LedgerAccountRow = {
  id: string;
  wallet_id: string | null;
  account_number: string;
  account_name: string;
  account_type: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
};

type JournalEntryRow = {
  id: string;
  reference_id: string | null;
  description: string;
  status: string;
  posted_at: string;
  created_at: string;
};

type LedgerEntryRow = {
  id: string;
  journal_id: string;
  ledger_account_id: string;
  amount: number;
  entry_type: string;
  currency_code: string;
  created_at: string;
};

type PaymentIntentRow = {
  id: string;
  wallet_id: string;
  amount: number;
  currency_code: string;
  status: string;
  gateway_used: string | null;
  client_secret: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type PaymentGatewayRow = {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  created_at: string;
};

type WalletKycDocumentRow = {
  id: string;
  wallet_id: string;
  document_type: string;
  file_url: string;
  status: string;
  reviewed_at: string | null;
  created_at: string;
};

type WalletAmlCheckRow = {
  id: string;
  wallet_id: string;
  screening_provider: string;
  risk_level: string;
  match_found: boolean;
  checked_at: string;
};

type WalletBeneficiaryRow = {
  id: string;
  wallet_id: string;
  name: string;
  account_number: string;
  bank_name: string | null;
  swift_code: string | null;
  country_code: string;
  created_at: string;
};

type WalletScheduledPaymentRow = {
  id: string;
  wallet_id: string;
  amount: number;
  currency_code: string;
  frequency: string;
  next_run_at: string;
  is_active: boolean;
  created_at: string;
};

type WalletQrPaymentRow = {
  id: string;
  wallet_id: string;
  qr_code_data: string;
  amount: number | null;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
};

type WalletSettlementRow = {
  id: string;
  wallet_id: string;
  amount: number;
  currency_code: string;
  settlement_cycle: string;
  status: string;
  settled_at: string | null;
  created_at: string;
};

type WalletWebhookRow = {
  id: string;
  wallet_id: string;
  url: string;
  is_active: boolean;
  created_at: string;
};

type ImmutableAuditLogRow = {
  id: string;
  wallet_id: string | null;
  actor_id: string | null;
  action: string;
  created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapLedgerAccount(r: LedgerAccountRow): LedgerAccount {
  return {
    id: r.id,
    walletId: r.wallet_id,
    accountNumber: r.account_number,
    accountName: r.account_name,
    accountType: r.account_type,
    currencyCode: r.currency_code,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapJournalEntry(r: JournalEntryRow): JournalEntry {
  return {
    id: r.id,
    referenceId: r.reference_id,
    description: r.description,
    status: r.status,
    postedAt: r.posted_at,
    createdAt: r.created_at,
  };
}

function mapLedgerEntry(r: LedgerEntryRow): LedgerEntry {
  return {
    id: r.id,
    journalId: r.journal_id,
    ledgerAccountId: r.ledger_account_id,
    amount: r.amount,
    entryType: r.entry_type as LedgerEntry['entryType'],
    currencyCode: r.currency_code,
    createdAt: r.created_at,
  };
}

function mapPaymentIntent(r: PaymentIntentRow): PaymentIntent {
  return {
    id: r.id,
    walletId: r.wallet_id,
    amount: r.amount,
    currencyCode: r.currency_code,
    status: r.status as PaymentIntentStatus,
    gatewayUsed: r.gateway_used,
    clientSecret: r.client_secret,
    metadata: r.metadata,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapPaymentGateway(r: PaymentGatewayRow): PaymentGateway {
  return {
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    priority: r.priority,
    createdAt: r.created_at,
  };
}

function mapKycDocument(r: WalletKycDocumentRow): WalletKycDocument {
  return {
    id: r.id,
    walletId: r.wallet_id,
    documentType: r.document_type,
    fileUrl: r.file_url,
    status: r.status,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  };
}

function mapAmlCheck(r: WalletAmlCheckRow): WalletAmlCheck {
  return {
    id: r.id,
    walletId: r.wallet_id,
    screeningProvider: r.screening_provider,
    riskLevel: r.risk_level as WalletAmlCheck['riskLevel'],
    matchFound: r.match_found,
    checkedAt: r.checked_at,
  };
}

function mapBeneficiary(r: WalletBeneficiaryRow): WalletBeneficiary {
  return {
    id: r.id,
    walletId: r.wallet_id,
    name: r.name,
    accountNumber: r.account_number,
    bankName: r.bank_name,
    swiftCode: r.swift_code,
    countryCode: r.country_code,
    createdAt: r.created_at,
  };
}

function mapScheduledPayment(r: WalletScheduledPaymentRow): WalletScheduledPayment {
  return {
    id: r.id,
    walletId: r.wallet_id,
    amount: r.amount,
    currencyCode: r.currency_code,
    frequency: r.frequency,
    nextRunAt: r.next_run_at,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapQrPayment(r: WalletQrPaymentRow): WalletQrPayment {
  return {
    id: r.id,
    walletId: r.wallet_id,
    qrCodeData: r.qr_code_data,
    amount: r.amount,
    isUsed: r.is_used,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function mapSettlement(r: WalletSettlementRow): WalletSettlement {
  return {
    id: r.id,
    walletId: r.wallet_id,
    amount: r.amount,
    currencyCode: r.currency_code,
    settlementCycle: r.settlement_cycle,
    status: r.status,
    settledAt: r.settled_at,
    createdAt: r.created_at,
  };
}

function mapWebhook(r: WalletWebhookRow): WalletWebhook {
  return {
    id: r.id,
    walletId: r.wallet_id,
    url: r.url,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapAuditLog(r: ImmutableAuditLogRow): ImmutableAuditLog {
  return {
    id: r.id,
    walletId: r.wallet_id,
    actorId: r.actor_id,
    action: r.action,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Ledger Accounts
// ================================================================

export async function getMyLedgerAccounts(
  walletId: string
): Promise<LedgerAccount[]> {
  const { data, error } = await supabase
    .from('ledger_accounts')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('is_active', true)
    .order('account_number', { ascending: true });
  if (error) throw error;
  return (data as LedgerAccountRow[]).map(mapLedgerAccount);
}

export async function getLedgerAccount(
  accountId: string
): Promise<LedgerAccount | null> {
  const { data, error } = await supabase
    .from('ledger_accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLedgerAccount(data as LedgerAccountRow) : null;
}

export async function getJournalEntry(
  journalId: string
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', journalId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJournalEntry(data as JournalEntryRow) : null;
}

export async function getLedgerEntriesForJournal(
  journalId: string
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('journal_id', journalId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as LedgerEntryRow[]).map(mapLedgerEntry);
}

export async function getLedgerEntriesForAccount(
  ledgerAccountId: string,
  limit = 50
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('ledger_account_id', ledgerAccountId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as LedgerEntryRow[]).map(mapLedgerEntry);
}

// ================================================================
// === Payment Intents & Gateway Routing
// ================================================================

// Creating a payment intent must go through backend to validate amount,
// generate client_secret securely, and select the optimal gateway.

export async function getMyPaymentIntents(
  walletId: string,
  status?: PaymentIntentStatus
): Promise<PaymentIntent[]> {
  let q = supabase
    .from('payment_intents')
    .select('*')
    .eq('wallet_id', walletId);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PaymentIntentRow[]).map(mapPaymentIntent);
}

export async function getPaymentIntentById(
  intentId: string
): Promise<PaymentIntent | null> {
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('id', intentId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPaymentIntent(data as PaymentIntentRow) : null;
}

export async function getAvailableGateways(): Promise<PaymentGateway[]> {
  const { data, error } = await supabase
    .from('payment_gateways')
    .select(GATEWAY_COLS)
    .eq('is_active', true)
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data as PaymentGatewayRow[]).map(mapPaymentGateway);
}

// ================================================================
// === KYC Documents
// ================================================================

// Uploading KYC documents must go through backend to generate signed
// upload URLs and trigger the verification workflow.

export async function getMyKycDocuments(
  walletId: string
): Promise<WalletKycDocument[]> {
  const { data, error } = await supabase
    .from('wallet_kyc_documents')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletKycDocumentRow[]).map(mapKycDocument);
}

// ================================================================
// === AML Checks
// ================================================================

// AML screening is triggered by backend on high-value transactions
// and account upgrades. payload excluded — contains raw provider data.

export async function getMyAmlChecks(
  walletId: string
): Promise<WalletAmlCheck[]> {
  const { data, error } = await supabase
    .from('wallet_aml_checks')
    .select(AML_CHECK_COLS)
    .eq('wallet_id', walletId)
    .order('checked_at', { ascending: false });
  if (error) throw error;
  return (data as WalletAmlCheckRow[]).map(mapAmlCheck);
}

export async function getLatestAmlCheck(
  walletId: string
): Promise<WalletAmlCheck | null> {
  const { data, error } = await supabase
    .from('wallet_aml_checks')
    .select(AML_CHECK_COLS)
    .eq('wallet_id', walletId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAmlCheck(data as WalletAmlCheckRow) : null;
}

// ================================================================
// === Beneficiaries
// ================================================================

export async function getMyBeneficiaries(
  walletId: string
): Promise<WalletBeneficiary[]> {
  const { data, error } = await supabase
    .from('wallet_beneficiaries')
    .select('*')
    .eq('wallet_id', walletId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as WalletBeneficiaryRow[]).map(mapBeneficiary);
}

export async function getBeneficiaryById(
  beneficiaryId: string
): Promise<WalletBeneficiary | null> {
  const { data, error } = await supabase
    .from('wallet_beneficiaries')
    .select('*')
    .eq('id', beneficiaryId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBeneficiary(data as WalletBeneficiaryRow) : null;
}

export async function addBeneficiary(
  walletId: string,
  input: {
    name: string;
    accountNumber: string;
    bankName?: string;
    swiftCode?: string;
    countryCode: string;
  }
): Promise<WalletBeneficiary> {
  const { data, error } = await supabase
    .from('wallet_beneficiaries')
    .insert({
      wallet_id: walletId,
      name: input.name,
      account_number: input.accountNumber,
      bank_name: input.bankName ?? null,
      swift_code: input.swiftCode ?? null,
      country_code: input.countryCode,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapBeneficiary(data as WalletBeneficiaryRow);
}

export async function deleteBeneficiary(beneficiaryId: string): Promise<void> {
  const { error } = await supabase
    .from('wallet_beneficiaries')
    .delete()
    .eq('id', beneficiaryId);
  if (error) throw error;
}

// ================================================================
// === Scheduled Payments
// ================================================================

// Creating, updating, and cancelling scheduled payments must go through
// backend to validate balance availability and prevent scheduling overdrafts.

export async function getMyScheduledPayments(
  walletId: string,
  activeOnly = false
): Promise<WalletScheduledPayment[]> {
  let q = supabase
    .from('wallet_scheduled_payments')
    .select('*')
    .eq('wallet_id', walletId);

  if (activeOnly) q = q.eq('is_active', true);

  const { data, error } = await q.order('next_run_at', { ascending: true });
  if (error) throw error;
  return (data as WalletScheduledPaymentRow[]).map(mapScheduledPayment);
}

export async function getScheduledPaymentById(
  paymentId: string
): Promise<WalletScheduledPayment | null> {
  const { data, error } = await supabase
    .from('wallet_scheduled_payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapScheduledPayment(data as WalletScheduledPaymentRow) : null;
}

// ================================================================
// === QR Payments
// ================================================================

export async function getMyQrPayments(
  walletId: string,
  unusedOnly = false
): Promise<WalletQrPayment[]> {
  const now = new Date().toISOString();
  let q = supabase
    .from('wallet_qr_payments')
    .select('*')
    .eq('wallet_id', walletId);

  if (unusedOnly) {
    q = q
      .eq('is_used', false)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
  }

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletQrPaymentRow[]).map(mapQrPayment);
}

export async function getQrPaymentByCode(
  qrCodeData: string
): Promise<WalletQrPayment | null> {
  const { data, error } = await supabase
    .from('wallet_qr_payments')
    .select('*')
    .eq('qr_code_data', qrCodeData)
    .maybeSingle();
  if (error) throw error;
  return data ? mapQrPayment(data as WalletQrPaymentRow) : null;
}

// ================================================================
// === Settlements
// ================================================================

// Settlement execution is backend/scheduler-only.

export async function getMySettlements(
  walletId: string,
  status?: string
): Promise<WalletSettlement[]> {
  let q = supabase
    .from('wallet_settlements')
    .select('*')
    .eq('wallet_id', walletId);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletSettlementRow[]).map(mapSettlement);
}

// ================================================================
// === Webhooks
// ================================================================

export async function getMyWebhooks(
  walletId: string
): Promise<WalletWebhook[]> {
  const { data, error } = await supabase
    .from('wallet_webhooks')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletWebhookRow[]).map(mapWebhook);
}

// webhook_deliveries (payload + response) are backend-only audit records.

// ================================================================
// === Immutable Audit Trail
// ================================================================

// old_state, new_state, previous_hash, signature are excluded — these form
// the cryptographic chain and are verified only by backend integrity checks.

export async function getMyAuditLogs(
  walletId: string,
  limit = 100
): Promise<ImmutableAuditLog[]> {
  const { data, error } = await supabase
    .from('immutable_audit_logs')
    .select(AUDIT_LOG_COLS)
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ImmutableAuditLogRow[]).map(mapAuditLog);
}
