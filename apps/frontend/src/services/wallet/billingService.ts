import { supabase } from '../../lib/supabase';
import type {
  Invoice,
  InvoiceItem,
  InvoicePayment,
  InvoiceStatus,
  TaxRecord,
  Fee,
  WalletLimits,
  WalletLimitHistory,
  WalletLimitUsage,
  WalletLimitException,
  WalletRefund,
  WalletChargeback,
  ChargebackEvidence,
  ChargebackStatus,
  PayoutBatch,
  WalletPayout,
  PayoutEvent,
  PayoutStatus,
  RefundStatus,
} from '../../types/billing';

// All billing write operations (create refund, initiate payout, process chargeback)
// must go through the backend/Edge Functions to guarantee ACID atomicity.
// invoice_templates, invoice_events, tax_calculations, tax_jurisdictions,
// fee_rules, fee_history, chargeback_events, refund_events, and payout_webhooks
// are server-side only and not exposed here.

// ---- Row types (snake_case) ----

type InvoiceRow = {
  id: string;
  wallet_id: string;
  currency_id: string | null;
  customer_id: string | null;
  company_id: string | null;
  wallet_transaction_id: string | null;
  invoice_number: string;
  invoice_type: string;
  reference_id: string | null;
  external_reference: string | null;
  customer_name: string;
  customer_email: string | null;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  currency_code: string;
  status: string;
  pdf_url: string | null;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  total: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type InvoicePaymentRow = {
  id: string;
  invoice_id: string;
  wallet_transaction_id: string | null;
  amount: number;
  created_at: string;
};

type TaxRecordRow = {
  id: string;
  country_id: string | null;
  currency_id: string | null;
  tax_name: string;
  tax_code: string;
  tax_authority_id: string | null;
  percentage: number;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type FeeRow = {
  id: string;
  country_id: string | null;
  currency_id: string | null;
  transaction_type: string;
  provider: string | null;
  wallet_type: string | null;
  fee_percentage: number;
  fixed_fee: number;
  min_fee: number;
  max_fee: number | null;
  minimum_amount: number;
  maximum_amount: number | null;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type WalletLimitsRow = {
  id: string;
  wallet_id: string;
  deposit_limit: number;
  withdrawal_limit: number;
  transfer_limit: number;
  exchange_limit: number;
  payment_limit: number;
  payout_limit: number;
  crypto_limit: number;
  card_limit: number;
  period_type: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type WalletLimitHistoryRow = {
  id: string;
  wallet_id: string;
  changed_by: string | null;
  limit_type: string;
  old_value: number;
  new_value: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  changed_at: string;
};

type WalletLimitUsageRow = {
  id: string;
  wallet_id: string;
  limit_type: string;
  current_usage: number;
  reset_at: string | null;
  created_at: string;
};

type WalletLimitExceptionRow = {
  id: string;
  wallet_id: string;
  limit_type: string;
  extended_limit: number;
  expires_at: string | null;
  created_at: string;
};

type WalletRefundRow = {
  id: string;
  transaction_id: string;
  wallet_transaction_id: string | null;
  processed_by: string | null;
  refund_reference: string | null;
  amount: number;
  reason: string;
  status: string;
  processed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type WalletChargebackRow = {
  id: string;
  transaction_id: string;
  chargeback_code: string;
  provider_reference: string | null;
  amount: number;
  reason: string;
  resolution: string | null;
  status: string;
  evidence: Record<string, unknown>;
  opened_at: string;
  closed_at: string | null;
  resolved_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ChargebackEvidenceRow = {
  id: string;
  chargeback_id: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
};

type PayoutBatchRow = {
  id: string;
  provider: string;
  provider_batch_id: string | null;
  total_amount: number;
  currency_code: string;
  status: string;
  processed_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type WalletPayoutRow = {
  id: string;
  batch_id: string | null;
  wallet_id: string;
  bank_account_id: string | null;
  wallet_transaction_id: string | null;
  provider_reference: string | null;
  external_reference: string | null;
  amount: number;
  net_amount: number;
  fee_amount: number;
  exchange_rate: number;
  currency_code: string;
  status: string;
  processed_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PayoutEventRow = {
  id: string;
  payout_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

// ---- Mappers ----

function mapInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    walletId: r.wallet_id,
    currencyId: r.currency_id,
    customerId: r.customer_id,
    companyId: r.company_id,
    walletTransactionId: r.wallet_transaction_id,
    invoiceNumber: r.invoice_number,
    invoiceType: r.invoice_type,
    referenceId: r.reference_id,
    externalReference: r.external_reference,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    subtotal: r.subtotal,
    taxTotal: r.tax_total,
    discountTotal: r.discount_total,
    grandTotal: r.grand_total,
    currencyCode: r.currency_code,
    status: r.status as InvoiceStatus,
    pdfUrl: r.pdf_url,
    dueDate: r.due_date,
    issuedAt: r.issued_at,
    paidAt: r.paid_at,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapInvoiceItem(r: InvoiceItemRow): InvoiceItem {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    productId: r.product_id,
    serviceId: r.service_id,
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    taxRate: r.tax_rate,
    discountAmount: r.discount_amount,
    total: r.total,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapInvoicePayment(r: InvoicePaymentRow): InvoicePayment {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    walletTransactionId: r.wallet_transaction_id,
    amount: r.amount,
    createdAt: r.created_at,
  };
}

function mapTaxRecord(r: TaxRecordRow): TaxRecord {
  return {
    id: r.id,
    countryId: r.country_id,
    currencyId: r.currency_id,
    taxName: r.tax_name,
    taxCode: r.tax_code,
    taxAuthorityId: r.tax_authority_id,
    percentage: r.percentage,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
    isActive: r.is_active,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapFee(r: FeeRow): Fee {
  return {
    id: r.id,
    countryId: r.country_id,
    currencyId: r.currency_id,
    transactionType: r.transaction_type,
    provider: r.provider,
    walletType: r.wallet_type,
    feePercentage: r.fee_percentage,
    fixedFee: r.fixed_fee,
    minFee: r.min_fee,
    maxFee: r.max_fee,
    minimumAmount: r.minimum_amount,
    maximumAmount: r.maximum_amount,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
    isActive: r.is_active,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapWalletLimits(r: WalletLimitsRow): WalletLimits {
  return {
    id: r.id,
    walletId: r.wallet_id,
    depositLimit: r.deposit_limit,
    withdrawalLimit: r.withdrawal_limit,
    transferLimit: r.transfer_limit,
    exchangeLimit: r.exchange_limit,
    paymentLimit: r.payment_limit,
    payoutLimit: r.payout_limit,
    cryptoLimit: r.crypto_limit,
    cardLimit: r.card_limit,
    periodType: r.period_type,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapLimitHistory(r: WalletLimitHistoryRow): WalletLimitHistory {
  return {
    id: r.id,
    walletId: r.wallet_id,
    changedBy: r.changed_by,
    limitType: r.limit_type,
    oldValue: r.old_value,
    newValue: r.new_value,
    reason: r.reason,
    metadata: r.metadata,
    changedAt: r.changed_at,
  };
}

function mapLimitUsage(r: WalletLimitUsageRow): WalletLimitUsage {
  return {
    id: r.id,
    walletId: r.wallet_id,
    limitType: r.limit_type,
    currentUsage: r.current_usage,
    resetAt: r.reset_at,
    createdAt: r.created_at,
  };
}

function mapLimitException(r: WalletLimitExceptionRow): WalletLimitException {
  return {
    id: r.id,
    walletId: r.wallet_id,
    limitType: r.limit_type,
    extendedLimit: r.extended_limit,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function mapRefund(r: WalletRefundRow): WalletRefund {
  return {
    id: r.id,
    transactionId: r.transaction_id,
    walletTransactionId: r.wallet_transaction_id,
    processedBy: r.processed_by,
    refundReference: r.refund_reference,
    amount: r.amount,
    reason: r.reason,
    status: r.status as RefundStatus,
    processedAt: r.processed_at,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapChargeback(r: WalletChargebackRow): WalletChargeback {
  return {
    id: r.id,
    transactionId: r.transaction_id,
    chargebackCode: r.chargeback_code,
    providerReference: r.provider_reference,
    amount: r.amount,
    reason: r.reason,
    resolution: r.resolution,
    status: r.status as ChargebackStatus,
    evidence: r.evidence,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    resolvedAt: r.resolved_at,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapChargebackEvidence(r: ChargebackEvidenceRow): ChargebackEvidence {
  return {
    id: r.id,
    chargebackId: r.chargeback_id,
    fileUrl: r.file_url,
    fileType: r.file_type,
    createdAt: r.created_at,
  };
}

function mapPayoutBatch(r: PayoutBatchRow): PayoutBatch {
  return {
    id: r.id,
    provider: r.provider,
    providerBatchId: r.provider_batch_id,
    totalAmount: r.total_amount,
    currencyCode: r.currency_code,
    status: r.status as PayoutStatus,
    processedAt: r.processed_at,
    completedAt: r.completed_at,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapPayout(r: WalletPayoutRow): WalletPayout {
  return {
    id: r.id,
    batchId: r.batch_id,
    walletId: r.wallet_id,
    bankAccountId: r.bank_account_id,
    walletTransactionId: r.wallet_transaction_id,
    providerReference: r.provider_reference,
    externalReference: r.external_reference,
    amount: r.amount,
    netAmount: r.net_amount,
    feeAmount: r.fee_amount,
    exchangeRate: r.exchange_rate,
    currencyCode: r.currency_code,
    status: r.status as PayoutStatus,
    processedAt: r.processed_at,
    completedAt: r.completed_at,
    metadata: r.metadata,
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

function mapPayoutEvent(r: PayoutEventRow): PayoutEvent {
  return {
    id: r.id,
    payoutId: r.payout_id,
    eventType: r.event_type,
    payload: r.payload,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Invoices
// ================================================================

type GetInvoicesOptions = {
  status?: InvoiceStatus;
  invoiceType?: string;
  limit?: number;
};

export async function getMyInvoices(
  walletId: string,
  options: GetInvoicesOptions = {}
): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('*')
    .eq('wallet_id', walletId)
    .is('deleted_at', null);

  if (options.status) q = q.eq('status', options.status);
  if (options.invoiceType) q = q.eq('invoice_type', options.invoiceType);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as InvoiceRow[]).map(mapInvoice);
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInvoice(data as InvoiceRow) : null;
}

export async function getInvoiceByNumber(
  invoiceNumber: string
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInvoice(data as InvoiceRow) : null;
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as InvoiceItemRow[]).map(mapInvoiceItem);
}

export async function getInvoicePayments(
  invoiceId: string
): Promise<InvoicePayment[]> {
  const { data, error } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as InvoicePaymentRow[]).map(mapInvoicePayment);
}

// ================================================================
// === Tax Records
// ================================================================

export async function getTaxRecords(countryId?: string): Promise<TaxRecord[]> {
  let q = supabase
    .from('tax_records')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (countryId) q = q.eq('country_id', countryId);

  const { data, error } = await q.order('tax_name', { ascending: true });
  if (error) throw error;
  return (data as TaxRecordRow[]).map(mapTaxRecord);
}

export async function getActiveTaxRecords(
  countryId: string
): Promise<TaxRecord[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tax_records')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`effective_from.is.null,effective_from.lte.${now}`)
    .or(`effective_to.is.null,effective_to.gte.${now}`)
    .order('tax_code', { ascending: true });
  if (error) throw error;
  return (data as TaxRecordRow[]).map(mapTaxRecord);
}

// ================================================================
// === Fees
// ================================================================

export async function getFees(
  transactionType?: string,
  countryId?: string
): Promise<Fee[]> {
  let q = supabase
    .from('fees')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (transactionType) q = q.eq('transaction_type', transactionType);
  if (countryId) q = q.eq('country_id', countryId);

  const { data, error } = await q.order('transaction_type', { ascending: true });
  if (error) throw error;
  return (data as FeeRow[]).map(mapFee);
}

export async function getActiveFees(transactionType: string): Promise<Fee[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('transaction_type', transactionType)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`effective_from.is.null,effective_from.lte.${now}`)
    .or(`effective_to.is.null,effective_to.gte.${now}`);
  if (error) throw error;
  return (data as FeeRow[]).map(mapFee);
}

// ================================================================
// === Wallet Limits
// ================================================================

export async function getWalletLimits(
  walletId: string
): Promise<WalletLimits | null> {
  const { data, error } = await supabase
    .from('wallet_limits')
    .select('*')
    .eq('wallet_id', walletId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWalletLimits(data as WalletLimitsRow) : null;
}

export async function getWalletLimitHistory(
  walletId: string
): Promise<WalletLimitHistory[]> {
  const { data, error } = await supabase
    .from('wallet_limit_history')
    .select('*')
    .eq('wallet_id', walletId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return (data as WalletLimitHistoryRow[]).map(mapLimitHistory);
}

export async function getWalletLimitUsage(
  walletId: string
): Promise<WalletLimitUsage[]> {
  const { data, error } = await supabase
    .from('wallet_limit_usage')
    .select('*')
    .eq('wallet_id', walletId)
    .order('limit_type', { ascending: true });
  if (error) throw error;
  return (data as WalletLimitUsageRow[]).map(mapLimitUsage);
}

export async function getWalletLimitExceptions(
  walletId: string
): Promise<WalletLimitException[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('wallet_limit_exceptions')
    .select('*')
    .eq('wallet_id', walletId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletLimitExceptionRow[]).map(mapLimitException);
}

// ================================================================
// === Wallet Refunds
// ================================================================

export async function getRefundsByTransaction(
  transactionId: string
): Promise<WalletRefund[]> {
  const { data, error } = await supabase
    .from('wallet_refunds')
    .select('*')
    .eq('transaction_id', transactionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletRefundRow[]).map(mapRefund);
}

export async function getRefundById(
  refundId: string
): Promise<WalletRefund | null> {
  const { data, error } = await supabase
    .from('wallet_refunds')
    .select('*')
    .eq('id', refundId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRefund(data as WalletRefundRow) : null;
}

export async function getMyRefunds(status?: RefundStatus): Promise<WalletRefund[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('wallet_refunds')
    .select('*')
    .eq('created_by', user.id)
    .is('deleted_at', null);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletRefundRow[]).map(mapRefund);
}

// ================================================================
// === Wallet Chargebacks
// ================================================================

export async function getChargebacksByTransaction(
  transactionId: string
): Promise<WalletChargeback[]> {
  const { data, error } = await supabase
    .from('wallet_chargebacks')
    .select('*')
    .eq('transaction_id', transactionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletChargebackRow[]).map(mapChargeback);
}

export async function getChargebackById(
  chargebackId: string
): Promise<WalletChargeback | null> {
  const { data, error } = await supabase
    .from('wallet_chargebacks')
    .select('*')
    .eq('id', chargebackId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapChargeback(data as WalletChargebackRow) : null;
}

export async function getMyChargebacks(
  status?: ChargebackStatus
): Promise<WalletChargeback[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('wallet_chargebacks')
    .select('*')
    .eq('created_by', user.id)
    .is('deleted_at', null);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WalletChargebackRow[]).map(mapChargeback);
}

export async function getChargebackEvidence(
  chargebackId: string
): Promise<ChargebackEvidence[]> {
  const { data, error } = await supabase
    .from('chargeback_evidence')
    .select('*')
    .eq('chargeback_id', chargebackId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ChargebackEvidenceRow[]).map(mapChargebackEvidence);
}

// ================================================================
// === Payouts
// ================================================================

type GetPayoutsOptions = {
  status?: PayoutStatus;
  currencyCode?: string;
  limit?: number;
};

export async function getMyPayouts(
  walletId: string,
  options: GetPayoutsOptions = {}
): Promise<WalletPayout[]> {
  let q = supabase
    .from('wallet_payouts')
    .select('*')
    .eq('wallet_id', walletId)
    .is('deleted_at', null);

  if (options.status) q = q.eq('status', options.status);
  if (options.currencyCode) q = q.eq('currency_code', options.currencyCode.toUpperCase());

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as WalletPayoutRow[]).map(mapPayout);
}

export async function getPayoutById(
  payoutId: string
): Promise<WalletPayout | null> {
  const { data, error } = await supabase
    .from('wallet_payouts')
    .select('*')
    .eq('id', payoutId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayout(data as WalletPayoutRow) : null;
}

export async function getPayoutBatchById(
  batchId: string
): Promise<PayoutBatch | null> {
  const { data, error } = await supabase
    .from('wallet_payout_batches')
    .select('*')
    .eq('id', batchId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayoutBatch(data as PayoutBatchRow) : null;
}

export async function getPayoutEvents(payoutId: string): Promise<PayoutEvent[]> {
  const { data, error } = await supabase
    .from('payout_events')
    .select('*')
    .eq('payout_id', payoutId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as PayoutEventRow[]).map(mapPayoutEvent);
}
