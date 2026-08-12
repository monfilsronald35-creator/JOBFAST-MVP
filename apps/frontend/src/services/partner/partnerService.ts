import { supabase } from '../../lib/supabase';
import type {
  Partner,
  PartnerOrganization,
  PartnerWallet,
  PartnerCommissionHistory,
  PartnerPayoutBatch,
  PartnerRevenue,
  PartnerContract,
  PartnerApiUsage,
  PartnerDailyMetrics,
} from '../../types/partner';

// Enterprise Financial & Partner Settlement Grid
//
// Backend-only tables (zero functions here):
//   ledger_accounts — internal double-entry chart of accounts
//   ledger_entries  — internal debit/credit journal entries

// ── Column constants ───────────────────────────────────────────────────────

const PARTNER_COLS = 'id, profile_id, company_name, slug, tier, status, kyc_status, revenue_share_model, payout_currency, payout_method, created_at, updated_at';
// tax_id excluded — NEVER (sensitive financial identifier; EIN equivalent)
// payout_destination_config excluded — NEVER (bank/routing/IBAN/crypto wallet addresses)
// api_signing_secret_hash excluded — ABSOLUTE NEVER (API signing secret hash)
// risk_score excluded — NEVER (fraud/risk scoring signal; enables gaming)
// metadata excluded — JSONB with no type contract

const PARTNER_ORG_COLS = 'id, partner_id, organization_id, role_in_org, created_at';
const WALLET_COLS = 'id, partner_id, currency, balance_available, balance_pending, balance_reserve, updated_at';
const COMMISSION_COLS = 'id, partner_id, commission_rate, effective_from, effective_to, reason, changed_by, created_at';
const BATCH_COLS = 'id, currency, status, bank_reference, total_amount, created_by, approved_by, paid_at, created_at';
const REVENUE_COLS = [
  'id', 'partner_id', 'transaction_id', 'reference_type',
  'gross_amount', 'commission_rate_applied', 'commission_amount', 'net_partner_amount',
  'currency', 'exchange_rate_used', 'converted_amount',
  'tax_amount', 'tax_type', 'status', 'payout_batch_id', 'settled_at', 'created_at',
].join(', ');
// previous_ledger_hash excluded — internal audit chain integrity hash
// ledger_hash excluded — internal audit chain integrity hash
// metadata excluded — JSONB with no type contract

const CONTRACT_COLS = 'id, partner_id, contract_version, pdf_url, signed_at, expires_at, is_active, created_at';
const API_USAGE_COLS = 'id, partner_id, requests_count, bandwidth_bytes, storage_bytes, ai_tokens_used, total_cost, usage_date';
const DAILY_METRICS_COLS = 'id, partner_id, metric_date, total_sales, total_revenue, conversion_rate, average_sale_amount';

// ── Row types ─────────────────────────────────────────────────────────────

