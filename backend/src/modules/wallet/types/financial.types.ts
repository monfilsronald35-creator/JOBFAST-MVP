export enum EscrowStatus {
  Locked    = 'locked',
  Released  = 'released',
  Disputed  = 'disputed',
  Refunded  = 'refunded',
  Cancelled = 'cancelled',
}

export enum CardStatus {
  Active    = 'active',
  Blocked   = 'blocked',
  Expired   = 'expired',
  Cancelled = 'cancelled',
}

export enum BankAccountStatus {
  Pending   = 'pending',
  Verified  = 'verified',
  Rejected  = 'rejected',
  Removed   = 'removed',
}

export enum InvoiceStatus {
  Draft     = 'draft',
  Sent      = 'sent',
  Paid      = 'paid',
  Overdue   = 'overdue',
  Cancelled = 'cancelled',
}

export enum RiskLevel {
  Low      = 'low',
  Medium   = 'medium',
  High     = 'high',
  Critical = 'critical',
}

export interface Escrow {
  id:          string;
  payerId:     string;
  payeeId:     string;
  walletId:    string;
  amount:      number;
  currency:    string;
  status:      EscrowStatus;
  reference:   string;
  createdAt:   string;
  releasedAt?: string;
  refundedAt?: string;
  expiresAt?:  string;
  orderId?:    string;
  jobId?:      string;
  notes?:      string;
}

export interface VirtualCard {
  id:           string;
  walletId:     string;
  ownerId:      string;
  last4:        string;
  expiryMonth:  number;
  expiryYear:   number;
  status:       CardStatus;
  spendLimit:   number;
  currency:     string;
  isDisposable: boolean;
  createdAt:    string;
  updatedAt:    string;
  nickname?:    string;
}

export interface BankAccount {
  id:            string;
  walletId:      string;
  ownerId:       string;
  bankName:      string;
  accountName:   string;
  accountNumber: string;
  country:       string;
  currency:      string;
  status:        BankAccountStatus;
  createdAt:     string;
  routingNumber?: string;
  swiftCode?:     string;
  iban?:          string;
}

export interface ExchangeRate {
  id:         string;
  fromCurrency: string;
  toCurrency:   string;
  rate:         number;
  fee:          number;
  fetchedAt:    string;
}

export interface ExchangeTransaction {
  id:           string;
  walletId:     string;
  ownerId:      string;
  fromCurrency: string;
  toCurrency:   string;
  fromAmount:   number;
  toAmount:     number;
  rate:         number;
  fee:          number;
  status:       'completed' | 'failed';
  createdAt:    string;
}

export interface Invoice {
  id:          string;
  issuerId:    string;
  recipientId: string;
  number:      string;
  status:      InvoiceStatus;
  currency:    string;
  subtotal:    number;
  taxAmount:   number;
  total:       number;
  dueDate?:    string;
  paidAt?:     string;
  notes?:      string;
  createdAt:   string;
  updatedAt:   string;
}

export interface InvoiceItem {
  id:          string;
  invoiceId:   string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
  taxRate?:    number;
}

export interface RiskScore {
  id:            string;
  transactionId: string;
  walletId:      string;
  score:         number;
  level:         RiskLevel;
  factors:       Record<string, number>;
  decision:      'allow' | 'review' | 'block';
  createdAt:     string;
}

export interface FraudFlag {
  id:          string;
  walletId:    string;
  ownerId:     string;
  type:        string;
  severity:    RiskLevel;
  description: string;
  metadata:    Record<string, unknown>;
  resolved:    boolean;
  createdAt:   string;
  resolvedAt?: string;
}
