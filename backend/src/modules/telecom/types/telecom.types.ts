// ── Operators ──────────────────────────────────────────────────────────────────
export interface TelecomOperator {
  id:          string;
  name:        string;
  code:        string;
  country:     string;
  currency:    string;
  logoUrl?:    string | undefined;
  website?:    string | undefined;
  apiType:     OperatorAPIType;
  isActive:    boolean;
  ownerId:     string;
  createdAt:   string;
}

export type OperatorAPIType = 'rest' | 'soap' | 'ussd' | 'mock';

export interface OperatorConfig {
  operatorId:   string;
  apiBaseUrl:   string;
  apiKey?:      string | undefined;
  apiSecret?:   string | undefined;
  webhookUrl?:  string | undefined;
  timeout:      number;
  retryAttempts: number;
  rateLimitRpm: number;
  sandboxMode:  boolean;
  updatedAt:    string;
}

// ── Bundles ────────────────────────────────────────────────────────────────────
export interface TelecomBundle {
  id:          string;
  operatorId:  string;
  name:        string;
  code:        string;
  type:        BundleType;
  description: string;
  price:       number;
  currency:    string;
  validityDays: number;
  dataGb?:     number | undefined;
  minutesMins?: number | undefined;
  smsCount?:   number | undefined;
  speed?:      string | undefined;
  coverage?:   string | undefined;
  bonus?:      string | undefined;
  isRenewable: boolean;
  countries:   string[];
  tags:        string[];
  isActive:    boolean;
  createdAt:   string;
}

export type BundleType =
  | 'internet' | 'minutes' | 'sms' | 'roaming' | 'international'
  | 'streaming' | 'gaming' | 'business' | 'family' | 'student'
  | 'night' | 'unlimited' | 'combo';

// ── Recharge ──────────────────────────────────────────────────────────────────
export interface TelecomRecharge {
  id:           string;
  operatorId:   string;
  userId:       string;
  dealerId?:    string | undefined;
  type:         RechargeType;
  phone:        string;
  amount:       number;
  currency:     string;
  bundleId?:    string | undefined;
  status:       RechargeStatus;
  externalRef?:  string | undefined;
  failReason?:  string | undefined;
  scheduledAt?: string | undefined;
  completedAt?: string | undefined;
  refundedAt?:  string | undefined;
  createdAt:    string;
}

export type RechargeType =
  | 'prepaid' | 'postpaid' | 'international' | 'gift' | 'scheduled'
  | 'auto' | 'family' | 'emergency';

export type RechargeStatus =
  | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

// ── SIM ───────────────────────────────────────────────────────────────────────
export interface SIMCard {
  id:           string;
  operatorId:   string;
  userId:       string;
  iccid:        string;
  msisdn:       string;
  type:         'physical' | 'esim';
  status:       SIMStatus;
  kycStatus:    'pending' | 'verified' | 'rejected';
  activatedAt?: string | undefined;
  expiresAt?:   string | undefined;
  country:      string;
  createdAt:    string;
}

export type SIMStatus = 'unregistered' | 'registered' | 'active' | 'suspended' | 'terminated';

// ── Bill ──────────────────────────────────────────────────────────────────────
export interface TelecomBill {
  id:            string;
  operatorId:    string;
  userId:        string;
  phone:         string;
  period:        string;
  amount:        number;
  currency:      string;
  dueDate:       string;
  status:        BillStatus;
  paidAt?:       string | undefined;
  lateFee?:      number | undefined;
  items:         BillItem[];
  createdAt:     string;
}

export interface BillItem {
  description: string;
  amount:      number;
  type:        'data' | 'voice' | 'sms' | 'roaming' | 'service' | 'tax';
}

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';

// ── Dealer ────────────────────────────────────────────────────────────────────
export interface TelecomDealer {
  id:           string;
  operatorId:   string;
  userId:       string;
  name:         string;
  code:         string;
  tier:         DealerTier;
  country:      string;
  city:         string;
  phone:        string;
  email?:       string | undefined;
  managerId?:   string | undefined;
  walletBalance: number;
  currency:     string;
  status:       'active' | 'suspended' | 'terminated';
  createdAt:    string;
}

export type DealerTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'agent';

// ── Commission ────────────────────────────────────────────────────────────────
export interface Commission {
  id:          string;
  operatorId:  string;
  dealerId:    string;
  type:        CommissionType;
  rechargeId?: string | undefined;
  baseAmount:  number;
  rate:        number;
  amount:      number;
  currency:    string;
  status:      'pending' | 'approved' | 'paid' | 'reversed';
  paidAt?:     string | undefined;
  createdAt:   string;
}

export type CommissionType =
  | 'recharge' | 'bundle' | 'sim_activation' | 'referral' | 'campaign' | 'monthly_bonus';

export interface CommissionRule {
  operatorId:  string;
  type:        CommissionType;
  dealerTier:  DealerTier;
  ratePercent: number;
  minAmount:   number;
  bonusAmount?: number | undefined;
}

// ── Fraud ─────────────────────────────────────────────────────────────────────
export interface FraudEvent {
  id:          string;
  operatorId:  string;
  userId?:     string | undefined;
  dealerId?:   string | undefined;
  type:        FraudType;
  riskScore:   number;
  details:     Record<string, unknown>;
  action:      'flagged' | 'blocked' | 'reviewed' | 'cleared';
  createdAt:   string;
}

export type FraudType =
  | 'fake_recharge' | 'duplicate_payment' | 'bot_activity'
  | 'sim_fraud' | 'account_abuse' | 'dealer_fraud';

// ── API Connector ─────────────────────────────────────────────────────────────
export interface APICallResult {
  success:      boolean;
  externalRef?: string | undefined;
  message?:     string | undefined;
  data?:        Record<string, unknown> | undefined;
  retryCount:   number;
}

export interface RetryQueueItem {
  id:          string;
  operatorId:  string;
  rechargeId:  string;
  attempts:    number;
  nextRetryAt: string;
  lastError:   string;
  createdAt:   string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface TelecomAnalytics {
  operatorId:     string;
  period:         string;
  totalRecharges: number;
  totalRevenue:   number;
  currency:       string;
  successRate:    number;
  topBundles:     Array<{ bundleId: string; name: string; count: number; revenue: number }>;
  topCountries:   Array<{ country: string; count: number; revenue: number }>;
  peakHour:       number;
  failedCount:    number;
  newDealers:     number;
  commissionPaid: number;
  generatedAt:    string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface TelecomDashboard {
  operatorId:      string;
  operatorName:    string;
  revenueToday:    number;
  salesToday:      number;
  rechargeCount:   number;
  bundleCount:     number;
  simActivations:  number;
  commissionDue:   number;
  dealerCount:     number;
  customerCount:   number;
  fraudAlerts:     number;
  apiStatus:       'online' | 'degraded' | 'offline';
  currency:        string;
  generatedAt:     string;
}