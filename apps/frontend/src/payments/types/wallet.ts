export type WalletType   = 'fiat' | 'crypto' | 'loyalty' | 'gift' | 'escrow';
export type WalletStatus = 'active' | 'frozen' | 'closed' | 'pending_verification';
export type CryptoCurrency = 'BTC' | 'ETH' | 'USDC' | 'USDT' | 'SOL' | 'MATIC' | 'BNB';

export interface WalletBalance {
  currency:  string;
  total:     number;   // integer minor units
  available: number;
  pending:   number;
  reserved:  number;
}

export interface Wallet {
  id:              string;
  userId:          string;
  type:            WalletType;
  balances:        WalletBalance[];
  defaultCurrency: string;
  status:          WalletStatus;
  kycRequired:     boolean;
  dailyLimit?:     number;
  monthlyLimit?:   number;
  createdAt:       number;
  updatedAt:       number;
  metadata?:       Record<string, unknown>;
}

export interface CryptoAddress {
  walletId:  string;
  currency:  CryptoCurrency;
  address:   string;
  network:   string;
  tag?:      string;   // memo/destination tag for XRP, etc.
  qrCode?:   string;   // data URI
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId?:  string;
  toUserId?:    string;
  amount:       number;    // integer minor units
  currency:     string;
  memo?:        string;
  metadata?:    Record<string, unknown>;
  idempotencyKey?: string;
}

export interface TransferResult {
  success:       boolean;
  transferId?:   string;
  fromBalance?:  WalletBalance;
  toBalance?:    WalletBalance;
  error?:        string;
  requiresOTP?:  boolean;
}

export interface TopUpRequest {
  walletId:        string;
  amount:          number;   // integer minor units
  currency:        string;
  paymentMethodId?: string;
  provider?:       string;
}

export interface WithdrawalRequest {
  walletId:        string;
  amount:          number;
  currency:        string;
  destination:     { type: 'bank' | 'crypto' | 'mobile_money'; address: string; network?: string };
  twoFactorCode?:  string;
}

export interface LoyaltyPoints {
  walletId:    string;
  points:      number;
  tier:        'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierAt?: number;   // points needed for next tier
  expiresAt?:  number;
  earnRate:    number;   // points per minor unit spent
  redeemRate:  number;   // minor units per point
}

export interface WalletTransaction {
  id:          string;
  walletId:    string;
  type:        'credit' | 'debit' | 'hold' | 'release';
  amount:      number;
  currency:    string;
  balance:     number;   // balance after transaction
  reference?:  string;
  memo?:       string;
  timestamp:   number;
}