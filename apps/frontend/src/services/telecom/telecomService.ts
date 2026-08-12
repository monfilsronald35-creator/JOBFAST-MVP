import { supabase } from '../../lib/supabase';
import type {
  TelecomProvider,
  TelecomStatus,
  TelecomProviderHealthMonitor,
  TelecomEdgeRoutingNode,
  TelecomFxRate,
  TelecomProduct,
  ProductCategory,
  DataPackage,
  SmsPackage,
  Recharge,
  RechargeStatus,
  TelecomOrder,
  OrderPaymentStatus,
  OrderFulfillmentStatus,
  DealerAccount,
  Commission,
  CommissionPayoutStatus,
  TelecomEsim,
  TelecomPortingRequest,
  TelecomTransaction,
  TelecomApiLog,
  TelecomRefund,
  TelecomInventoryAvailability,
  TelecomPromotion,
  TelecomCircuitBreakerEvent,
  TelecomRoutingRule,
  TelecomAuditLog,
  TelecomAiNeuralTelemetry,
  TelecomInterCarrierClearinghouse,
  SettlementStatus,
  TelecomHighFrequencyMetric,
  TelecomAutonomousFailoverLog,
} from '../../types/telecom';

// Backend-only data (never queried from frontend):
//   telecom_provider_credentials — ENTIRE TABLE (encrypted keys, RSA PEM, signing secrets)
//   telecom_providers:            api_base_url, api_backup_url — server infrastructure endpoints
//                                 api_version — backend routing detail
//                                 metadata — internal operational data
//   telecom_edge_routing_nodes:   ip_address — server infrastructure IP
//   telecom_fx_rates:             markup_percentage — internal FX profit margin (NEVER expose)
//                                 source_provider — internal oracle routing
//   telecom_products:             profit_margin_percentage — NEVER (business margin)
//                                 metadata — internal product configuration

// ── Column constants ───────────────────────────────────────────────────────

const PROVIDER_COLS =
  'id, provider_code, provider_name, parent_enterprise, country_code, supported_services, supported_currencies, logo_url, priority_rank, is_primary_gateway, circuit_breaker_status, status, created_at, updated_at';

const HEALTH_COLS =
  'id, provider_id, latency_ms, success_rate_24h, total_requests_24h, failed_requests_24h, last_ping_at, is_healthy, auto_failover_triggered, created_at, updated_at';

const EDGE_NODE_COLS =
  'id, node_code, region_name, continent, is_active, current_load_percentage, created_at';

const FX_RATE_COLS =
  'id, base_currency, target_currency, exchange_rate, is_active, updated_at';

const PRODUCT_COLS =
  'id, provider_id, product_sku, product_name, product_category, face_value, face_currency, selling_price, selling_currency, tax_percentage, is_promotional, is_available, allow_partial_payment, created_at, updated_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type ProviderRow = {
  id: string; provider_code: string; provider_name: string;
  parent_enterprise: string | null; country_code: string;
  supported_services: string[]; supported_currencies: string[];
  logo_url: string | null; priority_rank: number; is_primary_gateway: boolean;
  circuit_breaker_status: string; status: string;
  created_at: string; updated_at: string;
};

type HealthRow = {
  id: string; provider_id: string; latency_ms: number; success_rate_24h: number;
  total_requests_24h: number; failed_requests_24h: number; last_ping_at: string;
  is_healthy: boolean; auto_failover_triggered: boolean;
  created_at: string; updated_at: string;
};

type EdgeNodeRow = {
  id: string; node_code: string; region_name: string; continent: string;
  is_active: boolean; current_load_percentage: number; created_at: string;
};

type FxRateRow = {
  id: string; base_currency: string; target_currency: string;
  exchange_rate: number; is_active: boolean; updated_at: string;
};

type ProductRow = {
  id: string; provider_id: string; product_sku: string; product_name: string;
  product_category: string; face_value: number; face_currency: string;
  selling_price: number; selling_currency: string; tax_percentage: number;
  is_promotional: boolean; is_available: boolean; allow_partial_payment: boolean;
  created_at: string; updated_at: string;
};

type DataPackageRow = {
  id: string; product_id: string; data_amount_mb: number;
  validity_duration_hours: number; max_speed_download_mbps: number;
  max_speed_upload_mbps: number; network_technology: string;
  allows_hotspot: boolean; is_unlimited: boolean;
  fair_usage_policy_limit_mb: number | null; supports_roaming: boolean;
  roaming_countries: string[]; created_at: string;
};

