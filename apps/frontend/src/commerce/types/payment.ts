// ─── Global Payment Engine Types ──────────────────────────────────────────────

export type PaymentMethodType =
  | 'card'
  | 'digital_wallet'
  | 'mobile_money'
  | 'bank_transfer'
  | 'cash'
  | 'crypto'
  | 'wallet'
  | 'buy_now_pay_later'
  | 'voucher'
  | 'gift_card';

export type PaymentProviderId =
  | 'stripe'
  | 'paypal'
  | 'adyen'
  | 'wise'
  | 'revolut'
  | 'moncash'
  | 'natcash'
  | 'mpesa'
  | 'orange_money'
  | 'apple_pay'
  | 'google_pay'
  | 'bitcoin'
  | 'ethereum'
  | 'usdc'
  | 'jobfast_wallet'
  | 'cash_on_delivery'
  | 'bank_transfer';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunding'
  | 'refunded'
  | 'disputed'
  | 'expired';

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface PaymentMethodConfig {
  providerId:     PaymentProviderId;
  methodType:     PaymentMethodType;
  displayName:    string;
  icon:           string;
  enabled:        boolean;
  countries:      string[];
  currencies:     string[];
  minAmount?:     number;
  maxAmount?:     number;
  feePercent?:    number;
  feeFixed?:      number;
  feeCurrency?:   string;
  instructions?:  string;
  metadata:       Record<string, unknown>;
}

export interface PaymentProviderPlugin {
  id:            PaymentProviderId;
  name:          string;
  version:       string;
  enabled:       boolean;
  countries:     string[];
  currencies:    string[];
  methods:       PaymentMethodConfig[];
  config:        Record<string, unknown>;
  initSDK?:      () => Promise<void>;
  createPayment: (params: CreatePaymentParams) => Promise<PaymentIntent>;
  confirmPayment: (intentId: string, data?: unknown) => Promise<TransactionResult>;
  refund:        (transactionId: string, amount?: number) => Promise<RefundResult>;
  webhook?:      (payload: unknown) => Promise<WebhookResult>;
}

export interface CreatePaymentParams {
  orderId:        string;
  amount:         number;
  currency:       string;
  method:         PaymentMethodType;
  buyerId:        string;
  vendorId:       string;
  description?:   string;
  returnUrl?:     string;
  cancelUrl?:     string;
  metadata?:      Record<string, unknown>;
}

export interface PaymentIntent {
  intentId:      string;
  status:        'created' | 'requires_action' | 'requires_confirmation' | 'processing';
  amount:        number;
  currency:      string;
  clientSecret?: string;
  redirectUrl?:  string;
  qrData?:       string;
  expiresAt?:    number;
  metadata:      Record<string, unknown>;
}

export interface TransactionResult {
  transactionId: string;
  status:        TransactionStatus;
  amount:        number;
  currency:      string;
  fee:           number;
  net:           number;
  reference?:    string;
  receipt?:      string;
  metadata:      Record<string, unknown>;
}

export interface RefundResult {
  refundId:      string;
  status:        RefundStatus;
  amount:        number;
  currency:      string;
  processedAt?:  number;
  metadata:      Record<string, unknown>;
}

export interface WebhookResult {
  processed: boolean;
  event?:    string;
  data?:     unknown;
}

export interface Transaction {
  id:              string;
  orderId:         string;
  vendorId:        string;
  buyerId:         string;
  providerId:      PaymentProviderId;
  methodType:      PaymentMethodType;
  amount:          number;
  currency:        string;
  amountInMinor:   number;
  exchangeRate?:   number;
  fee:             number;
  net:             number;
  status:          TransactionStatus;
  intentId?:       string;
  providerRef?:    string;
  receipt?:        string;
  failureReason?:  string;
  refunds:         RefundRecord[];
  metadata:        Record<string, unknown>;
  createdAt:       number;
  updatedAt:       number;
  completedAt?:    number;
}

export interface RefundRecord {
  id:           string;
  transactionId: string;
  amount:       number;
  currency:     string;
  reason:       string;
  status:       RefundStatus;
  requestedAt:  number;
  processedAt?: number;
  processedBy?: string;
}