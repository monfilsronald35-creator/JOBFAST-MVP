import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { Branch }           from '../types/enterprise.types.js';
import { db }                    from '../../../core/database/SupabaseClient.js';

export const BranchService = {
  async create(orgId: string, userId: string, input: {
    name: string; code: string; country: string; city: string;
    timezone?: string; language?: string; currency?: string;
    managerId?: string; phone?: string; email?: string; address?: string;
  }): Promise<Branch> {
    const branch = await EnterpriseRepository.createBranch({
      orgId, name: input.name, code: input.code.toUpperCase(),
      country:   input.country,  city:      input.city,
      timezone:  input.timezone  ?? 'America/Port-au-Prince',
      language:  input.language  ?? 'ht',
      currency:  input.currency  ?? 'HTG',
      managerId: input.managerId, phone: input.phone,
      email: input.email, address: input.address, status: 'active',
    });

    await AuditLogService.log({
      orgId, userId, action: 'branch.created', entity: 'branch', entityId: branch.id,
      after: { name: branch.name, code: branch.code, city: branch.city },
    });
    return branch;
  },

  async list(orgId: string): Promise<Branch[]> {
    return EnterpriseRepository.listBranches(orgId);
  },

  async get(id: string): Promise<Branch | null> {
    return EnterpriseRepository.getBranch(id);
  },

  async update(branchId: string, orgId: string, userId: string, patch: Partial<Branch>): Promise<void> {
    await EnterpriseRepository.updateBranch(branchId, patch);
    await AuditLogService.log({
      orgId, userId, action: 'branch.updated', entity: 'branch', entityId: branchId,
      after: patch as Record<string, unknown>,
    });
  },

  async getRevenue(branchId: string, currency: string): Promise<number> {
    const { data } = await db.client()
      .from('wlt_transactions')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('type', 'credit')
      .eq('currency', currency)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    return (data ?? []).reduce((s, r) => s + Number((r as Record<string, unknown>)['amount'] ?? 0), 0);
  },
};