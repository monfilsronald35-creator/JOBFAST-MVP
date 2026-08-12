// ── Telecom Providers ─────────────────────────────────────────────────────

export const TELECOM_STATUSES = [
  'active', 'maintenance', 'deprecated', 'suspended', 'quantum_blacklisted',
] as const;
export type TelecomStatus = typeof TELECOM_STATUSES[number];

export const CIRCUIT_BREAKER_STATUSES = ['closed', 'half_open', 'open'] as const;
export type CircuitBreakerStatus = typeof CIRCUIT_BREAKER_STATUSES[number];

export const TELECOM_SERVICES = [
  'airtime', 'data', 'sms', 'voice', 'bundle', 'esim', 'roaming', 'bill_payment', 'fiber_internet',
] as const;
export type TelecomService = typeof TELECOM_SERVICES[number];

export interface TelecomProvider {
  id: string;
  providerCode: string;
  providerName: string;
  parentEnterprise: string | null;
  countryCode: string;
  supportedServices: string[];
  supportedCurrencies: string[];
  logoUrl: string | null;
  priorityRank: number;
  isPrimaryGateway: boolean;
  circuitBreakerStatus: CircuitBreakerStatus;
  status: TelecomStatus;
  createdAt: string;
  updatedAt: string;
  // api_base_url, api_backup_url excluded — backend infrastructure endpoints (security)
  // api_version excluded — backend routing detail
  // metadata excluded — internal operational data
}

// ── Provider Health Monitors ──────────────────────────────────────────────

export interface TelecomProviderHealthMonitor {
  id: string;
  providerId: string;
  latencyMs: number;
  successRate24h: number;
  totalRequests24h: number;
  failedRequests24h: number;
  lastPingAt: string;
  isHealthy: boolean;
  autoFailoverTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

// telecom_provider_credentials — ENTIRE TABLE EXCLUDED
// Encrypted API keys, secrets, RSA private keys, and signing secrets
// are backend vault data — NEVER exposed to the React frontend.

// ── Edge Routing Nodes ────────────────────────────────────────────────────

export interface TelecomEdgeRoutingNode {
  id: string;
  nodeCode: string;
  regionName: string;
  continent: string;
  isActive: boolean;
  currentLoadPercentage: number;
  createdAt: string;
  // ip_address excluded — server infrastructure IP (exposes internal network topology)
}

// ── FX Rates ──────────────────────────────────────────────────────────────

export interface TelecomFxRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  isActive: boolean;
  updatedAt: string;
  // markup_percentage excluded — internal profit margin on FX spread (NEVER expose to clients)
  // source_provider excluded — internal oracle routing detail
}

// ── Telecom Products ──────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  'airtime_recharge', 'data_bundle', 'sms_bundle', 'voice_bundle', 'combo_bundle',
  'esim_profile', 'international_roaming', 'bill_payment', 'fiber_broadband',
] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export interface TelecomProduct {
  id: string;
  providerId: string;
  productSku: string;
  productName: string;
  productCategory: ProductCategory;
  faceValue: number;
  faceCurrency: string;
  sellingPrice: number;
  sellingCurrency: string;
  taxPercentage: number;
  isPromotional: boolean;
  isAvailable: boolean;
  allowPartialPayment: boolean;
  createdAt: string;
  updatedAt: string;
  // profit_margin_percentage excluded — NEVER (internal business margin)
  // metadata excluded — internal product configuration
}

// ── Data Packages ─────────────────────────────────────────────────────────

export const NETWORK_TECHNOLOGIES = ['2G', '3G', '4G_LTE', '5G', 'FIBER', 'SATELLITE'] as const;
export type NetworkTechnology = typeof NETWORK_TECHNOLOGIES[number];

export interface DataPackage {
  id: string;
  productId: string;
  dataAmountMb: number; // -1 = unlimited real-time
  validityDurationHours: number;
  maxSpeedDownloadMbps: number;
  maxSpeedUploadMbps: number;
  networkTechnology: NetworkTechnology;
  allowsHotspot: boolean;
  isUnlimited: boolean;
  fairUsagePolicyLimitMb: number | null;
  supportsRoaming: boolean;
  roamingCountries: string[];
  createdAt: string;
}

// ── SMS Packages ──────────────────────────────────────────────────────────

