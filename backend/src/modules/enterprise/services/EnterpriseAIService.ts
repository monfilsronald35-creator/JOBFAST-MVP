import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { ReportService }         from './ReportService.js';
import type { Organization }     from '../types/enterprise.types.js';

interface AIQuery { question: string; orgId: string; lang?: string; }
interface AIResponse { answer: string; data?: Record<string, unknown>; suggestions?: string[]; }

const QUESTION_PATTERNS: Array<{ pattern: RegExp; handler: (orgId: string, lang: string) => Promise<AIResponse> }> = [
  {
    pattern: /revni|revenue|konbyen.*fè|rapò/i,
    handler: async (orgId, lang) => {
      const period = new Date().toISOString().slice(0, 7);
      const org    = await EnterpriseRepository.getOrg(orgId);
      const report = await ReportService.generate(orgId, period, org?.currency ?? 'HTG');
      const rev    = report.revenue / 100;
      const answer = lang === 'en'
        ? `This month's revenue is ${rev.toFixed(2)} ${report.currency}. Profit: ${(report.profit / 100).toFixed(2)} ${report.currency}.`
        : `Revni mwa sa a: ${rev.toFixed(2)} ${report.currency}. Pwofi: ${(report.profit / 100).toFixed(2)} ${report.currency}.`;
      return { answer, data: { revenue: rev, profit: report.profit / 100, currency: report.currency } };
    },
  },
  {
    pattern: /branch.*plis|meilleur.*branch|best.*branch|ki branch/i,
    handler: async (orgId, lang) => {
      const period  = new Date().toISOString().slice(0, 7);
      const org     = await EnterpriseRepository.getOrg(orgId);
      const report  = await ReportService.generate(orgId, period, org?.currency ?? 'HTG');
      const top     = report.branches.sort((a, b) => b.revenue - a.revenue)[0];
      const answer  = top
        ? (lang === 'en'
            ? `The best performing branch is ${top.name} with ${(top.revenue / 100).toFixed(2)} ${report.currency} in revenue.`
            : `Branch ki pi pèfòman an se ${top.name} avèk ${(top.revenue / 100).toFixed(2)} ${report.currency} revni.`)
        : (lang === 'en' ? 'No branch data available.' : 'Pa gen done branch disponib.');
      return { answer, data: { topBranch: top } };
    },
  },
  {
    pattern: /anplwaye|employee|headcount|pòs/i,
    handler: async (orgId, lang) => {
      const employees = await EnterpriseRepository.listEmployees(orgId);
      const active    = employees.filter(e => e.status === 'active').length;
      const onLeave   = employees.filter(e => e.status === 'on_leave').length;
      const answer    = lang === 'en'
        ? `You have ${active} active employees and ${onLeave} on leave.`
        : `Ou gen ${active} anplwaye aktif ak ${onLeave} k ap konnje.`;
      return { answer, data: { total: employees.length, active, onLeave } };
    },
  },
  {
    pattern: /depatman.*bidjè|budget.*department|depas.*bidjè/i,
    handler: async (orgId, lang) => {
      const period  = new Date().toISOString().slice(0, 7);
      const org     = await EnterpriseRepository.getOrg(orgId);
      const report  = await ReportService.generate(orgId, period, org?.currency ?? 'HTG');
      const over    = report.departments.filter(d => d.spent > d.budget && d.budget > 0);
      const answer  = over.length === 0
        ? (lang === 'en' ? 'All departments are within budget.' : 'Tout depatman yo andedan bidjè yo.')
        : (lang === 'en'
            ? `${over.length} department(s) over budget: ${over.map(d => d.name).join(', ')}.`
            : `${over.length} depatman depase bidjè: ${over.map(d => d.name).join(', ')}.`);
      return { answer, data: { overBudgetDepts: over } };
    },
  },
  {
    pattern: /salaryal|payroll|salè/i,
    handler: async (orgId, lang) => {
      const period    = new Date().toISOString().slice(0, 7);
      const payrolls  = await EnterpriseRepository.listPayroll(orgId, period);
      const pending   = payrolls.filter(p => p.status === 'pending_approval').length;
      const paid      = payrolls.filter(p => p.status === 'paid').length;
      const total     = payrolls.reduce((s, p) => s + p.netAmount, 0);
      const answer    = lang === 'en'
        ? `Payroll this month: ${total / 100} total. ${paid} paid, ${pending} pending approval.`
        : `Salaryal mwa sa a: ${total / 100} total. ${paid} peye, ${pending} ap tann apwobasyon.`;
      return { answer, data: { total: total / 100, paid, pending } };
    },
  },
];

export const EnterpriseAIService = {
  async query(input: AIQuery): Promise<AIResponse> {
    const lang = input.lang ?? 'ht';

    for (const { pattern, handler } of QUESTION_PATTERNS) {
      if (pattern.test(input.question)) {
        try {
          const response = await handler(input.orgId, lang);
          return {
            ...response,
            suggestions: buildSuggestions(lang),
          };
        } catch {
          break;
        }
      }
    }

    return {
      answer: lang === 'en'
        ? 'I can help with: revenue, branch performance, employees, payroll, and budget analysis.'
        : 'Mwen ka ede ak: revni, pèfòmans branch, anplwaye, salaryal, ak analiz bidjè.',
      suggestions: buildSuggestions(lang),
    };
  },
};

function buildSuggestions(lang: string): string[] {
  return lang === 'en' ? [
    'How much revenue did we make this month?',
    'Which branch is performing best?',
    'How many employees do we have?',
    'Which departments exceeded budget?',
    'What is the payroll status?',
  ] : [
    'Konbyen revni nou fè mwa sa a?',
    'Ki branch ki vann plis?',
    'Konbyen anplwaye nou genyen?',
    'Ki depatman ki depase bidjè?',
    'Ki eta salaryal la?',
  ];
}