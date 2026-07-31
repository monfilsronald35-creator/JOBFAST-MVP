import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { Department }       from '../types/enterprise.types.js';

export const DepartmentService = {
  async create(orgId: string, userId: string, input: {
    name: string; code: string; branchId?: string; parentId?: string;
    headId?: string; budget?: number; currency?: string;
  }): Promise<Department> {
    const dept = await EnterpriseRepository.createDept({
      orgId, name: input.name, code: input.code.toUpperCase(),
      branchId: input.branchId, parentId: input.parentId,
      headId: input.headId, budget: input.budget, currency: input.currency ?? 'HTG',
      status: 'active',
    });
    await AuditLogService.log({
      orgId, userId, action: 'dept.created', entity: 'department', entityId: dept.id,
      after: { name: dept.name, code: dept.code },
    });
    return dept;
  },

  async list(orgId: string, branchId?: string): Promise<Department[]> {
    return EnterpriseRepository.listDepts(orgId, branchId);
  },

  async get(id: string): Promise<Department | null> {
    return EnterpriseRepository.getDept(id);
  },

  async tree(orgId: string): Promise<Department[]> {
    const all = await EnterpriseRepository.listDepts(orgId);
    return buildTree(all);
  },
};

function buildTree(depts: Department[]): Department[] {
  const roots = depts.filter(d => !d.parentId);
  return roots;
}