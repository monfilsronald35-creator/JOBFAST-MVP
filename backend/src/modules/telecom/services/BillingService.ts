import { TelecomRepository } from '../repositories/TelecomRepository.js';
import type { TelecomBill, BillItem } from '../types/telecom.types.js';

const LATE_FEE_RATE = 0.05;

export const BillingService = {
  async createBill(operatorId: string, input: {
    userId: string; phone: string; period: string; items: BillItem[]; currency: string; dueDate: string;
  }): Promise<TelecomBill> {
    const amount = input.items.reduce((s, i) => s + i.amount, 0);
    return TelecomRepository.createBill({
      operatorId, userId: input.userId, phone: input.phone, period: input.period,
      amount, currency: input.currency, dueDate: input.dueDate, status: 'pending',
      items: input.items,
    });
  },

  async listBills(userId: string, operatorId?: string): Promise<TelecomBill[]> {
    return TelecomRepository.listBills(userId, operatorId);
  },

  async pay(billId: string): Promise<void> {
    await TelecomRepository.updateBillStatus(billId, 'paid');
  },

  async applyLateFees(operatorId: string): Promise<number> {
    let count = 0;
    const { data } = await import('../../../core/database/SupabaseClient.js')
      .then(({ db }) => db.client()
        .from('tel_bills').select('id, amount, due_date')
        .eq('operator_id', operatorId)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().slice(0, 10)));

    for (const r of data ?? []) {
      const row     = r as Record<string, unknown>;
      const id      = String(row['id'] ?? '');
      const amount  = Number(row['amount'] ?? 0);
      const lateFee = Math.round(amount * LATE_FEE_RATE);
      await import('../../../core/database/SupabaseClient.js').then(({ db }) =>
        db.client().from('tel_bills').update({ status: 'overdue', late_fee: lateFee }).eq('id', id),
      );
      count++;
    }
    return count;
  },

  buildPDF(bill: TelecomBill): Record<string, unknown> {
    return {
      invoiceNumber: `BILL-${bill.id.slice(0, 8).toUpperCase()}`,
      period:        bill.period,
      phone:         bill.phone,
      dueDate:       bill.dueDate,
      currency:      bill.currency,
      items:         bill.items,
      total:         bill.amount / 100,
      lateFee:       (bill.lateFee ?? 0) / 100,
      status:        bill.status,
      paidAt:        bill.paidAt,
    };
  },
};