type PartnerRow = { id: string; profile_id: string; company_name: string; slug: string; tier: string; status: string; kyc_status: string; revenue_share_model: string; payout_currency: string; payout_method: string; created_at: string; updated_at: string; };
type PartnerOrgRow = { id: string; partner_id: string; organization_id: string; role_in_org: string; created_at: string; };
type WalletRow = { id: string; partner_id: string; currency: string; balance_available: number; balance_pending: number; balance_reserve: number; updated_at: string; };
type CommissionRow = { id: string; partner_id: string; commission_rate: number; effective_from: string; effective_to: string | null; reason: string | null; changed_by: string | null; created_at: string; };
type BatchRow = { id: string; currency: string; status: string; bank_reference: string | null; total_amount: number; created_by: string | null; approved_by: string | null; paid_at: string | null; created_at: string; };
type RevenueRow = { id: string; partner_id: string; transaction_id: string; reference_type: string; gross_amount: number; commission_rate_applied: number; commission_amount: number; net_partner_amount: number; currency: string; exchange_rate_used: number; converted_amount: number; tax_amount: number; tax_type: string | null; status: string; payout_batch_id: string | null; settled_at: string | null; created_at: string; };
type ContractRow = { id: string; partner_id: string; contract_version: string; pdf_url: string; signed_at: string; expires_at: string | null; is_active: boolean; created_at: string; };
type ApiUsageRow = { id: string; partner_id: string; requests_count: number; bandwidth_bytes: number; storage_bytes: number; ai_tokens_used: number; total_cost: number; usage_date: string; };
type DailyMetricsRow = { id: string; partner_id: string; metric_date: string; total_sales: number; total_revenue: number; conversion_rate: number; average_sale_amount: number; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapPartner = (r: PartnerRow): Partner => ({ id: r.id, profileId: r.profile_id, companyName: r.company_name, slug: r.slug, tier: r.tier, status: r.status, kycStatus: r.kyc_status, revenueShareModel: r.revenue_share_model, payoutCurrency: r.payout_currency, payoutMethod: r.payout_method, createdAt: r.created_at, updatedAt: r.updated_at });
const mapPartnerOrg = (r: PartnerOrgRow): PartnerOrganization => ({ id: r.id, partnerId: r.partner_id, organizationId: r.organization_id, roleInOrg: r.role_in_org, createdAt: r.created_at });
const mapWallet = (r: WalletRow): PartnerWallet => ({ id: r.id, partnerId: r.partner_id, currency: r.currency, balanceAvailable: r.balance_available, balancePending: r.balance_pending, balanceReserve: r.balance_reserve, updatedAt: r.updated_at });
const mapCommission = (r: CommissionRow): PartnerCommissionHistory => ({ id: r.id, partnerId: r.partner_id, commissionRate: r.commission_rate, effectiveFrom: r.effective_from, effectiveTo: r.effective_to, reason: r.reason, changedBy: r.changed_by, createdAt: r.created_at });
const mapBatch = (r: BatchRow): PartnerPayoutBatch => ({ id: r.id, currency: r.currency, status: r.status, bankReference: r.bank_reference, totalAmount: r.total_amount, createdBy: r.created_by, approvedBy: r.approved_by, paidAt: r.paid_at, createdAt: r.created_at });
const mapRevenue = (r: RevenueRow): PartnerRevenue => ({ id: r.id, partnerId: r.partner_id, transactionId: r.transaction_id, referenceType: r.reference_type, grossAmount: r.gross_amount, commissionRateApplied: r.commission_rate_applied, commissionAmount: r.commission_amount, netPartnerAmount: r.net_partner_amount, currency: r.currency, exchangeRateUsed: r.exchange_rate_used, convertedAmount: r.converted_amount, taxAmount: r.tax_amount, taxType: r.tax_type, status: r.status, payoutBatchId: r.payout_batch_id, settledAt: r.settled_at, createdAt: r.created_at });
const mapContract = (r: ContractRow): PartnerContract => ({ id: r.id, partnerId: r.partner_id, contractVersion: r.contract_version, pdfUrl: r.pdf_url, signedAt: r.signed_at, expiresAt: r.expires_at, isActive: r.is_active, createdAt: r.created_at });
const mapApiUsage = (r: ApiUsageRow): PartnerApiUsage => ({ id: r.id, partnerId: r.partner_id, requestsCount: r.requests_count, bandwidthBytes: r.bandwidth_bytes, storageBytes: r.storage_bytes, aiTokensUsed: r.ai_tokens_used, totalCost: r.total_cost, usageDate: r.usage_date });
const mapDailyMetrics = (r: DailyMetricsRow): PartnerDailyMetrics => ({ id: r.id, partnerId: r.partner_id, metricDate: r.metric_date, totalSales: r.total_sales, totalRevenue: r.total_revenue, conversionRate: r.conversion_rate, averageSaleAmount: r.average_sale_amount });

// ── Partner profile functions ─────────────────────────────────────────────

export async function getMyPartnerProfile(): Promise<Partner | null> {
  const { data, error } = await supabase.from('partners').select(PARTNER_COLS).maybeSingle();
  if (error) throw error;
  return data ? mapPartner(data as unknown as PartnerRow) : null;
}

export async function getPartnerOrganizations(partnerId: string): Promise<PartnerOrganization[]> {
  const { data, error } = await supabase.from('partner_organizations').select(PARTNER_ORG_COLS).eq('partner_id', partnerId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as PartnerOrgRow[]).map(mapPartnerOrg);
}

// ── Wallet functions ──────────────────────────────────────────────────────

export async function getMyPartnerWallets(partnerId: string): Promise<PartnerWallet[]> {
  const { data, error } = await supabase.from('partner_wallets').select(WALLET_COLS).eq('partner_id', partnerId).order('currency');
  if (error) throw error;
  return (data as unknown as WalletRow[]).map(mapWallet);
}

export async function getPartnerWalletByCurrency(partnerId: string, currency: string): Promise<PartnerWallet | null> {
  const { data, error } = await supabase.from('partner_wallets').select(WALLET_COLS).eq('partner_id', partnerId).eq('currency', currency).maybeSingle();
  if (error) throw error;
  return data ? mapWallet(data as unknown as WalletRow) : null;
}

// ── Commission history functions ──────────────────────────────────────────

export async function getCommissionHistory(partnerId: string, options: { limit?: number } = {}): Promise<PartnerCommissionHistory[]> {
  const { data, error } = await supabase.from('partner_commission_history').select(COMMISSION_COLS).eq('partner_id', partnerId).order('effective_from', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as CommissionRow[]).map(mapCommission);
}

export async function getCurrentCommissionRate(partnerId: string): Promise<PartnerCommissionHistory | null> {
  const { data, error } = await supabase.from('partner_commission_history').select(COMMISSION_COLS).eq('partner_id', partnerId).is('effective_to', null).order('effective_from', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapCommission(data as unknown as CommissionRow) : null;
}

// ── Payout batch functions ────────────────────────────────────────────────

export async function getPayoutBatches(options: { status?: string; currency?: string; limit?: number } = {}): Promise<PartnerPayoutBatch[]> {
  let q = supabase.from('partner_payout_batches').select(BATCH_COLS);
  if (options.status) q = q.eq('status', options.status);
  if (options.currency) q = q.eq('currency', options.currency);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as BatchRow[]).map(mapBatch);
}

export async function getPayoutBatch(id: string): Promise<PartnerPayoutBatch | null> {
  const { data, error } = await supabase.from('partner_payout_batches').select(BATCH_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapBatch(data as unknown as BatchRow) : null;
}

// ── Revenue functions ─────────────────────────────────────────────────────

export async function getMyRevenues(partnerId: string, options: { status?: string; from?: string; to?: string; limit?: number; before?: string } = {}): Promise<PartnerRevenue[]> {
  let q = supabase.from('partner_revenues').select(REVENUE_COLS).eq('partner_id', partnerId);
  if (options.status) q = q.eq('status', options.status);
  if (options.from) q = q.gte('created_at', options.from);
  if (options.to) q = q.lte('created_at', options.to);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as RevenueRow[]).map(mapRevenue);
}

export async function getPendingRevenues(partnerId: string): Promise<PartnerRevenue[]> {
  const { data, error } = await supabase.from('partner_revenues').select(REVENUE_COLS).eq('partner_id', partnerId).eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as RevenueRow[]).map(mapRevenue);
}