type SmsPackageRow = {
  id: string; product_id: string; sms_count: number;
  validity_duration_hours: number; sms_scope: string;
  supports_delivery_reports: boolean; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapProvider(r: ProviderRow): TelecomProvider {
  return {
    id: r.id, providerCode: r.provider_code, providerName: r.provider_name,
    parentEnterprise: r.parent_enterprise, countryCode: r.country_code,
    supportedServices: r.supported_services, supportedCurrencies: r.supported_currencies,
    logoUrl: r.logo_url, priorityRank: r.priority_rank,
    isPrimaryGateway: r.is_primary_gateway,
    circuitBreakerStatus: r.circuit_breaker_status as TelecomProvider['circuitBreakerStatus'],
    status: r.status as TelecomStatus, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapHealth(r: HealthRow): TelecomProviderHealthMonitor {
  return {
    id: r.id, providerId: r.provider_id, latencyMs: r.latency_ms,
    successRate24h: r.success_rate_24h, totalRequests24h: r.total_requests_24h,
    failedRequests24h: r.failed_requests_24h, lastPingAt: r.last_ping_at,
    isHealthy: r.is_healthy, autoFailoverTriggered: r.auto_failover_triggered,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapEdgeNode(r: EdgeNodeRow): TelecomEdgeRoutingNode {
  return {
    id: r.id, nodeCode: r.node_code, regionName: r.region_name, continent: r.continent,
    isActive: r.is_active, currentLoadPercentage: r.current_load_percentage,
    createdAt: r.created_at,
  };
}

function mapFxRate(r: FxRateRow): TelecomFxRate {
  return {
    id: r.id, baseCurrency: r.base_currency, targetCurrency: r.target_currency,
    exchangeRate: r.exchange_rate, isActive: r.is_active, updatedAt: r.updated_at,
  };
}

function mapProduct(r: ProductRow): TelecomProduct {
  return {
    id: r.id, providerId: r.provider_id, productSku: r.product_sku,
    productName: r.product_name, productCategory: r.product_category as ProductCategory,
    faceValue: r.face_value, faceCurrency: r.face_currency,
    sellingPrice: r.selling_price, sellingCurrency: r.selling_currency,
    taxPercentage: r.tax_percentage, isPromotional: r.is_promotional,
    isAvailable: r.is_available, allowPartialPayment: r.allow_partial_payment,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDataPackage(r: DataPackageRow): DataPackage {
  return {
    id: r.id, productId: r.product_id, dataAmountMb: r.data_amount_mb,
    validityDurationHours: r.validity_duration_hours,
    maxSpeedDownloadMbps: r.max_speed_download_mbps,
    maxSpeedUploadMbps: r.max_speed_upload_mbps,
    networkTechnology: r.network_technology as DataPackage['networkTechnology'],
    allowsHotspot: r.allows_hotspot, isUnlimited: r.is_unlimited,
    fairUsagePolicyLimitMb: r.fair_usage_policy_limit_mb,
    supportsRoaming: r.supports_roaming, roamingCountries: r.roaming_countries,
    createdAt: r.created_at,
  };
}

function mapSmsPackage(r: SmsPackageRow): SmsPackage {
  return {
    id: r.id, productId: r.product_id, smsCount: r.sms_count,
    validityDurationHours: r.validity_duration_hours,
    smsScope: r.sms_scope as SmsPackage['smsScope'],
    supportsDeliveryReports: r.supports_delivery_reports, createdAt: r.created_at,
  };
}

// ================================================================
// === Telecom Providers
// ================================================================

export async function getTelecomProviders(
  options: { countryCode?: string; status?: TelecomStatus; service?: string } = {}
): Promise<TelecomProvider[]> {
  let q = supabase
    .from('telecom_providers')
    .select(PROVIDER_COLS);

  if (options.countryCode) q = q.eq('country_code', options.countryCode);
  if (options.status) q = q.eq('status', options.status);
  if (options.service) q = q.contains('supported_services', [options.service]);

  const { data, error } = await q.order('priority_rank', { ascending: true });
  if (error) throw error;
  return (data as ProviderRow[]).map(mapProvider);
}

export async function getTelecomProvider(
  providerId: string
): Promise<TelecomProvider | null> {
  const { data, error } = await supabase
    .from('telecom_providers')
    .select(PROVIDER_COLS)
    .eq('id', providerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProvider(data as ProviderRow) : null;
}

export async function getTelecomProviderByCode(
  providerCode: string
): Promise<TelecomProvider | null> {
  const { data, error } = await supabase
    .from('telecom_providers')
    .select(PROVIDER_COLS)
    .eq('provider_code', providerCode)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProvider(data as ProviderRow) : null;
}

export async function getPrimaryGateway(
  countryCode: string
): Promise<TelecomProvider | null> {
  const { data, error } = await supabase
    .from('telecom_providers')
    .select(PROVIDER_COLS)
    .eq('country_code', countryCode)
    .eq('is_primary_gateway', true)
    .eq('status', 'active')
    .eq('circuit_breaker_status', 'closed')
    .maybeSingle();
  if (error) throw error;
  return data ? mapProvider(data as ProviderRow) : null;
}

// ================================================================
// === Provider Health Monitors
// ================================================================

export async function getProviderHealth(
  providerId: string
): Promise<TelecomProviderHealthMonitor | null> {
  const { data, error } = await supabase
    .from('telecom_provider_health_monitors')
    .select(HEALTH_COLS)
    .eq('provider_id', providerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapHealth(data as HealthRow) : null;
}

export async function getAllProvidersHealth(
  healthyOnly: boolean = false
): Promise<TelecomProviderHealthMonitor[]> {
  let q = supabase
    .from('telecom_provider_health_monitors')
    .select(HEALTH_COLS);

  if (healthyOnly) q = q.eq('is_healthy', true);

  const { data, error } = await q.order('latency_ms', { ascending: true });
  if (error) throw error;
  return (data as HealthRow[]).map(mapHealth);
}

// ================================================================
// === Edge Routing Nodes
// ================================================================

export async function getActiveEdgeNodes(
  continent?: string
): Promise<TelecomEdgeRoutingNode[]> {
  let q = supabase
    .from('telecom_edge_routing_nodes')
    .select(EDGE_NODE_COLS)
    .eq('is_active', true);

  if (continent) q = q.eq('continent', continent);

  const { data, error } = await q.order('current_load_percentage', { ascending: true });
  if (error) throw error;
  return (data as EdgeNodeRow[]).map(mapEdgeNode);
}

export async function getEdgeNode(
  nodeId: string
): Promise<TelecomEdgeRoutingNode | null> {
  const { data, error } = await supabase
    .from('telecom_edge_routing_nodes')
    .select(EDGE_NODE_COLS)
    .eq('id', nodeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEdgeNode(data as EdgeNodeRow) : null;
}

// ================================================================
// === FX Rates
// ================================================================

export async function getFxRate(
  baseCurrency: string,
  targetCurrency: string
): Promise<TelecomFxRate | null> {
  const { data, error } = await supabase
    .from('telecom_fx_rates')
    .select(FX_RATE_COLS)
    .eq('base_currency', baseCurrency)
    .eq('target_currency', targetCurrency)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFxRate(data as FxRateRow) : null;
}

export async function getAllFxRates(
  baseCurrency: string = 'USD'
): Promise<TelecomFxRate[]> {
  const { data, error } = await supabase
    .from('telecom_fx_rates')
    .select(FX_RATE_COLS)
    .eq('base_currency', baseCurrency)
    .eq('is_active', true)
    .order('target_currency', { ascending: true });
  if (error) throw error;
  return (data as FxRateRow[]).map(mapFxRate);
}

// Converts an amount using the stored exchange_rate (markup excluded).
// The actual charged amount (with spread) is computed backend-side at transaction time.
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return amount;
  const rate = await getFxRate(fromCurrency, toCurrency);
  if (!rate) return null;
  return amount * rate.exchangeRate;
}

// ================================================================
// === Telecom Products
// ================================================================

export async function getTelecomProducts(
  options: {
    providerId?: string;
    category?: ProductCategory;
    countryCode?: string;
    availableOnly?: boolean;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<TelecomProduct[]> {
  let q = supabase
    .from('telecom_products')
    .select(PRODUCT_COLS);

  if (options.providerId) q = q.eq('provider_id', options.providerId);
  if (options.category) q = q.eq('product_category', options.category);
  if (options.availableOnly !== false) q = q.eq('is_available', true);
  if (options.cursor) q = q.gt('id', options.cursor);

  const { data, error } = await q
    .order('selling_price', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getTelecomProduct(
  productId: string
): Promise<TelecomProduct | null> {
  const { data, error } = await supabase
    .from('telecom_products')
    .select(PRODUCT_COLS)
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function getTelecomProductBySku(
  sku: string
): Promise<TelecomProduct | null> {
  const { data, error } = await supabase
    .from('telecom_products')
    .select(PRODUCT_COLS)
    .eq('product_sku', sku)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function getPromotionalProducts(
  providerId?: string
): Promise<TelecomProduct[]> {
  let q = supabase
    .from('telecom_products')
    .select(PRODUCT_COLS)
    .eq('is_promotional', true)
    .eq('is_available', true);

  if (providerId) q = q.eq('provider_id', providerId);

  const { data, error } = await q.order('selling_price', { ascending: true });
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

// ================================================================
// === Data Packages
// ================================================================

export async function getDataPackage(
  productId: string
): Promise<DataPackage | null> {
  const { data, error } = await supabase
    .from('data_packages')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDataPackage(data as DataPackageRow) : null;
}

export async function getDataPackages(
  productIds: string[]
): Promise<DataPackage[]> {
  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from('data_packages')
    .select('*')
    .in('product_id', productIds);
  if (error) throw error;
  return (data as DataPackageRow[]).map(mapDataPackage);
}

export async function getRoamingDataPackages(
  countryCode: string
): Promise<DataPackage[]> {
  const { data, error } = await supabase
    .from('data_packages')
    .select('*')
    .eq('supports_roaming', true)
    .contains('roaming_countries', [countryCode]);
  if (error) throw error;
  return (data as DataPackageRow[]).map(mapDataPackage);
}

// ================================================================
// === SMS Packages
// ================================================================

export async function getSmsPackage(
  productId: string
): Promise<SmsPackage | null> {
  const { data, error } = await supabase
    .from('sms_packages')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSmsPackage(data as SmsPackageRow) : null;
}

export async function getSmsPackages(
  productIds: string[]
): Promise<SmsPackage[]> {
  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from('sms_packages')
    .select('*')
    .in('product_id', productIds);
  if (error) throw error;
  return (data as SmsPackageRow[]).map(mapSmsPackage);
}

// ── Part 2 — Row types ────────────────────────────────────────────────────

type RechargeRow = {
  id: string; organization_id: string | null; provider_id: string;
  customer_phone_number: string; country_code: string; amount_charged: number;
  currency: string; airtime_value: number; airtime_currency: string;
  recharge_type: string; recharge_status: string;
  operator_transaction_id: string | null; error_message: string | null;
  processed_at: string | null; created_at: string;
};

type TelecomOrderRow = {
  id: string; organization_id: string | null; customer_user_id: string | null;
  dealer_id: string | null; order_reference: string; product_id: string;
  recipient_phone_number: string; order_type: string; quantity: number;
  unit_price: number; total_amount: number; currency: string;
  payment_method: string; payment_status: string; fulfillment_status: string;
  retry_count: number; max_retries: number;
  fulfilled_at: string | null; created_at: string; updated_at: string;
};

type DealerAccountRow = {
  id: string; organization_id: string; dealer_name: string; dealer_code: string;
  country_code: string; contact_email: string; contact_phone: string | null;
  current_balance: number; credit_limit: number; currency: string;
  commission_tier: string; is_active: boolean; created_at: string; updated_at: string;
};

type CommissionRow = {
  id: string; dealer_id: string | null; agent_employee_id: string | null;
  order_id: string; commission_amount: number; currency: string;
  payout_status: string; paid_at: string | null; created_at: string;
};

type EsimRow = {
  id: string; order_id: string; provider_id: string; iccid: string;
  matching_id: string; qr_code_url: string; smdp_address: string;
  device_imei: string | null; profile_status: string; data_remaining_mb: number;
  installed_at: string | null; expires_at: string | null; created_at: string;
};

type PortingRow = {
  id: string; organization_id: string; customer_phone_number: string;
  source_provider_id: string; target_provider_id: string; porting_status: string;
  rejection_reason: string | null; scheduled_port_time: string | null;
  completed_at: string | null; created_at: string;
};

type TelecomTxRow = {
  id: string; order_id: string | null; recharge_id: string | null;
  organization_id: string; transaction_reference: string; amount: number;
  currency: string; exchange_rate: number; fee_amount: number;
  status: string; transacted_at: string;
};

type ApiLogRow = {
  id: string; provider_id: string | null; http_method: string;
  response_status_code: number; latency_ms: number; created_at: string;
};

type RefundRow = {
  id: string; order_id: string; recharge_id: string | null;
  refund_amount: number; currency: string; reason: string; refund_status: string;
  gateway_refund_ref: string | null; processed_at: string | null; created_at: string;
};

type PromotionRow = {
  id: string; provider_id: string | null; promo_code: string; promo_name: string;
  discount_type: string; discount_value: number; min_order_amount: number;
  max_discount_limit: number | null; start_date: string; end_date: string;
  usage_limit_total: number | null; usage_count: number;
  is_active: boolean; created_at: string;
};

// ── Part 2 — Column constants ─────────────────────────────────────────────

const RECHARGE_COLS =
  'id, organization_id, provider_id, customer_phone_number, country_code, amount_charged, currency, airtime_value, airtime_currency, recharge_type, recharge_status, operator_transaction_id, error_message, processed_at, created_at';

const ORDER_COLS =
  'id, organization_id, customer_user_id, dealer_id, order_reference, product_id, recipient_phone_number, order_type, quantity, unit_price, total_amount, currency, payment_method, payment_status, fulfillment_status, retry_count, max_retries, fulfilled_at, created_at, updated_at';

const DEALER_COLS =
  'id, organization_id, dealer_name, dealer_code, country_code, contact_email, contact_phone, current_balance, credit_limit, currency, commission_tier, is_active, created_at, updated_at';

const COMMISSION_COLS =
  'id, dealer_id, agent_employee_id, order_id, commission_amount, currency, payout_status, paid_at, created_at';

const ESIM_COLS =
  'id, order_id, provider_id, iccid, matching_id, qr_code_url, smdp_address, device_imei, profile_status, data_remaining_mb, installed_at, expires_at, created_at';

const PORTING_COLS =
  'id, organization_id, customer_phone_number, source_provider_id, target_provider_id, porting_status, rejection_reason, scheduled_port_time, completed_at, created_at';

const TELECOM_TX_COLS =
  'id, order_id, recharge_id, organization_id, transaction_reference, amount, currency, exchange_rate, fee_amount, status, transacted_at';

const API_LOG_COLS =
  'id, provider_id, http_method, response_status_code, latency_ms, created_at';

const REFUND_COLS =
  'id, order_id, recharge_id, refund_amount, currency, reason, refund_status, gateway_refund_ref, processed_at, created_at';

const PROMOTION_COLS =
  'id, provider_id, promo_code, promo_name, discount_type, discount_value, min_order_amount, max_discount_limit, start_date, end_date, usage_limit_total, usage_count, is_active, created_at';

// ── Part 2 — Mappers ──────────────────────────────────────────────────────

function mapRecharge(r: RechargeRow): Recharge {
  return { id: r.id, organizationId: r.organization_id, providerId: r.provider_id, customerPhoneNumber: r.customer_phone_number, countryCode: r.country_code, amountCharged: r.amount_charged, currency: r.currency, airtimeValue: r.airtime_value, airtimeCurrency: r.airtime_currency, rechargeType: r.recharge_type as Recharge['rechargeType'], rechargeStatus: r.recharge_status as RechargeStatus, operatorTransactionId: r.operator_transaction_id, errorMessage: r.error_message, processedAt: r.processed_at, createdAt: r.created_at };
}

function mapOrder(r: TelecomOrderRow): TelecomOrder {
  return { id: r.id, organizationId: r.organization_id, customerUserId: r.customer_user_id, dealerId: r.dealer_id, orderReference: r.order_reference, productId: r.product_id, recipientPhoneNumber: r.recipient_phone_number, orderType: r.order_type as TelecomOrder['orderType'], quantity: r.quantity, unitPrice: r.unit_price, totalAmount: r.total_amount, currency: r.currency, paymentMethod: r.payment_method as TelecomOrder['paymentMethod'], paymentStatus: r.payment_status as OrderPaymentStatus, fulfillmentStatus: r.fulfillment_status as OrderFulfillmentStatus, retryCount: r.retry_count, maxRetries: r.max_retries, fulfilledAt: r.fulfilled_at, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapDealer(r: DealerAccountRow): DealerAccount {
  return { id: r.id, organizationId: r.organization_id, dealerName: r.dealer_name, dealerCode: r.dealer_code, countryCode: r.country_code, contactEmail: r.contact_email, contactPhone: r.contact_phone, currentBalance: r.current_balance, creditLimit: r.credit_limit, currency: r.currency, commissionTier: r.commission_tier as DealerAccount['commissionTier'], isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at };
}

function mapCommission(r: CommissionRow): Commission {
  return { id: r.id, dealerId: r.dealer_id, agentEmployeeId: r.agent_employee_id, orderId: r.order_id, commissionAmount: r.commission_amount, currency: r.currency, payoutStatus: r.payout_status as CommissionPayoutStatus, paidAt: r.paid_at, createdAt: r.created_at };
}

function mapEsim(r: EsimRow): TelecomEsim {
  return { id: r.id, orderId: r.order_id, providerId: r.provider_id, iccid: r.iccid, matchingId: r.matching_id, qrCodeUrl: r.qr_code_url, smdpAddress: r.smdp_address, deviceImei: r.device_imei, profileStatus: r.profile_status as TelecomEsim['profileStatus'], dataRemainingMb: r.data_remaining_mb, installedAt: r.installed_at, expiresAt: r.expires_at, createdAt: r.created_at };
}

function mapPorting(r: PortingRow): TelecomPortingRequest {
  return { id: r.id, organizationId: r.organization_id, customerPhoneNumber: r.customer_phone_number, sourceProviderId: r.source_provider_id, targetProviderId: r.target_provider_id, portingStatus: r.porting_status as TelecomPortingRequest['portingStatus'], rejectionReason: r.rejection_reason, scheduledPortTime: r.scheduled_port_time, completedAt: r.completed_at, createdAt: r.created_at };
}

function mapTelecomTx(r: TelecomTxRow): TelecomTransaction {
  return { id: r.id, orderId: r.order_id, rechargeId: r.recharge_id, organizationId: r.organization_id, transactionReference: r.transaction_reference, amount: r.amount, currency: r.currency, exchangeRate: r.exchange_rate, feeAmount: r.fee_amount, status: r.status as TelecomTransaction['status'], transactedAt: r.transacted_at };
}

function mapApiLog(r: ApiLogRow): TelecomApiLog {
  return { id: r.id, providerId: r.provider_id, httpMethod: r.http_method, responseStatusCode: r.response_status_code, latencyMs: r.latency_ms, createdAt: r.created_at };
}

function mapRefund(r: RefundRow): TelecomRefund {
  return { id: r.id, orderId: r.order_id, rechargeId: r.recharge_id, refundAmount: r.refund_amount, currency: r.currency, reason: r.reason, refundStatus: r.refund_status as TelecomRefund['refundStatus'], gatewayRefundRef: r.gateway_refund_ref, processedAt: r.processed_at, createdAt: r.created_at };
}

function mapPromotion(r: PromotionRow): TelecomPromotion {
  return { id: r.id, providerId: r.provider_id, promoCode: r.promo_code, promoName: r.promo_name, discountType: r.discount_type as TelecomPromotion['discountType'], discountValue: r.discount_value, minOrderAmount: r.min_order_amount, maxDiscountLimit: r.max_discount_limit, startDate: r.start_date, endDate: r.end_date, usageLimitTotal: r.usage_limit_total, usageCount: r.usage_count, isActive: r.is_active, createdAt: r.created_at };
}

// ================================================================
// === Recharges
// ================================================================

export async function getMyRecharges(
  options: { status?: RechargeStatus; from?: string; limit?: number; cursor?: string } = {}
): Promise<Recharge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Recharges are linked via organization — fetch org membership first.
  const { data: bindings } = await supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id);

  const orgIds = [...new Set(((bindings ?? []) as { organization_id: string }[]).map(r => r.organization_id))];
  if (!orgIds.length) return [];

  let q = supabase
    .from('recharges')
    .select(RECHARGE_COLS)
    .in('organization_id', orgIds);

  if (options.status) q = q.eq('recharge_status', options.status);
  if (options.from) q = q.gte('created_at', options.from);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as RechargeRow[]).map(mapRecharge);
}

export async function getRecharge(rechargeId: string): Promise<Recharge | null> {
  const { data, error } = await supabase
    .from('recharges')
    .select(RECHARGE_COLS)
    .eq('id', rechargeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRecharge(data as RechargeRow) : null;
}

export async function getPhoneRechargeHistory(
  phoneNumber: string,
  from: string
): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('recharges')
    .select(RECHARGE_COLS)
    .eq('customer_phone_number', phoneNumber)
    .gte('created_at', from)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RechargeRow[]).map(mapRecharge);
}

// ================================================================
// === Telecom Orders (READ ONLY — creation + payment go through backend)
// ================================================================

export async function getMyOrders(
  options: {
    paymentStatus?: OrderPaymentStatus;
    fulfillmentStatus?: OrderFulfillmentStatus;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<TelecomOrder[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('telecom_orders')
    .select(ORDER_COLS)
    .eq('customer_user_id', user.id);

  if (options.paymentStatus) q = q.eq('payment_status', options.paymentStatus);
  if (options.fulfillmentStatus) q = q.eq('fulfillment_status', options.fulfillmentStatus);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TelecomOrderRow[]).map(mapOrder);
}

export async function getTelecomOrder(orderId: string): Promise<TelecomOrder | null> {
  const { data, error } = await supabase
    .from('telecom_orders')
    .select(ORDER_COLS)
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as TelecomOrderRow) : null;
}

export async function getOrderByReference(
  orderReference: string
): Promise<TelecomOrder | null> {
  const { data, error } = await supabase
    .from('telecom_orders')
    .select(ORDER_COLS)
    .eq('order_reference', orderReference)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as TelecomOrderRow) : null;
}

// ================================================================
// === Dealer Accounts
// ================================================================

export async function getMyDealerAccount(): Promise<DealerAccount | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Dealers are linked via organization membership
  const { data: bindings } = await supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!bindings) return null;
  const orgId = (bindings as { organization_id: string }).organization_id;

  const { data, error } = await supabase
    .from('dealer_accounts')
    .select(DEALER_COLS)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDealer(data as DealerAccountRow) : null;
}

export async function getDealerAccount(
  dealerId: string
): Promise<DealerAccount | null> {
  const { data, error } = await supabase
    .from('dealer_accounts')
    .select(DEALER_COLS)
    .eq('id', dealerId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDealer(data as DealerAccountRow) : null;
}

// ================================================================
// === Commissions
// ================================================================

export async function getMyCommissions(
  options: { status?: CommissionPayoutStatus; limit?: number; cursor?: string } = {}
): Promise<Commission[]> {
  const dealer = await getMyDealerAccount();
  if (!dealer) return [];

  let q = supabase
    .from('commissions')
    .select(COMMISSION_COLS)
    .eq('dealer_id', dealer.id);

  if (options.status) q = q.eq('payout_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CommissionRow[]).map(mapCommission);
}

export async function getDealerCommissions(
  dealerId: string,
  options: { status?: CommissionPayoutStatus; limit?: number } = {}
): Promise<Commission[]> {
  let q = supabase
    .from('commissions')
    .select(COMMISSION_COLS)
    .eq('dealer_id', dealerId);

  if (options.status) q = q.eq('payout_status', options.status);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as CommissionRow[]).map(mapCommission);
}

// ================================================================
// === eSIMs
// ================================================================

export async function getOrderEsim(orderId: string): Promise<TelecomEsim | null> {
  const { data, error } = await supabase
    .from('telecom_esims')
    .select(ESIM_COLS)
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEsim(data as EsimRow) : null;
}

export async function getEsim(esimId: string): Promise<TelecomEsim | null> {
  const { data, error } = await supabase
    .from('telecom_esims')
    .select(ESIM_COLS)
    .eq('id', esimId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEsim(data as EsimRow) : null;
}

export async function getEsimByIccid(iccid: string): Promise<TelecomEsim | null> {
  const { data, error } = await supabase
    .from('telecom_esims')
    .select(ESIM_COLS)
    .eq('iccid', iccid)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEsim(data as EsimRow) : null;
}

// ================================================================
// === MNP Porting Requests (READ ONLY — submission goes through backend)
// ================================================================
//
// porting_pin and account_number_at_source are sensitive carrier credentials.
// Submission must go through a backend endpoint that stores them without
// returning them to the client. Frontend tracks status only.

export async function getMyPortingRequests(): Promise<TelecomPortingRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bindings } = await supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id);
  const orgIds = [...new Set(((bindings ?? []) as { organization_id: string }[]).map(r => r.organization_id))];
  if (!orgIds.length) return [];

  const { data, error } = await supabase
    .from('telecom_porting_requests')
    .select(PORTING_COLS)
    .in('organization_id', orgIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PortingRow[]).map(mapPorting);
}

export async function getPortingRequest(
  portingId: string
): Promise<TelecomPortingRequest | null> {
  const { data, error } = await supabase
    .from('telecom_porting_requests')
    .select(PORTING_COLS)
    .eq('id', portingId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPorting(data as PortingRow) : null;
}

// ================================================================
// === Telecom Transactions
// ================================================================

export async function getMyTelecomTransactions(
  orgId: string,
  options: { from?: string; limit?: number; cursor?: string } = {}
): Promise<TelecomTransaction[]> {
  let q = supabase
    .from('telecom_transactions')
    .select(TELECOM_TX_COLS)
    .eq('organization_id', orgId);

  if (options.from) q = q.gte('transacted_at', options.from);
  if (options.cursor) q = q.lt('transacted_at', options.cursor);

  const { data, error } = await q
    .order('transacted_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TelecomTxRow[]).map(mapTelecomTx);
}

export async function getOrderTransaction(
  orderId: string
): Promise<TelecomTransaction | null> {
  const { data, error } = await supabase
    .from('telecom_transactions')
    .select(TELECOM_TX_COLS)
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTelecomTx(data as TelecomTxRow) : null;
}

// ================================================================
// === Telecom API Logs (admin latency monitoring — no request/response data)
// ================================================================

export async function getProviderApiLogs(
  providerId: string,
  options: { from?: string; limit?: number } = {}
): Promise<TelecomApiLog[]> {
  let q = supabase
    .from('telecom_api_logs')
    .select(API_LOG_COLS)
    .eq('provider_id', providerId);

  if (options.from) q = q.gte('created_at', options.from);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as ApiLogRow[]).map(mapApiLog);
}

// ================================================================
// === Telecom Refunds
// ================================================================

export async function getOrderRefunds(orderId: string): Promise<TelecomRefund[]> {
  const { data, error } = await supabase
    .from('telecom_refunds')
    .select(REFUND_COLS)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RefundRow[]).map(mapRefund);
}

export async function getMyRefunds(
  options: { limit?: number; cursor?: string } = {}
): Promise<TelecomRefund[]> {
  const myOrders = await getMyOrders();
  if (!myOrders.length) return [];

  const orderIds = myOrders.map(o => o.id);

  let q = supabase
    .from('telecom_refunds')
    .select(REFUND_COLS)
    .in('order_id', orderIds);

  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as RefundRow[]).map(mapRefund);
}

// ================================================================
// === Telecom Inventory (availability counts only — no serial/PIN data)
// ================================================================

export async function getProductStockAvailability(
  productId: string
): Promise<TelecomInventoryAvailability> {
  // Count only — never select individual rows (which contain serial_number and encrypted_pin_code)
  const { count, error } = await supabase
    .from('telecom_inventory')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('stock_status', 'in_stock');
  if (error) throw error;
  return { productId, availableCount: count ?? 0 };
}

export async function getProviderStockSummary(
  providerId: string
): Promise<TelecomInventoryAvailability[]> {
  // Fetch all in-stock product IDs for this provider (no serial/PIN)
  const { data: products, error: pErr } = await supabase
    .from('telecom_products')
    .select('id')
    .eq('provider_id', providerId)
    .eq('is_available', true);
  if (pErr) throw pErr;
  if (!products?.length) return [];

  const productIds = (products as { id: string }[]).map(p => p.id);
  const results: TelecomInventoryAvailability[] = [];

  for (const productId of productIds) {
    const availability = await getProductStockAvailability(productId);
    if (availability.availableCount > 0) results.push(availability);
  }

  return results;
}

// ================================================================
// === Telecom Promotions
// ================================================================

export async function getActivePromotions(
  options: { providerId?: string; limit?: number } = {}
): Promise<TelecomPromotion[]> {
  const now = new Date().toISOString();

  let q = supabase
    .from('telecom_promotions')
    .select(PROMOTION_COLS)
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now);

  if (options.providerId) q = q.eq('provider_id', options.providerId);

  const { data, error } = await q
    .order('end_date', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as PromotionRow[]).map(mapPromotion);
}

export async function getTelecomPromotion(
  promoId: string
): Promise<TelecomPromotion | null> {
  const { data, error } = await supabase
    .from('telecom_promotions')
    .select(PROMOTION_COLS)
    .eq('id', promoId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPromotion(data as PromotionRow) : null;
}

export async function getPromotionByCode(
  promoCode: string
): Promise<TelecomPromotion | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('telecom_promotions')
    .select(PROMOTION_COLS)
    .eq('promo_code', promoCode)
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPromotion(data as PromotionRow) : null;
}

// Validates a promo code for a given order amount.
// Returns the promotion if valid, null otherwise.
export async function validatePromoCode(
  promoCode: string,
  orderAmount: number
): Promise<TelecomPromotion | null> {
  const promo = await getPromotionByCode(promoCode);
  if (!promo) return null;
  if (orderAmount < promo.minOrderAmount) return null;
  if (promo.usageLimitTotal !== null && promo.usageCount >= promo.usageLimitTotal) return null;
  return promo;
}

// ── Part 3 — Row types & column constants ─────────────────────────────────

type CircuitBreakerEventRow = {
  id: string; provider_id: string; previous_state: string; new_state: string;
  trigger_reason: string; failure_count_snapshot: number;
  triggered_at: string; resolved_at: string | null;
};

type RoutingRuleRow = {
  id: string; country_code: string; service_type: string;
  preferred_provider_id: string; fallback_provider_id: string | null;
  max_allowable_latency_ms: number; min_success_rate_percentage: number;
  is_active: boolean; priority_weight: number; created_at: string;
};

type TelecomAuditLogRow = {
  id: string; organization_id: string | null; actor_user_id: string | null;
  actor_dealer_id: string | null; action_type: string; target_table: string;
  target_record_id: string; created_at: string;
};

const CB_EVENT_COLS =
  'id, provider_id, previous_state, new_state, trigger_reason, failure_count_snapshot, triggered_at, resolved_at';

const ROUTING_RULE_COLS =
  'id, country_code, service_type, preferred_provider_id, fallback_provider_id, max_allowable_latency_ms, min_success_rate_percentage, is_active, priority_weight, created_at';

const TELECOM_AUDIT_COLS =
  'id, organization_id, actor_user_id, actor_dealer_id, action_type, target_table, target_record_id, created_at';

function mapCircuitBreakerEvent(r: CircuitBreakerEventRow): TelecomCircuitBreakerEvent {
  return { id: r.id, providerId: r.provider_id, previousState: r.previous_state, newState: r.new_state as TelecomCircuitBreakerEvent['newState'], triggerReason: r.trigger_reason, failureCountSnapshot: r.failure_count_snapshot, triggeredAt: r.triggered_at, resolvedAt: r.resolved_at };
}

function mapRoutingRule(r: RoutingRuleRow): TelecomRoutingRule {
  return { id: r.id, countryCode: r.country_code, serviceType: r.service_type as TelecomRoutingRule['serviceType'], preferredProviderId: r.preferred_provider_id, fallbackProviderId: r.fallback_provider_id, maxAllowableLatencyMs: r.max_allowable_latency_ms, minSuccessRatePercentage: r.min_success_rate_percentage, isActive: r.is_active, priorityWeight: r.priority_weight, createdAt: r.created_at };
}

function mapTelecomAuditLog(r: TelecomAuditLogRow): TelecomAuditLog {
  return { id: r.id, organizationId: r.organization_id, actorUserId: r.actor_user_id, actorDealerId: r.actor_dealer_id, actionType: r.action_type, targetTable: r.target_table, targetRecordId: r.target_record_id, createdAt: r.created_at };
}

// ================================================================
// === Circuit Breaker Events
// ================================================================

export async function getProviderCircuitBreakerEvents(
  providerId: string,
  options: { from?: string; limit?: number } = {}
): Promise<TelecomCircuitBreakerEvent[]> {
  let q = supabase
    .from('telecom_circuit_breaker_events')
    .select(CB_EVENT_COLS)
    .eq('provider_id', providerId);

  if (options.from) q = q.gte('triggered_at', options.from);

  const { data, error } = await q
    .order('triggered_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CircuitBreakerEventRow[]).map(mapCircuitBreakerEvent);
}

export async function getOpenCircuitBreakers(): Promise<TelecomCircuitBreakerEvent[]> {
  const { data, error } = await supabase
    .from('telecom_circuit_breaker_events')
    .select(CB_EVENT_COLS)
    .in('new_state', ['open', 'half_open', 'quantum_isolated'])
    .is('resolved_at', null)
    .order('triggered_at', { ascending: false });
  if (error) throw error;
  return (data as CircuitBreakerEventRow[]).map(mapCircuitBreakerEvent);
}

// ================================================================
// === Routing Rules
// ================================================================

export async function getRoutingRules(
  options: { countryCode?: string; serviceType?: TelecomRoutingRule['serviceType']; activeOnly?: boolean } = {}
): Promise<TelecomRoutingRule[]> {
  let q = supabase
    .from('telecom_routing_rules')
    .select(ROUTING_RULE_COLS);

  if (options.countryCode) q = q.eq('country_code', options.countryCode);
  if (options.serviceType) q = q.eq('service_type', options.serviceType);
  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q.order('priority_weight', { ascending: false });
  if (error) throw error;
  return (data as RoutingRuleRow[]).map(mapRoutingRule);
}

export async function getRoutingRule(ruleId: string): Promise<TelecomRoutingRule | null> {
  const { data, error } = await supabase
    .from('telecom_routing_rules')
    .select(ROUTING_RULE_COLS)
    .eq('id', ruleId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRoutingRule(data as RoutingRuleRow) : null;
}

export async function getCountryRoutingRules(
  countryCode: string,
  serviceType?: TelecomRoutingRule['serviceType']
): Promise<TelecomRoutingRule[]> {
  let q = supabase
    .from('telecom_routing_rules')
    .select(ROUTING_RULE_COLS)
    .eq('country_code', countryCode)
    .eq('is_active', true);

  if (serviceType) q = q.eq('service_type', serviceType);

  const { data, error } = await q.order('priority_weight', { ascending: false });
  if (error) throw error;
  return (data as RoutingRuleRow[]).map(mapRoutingRule);
}

// ================================================================
// === Telecom Audit Logs (READ ONLY — always)
// ================================================================

export async function getTelecomAuditLogs(
  orgId: string,
  options: {
    actorUserId?: string;
    targetTable?: string;
    from?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<TelecomAuditLog[]> {
  let q = supabase
    .from('telecom_audit_logs')
    .select(TELECOM_AUDIT_COLS)
    .eq('organization_id', orgId);

  if (options.actorUserId) q = q.eq('actor_user_id', options.actorUserId);
  if (options.targetTable) q = q.eq('target_table', options.targetTable);
  if (options.from) q = q.gte('created_at', options.from);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as TelecomAuditLogRow[]).map(mapTelecomAuditLog);
}

export async function getRecordAuditHistory(
  targetTable: string,
  targetRecordId: string
): Promise<TelecomAuditLog[]> {
  const { data, error } = await supabase
    .from('telecom_audit_logs')
    .select(TELECOM_AUDIT_COLS)
    .eq('target_table', targetTable)
    .eq('target_record_id', targetRecordId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TelecomAuditLogRow[]).map(mapTelecomAuditLog);
}

// ── Part 5 — Row types & column constants ─────────────────────────────────

type NeuralTelemetryRow = {
  id: string; organization_id: string; cluster_node_id: string | null;
  anomaly_probability_score: number; predictive_congestion_level: string;
  ai_recommendation_action: string; is_executed_automatically: boolean;
  analyzed_at: string;
};

type ClearinghouseRow = {
  id: string; source_provider_id: string; destination_provider_id: string;
  reconciliation_period_start: string; reconciliation_period_end: string;
  total_traffic_volume_mb: number; total_recharges_count: number;
  gross_settlement_amount: number; net_payable_amount: number;
  currency: string; settlement_status: string; clearinghouse_reference: string;
  created_at: string;
};

type HfMetricRow = {
  id: string; metric_timestamp: string; metric_category: string;
  provider_id: string | null; metric_value: number;
};

type FailoverLogRow = {
  id: string; failed_provider_id: string; fallback_provider_id: string;
  trigger_latency_ms: number; affected_country_code: string;
  recovery_status: string; switched_at: string;
};

const NEURAL_TELEMETRY_COLS =
  'id, organization_id, cluster_node_id, anomaly_probability_score, predictive_congestion_level, ai_recommendation_action, is_executed_automatically, analyzed_at';

const CLEARINGHOUSE_COLS =
  'id, source_provider_id, destination_provider_id, reconciliation_period_start, reconciliation_period_end, total_traffic_volume_mb, total_recharges_count, gross_settlement_amount, net_payable_amount, currency, settlement_status, clearinghouse_reference, created_at';

const HF_METRIC_COLS =
  'id, metric_timestamp, metric_category, provider_id, metric_value';

const FAILOVER_LOG_COLS =
  'id, failed_provider_id, fallback_provider_id, trigger_latency_ms, affected_country_code, recovery_status, switched_at';

function mapNeuralTelemetry(r: NeuralTelemetryRow): TelecomAiNeuralTelemetry {
  return { id: r.id, organizationId: r.organization_id, clusterNodeId: r.cluster_node_id, anomalyProbabilityScore: r.anomaly_probability_score, predictiveCongestionLevel: r.predictive_congestion_level as TelecomAiNeuralTelemetry['predictiveCongestionLevel'], aiRecommendationAction: r.ai_recommendation_action, isExecutedAutomatically: r.is_executed_automatically, analyzedAt: r.analyzed_at };
}

function mapClearinghouse(r: ClearinghouseRow): TelecomInterCarrierClearinghouse {
  return { id: r.id, sourceProviderId: r.source_provider_id, destinationProviderId: r.destination_provider_id, reconciliationPeriodStart: r.reconciliation_period_start, reconciliationPeriodEnd: r.reconciliation_period_end, totalTrafficVolumeMb: r.total_traffic_volume_mb, totalRechargesCount: r.total_recharges_count, grossSettlementAmount: r.gross_settlement_amount, netPayableAmount: r.net_payable_amount, currency: r.currency, settlementStatus: r.settlement_status as SettlementStatus, clearinghouseReference: r.clearinghouse_reference, createdAt: r.created_at };
}

function mapHfMetric(r: HfMetricRow): TelecomHighFrequencyMetric {
  return { id: r.id, metricTimestamp: r.metric_timestamp, metricCategory: r.metric_category, providerId: r.provider_id, metricValue: r.metric_value };
}

function mapFailoverLog(r: FailoverLogRow): TelecomAutonomousFailoverLog {
  return { id: r.id, failedProviderId: r.failed_provider_id, fallbackProviderId: r.fallback_provider_id, triggerLatencyMs: r.trigger_latency_ms, affectedCountryCode: r.affected_country_code, recoveryStatus: r.recovery_status as TelecomAutonomousFailoverLog['recoveryStatus'], switchedAt: r.switched_at };
}

// ================================================================
// === AI Neural Telemetry
// ================================================================

export async function getOrgNeuralTelemetry(
  orgId: string,
  from: string,
  options: { congestionLevel?: TelecomAiNeuralTelemetry['predictiveCongestionLevel']; limit?: number } = {}
): Promise<TelecomAiNeuralTelemetry[]> {
  let q = supabase
    .from('telecom_ai_neural_telemetry')
    .select(NEURAL_TELEMETRY_COLS)
    .eq('organization_id', orgId)
    .gte('analyzed_at', from);

  if (options.congestionLevel) q = q.eq('predictive_congestion_level', options.congestionLevel);

  const { data, error } = await q
    .order('analyzed_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as NeuralTelemetryRow[]).map(mapNeuralTelemetry);
}

export async function getNodeTelemetry(
  nodeId: string,
  from: string
): Promise<TelecomAiNeuralTelemetry[]> {
  const { data, error } = await supabase
    .from('telecom_ai_neural_telemetry')
    .select(NEURAL_TELEMETRY_COLS)
    .eq('cluster_node_id', nodeId)
    .gte('analyzed_at', from)
    .order('analyzed_at', { ascending: false });
  if (error) throw error;
  return (data as NeuralTelemetryRow[]).map(mapNeuralTelemetry);
}

export async function getCriticalTelemetryAlerts(
  orgId: string,
  from: string
): Promise<TelecomAiNeuralTelemetry[]> {
  const { data, error } = await supabase
    .from('telecom_ai_neural_telemetry')
    .select(NEURAL_TELEMETRY_COLS)
    .eq('organization_id', orgId)
    .gte('analyzed_at', from)
    .in('predictive_congestion_level', ['critical_bottleneck', 'singularity_lock'])
    .order('analyzed_at', { ascending: false });
  if (error) throw error;
  return (data as NeuralTelemetryRow[]).map(mapNeuralTelemetry);
}

// ================================================================
// === Inter-Carrier Clearinghouse
// ================================================================

export async function getClearinghouseSettlements(
  options: {
    sourceProviderId?: string;
    destinationProviderId?: string;
    status?: SettlementStatus;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<TelecomInterCarrierClearinghouse[]> {
  let q = supabase
    .from('telecom_inter_carrier_clearinghouse')
    .select(CLEARINGHOUSE_COLS);

  if (options.sourceProviderId) q = q.eq('source_provider_id', options.sourceProviderId);
  if (options.destinationProviderId) q = q.eq('destination_provider_id', options.destinationProviderId);
  if (options.status) q = q.eq('settlement_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ClearinghouseRow[]).map(mapClearinghouse);
}

export async function getClearinghouseSettlement(
  settlementId: string
): Promise<TelecomInterCarrierClearinghouse | null> {
  const { data, error } = await supabase
    .from('telecom_inter_carrier_clearinghouse')
    .select(CLEARINGHOUSE_COLS)
    .eq('id', settlementId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapClearinghouse(data as ClearinghouseRow) : null;
}

export async function getClearinghouseByReference(
  reference: string
): Promise<TelecomInterCarrierClearinghouse | null> {
  const { data, error } = await supabase
    .from('telecom_inter_carrier_clearinghouse')
    .select(CLEARINGHOUSE_COLS)
    .eq('clearinghouse_reference', reference)
    .maybeSingle();
  if (error) throw error;
  return data ? mapClearinghouse(data as ClearinghouseRow) : null;
}

// ================================================================
// === High-Frequency Metrics (partitioned — always include from date)
// ================================================================
//
// telecom_high_frequency_metrics has no PRIMARY KEY — it is partitioned
// by metric_timestamp. All queries MUST include a metric_timestamp lower
// bound (.gte) to enable partition pruning and prevent full-table scans.

export async function getProviderMetrics(
  providerId: string,
  from: string,
  options: { category?: string; limit?: number } = {}
): Promise<TelecomHighFrequencyMetric[]> {
  let q = supabase
    .from('telecom_high_frequency_metrics')
    .select(HF_METRIC_COLS)
    .eq('provider_id', providerId)
    .gte('metric_timestamp', from);

  if (options.category) q = q.eq('metric_category', options.category);

  const { data, error } = await q
    .order('metric_timestamp', { ascending: false })
    .limit(options.limit ?? 500);
  if (error) throw error;
  return (data as HfMetricRow[]).map(mapHfMetric);
}

export async function getCategoryMetrics(
  category: string,
  from: string,
  limit: number = 200
): Promise<TelecomHighFrequencyMetric[]> {
  const { data, error } = await supabase
    .from('telecom_high_frequency_metrics')
    .select(HF_METRIC_COLS)
    .eq('metric_category', category)
    .gte('metric_timestamp', from)
    .order('metric_timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as HfMetricRow[]).map(mapHfMetric);
}

// ================================================================
// === Autonomous Failover Logs
// ================================================================

export async function getFailoverLogs(
  options: {
    countryCode?: string;
    failedProviderId?: string;
    from?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<TelecomAutonomousFailoverLog[]> {
  let q = supabase
    .from('telecom_autonomous_failover_logs')
    .select(FAILOVER_LOG_COLS);

  if (options.countryCode) q = q.eq('affected_country_code', options.countryCode);
  if (options.failedProviderId) q = q.eq('failed_provider_id', options.failedProviderId);
  if (options.from) q = q.gte('switched_at', options.from);
  if (options.cursor) q = q.lt('switched_at', options.cursor);

  const { data, error } = await q
    .order('switched_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FailoverLogRow[]).map(mapFailoverLog);
}

export async function getProviderFailoverHistory(
  failedProviderId: string,
  from: string
): Promise<TelecomAutonomousFailoverLog[]> {
  const { data, error } = await supabase
    .from('telecom_autonomous_failover_logs')
    .select(FAILOVER_LOG_COLS)
    .eq('failed_provider_id', failedProviderId)
    .gte('switched_at', from)
    .order('switched_at', { ascending: false });
  if (error) throw error;
  return (data as FailoverLogRow[]).map(mapFailoverLog);
}
