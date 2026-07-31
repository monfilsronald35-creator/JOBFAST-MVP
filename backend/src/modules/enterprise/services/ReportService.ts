import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import type { EnterpriseReport, EnterpriseDashboard } from '../types/enterprise.types.js';
import { db }                    from '../../../core/database/SupabaseClient.js';

export const ReportService = {
  async generate(orgId: string, period: string, currency = 'HTG'): Promise<EnterpriseReport> {
    const [payrolls, invoices, employees, branches, departments] = await Promise.all([
      EnterpriseRepository.listPayroll(orgId, period),
      EnterpriseRepository.listInvoices(orgId),
      EnterpriseRepository.listEmployees(orgId),
      EnterpriseRepository.listBranches(orgId),
      EnterpriseRepository.listDepts(orgId),
    ]);

    const payrollTotal = payrolls
      .filter(p => p.status === 'paid' || p.status === 'approved')
      .reduce((s, p) => s + p.netAmount, 0);

    const revenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.total, 0);

    const expenses = payrollTotal;
    const headcount = employees.filter(e => e.status === 'active').length;
    const openPositions = 0;

    const branchSummaries = branches.map(b => ({
      branchId: b.id, name: b.name,
      revenue:  invoices.filter(i => i.branchId === b.id && i.status === 'paid').reduce((s, i) => s + i.total, 0),
      headcount: employees.filter(e => e.branchId === b.id && e.status === 'active').length,
    }));

    const deptSummaries = departments.map(d => ({
      deptId: d.id, name: d.name,
      headcount: employees.filter(e => e.departmentId === d.id && e.status === 'active').length,
      budget: d.budget ?? 0,
      spent: payrolls.filter(p => {
        const emp = employees.find(e => e.id === p.employeeId);
        return emp?.departmentId === d.id;
      }).reduce((s, p) => s + p.netAmount, 0),
    }));

    return {
      orgId, period, generatedAt: new Date().toISOString(),
      revenue, expenses, profit: revenue - expenses,
      headcount, payrollTotal, openPositions, currency,
      branches: branchSummaries, departments: deptSummaries,
    };
  },

  async getDashboard(orgId: string, ownerId: string): Promise<EnterpriseDashboard> {
    const [org, branches, employees] = await Promise.all([
      EnterpriseRepository.getOrg(orgId),
      EnterpriseRepository.listBranches(orgId),
      EnterpriseRepository.listEmployees(orgId),
    ]);
    if (!org) throw new Error('Organization not found');

    const period  = new Date().toISOString().slice(0, 7);
    const report  = await ReportService.generate(orgId, period, org.currency);

    const riskAlerts: string[] = [];

    const { data: notifs } = await db.client()
      .from('notif_notifications')
      .select('title')
      .eq('user_id', ownerId)
      .in('event_type', ['fraud.alert', 'payment.failed'])
      .eq('is_read', false)
      .limit(3);
    (notifs ?? []).forEach(n => riskAlerts.push(String((n as Record<string, unknown>)['title'] ?? '')));

    const aiInsights: string[] = [
      `${report.headcount} anplwaye aktif`,
      `Revni mwa sa a: ${report.revenue / 100} ${org.currency}`,
      `${branches.length} branch aktif`,
      `Depans salaryal: ${report.payrollTotal / 100} ${org.currency}`,
    ];

    return {
      orgId, orgName: org.name, globalRevenue: report.revenue,
      currency: org.currency, headcount: report.headcount,
      openPositions: report.openPositions, branches: report.branches,
      payrollStatus: 'on_track', riskAlerts, aiInsights,
      generatedAt: new Date().toISOString(),
    };
  },
};