export const SMS_SCOPES = [
  'local', 'regional', 'international', 'all_networks', 'shortcode_premium',
] as const;
export type SmsScope = typeof SMS_SCOPES[number];

export interface SmsPackage {
  id: string;
  productId: string;
  smsCount: number; // -1 = unlimited
  validityDurationHours: number;
  smsScope: SmsScope;
  supportsDeliveryReports: boolean;
  createdAt: string;
}

// ── Recharges ─────────────────────────────────────────────────────────────

export const RECHARGE_TYPES = [
  'direct', 'voucher_pin', 'ussd_push', 'data_direct', 'bundle_activation',
] as const;
export type RechargeType = typeof RECHARGE_TYPES[number];

export const RECHARGE_STATUSES = [
  'queued', 'processing', 'success', 'failed', 'refunded', 'fraud_blocked',
] as const;
export type RechargeStatus = typeof RECHARGE_STATUSES[number];

export interface Recharge {
  id: string;
  organizationId: string | null;
  providerId: string;
  customerPhoneNumber: string;
  countryCode: string;
  amountCharged: number;
  currency: string;
  airtimeValue: number;
  airtimeCurrency: string;
  rechargeType: RechargeType;
  rechargeStatus: RechargeStatus;
  operatorTransactionId: string | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  // edge_node_id excluded — internal routing infrastructure reference
}

// ── Telecom Orders ────────────────────────────────────────────────────────

export const ORDER_TYPES = [
  'recharge', 'data_package', 'sms_package', 'combo_bundle',
  'esim_activation', 'roaming_pass', 'bill_payment',
] as const;
export type TelecomOrderType = typeof ORDER_TYPES[number];

export const ORDER_PAYMENT_METHODS = [
  'wallet', 'credit_card', 'crypto', 'bank_wire', 'dealer_credit', 'stablecoin',
] as const;
export type OrderPaymentMethod = typeof ORDER_PAYMENT_METHODS[number];

export const ORDER_PAYMENT_STATUSES = [
  'pending', 'paid', 'failed', 'refunded', 'partially_refunded',
] as const;
export type OrderPaymentStatus = typeof ORDER_PAYMENT_STATUSES[number];

export const ORDER_FULFILLMENT_STATUSES = [
  'pending', 'processing', 'fulfilled', 'failed', 'cancelled',
] as const;
export type OrderFulfillmentStatus = typeof ORDER_FULFILLMENT_STATUSES[number];

export interface TelecomOrder {
  id: string;
  organizationId: string | null;
  customerUserId: string | null;
  dealerId: string | null;
  orderReference: string;
  productId: string;
  recipientPhoneNumber: string;
  orderType: TelecomOrderType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  retryCount: number;
  maxRetries: number;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // gateway_response excluded — internal gateway data, may contain auth tokens
  // metadata excluded — internal processing data
}

// ── Dealer Accounts ───────────────────────────────────────────────────────

export const COMMISSION_TIERS = [
  'standard', 'silver', 'gold', 'platinum', 'quantum_enterprise',
] as const;
export type CommissionTier = typeof COMMISSION_TIERS[number];

export interface DealerAccount {
  id: string;
  organizationId: string;
  dealerName: string;
  dealerCode: string;
  countryCode: string;
  contactEmail: string;
  contactPhone: string | null;
  currentBalance: number;
  creditLimit: number;
  currency: string;
  commissionTier: CommissionTier;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // metadata excluded — internal dealer configuration
}

// ── Commissions ───────────────────────────────────────────────────────────

export const COMMISSION_PAYOUT_STATUSES = [
  'pending', 'approved', 'paid', 'reversed', 'cancelled',
] as const;
export type CommissionPayoutStatus = typeof COMMISSION_PAYOUT_STATUSES[number];

export interface Commission {
  id: string;
  dealerId: string | null;
  agentEmployeeId: string | null;
  orderId: string;
  commissionAmount: number;
  currency: string;
  payoutStatus: CommissionPayoutStatus;
  paidAt: string | null;
  createdAt: string;
  // commission_percentage excluded — reveals internal tier pricing structure
}

// ── eSIMs ─────────────────────────────────────────────────────────────────

export const ESIM_PROFILE_STATUSES = [
  'generated', 'downloaded', 'installed', 'active', 'expired', 'deleted',
] as const;
export type EsimProfileStatus = typeof ESIM_PROFILE_STATUSES[number];

