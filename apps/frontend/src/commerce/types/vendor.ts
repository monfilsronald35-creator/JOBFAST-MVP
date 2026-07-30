// ─── Multi-Vendor Engine Types ────────────────────────────────────────────────

export type VendorType =
  | 'individual'
  | 'small_business'
  | 'enterprise'
  | 'government'
  | 'ngo'
  | 'university'
  | 'telecom'
  | 'hospital'
  | 'marketplace_seller'
  | 'restaurant'
  | 'hotel'
  | 'bank'
  | 'insurance';

export type VendorStatus   = 'pending' | 'active' | 'suspended' | 'rejected' | 'closed';
export type VerificationLevel = 'unverified' | 'email' | 'phone' | 'id' | 'business' | 'enterprise';

export type VendorPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface VendorTier {
  plan:            VendorPlan;
  maxListings:     number;
  maxBranches:     number;
  commissionRate:  number;
  featureFlags:    Record<string, boolean>;
  monthlyFee:      number;
  currency:        string;
}

export interface VendorRating {
  average:     number;
  count:       number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  lastUpdated: number;
}

export interface VendorMetrics {
  totalSales:       number;
  totalRevenue:     number;
  totalListings:    number;
  activeListings:   number;
  totalOrders:      number;
  completedOrders:  number;
  cancelledOrders:  number;
  avgFulfillmentMs: number;
  returnRate:       number;
  responseTimeMs:   number;
  lastSaleAt?:      number;
}

export interface VendorSettings {
  autoAcceptOrders:    boolean;
  notifyOnOrder:       boolean;
  notifyOnMessage:     boolean;
  allowReviews:        boolean;
  allowQuestions:      boolean;
  minimumOrderAmount?: number;
  shippingPolicy?:     string;
  returnPolicy?:       string;
  supportEmail?:       string;
  supportPhone?:       string;
  businessHours?:      WeeklySchedule;
  fulfillmentSla:      number;
  autoFulfillTypes:    string[];
}

export interface TimeRange {
  open:  string;
  close: string;
}

export interface DaySchedule {
  open:   boolean;
  ranges: TimeRange[];
}

export type WeeklySchedule = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  DaySchedule
>;

export interface VendorPayoutConfig {
  method:      string;
  accountRef:  string;
  currency:    string;
  scheduleDay: number;
  minPayout:   number;
  holdDays:    number;
}

export interface Vendor {
  id:                 string;
  orgId?:             string;
  userId:             string;
  type:               VendorType;
  name:               string;
  displayName:        string;
  slug:               string;
  logo?:              string;
  banner?:            string;
  description?:       string;
  tagline?:           string;
  categoryIds:        string[];
  countryCode:        string;
  currencyCode:       string;
  languages:          string[];
  status:             VendorStatus;
  verificationLevel:  VerificationLevel;
  plan:               VendorPlan;
  tier:               VendorTier;
  rating:             VendorRating;
  metrics:            VendorMetrics;
  settings:           VendorSettings;
  payoutConfig?:      VendorPayoutConfig;
  enabledPlugins:     string[];
  enabledPayments:    string[];
  metadata:           Record<string, unknown>;
  createdAt:          number;
  updatedAt:          number;
}