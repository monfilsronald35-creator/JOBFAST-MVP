// ─── Order Lifecycle Types ────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'payment_processing'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded'
  | 'disputed'
  | 'failed';

export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'failed';

export type DeliveryMethod = 'digital' | 'pickup' | 'courier' | 'post' | 'service' | 'appointment' | 'none';

export interface OrderItem {
  id:             string;
  listingId:      string;
  variantId?:     string;
  vendorId:       string;
  title:          string;
  sku?:           string;
  quantity:       number;
  unitPrice:      number;
  totalPrice:     number;
  currency:       string;
  attributes:     Array<{ key: string; value: string }>;
  listingType:    string;
  fulfillment:    ItemFulfillment;
  discount?:      DiscountApplication;
  tax:            TaxLine;
  metadata:       Record<string, unknown>;
}

export interface ItemFulfillment {
  status:         FulfillmentStatus;
  method:         DeliveryMethod;
  trackingCode?:  string;
  trackingUrl?:   string;
  downloadUrl?:   string;
  redeemCode?:    string;
  qrData?:        string;
  scheduledAt?:   number;
  completedAt?:   number;
  provider?:      string;
  notes?:         string;
}

export interface DiscountApplication {
  code?:       string;
  type:        'percent' | 'fixed' | 'free_shipping';
  value:       number;
  savings:     number;
  label:       string;
}

export interface TaxLine {
  rate:     number;
  amount:   number;
  included: boolean;
  label:    string;
}

export interface ShippingLine {
  method:    string;
  carrier?:  string;
  price:     number;
  currency:  string;
  estimatedDelivery?: number;
}

export interface OrderAddress {
  firstName:   string;
  lastName:    string;
  phone?:      string;
  line1:       string;
  line2?:      string;
  city:        string;
  state?:      string;
  country:     string;
  postalCode?: string;
}

export interface OrderTotals {
  subtotal:        number;
  discount:        number;
  shipping:        number;
  tax:             number;
  total:           number;
  currency:        string;
  exchangeRate?:   number;
  totalInMinor:    number;
}

export interface OrderEvent {
  id:        string;
  orderId:   string;
  type:      string;
  data?:     unknown;
  actorId?:  string;
  actorType: 'customer' | 'vendor' | 'system' | 'admin';
  timestamp: number;
}

export interface MultiVendorSplit {
  vendorId:   string;
  items:      string[];
  subtotal:   number;
  commission: number;
  payout:     number;
  currency:   string;
  status:     OrderStatus;
}

export interface Order {
  id:                string;
  buyerId:           string;
  vendorIds:         string[];
  items:             OrderItem[];
  vendorSplits:      MultiVendorSplit[];
  status:            OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress?:  OrderAddress;
  billingAddress?:   OrderAddress;
  shippingLine?:     ShippingLine;
  totals:            OrderTotals;
  discounts:         DiscountApplication[];
  paymentStatus:     'unpaid' | 'partial' | 'paid' | 'refunded';
  transactionIds:    string[];
  notes?:            string;
  customerNote?:     string;
  events:            OrderEvent[];
  tags:              string[];
  source:            'web' | 'mobile' | 'api' | 'pos' | 'import';
  metadata:          Record<string, unknown>;
  createdAt:         number;
  updatedAt:         number;
  completedAt?:      number;
  cancelledAt?:      number;
  cancelReason?:     string;
}

export interface Cart {
  id:          string;
  buyerId?:    string;
  sessionId:   string;
  items:       CartItem[];
  totals:      OrderTotals;
  couponCode?: string;
  discount?:   DiscountApplication;
  currency:    string;
  countryCode: string;
  expiresAt:   number;
  createdAt:   number;
  updatedAt:   number;
}

export interface CartItem {
  id:          string;
  listingId:   string;
  variantId?:  string;
  vendorId:    string;
  quantity:    number;
  unitPrice:   number;
  currency:    string;
  title:       string;
  image?:      string;
  attributes:  Array<{ key: string; value: string }>;
  listingType: string;
  availability: 'available' | 'low_stock' | 'unavailable';
  addedAt:     number;
}