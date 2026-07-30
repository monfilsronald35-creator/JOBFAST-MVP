export enum PaymentMethod {
  Card          = 'card',
  Wallet        = 'wallet',
  Bank          = 'bank',
  MobileMoney   = 'mobile_money',
  Crypto        = 'crypto',
  QRCode        = 'qr_code',
  CashAgent     = 'cash_agent',
  VirtualCard   = 'virtual_card',
  Escrow        = 'escrow',
  Subscription  = 'subscription',
  SplitPayment  = 'split_payment',
}

export enum PaymentStatus {
  Pending        = 'pending',
  Authorized     = 'authorized',
  Captured       = 'captured',
  Completed      = 'completed',
  Failed         = 'failed',
  Cancelled      = 'cancelled',
  Refunded       = 'refunded',
  PartialRefund  = 'partial_refund',
  Disputed       = 'disputed',
  RequiresAction = 'requires_action',
}

export enum ProviderName {
  // Online gateways
  Stripe        = 'stripe',
  PayPal        = 'paypal',
  Adyen         = 'adyen',
  Checkout      = 'checkout',
  Worldpay      = 'worldpay',
  Braintree     = 'braintree',
  // Mobile money
  MonCash       = 'moncash',
  NatCash       = 'natcash',
  MPesa         = 'm_pesa',
  OrangeMoney   = 'orange_money',
  MTNMoMo       = 'mtn_momo',
  AirtelMoney   = 'airtel_money',
  // Digital wallets
  ApplePay      = 'apple_pay',
  GooglePay     = 'google_pay',
  SamsungWallet = 'samsung_wallet',
  // Telecom
  Digicel       = 'digicel',
  Claro         = 'claro',
  Altice        = 'altice',
  Flow          = 'flow',
  Vodafone      = 'vodafone',
  OrangeTelecom = 'orange_telecom',
  // Banking rails
  OpenBanking   = 'open_banking',
  ACH           = 'ach',
  SEPA          = 'sepa',
  SWIFT         = 'swift',
  // Crypto
  Bitcoin       = 'bitcoin',
  Ethereum      = 'ethereum',
  USDT          = 'usdt',
  USDC          = 'usdc',
}

export enum ProviderCategory {
  OnlineGateway  = 'online_gateway',
  MobileMoney    = 'mobile_money',
  WalletProvider = 'wallet_provider',
  Telecom        = 'telecom',
  Banking        = 'banking',
  Crypto         = 'crypto',
}

export enum ProviderStatus {
  Active   = 'active',
  Inactive = 'inactive',
  Degraded = 'degraded',
  Down     = 'down',
}

export enum RefundStatus {
  Pending    = 'pending',
  Approved   = 'approved',
  Processing = 'processing',
  Completed  = 'completed',
  Rejected   = 'rejected',
  Failed     = 'failed',
}

export enum SubscriptionInterval {
  Weekly  = 'weekly',
  Monthly = 'monthly',
  Yearly  = 'yearly',
}

export enum SubscriptionStatus {
  Active      = 'active',
  Trial       = 'trial',
  GracePeriod = 'grace_period',
  PastDue     = 'past_due',
  Cancelled   = 'cancelled',
  Expired     = 'expired',
}

export interface PaymentIntent {
  id:               string;
  userId:           string;
  amount:           number;
  currency:         string;
  method:           PaymentMethod;
  status:           PaymentStatus;
  description:      string;
  provider?:        ProviderName;
  providerIntentId?:string;
  clientSecret?:    string;
  requires3DS?:     boolean;
  riskScore?:       number;
  orderId?:         string;
  jobId?:           string;
  escrowId?:        string;
  subscriptionId?:  string;
  splitRuleId?:     string;
  ipAddress?:       string;
  deviceId?:        string;
  country?:         string;
  metadata?:        Record<string, unknown>;
  createdAt:        string;
  updatedAt:        string;
}

export interface PaymentTransaction {
  id:            string;
  intentId:      string;
  provider:      ProviderName;
  providerTxId?: string;
  amount:        number;
  fee:           number;
  currency:      string;
  status:        PaymentStatus;
  attempt:       number;
  errorCode?:    string;
  errorMessage?: string;
  rawResponse?:  Record<string, unknown>;
  createdAt:     string;
}

export interface SplitRule {
  id:       string;
  name:     string;
  context:  string;
  entries:  Array<{ recipient: string; percentage: number; fixedAmount?: number }>;
  isActive: boolean;
  createdAt:string;
}

export interface SplitEntry {
  id:        string;
  intentId:  string;
  recipient: string;
  amount:    number;
  currency:  string;
  status:    PaymentStatus;
  createdAt: string;
}

export interface Refund {
  id:               string;
  intentId:         string;
  userId:           string;
  amount:           number;
  currency:         string;
  reason:           string;
  status:           RefundStatus;
  providerRefundId?:string;
  processedAt?:     string;
  createdAt:        string;
}

export interface PaySubscription {
  id:                 string;
  userId:             string;
  provider:           ProviderName;
  status:             SubscriptionStatus;
  interval:           SubscriptionInterval;
  amount:             number;
  currency:           string;
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  providerSubId?:     string;
  planId?:            string;
  trialEndsAt?:       string;
  cancelledAt?:       string;
  createdAt:          string;
  updatedAt:          string;
}

export interface WebhookEvent {
  id:           string;
  provider:     ProviderName;
  eventType:    string;
  payload:      Record<string, unknown>;
  processed:    boolean;
  processedAt?: string;
  createdAt:    string;
}

export interface CreatePaymentInput {
  amount:       number;
  currency:     string;
  method:       PaymentMethod;
  description?: string | undefined;
  metadata?:    Record<string, unknown> | undefined;
  orderId?:     string | undefined;
  jobId?:       string | undefined;
  escrowId?:    string | undefined;
  splitRuleId?: string | undefined;
  ipAddress?:   string | undefined;
  deviceId?:    string | undefined;
  country?:     string | undefined;
  kycLevel?:    number | undefined;
}
