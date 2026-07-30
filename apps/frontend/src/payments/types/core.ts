// All monetary amounts are integer minor units (e.g. $10.50 = 1050 cents).
// All timestamps are Unix milliseconds UTC.

export type PaymentProviderId =
  | 'stripe' | 'paypal'
  | 'visa' | 'mastercard' | 'amex' | 'discover'
  | 'apple_pay' | 'google_pay' | 'samsung_pay'
  | 'moncash' | 'natcash'
  | 'pix' | 'upi' | 'mpesa'
  | 'sepa' | 'ach' | 'swift'
  | 'wise' | 'revolut'
  | 'crypto'
  | 'local_bank';

export type PaymentMethodType =
  | 'card' | 'bank_transfer' | 'mobile_wallet' | 'mobile_money'
  | 'crypto' | 'qr' | 'nfc' | 'wallet' | 'local_bank'
  | 'buy_now_pay_later' | 'voucher' | 'instalment';

export type PaymentStatus =
  | 'pending' | 'requires_payment_method' | 'requires_confirmation'
  | 'requires_action' | 'processing' | 'succeeded'
  | 'failed' | 'cancelled' | 'refunded' | 'disputed' | 'expired';

export type TransactionType =
  | 'charge' | 'refund' | 'chargeback' | 'chargeback_reversal'
  | 'transfer' | 'payout' | 'topup' | 'withdrawal'
  | 'fee' | 'adjustment' | 'dispute_fee';

export interface Money {
  amount:   number;   // integer minor units
  currency: string;   // ISO 4217
}

export interface FeeStructure {
  percentageFee: number;  // e.g. 2.9 means 2.9 %
  fixedFee:      number;  // minor units
  currency?:     string;
}

export interface PaymentIntent {
  id:            string;
  amount:        number;            // integer minor units
  currency:      string;
  status:        PaymentStatus;
  provider:      PaymentProviderId;
  paymentMethod: PaymentMethodType;
  customerId?:   string;
  merchantId?:   string;
  description?:  string;
  metadata?:     Record<string, unknown>;
  clientSecret?: string;            // opaque — passed to SDK, never stored
  nextAction?:   { type: string; url?: string; data?: unknown };
  idempotencyKey?: string;
  expiresAt?:    number;
  capturedAt?:   number;
  createdAt:     number;
  updatedAt:     number;
}

export interface Transaction {
  id:                    string;
  intentId:              string;
  type:                  TransactionType;
  amount:                number;   // integer minor units
  currency:              string;
  status:                PaymentStatus;
  provider:              PaymentProviderId;
  providerTransactionId: string;
  fees:                  number;   // integer minor units
  netAmount:             number;   // amount − fees
  customerId?:           string;
  merchantId?:           string;
  description?:          string;
  metadata?:             Record<string, unknown>;
  refundedAmount?:       number;
  failureCode?:          string;
  failureMessage?:       string;
  timestamp:             number;
}

export interface PaymentRequest {
  amount:          number;   // integer minor units
  currency:        string;
  method:          PaymentMethodType;
  provider?:       PaymentProviderId;
  customerId?:     string;
  merchantId?:     string;
  description?:    string;
  returnUrl?:      string;
  cancelUrl?:      string;
  paymentToken?:   string;   // tokenised card/wallet — no raw PAN
  savedMethodId?:  string;
  metadata?:       Record<string, unknown>;
  idempotencyKey?: string;
  capture?:        'automatic' | 'manual';
}

export interface PaymentResult {
  success:         boolean;
  intent?:         PaymentIntent;
  transaction?:    Transaction;
  error?:          { code: string; message: string; declineCode?: string };
  requiresAction?: boolean;
  actionUrl?:      string;
}

export interface RefundRequest {
  transactionId: string;
  amount?:       number;    // partial if given, full if omitted
  reason?:       'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  metadata?:     Record<string, unknown>;
}

export interface RefundResult {
  success:   boolean;
  refundId?: string;
  amount:    number;
  currency:  string;
  status:    'pending' | 'succeeded' | 'failed';
  createdAt: number;
}

export interface ChargebackResult {
  caseId:    string;
  amount:    number;
  currency:  string;
  reason:    string;
  status:    'open' | 'won' | 'lost' | 'withdrawn';
  dueDate:   number;
  createdAt: number;
}

export interface WebhookEvent {
  id:        string;
  provider:  PaymentProviderId;
  type:      string;
  data:      unknown;
  signature?: string;
  timestamp: number;
}

export interface PaymentProviderPlugin {
  id:                   PaymentProviderId;
  name:                 string;
  supportedMethods:     PaymentMethodType[];
  supportedCurrencies:  string[];
  supportedCountries:   string[];
  minAmount:            number;
  maxAmount:            number;
  feeStructure:         FeeStructure;
  available:            boolean;

  charge(request: PaymentRequest): Promise<PaymentIntent>;
  confirm(intentId: string, data?: unknown): Promise<Transaction>;
  capture(intentId: string, amount?: number): Promise<Transaction>;
  cancel(intentId: string): Promise<void>;
  refund(request: RefundRequest): Promise<RefundResult>;
  getTransaction(id: string): Promise<Transaction | null>;
  health(): Promise<boolean>;
  handleWebhook?(event: unknown, signature?: string): Promise<void>;
}

export interface SavedPaymentMethod {
  id:       string;
  type:     PaymentMethodType;
  provider: PaymentProviderId;
  label:    string;   // e.g. "Visa ••••4242"
  isDefault: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
}