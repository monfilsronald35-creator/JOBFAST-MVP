import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { Organization }     from '../types/enterprise.types.js';
import { SYSTEM_ROLES, MODULE_PERMISSIONS } from '../types/enterprise.types.js';
import { db }                    from '../../../core/database/SupabaseClient.js';

export const OrganizationService = {
  async create(ownerId: string, input: {
    name: string; type: Organization['type']; country: string;
    currency?: string; timezone?: string; language?: string;
    legalName?: string; parentOrgId?: string;
  }): Promise<Organization> {
    const org = await EnterpriseRepository.createOrg({
      name:        input.name,
      legalName:   input.legalName,
      parentOrgId: input.parentOrgId,
      type:        input.type,
      country:     input.country,
      currency:    input.currency ?? 'HTG',
      timezone:    input.timezone ?? 'America/Port-au-Prince',
      language:    input.language ?? 'ht',
      status:      'active',
      ownerId,
    });

    // Seed system roles for this new org
    for (const roleName of SYSTEM_ROLES) {
      await db.client().from('ent_roles').insert({
        org_id:      org.id,
        name:        roleName,
        description: roleName.replace(/_/g, ' '),
        is_system:   true,
        permissions: buildDefaultPermissions(roleName),
      }).then(() => { /* ignore duplicate */ });
    }

    await AuditLogService.log({
      orgId: org.id, userId: ownerId,
      action: 'org.created', entity: 'organization', entityId: org.id,
      after: { name: org.name, type: org.type },
    });

    return org;
  },

  async get(id: string): Promise<Organization | null> {
    return EnterpriseRepository.getOrg(id);
  },

  async listMine(ownerId: string): Promise<Organization[]> {
    return EnterpriseRepository.listOrgs(ownerId);
  },

  async getHierarchy(orgId: string): Promise<{ org: Organization; children: Organization[] }> {
    const [org, children] = await Promise.all([
      EnterpriseRepository.getOrg(orgId),
      EnterpriseRepository.listChildren(orgId),
    ]);
    if (!org) throw new Error('Organization not found');
    return { org, children };
  },

  async update(orgId: string, userId: string, patch: Partial<Organization>): Promise<void> {
    const before = await EnterpriseRepository.getOrg(orgId);
    await EnterpriseRepository.updateOrg(orgId, patch);
    await AuditLogService.log({
      orgId, userId, action: 'org.updated', entity: 'organization', entityId: orgId,
      before: before as unknown as Record<string, unknown>,
      after:  patch as Record<string, unknown>,
    });
  },
};

function buildDefaultPermissions(role: string): Record<string, string[]> {
  switch (role) {
    case 'super_admin':
    case 'country_manager':
      return Object.fromEntries(Object.keys(MODULE_PERMISSIONS).map(m => [m, MODULE_PERMISSIONS[m] ?? []]));
    case 'regional_director':
      return { employees: ['read'], payroll: ['read'], invoices: ['read'], reports: ['read', 'export'], branches: ['read', 'manage'], audit: ['read'] };
    case 'branch_manager':
      return { employees: ['read', 'create', 'update'], payroll: ['read', 'approve'], invoices: ['read', 'create', 'approve'], reports: ['read'], branches: ['read', 'update'], documents: ['read', 'create'] };
    case 'hr_manager':
      return { employees: ['read', 'create', 'update', 'delete'], payroll: ['read', 'create'], documents: ['read', 'create', 'update'], workflows: ['read', 'create', 'approve'] };
    case 'finance_manager':
      return { payroll: ['read', 'create', 'approve', 'export'], invoices: ['read', 'create', 'update', 'approve', 'send'], reports: ['read', 'export'] };
    case 'recruiter':
      return { employees: ['read', 'create'], documents: ['read', 'create'], workflows: ['read', 'create'] };
    case 'auditor':
      return { audit: ['read'], reports: ['read', 'export'] };
    case 'viewer':
      return { employees: ['read'], reports: ['read'] };
    default:
      return { employees: ['read'] };
  }
}