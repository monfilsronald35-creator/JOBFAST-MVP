import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { TaxRecord, TaxType } from '../types/government.types.js';

// Tax rates (percentage * 100 to avoid floating point, stored as integer basis points)
const TAX_RATES: Record<TaxType, number> = {
  income:    0.15,   // 15%
  corporate: 0.25,   // 25%
  vat:       0.10,   // 10% (TCA Haiti)
  property:  0.015,  // 1.5%
  import:    0.20,   // 20%
  export:    0.05,   // 5%
};

// Receipt QR: JOBFAST-TAX:{taxId8}-{taxpayerId6}-{ts36}
function taxReceiptQR(taxId: string, taxpayerId: string): string {
  return `JOBFAST-TAX:${taxId.replace(/-/g, '').slice(0, 8)}-${taxpayerId.replace(/-/g, '').slice(0, 6)}-${Date.now().toString(36)}`;
}

export const TaxService = {
  calculateTax(type: TaxType, baseAmount: number): number {
    return Math.round(baseAmount * TAX_RATES[type]);
  },

  async declareTax(taxpayerId: string, agencyId: string, type: TaxType, period: string, baseAmount: number, installments = 1): Promise<TaxRecord> {
    const taxAmount = TaxService.calculateTax(type, baseAmount);
    const dueDate   = period.length === 7
      ? `${period}-28`
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const record = await GovernmentRepository.createTaxRecord({
      taxpayerId, agencyId, type, status: 'declared', period,
      baseAmount, taxAmount, currency: 'HTG', dueDate, installmentCount: installments,
    });
    TypedEventBus.publish({ eventName: 'gov.tax.declared', payload: { taxId: record.id, taxpayerId, type, period } });
    return record;
  },

  async payTax(taxId: string, taxpayerId: string, paymentRef: string): Promise<void> {
    const records = await GovernmentRepository.listTaxRecords(taxpayerId);
    const record  = records.find(r => r.id === taxId);
    if (!record) throw new Error('Dosye fiskal pa jwenn');
    if (record.status === 'paid') throw new Error('Taks sa a deja peye');

    const receiptQr = taxReceiptQR(taxId, taxpayerId);
    await GovernmentRepository.updateTaxStatus(taxId, 'paid', { paymentRef, receiptQr });
    TypedEventBus.publish({ eventName: 'gov.tax.paid', payload: { taxId, taxpayerId, paymentRef } });
  },

  async requestRefund(taxId: string, taxpayerId: string): Promise<void> {
    await GovernmentRepository.updateTaxStatus(taxId, 'refund_requested');
    TypedEventBus.publish({ eventName: 'gov.tax.refund_requested', payload: { taxId, taxpayerId } });
  },

  async listTaxRecords(taxpayerId: string): Promise<TaxRecord[]> {
    return GovernmentRepository.listTaxRecords(taxpayerId);
  },

  async getOverdueTaxes(taxpayerId: string): Promise<TaxRecord[]> {
    const records = await GovernmentRepository.listTaxRecords(taxpayerId);
    const today   = new Date().toISOString().slice(0, 10);
    return records.filter(r => r.status !== 'paid' && r.status !== 'refunded' && r.dueDate < today);
  },

  getTaxRates(): Record<TaxType, number> {
    return { ...TAX_RATES };
  },
};