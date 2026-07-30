export enum WalletStatus {
  Active    = 'active',
  Suspended = 'suspended',
  Frozen    = 'frozen',
  Closed    = 'closed',
}

export enum TransactionType {
  Deposit      = 'deposit',
  Withdrawal   = 'withdrawal',
  Transfer     = 'transfer',
  Payment      = 'payment',
  Refund       = 'refund',
  Cashback     = 'cashback',
  Bonus        = 'bonus',
  Escrow       = 'escrow',
  EscrowRelease= 'escrow_release',
  Exchange     = 'exchange',
  Fee          = 'fee',
  Tax          = 'tax',
  Subscription = 'subscription',
  Salary       = 'salary',
  Reversal     = 'reversal',
}

export enum TransactionStatus {
  Pending   = 'pending',
  Completed = 'completed',
  Failed    = 'failed',
  Reversed  = 'reversed',
  Flagged   = 'flagged',
}

export enum TransactionDirection {
  Credit = 'credit',
  Debit  = 'debit',
}

export interface Wallet {
  id:        string;
  ownerId:   string;
  status:    WalletStatus;
  createdAt: string;
  updatedAt: string;
  kycLevel?: number;
  dailySpent?:   number;
  monthlySpent?: number;
}

export interface WalletBalance {
  id:               string;
  walletId:         string;
  currency:         string;
  availableBalance: number;
  pendingBalance:   number;
  escrowBalance:    number;
  rewardBalance:    number;
  cashbackBalance:  number;
  updatedAt:        string;
}

export interface Transaction {
  id:          string;
  walletId:    string;
  ownerId:     string;
  type:        TransactionType;
  direction:   TransactionDirection;
  status:      TransactionStatus;
  amount:      number;
  fee:         number;
  netAmount:   number;
  currency:    string;
  reference:   string;
  description: string;
  createdAt:   string;
  metadata?:   Record<string, unknown>;
  riskScore?:  number;
  ipAddress?:  string;
  deviceId?:   string;
  country?:    string;
  relatedTxId?:string;
  failReason?: string;
}

export interface TransactionFilter {
  type?:      TransactionType;
  direction?: TransactionDirection;
  status?:    TransactionStatus;
  currency?:  string;
  dateFrom?:  string;
  dateTo?:    string;
  limit?:     number;
  cursor?:    string;
}

export interface FeeConfig {
  id:          string;
  txType:      string;
  feeType:     'flat' | 'percent';
  feeValue:    number;
  minFee:      number;
  maxFee:      number;
  currency:    string;
  isActive:    boolean;
  createdAt:   string;
}

export interface LimitConfig {
  id:                string;
  kycLevel:          number;
  currency:          string;
  maxSingleTx:       number;
  maxDailyVolume:    number;
  maxMonthlyVolume:  number;
  maxDailyCount:     number;
  isActive:          boolean;
  createdAt:         string;
}
