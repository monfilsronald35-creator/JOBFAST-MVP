import { supabase } from '../../lib/supabase';
import type {
  Order,
  OrderItem,
  OrderAddress,
  OrderPayment,
  OrderShipment,
  ShipmentTracking,
  Invoice,
  OrderStatus,
} from '../../types/orders';

// ---- Row types (snake_case) ----

type OrderRow = {
  id: string;
  customer_id: string;
  seller_id: string | null;
  order_number: string;
  status: string;
  payment_status: string;
  currency_id: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  service_id: string | null;
  item_type: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
  metadata: Record<string, unknown>;
};

type OrderAddressRow = {
  id: string;
  order_id: string;
  address_type: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
};

type OrderPaymentRow = {
  id: string;
  order_id: string;
  gateway: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  raw_response: Record<string, unknown>;
  created_at: string;
};

type OrderShipmentRow = {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string | null;
  shipping_label_url: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type ShipmentTrackingRow = {
  id: string;
  shipment_id: string;
  status_message: string;
  location: string | null;
  timestamp: string;
};

type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string;
  pdf_url: string | null;
  issued_at: string;
  due_date: string | null;
};

// ---- Mappers ----

function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    customerId: r.customer_id,
    sellerId: r.seller_id,
    orderNumber: r.order_number,
    status: r.status as Order['status'],
    paymentStatus: r.payment_status as Order['paymentStatus'],
    currencyId: r.currency_id,
    subtotal: r.subtotal,
    taxAmount: r.tax_amount,
    shippingAmount: r.shipping_amount,
    discountAmount: r.discount_amount,
    totalAmount: r.total_amount,
    metadata: r.metadata,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapOrderItem(r: OrderItemRow): OrderItem {
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    variantId: r.variant_id,
    serviceId: r.service_id,
    itemType: r.item_type,
    title: r.title,
    price: r.price,
    quantity: r.quantity,
    total: r.total,
    metadata: r.metadata,
  };
}

function mapOrderAddress(r: OrderAddressRow): OrderAddress {
  return {
    id: r.id,
    orderId: r.order_id,
    addressType: r.address_type,
    fullName: r.full_name,
    phone: r.phone,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    country: r.country,
  };
}

function mapOrderPayment(r: OrderPaymentRow): OrderPayment {
  return {
    id: r.id,
    orderId: r.order_id,
    gateway: r.gateway,
    transactionId: r.transaction_id,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    rawResponse: r.raw_response,
    createdAt: r.created_at,
  };
}

function mapOrderShipment(r: OrderShipmentRow): OrderShipment {
  return {
    id: r.id,
    orderId: r.order_id,
    carrier: r.carrier,
    trackingNumber: r.tracking_number,
    shippingLabelUrl: r.shipping_label_url,
    status: r.status,
    shippedAt: r.shipped_at,
    deliveredAt: r.delivered_at,
    createdAt: r.created_at,
  };
}

function mapShipmentTracking(r: ShipmentTrackingRow): ShipmentTracking {
  return {
    id: r.id,
    shipmentId: r.shipment_id,
    statusMessage: r.status_message,
    location: r.location,
    timestamp: r.timestamp,
  };
}

function mapInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    orderId: r.order_id,
    invoiceNumber: r.invoice_number,
    pdfUrl: r.pdf_url,
    issuedAt: r.issued_at,
    dueDate: r.due_date,
  };
}

// ================================================================
// === Orders
// ================================================================

export async function getMyOrders(status?: OrderStatus): Promise<Order[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(mapOrder);
}

export async function getMySellerOrders(status?: OrderStatus): Promise<Order[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(mapOrder);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

export async function getOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as OrderRow) : null;
}

// ================================================================
// === Order Items
// ================================================================

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw error;
  return (data as OrderItemRow[]).map(mapOrderItem);
}

// ================================================================
// === Order Addresses
// ================================================================

export async function getOrderAddresses(
  orderId: string
): Promise<OrderAddress[]> {
  const { data, error } = await supabase
    .from('order_addresses')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw error;
  return (data as OrderAddressRow[]).map(mapOrderAddress);
}

// ================================================================
// === Order Payments
// ================================================================

export async function getOrderPayments(
  orderId: string
): Promise<OrderPayment[]> {
  const { data, error } = await supabase
    .from('order_payments')
    .select('id, order_id, gateway, transaction_id, amount, currency, status, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderPaymentRow[]).map(mapOrderPayment);
}

// ================================================================
// === Order Shipments
// ================================================================

export async function getOrderShipments(
  orderId: string
): Promise<OrderShipment[]> {
  const { data, error } = await supabase
    .from('order_shipments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderShipmentRow[]).map(mapOrderShipment);
}

// ================================================================
// === Shipment Tracking
// ================================================================

export async function getShipmentTracking(
  shipmentId: string
): Promise<ShipmentTracking[]> {
  const { data, error } = await supabase
    .from('shipment_tracking')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data as ShipmentTrackingRow[]).map(mapShipmentTracking);
}

// ================================================================
// === Invoices
// ================================================================

export async function getOrderInvoice(orderId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInvoice(data as InvoiceRow) : null;
}
