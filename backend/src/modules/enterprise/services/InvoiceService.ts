import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { Invoice, InvoiceItem } from '../types/enterprise.types.js';

let _seq = 1000;
function nextInvoiceNumber(type: Invoice['type']): string {
  const prefix: Record<Invoice['type'], string> = {
    invoice: 'INV', quote: 'QUO', purchase_order: 'PO', credit_note: 'CN', debit_note: 'DN',
  };
  return `${prefix[type]}-${new Date().getFullYear()}-${(++_seq).toString().padStart(5, '0')}`;
}

export const InvoiceService = {
  async create(orgId: string, actorId: string, input: {
    type: Invoice['type']; clientName: string; clientEmail?: string;
    items: InvoiceItem[]; taxRate?: number; currency?: string;
    dueDate?: string; notes?: string; branchId?: string;
    isRecurring?: boolean; recurringInterval?: Invoice['recurringInterval'];
  }): Promise<Invoice> {
    const subtotal  = input.items.reduce((s, i) => s + i.total, 0);
    const taxRate   = input.taxRate ?? 0;
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total     = subtotal + taxAmount;

    const inv = await EnterpriseRepository.createInvoice({
      orgId, type: input.type, number: nextInvoiceNumber(input.type),
      clientName: input.clientName, clientEmail: input.clientEmail,
      items: input.items, subtotal, taxAmount, taxRate, total,
      currency: input.currency ?? 'HTG', status: 'draft',
      dueDate: input.dueDate, notes: input.notes, branchId: input.branchId,
      isRecurring: input.isRecurring ?? false,
      recurringInterval: input.recurringInterval,
      createdBy: actorId,
    });

    await AuditLogService.log({
      orgId, userId: actorId, action: 'invoice.created', entity: 'invoice', entityId: inv.id,
      after: { number: inv.number, type: inv.type, total: inv.total, clientName: inv.clientName },
    });
    return inv;
  },

  async list(orgId: string, filters: { type?: string; status?: string } = {}): Promise<Invoice[]> {
    return EnterpriseRepository.listInvoices(orgId, filters);
  },

  async get(id: string): Promise<Invoice | null> {
    return EnterpriseRepository.getInvoice(id);
  },

  async send(invoiceId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updateInvoiceStatus(invoiceId, 'sent');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'invoice.sent', entity: 'invoice', entityId: invoiceId,
    });
  },

  async markPaid(invoiceId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updateInvoiceStatus(invoiceId, 'paid');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'invoice.paid', entity: 'invoice', entityId: invoiceId,
    });
  },

  async cancel(invoiceId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updateInvoiceStatus(invoiceId, 'cancelled');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'invoice.cancelled', entity: 'invoice', entityId: invoiceId,
    });
  },

  computeSummary(invoices: Invoice[]): { totalDue: number; totalPaid: number; overdue: number; currency: string } {
    const paid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const due     = invoices.filter(i => ['sent','viewed'].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0);
    return { totalPaid: paid, totalDue: due, overdue, currency: invoices[0]?.currency ?? 'HTG' };
  },
};