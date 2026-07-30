import { FinancialRepository } from '../repositories/FinancialRepository.js';
import { AppError }            from '../../../core/errors/AppError.js';
import { InvoiceStatus, type Invoice, type InvoiceItem } from '../types/financial.types.js';

export const InvoiceService = {
  async create(issuerId: string, data: {
    recipientId: string; currency: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number }>;
    dueDate?: string; notes?: string;
  }): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const invoiceItems = data.items.map(i => ({
      description: i.description, quantity: i.quantity,
      unitPrice: i.unitPrice, total: i.quantity * i.unitPrice,
      ...(i.taxRate !== undefined ? { taxRate: i.taxRate } : {}),
    }));
    const subtotal  = invoiceItems.reduce((s, i) => s + i.total, 0);
    const taxAmount = invoiceItems.reduce((s, i) => s + Math.floor(i.total * (i.taxRate ?? 0)), 0);
    const total     = subtotal + taxAmount;
    return FinancialRepository.createInvoice(
      {
        issuerId, recipientId: data.recipientId, currency: data.currency,
        subtotal, taxAmount, total,
        ...(data.dueDate ? { dueDate: data.dueDate } : {}),
        ...(data.notes   ? { notes: data.notes }     : {}),
      },
      invoiceItems
    );
  },

  async send(id: string, issuerId: string): Promise<Invoice> {
    const invoices = await FinancialRepository.listInvoices(issuerId);
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    if (inv.status !== InvoiceStatus.Draft) throw new AppError('Invoice already sent', 400, 'INVALID_STATUS');
    return FinancialRepository.updateInvoiceStatus(id, InvoiceStatus.Sent);
  },

  async markPaid(id: string): Promise<Invoice> {
    return FinancialRepository.updateInvoiceStatus(id, InvoiceStatus.Paid);
  },

  async cancel(id: string, issuerId: string): Promise<Invoice> {
    const invoices = await FinancialRepository.listInvoices(issuerId);
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    return FinancialRepository.updateInvoiceStatus(id, InvoiceStatus.Cancelled);
  },

  async list(issuerId: string): Promise<Invoice[]> {
    return FinancialRepository.listInvoices(issuerId);
  },
};
