export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const ITEM_TYPES = [
  'product',
  'service',
  'digital',
  'subscription',
] as const;

export type ItemType = typeof ITEM_TYPES[number];

export const ADDRESS_TYPES = ['shipping', 'billing'] as const;

export type AddressType = typeof ADDRESS_TYPES[number];

// ---- Entity interfaces ----

export interface Order {
  id: string;
  customerId: string;
  sellerId: string | null;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currencyId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  serviceId: string | null;
  itemType: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
  metadata: Record<string, unknown>;
}

export interface OrderAddress {
  id: string;
  orderId: string;
  addressType: string;
  fullName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  gateway: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  rawResponse: Record<string, unknown>;
  createdAt: string;
}

export interface OrderShipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string | null;
  shippingLabelUrl: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ShipmentTracking {
  id: string;
  shipmentId: string;
  statusMessage: string;
  location: string | null;
  timestamp: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  pdfUrl: string | null;
  issuedAt: string;
  dueDate: string | null;
}

export const RETURN_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'item_received',
  'refunded',
] as const;

export type ReturnStatus = typeof RETURN_STATUSES[number];

export const DISPUTE_STATUSES = [
  'open',
  'under_review',
  'resolved',
  'closed',
] as const;

export type DisputeStatus = typeof DISPUTE_STATUSES[number];

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  quantity: number;
  condition: string | null;
}

export interface Refund {
  id: string;
  returnId: string | null;
  orderId: string;
  amount: number;
  gatewayRefundId: string | null;
  status: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  status: DisputeStatus;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
