import { db } from '../../../core/database/SupabaseClient.js';
import type { Invoice, InvoiceLine } from '../types/monetization.types.js';

export const BillingEngine = {
  async generateInvoice(params: {
    userId?: string;
    type: Invoice['type'];
    service?: string;
    lineItems: InvoiceLine[];
    currency: string;
    taxRate?: number;
    periodStart?: Date;
    periodEnd?: Date;
    dueAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<Invoice> {
    const subtotal   = params.lineItems.reduce((s, l) => s + l.totalAmount, 0);
    const taxAmount  = params.taxRate ? Math.round(subtotal * params.taxRate / 100) : 0;
    const total      = subtotal + taxAmount;
    const invoiceNumber = await _nextInvoiceNumber();

    const payload: Record<string, unknown> = {
      invoice_number: invoiceNumber,
      type:           params.type,
      subtotal,
      tax_amount:     taxAmount,
      total,
      currency:       params.currency,
      status:         'draft',
      line_items:     params.lineItems,
    };
    if (params.userId)      payload['user_id']      = params.userId;
    if (params.service)     payload['service']      = params.service;
    if (params.periodStart) payload['period_start'] = params.periodStart.toISOString();
    if (params.periodEnd)   payload['period_end']   = params.periodEnd.toISOString();
    if (params.dueAt)       payload['due_at']       = params.dueAt.toISOString();
    if (params.metadata)    payload['metadata']     = params.metadata;

    const { data, error } = await db.client()
      .from('mon_invoices')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return _map(data as Record<string, unknown>);
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data } = await db.client().from('mon_invoices').select('*').eq('id', id).single();
    return data ? _map(data as Record<string, unknown>) : null;
  },

  async getUserInvoices(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<{ invoices: Invoice[]; nextCursor?: string }> {
    let q = db.client()
      .from('mon_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })
      .limit(limit + 1);
    if (cursor) q = q.lt('issued_at', cursor);

    const { data, error } = await q;
    if (error) throw error;

    const rows = ((data ?? []) as Record<string, unknown>[]);
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    const invoices = rows.map(_map);
    const result: { invoices: Invoice[]; nextCursor?: string } = { invoices };
    const last = invoices[invoices.length - 1];
    if (hasMore && last) result.nextCursor = new Date(last.issuedAt).toISOString();
    return result;
  },

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    const payload: Record<string, unknown> = { status };
    if (status === 'paid') payload['paid_at'] = new Date().toISOString();
    const { error } = await db.client().from('mon_invoices').update(payload).eq('id', id);
    if (error) throw error;
  },

  async getCommissionReport(
    from: Date,
    to: Date,
    service?: string
  ): Promise<{
    totalFees: number;
    totalTransactions: number;
    byService: Record<string, { fees: number; count: number }>;
    currency: string;
  }> {
    let q = db.client()
      .from('mon_revenue_events')
      .select('service, fee_amount')
      .eq('status', 'collected')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());
    if (service) q = q.eq('service', service);

    const { data, error } = await q;
    if (error) throw error;

    const byService: Record<string, { fees: number; count: number }> = {};
    for (const row of ((data ?? []) as Record<string, unknown>[])) {
      const svc = row['service'] as string;
      if (!byService[svc]) byService[svc] = { fees: 0, count: 0 };
      byService[svc]!.fees  += (row['fee_amount'] as number) ?? 0;
      byService[svc]!.count += 1;
    }

    return {
      totalFees:         Object.values(byService).reduce((s, v) => s + v.fees,  0),
      totalTransactions: Object.values(byService).reduce((s, v) => s + v.count, 0),
      byService,
      currency: 'HTG',
    };
  },
};

async function _nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const res = await db.client()
    .from('mon_invoices')
    .select('id', { count: 'exact', head: true });
  const seq = String((res.count ?? 0) + 1).padStart(5, '0');
  return `INV-${year}-${seq}`;
}

function _map(row: Record<string, unknown>): Invoice {
  const inv: Invoice = {
    id:            row['id'] as string,
    invoiceNumber: row['invoice_number'] as string,
    type:          row['type'] as Invoice['type'],
    subtotal:      row['subtotal'] as number,
    taxAmount:     row['tax_amount'] as number,
    total:         row['total'] as number,
    currency:      row['currency'] as string,
    status:        row['status'] as Invoice['status'],
    lineItems:     (row['line_items'] as InvoiceLine[]) ?? [],
    issuedAt:      new Date(row['issued_at'] as string).getTime(),
  };
  if (row['user_id'])      inv.userId      = row['user_id'] as string;
  if (row['service'])      inv.service     = row['service'] as string;
  if (row['period_start']) inv.periodStart = new Date(row['period_start'] as string).getTime();
  if (row['period_end'])   inv.periodEnd   = new Date(row['period_end'] as string).getTime();
  if (row['due_at'])       inv.dueAt       = new Date(row['due_at'] as string).getTime();
  if (row['paid_at'])      inv.paidAt      = new Date(row['paid_at'] as string).getTime();
  return inv;
}