export type PlanInterval = 'monthly' | 'annual' | 'weekly' | 'usage' | 'seat' | 'metered';
export type SubscriptionStatus =
  | 'trialing' | 'active' | 'past_due' | 'cancelled'
  | 'incomplete' | 'incomplete_expired' | 'paused' | 'unpaid';

export interface Plan {
  id:            string;
  name:          string;
  description?:  string;
  amount:        number;        // integer minor units per interval
  currency:      string;
  interval:      PlanInterval;
  intervalCount: number;        // e.g. 3 = every 3 months
  trialDays?:    number;
  features:      string[];
  usageLimit?:   number;        // for metered/usage plans
  seatPrice?:    number;        // per seat in minor units
  active:        boolean;
  metadata?:     Record<string, unknown>;
}

export interface Subscription {
  id:                   string;
  userId:               string;
  planId:               string;
  status:               SubscriptionStatus;
  currentPeriodStart:   number;   // Unix ms UTC
  currentPeriodEnd:     number;
  cancelAtPeriodEnd:    boolean;
  cancelledAt?:         number;
  trialEnd?:            number;
  seats?:               number;
  usageThisPeriod?:     number;
  defaultPaymentMethod?: string;
  latestInvoiceId?:     string;
  appliedCouponId?:     string;
  metadata?:            Record<string, unknown>;
  createdAt:            number;
  updatedAt:            number;
}

export interface Coupon {
  id:               string;
  code:             string;
  name?:            string;
  discountType:     'percent' | 'fixed_amount';
  discountValue:    number;   // percent (1–100) or minor units for fixed
  currency?:        string;   // required for fixed_amount
  maxUses?:         number;
  usedCount:        number;
  durationMonths?:  number;   // how many billing cycles it applies
  expiresAt?:       number;
  validForPlanIds?: string[];
  active:           boolean;
  metadata?:        Record<string, unknown>;
}

export interface Promotion {
  id:          string;
  name:        string;
  couponId:    string;
  active:      boolean;
  code:        string;
  restrictions?: { minimumAmount?: number; firstTimeTransaction?: boolean };
  createdAt:   number;
}

export interface UsageRecord {
  subscriptionId: string;
  quantity:       number;
  action:         'increment' | 'set';
  timestamp:      number;
}

export interface Invoice {
  id:              string;
  subscriptionId:  string;
  userId:          string;
  amount:          number;   // integer minor units
  amountPaid:      number;
  amountDue:       number;
  currency:        string;
  status:          'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?:        number;
  paidAt?:         number;
  periodStart:     number;
  periodEnd:       number;
  lineItems:       Array<{ description: string; amount: number; quantity: number; unitAmount: number }>;
  taxAmount?:      number;
  discountAmount?: number;
  pdfUrl?:         string;
  createdAt:       number;
}

export interface BillingPortalSession {
  url:       string;
  expiresAt: number;
}