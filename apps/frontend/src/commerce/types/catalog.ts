// ─── Universal Catalog Engine Types ──────────────────────────────────────────

export type ListingType =
  | 'physical_product'
  | 'digital_product'
  | 'service'
  | 'subscription'
  | 'membership'
  | 'event_ticket'
  | 'hotel_room'
  | 'flight'
  | 'vehicle'
  | 'appointment'
  | 'medical_service'
  | 'insurance'
  | 'mobile_topup'
  | 'internet_package'
  | 'utility_bill'
  | 'digital_voucher'
  | 'gift_card';

export type ListingStatus = 'draft' | 'active' | 'paused' | 'archived' | 'pending_review' | 'rejected';
export type AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'multiselect' | 'range' | 'color' | 'image' | 'url' | 'phone' | 'duration';

export interface AttributeOption {
  value:  string;
  label:  string;
  icon?:  string;
  color?: string;
  meta?:  Record<string, unknown>;
}

export interface AttributeValidation {
  min?:       number;
  max?:       number;
  minLength?: number;
  maxLength?: number;
  pattern?:   string;
  required?:  boolean;
}

export interface AttributeDefinition {
  key:          string;
  label:        string;
  type:         AttributeType;
  required:     boolean;
  searchable:   boolean;
  filterable:   boolean;
  comparable:   boolean;
  unit?:        string;
  options?:     AttributeOption[];
  validation?:  AttributeValidation;
  group?:       string;
  sortOrder:    number;
  isVariant:    boolean;
}

export interface AttributeValue {
  key:    string;
  value:  string | number | boolean | string[];
  unit?:  string;
}

export interface ListingMedia {
  id:       string;
  url:      string;
  type:     'image' | 'video' | 'document' | '3d';
  alt?:     string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface PricingRule {
  minQty:    number;
  maxQty?:   number;
  price:     number;
  currency:  string;
}

export interface Pricing {
  currency:        string;
  basePrice:       number;
  comparePrice?:   number;
  costPrice?:      number;
  taxInclusive:    boolean;
  taxRate?:        number;
  pricingRules?:   PricingRule[];
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trialDays?:      number;
}

export interface Inventory {
  tracked:        boolean;
  quantity?:      number;
  reservedQty:    number;
  lowStockLevel?: number;
  allowBackorder: boolean;
  maxPerOrder?:   number;
  minPerOrder?:   number;
  sku?:           string;
  barcode?:       string;
  weight?:        number;
  weightUnit?:    'kg' | 'lb' | 'g';
  dimensions?:    { l: number; w: number; h: number; unit: 'cm' | 'in' };
}

export interface Variant {
  id:          string;
  listingId:   string;
  attributes:  AttributeValue[];
  sku?:        string;
  pricing:     Pricing;
  inventory:   Inventory;
  media?:      ListingMedia[];
  status:      'active' | 'inactive';
  sortOrder:   number;
}

export interface ListingAvailability {
  startAt?:    number;
  endAt?:      number;
  timezone?:   string;
  slots?:      TimeSlot[];
  daysOfWeek?: number[];
  maxCapacity?: number;
}

export interface TimeSlot {
  start: string;
  end:   string;
  date?: string;
}

export interface FulfillmentConfig {
  type:             'instant' | 'scheduled' | 'manual' | 'pickup' | 'delivery' | 'download';
  estimatedMinMs?:  number;
  estimatedMaxMs?:  number;
  deliveryMethods?: string[];
  requiresAppt:     boolean;
  expiresInDays?:   number;
  redemptionType?:  'code' | 'qr' | 'link' | 'email';
}

export interface ListingSeo {
  title?:       string;
  description?: string;
  keywords?:    string[];
  canonical?:   string;
}

export interface Listing {
  id:             string;
  vendorId:       string;
  orgId?:         string;
  type:           ListingType;
  title:          string;
  description:    string;
  slug:           string;
  categoryId:     string;
  subcategoryIds: string[];
  tags:           string[];
  attributes:     AttributeValue[];
  variants:       Variant[];
  defaultVariantId?: string;
  pricing:        Pricing;
  inventory:      Inventory;
  availability:   ListingAvailability;
  fulfillment:    FulfillmentConfig;
  media:          ListingMedia[];
  status:         ListingStatus;
  visibility:     'public' | 'private' | 'unlisted' | 'members_only';
  countryAvailability: string[];
  seo:            ListingSeo;
  rating?:        { average: number; count: number };
  totalSales:     number;
  viewCount:      number;
  metadata:       Record<string, unknown>;
  publishedAt?:   number;
  createdAt:      number;
  updatedAt:      number;
}

export interface Category {
  id:                string;
  parentId?:         string;
  name:              string;
  slug:              string;
  description?:      string;
  icon?:             string;
  image?:            string;
  listingTypes:      ListingType[];
  attributeTemplate: AttributeDefinition[];
  sortOrder:         number;
  isActive:          boolean;
  childIds:          string[];
  listingCount:      number;
  metadata:          Record<string, unknown>;
}

export interface SearchFilter {
  field:    string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'range';
  value:    unknown;
}

export interface SearchQuery {
  text?:        string;
  filters?:     SearchFilter[];
  categoryId?:  string;
  vendorId?:    string;
  listingType?: ListingType;
  minPrice?:    number;
  maxPrice?:    number;
  currency?:    string;
  countryCode?: string;
  sortBy?:      'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating' | 'relevance';
  page?:        number;
  limit?:       number;
}

export interface SearchResult {
  listings:   Listing[];
  total:      number;
  page:       number;
  totalPages: number;
  facets:     SearchFacet[];
  durationMs: number;
}

export interface SearchFacet {
  field:   string;
  label:   string;
  values:  Array<{ value: string; label: string; count: number }>;
}