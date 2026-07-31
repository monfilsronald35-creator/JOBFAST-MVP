import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { PayrollRecord, PayrollItem } from '../types/enterprise.types.js';

export const PayrollService = {
  async generate(orgId: string, actorId: string, input: {
    employeeId: string; period: string; items: PayrollItem[]; currency: string;
  }): Promise<PayrollRecord> {
    const credits  = input.items.filter(i => i.isCredit).reduce((s, i) => s + i.amount, 0);
    const debits   = input.items.filter(i => !i.isCredit).reduce((s, i) => s + i.amount, 0);
    const gross    = credits;
    const net      = Math.max(0, credits - debits);

    const record = await EnterpriseRepository.createPayroll({
      orgId, employeeId: input.employeeId, period: input.period,
      grossAmount: gross, netAmount: net, currency: input.currency,
      items: input.items, status: 'draft',
    });

    await AuditLogService.log({
      orgId, userId: actorId, action: 'payroll.generated', entity: 'payroll', entityId: record.id,
      after: { employeeId: input.employeeId, period: input.period, net },
    });
    return record;
  },

  async list(orgId: string, period?: string): Promise<PayrollRecord[]> {
    return EnterpriseRepository.listPayroll(orgId, period);
  },

  async submit(payrollId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updatePayrollStatus(payrollId, 'pending_approval');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'payroll.submitted', entity: 'payroll', entityId: payrollId,
    });
  },

  async approve(payrollId: string, orgId: string, approverId: string): Promise<void> {
    await EnterpriseRepository.updatePayrollStatus(payrollId, 'approved', approverId);
    await AuditLogService.log({
      orgId, userId: approverId, action: 'payroll.approved', entity: 'payroll', entityId: payrollId,
    });
  },

  async markPaid(payrollId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updatePayrollStatus(payrollId, 'paid');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'payroll.paid', entity: 'payroll', entityId: payrollId,
    });
  },

  async cancel(payrollId: string, orgId: string, actorId: string): Promise<void> {
    await EnterpriseRepository.updatePayrollStatus(payrollId, 'cancelled');
    await AuditLogService.log({
      orgId, userId: actorId, action: 'payroll.cancelled', entity: 'payroll', entityId: payrollId,
    });
  },

  buildPayslip(record: PayrollRecord): Record<string, unknown> {
    return {
      id:          record.id,
      period:      record.period,
      currency:    record.currency,
      grossAmount: record.grossAmount / 100,
      netAmount:   record.netAmount / 100,
      breakdown:   record.items.map(i => ({
        label:  i.description,
        amount: i.amount / 100,
        type:   i.type,
        sign:   i.isCredit ? '+' : '-',
      })),
      status:      record.status,
      paidAt:      record.paidAt,
    };
  },
};