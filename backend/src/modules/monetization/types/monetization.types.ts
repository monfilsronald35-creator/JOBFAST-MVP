export type MonetizationService =
  | 'jobs' | 'marketplace' | 'wallet' | 'hotels' | 'flights'
  | 'telecom' | 'healthcare' | 'government' | 'enterprise'
  | 'ai_premium' | 'subscriptions' | 'featured_listings'
  | 'api_partner' | 'affiliate';

export const ALL_SERVICES: MonetizationService[] = [
  'jobs', 'marketplace', 'wallet', 'hotels', 'flights',
  'telecom', 'healthcare', 'government', 'enterprise',
  'ai_premium', 'subscriptions', 'featured_listings',
  'api_partner', 'affiliate',
];

export interface MonetizationConfig {
  globalEnabled: boolean;
  updatedAt: number;
  updatedBy: string | null;
}

export interface FeeRule {
  id: string;
  service: MonetizationService;
  country?: string;
  city?: string;
  userType?: string;
  volumeMin?: number;
  volumeMax?: number;
  ratePercent?: number;
  fixedAmount?: number;
  currency?: string;
  priority: number;
  active: boolean;
  label?: string;
  createdAt: number;
}

export interface FeeCalculation {
  service: MonetizationService;
  originalAmount: number;
  feeAmount: number;
  feePercent: number;
  totalAmount: number;
  currency: string;
  ruleId?: string;
  isFree: boolean;
  freeReason?: string;
}

export type FreeTierStrategyType = 'days' | 'transactions' | 'amount' | 'month' | 'year' | 'user_type';

export interface FreeTierStrategy {
  id: string;
  name: string;
  strategyType: FreeTierStrategyType;
  value?: number;
  currency?: string;
  userTypes?: string[];
  service?: string;
  active: boolean;
  createdAt: number;
}

export interface RevenueEvent {
  id: string;
  userId?: string;
  service: MonetizationService;
  transactionRef?: string;
  originalAmount: number;
  feeAmount: number;
  totalAmount: number;
  currency: string;
  country?: string;
  city?: string;
  userType?: string;
  ruleId?: string;
  isFree: boolean;
  freeReason?: string;
  status: 'collected' | 'refunded' | 'disputed';
  createdAt: number;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId?: string;
  type: 'commission' | 'subscription' | 'service_fee';
  service?: string;
  periodStart?: number;
  periodEnd?: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void';
  lineItems: InvoiceLine[];
  issuedAt: number;
  dueAt?: number;
  paidAt?: number;
}

export interface RevenueDashboard {
  today: number;
  week: number;
  month: number;
  year: number;
  currency: string;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byService: Record<string, number>;
  byCurrency: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  topCustomers: Array<{ userId: string; total: number }>;
  collectedCommissions: number;
  refunds: number;
  mrr: number;
  arr: number;
  growthRate: number;
  conversionRate: number;
  generatedAt: number;
}

export interface RevenueInsight {
  type: 'most_profitable_service' | 'fastest_growing_country' | 'high_commission_risk' | 'churn_risk' | 'new_opportunity';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  confidence: number;
}

export interface MonetizationAnnouncement {
  id: string;
  type: 'monetization_enabled' | 'fee_change' | 'new_service';
  title: string;
  body: string;
  services?: string[];
  sentAt: number;
  sentBy: string;
  recipientsCount: number;
}