export interface TelecomEsim {
  id: string;
  orderId: string;
  providerId: string;
  iccid: string;
  matchingId: string;  // part of LPA URL: LPA:1$smdpAddress$matchingId
  qrCodeUrl: string;
  smdpAddress: string; // SM-DP+ server address for manual eSIM setup
  deviceImei: string | null;
  profileStatus: EsimProfileStatus;
  dataRemainingMb: number;
  installedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ── MNP Porting Requests ──────────────────────────────────────────────────

export const PORTING_STATUSES = [
  'submitted', 'verifying', 'approved_by_donor', 'scheduled',
  'completed', 'rejected', 'cancelled',
] as const;
export type PortingStatus = typeof PORTING_STATUSES[number];

export interface TelecomPortingRequest {
  id: string;
  organizationId: string;
  customerPhoneNumber: string;
  sourceProviderId: string;
  targetProviderId: string;
  portingStatus: PortingStatus;
  rejectionReason: string | null;
  scheduledPortTime: string | null;
  completedAt: string | null;
  createdAt: string;
  // porting_pin excluded — sensitive carrier authorization code (submitted via backend only)
  // account_number_at_source excluded — source carrier account credential
}

// ── Telecom Transactions ──────────────────────────────────────────────────

export const TELECOM_TX_STATUSES = ['pending', 'completed', 'reversed', 'failed'] as const;
export type TelecomTxStatus = typeof TELECOM_TX_STATUSES[number];

export interface TelecomTransaction {
  id: string;
  orderId: string | null;
  rechargeId: string | null;
  organizationId: string;
  transactionReference: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  feeAmount: number;
  status: TelecomTxStatus;
  transactedAt: string;
  // debit_account, credit_account excluded — internal double-entry accounting codes
}

// telecom_webhooks — ENTIRE TABLE EXCLUDED
// signature_header and payload_data are backend-only security processing fields.
// All webhook verification and event processing runs server-side.

// ── Telecom API Logs (admin metrics only) ─────────────────────────────────

export interface TelecomApiLog {
  id: string;
  providerId: string | null;
  httpMethod: string;
  responseStatusCode: number;
  latencyMs: number;
  createdAt: string;
  // endpoint_url excluded — server infrastructure URL (security)
  // request_headers excluded — may contain Authorization / API key headers (NEVER)
  // request_payload excluded — may contain phone numbers and credentials (NEVER)
  // response_payload excluded — may contain sensitive provider response data (NEVER)
  // ip_address excluded — PII
}

// ── Telecom Refunds ───────────────────────────────────────────────────────

export const REFUND_STATUSES = ['pending', 'approved', 'processed', 'rejected'] as const;
export type RefundStatus = typeof REFUND_STATUSES[number];

export interface TelecomRefund {
  id: string;
  orderId: string;
  rechargeId: string | null;
  refundAmount: number;
  currency: string;
  reason: string;
  refundStatus: RefundStatus;
  gatewayRefundRef: string | null;
  processedAt: string | null;
  createdAt: string;
}

// ── Telecom Inventory (availability counts only) ──────────────────────────

// Individual inventory rows (serial_number, encrypted_pin_code) are NEVER
// exposed to the frontend — PIN data is backend vault. Frontend may query
// only aggregate availability counts.

export interface TelecomInventoryAvailability {
  productId: string;
  availableCount: number;
}

// ── Telecom Promotions ────────────────────────────────────────────────────

export const DISCOUNT_TYPES = [
  'percentage', 'fixed_amount', 'bonus_airtime_multiplier', 'free_data_mb',
] as const;
export type DiscountType = typeof DISCOUNT_TYPES[number];

export interface TelecomPromotion {
  id: string;
  providerId: string | null;
  promoCode: string;
  promoName: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountLimit: number | null;
  startDate: string;
  endDate: string;
  usageLimitTotal: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

// ── Circuit Breaker Events ────────────────────────────────────────────────

export const CIRCUIT_BREAKER_NEW_STATES = [
  'closed', 'half_open', 'open', 'quantum_isolated',
] as const;
export type CircuitBreakerNewState = typeof CIRCUIT_BREAKER_NEW_STATES[number];

export interface TelecomCircuitBreakerEvent {
  id: string;
  providerId: string;
  previousState: string;
  newState: CircuitBreakerNewState;
  triggerReason: string;
  failureCountSnapshot: number;
  triggeredAt: string;
  resolvedAt: string | null;
}

// telecom_fraud_ai_detections — ENTIRE TABLE EXCLUDED
// risk_score, detected_anomalies, ml_model_version — exposing these fraud detection
// signals to the frontend would let adversaries tune attacks to evade the ML model.
// The order/recharge 'fraud_blocked' status communicates the outcome without revealing signals.

// ── Routing Rules ─────────────────────────────────────────────────────────

export const ROUTING_SERVICE_TYPES = [
  'recharge', 'data', 'sms', 'esim', 'roaming',
] as const;
export type RoutingServiceType = typeof ROUTING_SERVICE_TYPES[number];

export interface TelecomRoutingRule {
  id: string;
  countryCode: string;
  serviceType: RoutingServiceType;
  preferredProviderId: string;
  fallbackProviderId: string | null;
  maxAllowableLatencyMs: number;
  minSuccessRatePercentage: number;
  isActive: boolean;
  priorityWeight: number;
  createdAt: string;
}

// ── Telecom Audit Logs ────────────────────────────────────────────────────

export interface TelecomAuditLog {
  id: string;
  organizationId: string | null;
  actorUserId: string | null;
  actorDealerId: string | null;
  actionType: string;
  targetTable: string;
  targetRecordId: string;
  createdAt: string;
  // previous_state, new_state excluded — may contain any sensitive data
  // ip_address excluded — PII
  // user_agent excluded — device fingerprinting PII
  // cryptographic_hmac excluded — immutability verification, backend verifies
}

// telecom_rate_limits — ENTIRE TABLE EXCLUDED
// Exposing is_blocked, blocked_until, request_count, and window_expires_at would
// let attackers time DDoS bypass attempts by observing rate limit reset windows.

// ── AI Neural Telemetry ───────────────────────────────────────────────────

export const CONGESTION_LEVELS = [
  'optimal', 'moderate', 'high_strain', 'critical_bottleneck', 'singularity_lock',
] as const;
export type CongestionLevel = typeof CONGESTION_LEVELS[number];

export interface TelecomAiNeuralTelemetry {
  id: string;
  organizationId: string;
  clusterNodeId: string | null;
  anomalyProbabilityScore: number;
  predictiveCongestionLevel: CongestionLevel;
  aiRecommendationAction: string;
  isExecutedAutomatically: boolean;
  analyzedAt: string;
}

// telecom_hsm_vault_keys — ENTIRE TABLE EXCLUDED — ABSOLUTE NEVER
// encrypted_private_key_material is cryptographic HSM key material.
// No types, no service functions, zero frontend presence for this table.

// ── Inter-Carrier Clearinghouse ───────────────────────────────────────────

export const SETTLEMENT_STATUSES = [
  'unreconciled', 'under_dispute', 'cleared_and_approved', 'paid_in_full',
] as const;
export type SettlementStatus = typeof SETTLEMENT_STATUSES[number];

export interface TelecomInterCarrierClearinghouse {
  id: string;
  sourceProviderId: string;
  destinationProviderId: string;
  reconciliationPeriodStart: string;
  reconciliationPeriodEnd: string;
  totalTrafficVolumeMb: number;
  totalRechargesCount: number;
  grossSettlementAmount: number;
  netPayableAmount: number;
  currency: string;
  settlementStatus: SettlementStatus;
  clearinghouseReference: string;
  createdAt: string;
}

// ── High-Frequency Metrics ────────────────────────────────────────────────

// This table has no PRIMARY KEY constraint — it is partitioned by metric_timestamp.
// All queries MUST include a metric_timestamp lower bound for partition pruning.

export interface TelecomHighFrequencyMetric {
  id: string;
  metricTimestamp: string;
  metricCategory: string;
  providerId: string | null;
  metricValue: number;
  // metadata excluded — internal metrics metadata
}

// ── Autonomous Failover Logs ──────────────────────────────────────────────

export const FAILOVER_RECOVERY_STATUSES = [
  'success', 'degraded', 'total_outage_mitigated',
] as const;
export type FailoverRecoveryStatus = typeof FAILOVER_RECOVERY_STATUSES[number];

export interface TelecomAutonomousFailoverLog {
  id: string;
  failedProviderId: string;
  fallbackProviderId: string;
  triggerLatencyMs: number;
  affectedCountryCode: string;
  recoveryStatus: FailoverRecoveryStatus;
  switchedAt: string;
}