export async function getRevenuesByBatch(batchId: string): Promise<PartnerRevenue[]> {
  const { data, error } = await supabase.from('partner_revenues').select(REVENUE_COLS).eq('payout_batch_id', batchId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as RevenueRow[]).map(mapRevenue);
}

// ── Contract functions ────────────────────────────────────────────────────

export async function getMyContracts(partnerId: string): Promise<PartnerContract[]> {
  const { data, error } = await supabase.from('partner_contracts').select(CONTRACT_COLS).eq('partner_id', partnerId).order('signed_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as ContractRow[]).map(mapContract);
}

export async function getActiveContract(partnerId: string): Promise<PartnerContract | null> {
  const { data, error } = await supabase.from('partner_contracts').select(CONTRACT_COLS).eq('partner_id', partnerId).eq('is_active', true).order('signed_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapContract(data as unknown as ContractRow) : null;
}

// ── API usage functions ───────────────────────────────────────────────────

export async function getApiUsage(partnerId: string, options: { from?: string; to?: string; limit?: number } = {}): Promise<PartnerApiUsage[]> {
  let q = supabase.from('partner_api_usage').select(API_USAGE_COLS).eq('partner_id', partnerId);
  if (options.from) q = q.gte('usage_date', options.from);
  if (options.to) q = q.lte('usage_date', options.to);
  const { data, error } = await q.order('usage_date', { ascending: false }).limit(options.limit ?? 90);
  if (error) throw error;
  return (data as unknown as ApiUsageRow[]).map(mapApiUsage);
}

export async function getTodayApiUsage(partnerId: string): Promise<PartnerApiUsage | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('partner_api_usage').select(API_USAGE_COLS).eq('partner_id', partnerId).eq('usage_date', today).maybeSingle();
  if (error) throw error;
  return data ? mapApiUsage(data as unknown as ApiUsageRow) : null;
}

// ── Daily metrics functions ───────────────────────────────────────────────

export async function getDailyMetrics(partnerId: string, options: { from?: string; to?: string; limit?: number } = {}): Promise<PartnerDailyMetrics[]> {
  let q = supabase.from('partner_daily_metrics').select(DAILY_METRICS_COLS).eq('partner_id', partnerId);
  if (options.from) q = q.gte('metric_date', options.from);
  if (options.to) q = q.lte('metric_date', options.to);
  const { data, error } = await q.order('metric_date', { ascending: false }).limit(options.limit ?? 90);
  if (error) throw error;
  return (data as unknown as DailyMetricsRow[]).map(mapDailyMetrics);
}

export async function getRecentMetrics(partnerId: string, days = 30): Promise<PartnerDailyMetrics[]> {
  const from = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0];
  const { data, error } = await supabase.from('partner_daily_metrics').select(DAILY_METRICS_COLS).eq('partner_id', partnerId).gte('metric_date', from).order('metric_date', { ascending: true });
  if (error) throw error;
  return (data as unknown as DailyMetricsRow[]).map(mapDailyMetrics);
}
