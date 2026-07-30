export enum OrderStatus {
  PendingPayment = 'pending_payment',
  Processing     = 'processing',
  Confirmed      = 'confirmed',
  Shipped        = 'shipped',
  Delivered      = 'delivered',
  Completed      = 'completed',
  Cancelled      = 'cancelled',
  Refunded       = 'refunded',
  Disputed       = 'disputed',
}

export enum OrderType {
  Purchase     = 'purchase',
  Service      = 'service',
  Reservation  = 'reservation',
  Subscription = 'subscription',
  Digital      = 'digital',
  Rental       = 'rental',
}

export enum ReturnStatus {
  Requested = 'requested',
  Approved  = 'approved',
  Rejected  = 'rejected',
  PickedUp  = 'picked_up',
  Refunded  = 'refunded',
  Replaced  = 'replaced',
}

export interface Order {
  id:             string;
  buyerId:        string;
  sellerId:       string;
  status:         OrderStatus;
  type:           OrderType;
  totalAmount:    number;
  subtotalAmount: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount:      number;
  currency:       string;
  createdAt:      string;
  updatedAt:      string;
  storeId?:       string;
  couponId?:      string;
  couponCode?:    string;
  escrowId?:      string;
  paymentRef?:    string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?:  Record<string, unknown>;
  notes?:         string;
  completedAt?:   string;
  cancelledAt?:   string;
}

export interface OrderItem {
  id:            string;
  orderId:       string;
  productId:     string;
  quantity:      number;
  unitPrice:     number;
  totalPrice:    number;
  currency:      string;
  titleSnapshot: string;
  variantId?:    string;
  variantSnapshot?: Record<string, unknown>;
}

export interface OrderTracking {
  id:             string;
  orderId:        string;
  carrier:        string;
  trackingNumber: string;
  status:         string;
  events:         Record<string, unknown>[];
  updatedAt:      string;
  estimatedDelivery?: string;
}

export interface ReturnRequest {
  id:          string;
  orderId:     string;
  buyerId:     string;
  sellerId:    string;
  reason:      string;
  status:      ReturnStatus;
  evidenceUrls: string[];
  requestedAt: string;
  orderItemId?:     string;
  description?:     string;
  refundAmount?:    number;
  resolutionNotes?: string;
  resolvedAt?:      string;
}

export interface CreateOrderInput {
  sellerId:  string;
  type?:     OrderType;
  currency?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity:  number;
    unitPrice: number;
  }>;
  couponCode?:      string;
  shippingAmount?:  number;
  taxAmount?:       number;
  shippingAddress?: Record<string, unknown>;
  billingAddress?:  Record<string, unknown>;
  notes?:           string;
}
