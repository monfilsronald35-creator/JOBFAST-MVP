import { EnterpriseRepository } from '../repositories/EnterpriseRepository.js';
import { AuditLogService }       from './AuditLogService.js';
import type { EnterpriseRole }   from '../types/enterprise.types.js';

export const RolePermissionService = {
  async create(orgId: string, userId: string, input: {
    name: string; description: string; permissions: Record<string, string[]>;
  }): Promise<EnterpriseRole> {
    const role = await EnterpriseRepository.createRole({
      orgId, name: input.name, description: input.description,
      isSystem: false, permissions: input.permissions,
    });
    await AuditLogService.log({
      orgId, userId, action: 'role.created', entity: 'role', entityId: role.id,
      after: { name: role.name },
    });
    return role;
  },

  async list(orgId: string): Promise<EnterpriseRole[]> {
    return EnterpriseRepository.listRoles(orgId);
  },

  async get(id: string): Promise<EnterpriseRole | null> {
    return EnterpriseRepository.getRole(id);
  },

  async hasPermission(orgId: string, roleId: string, module: string, action: string): Promise<boolean> {
    const role = await EnterpriseRepository.getRole(roleId);
    if (!role) return false;
    const allowed = role.permissions[module] ?? [];
    return allowed.includes(action) || allowed.includes('*');
  },

  async updatePermissions(roleId: string, orgId: string, userId: string, permissions: Record<string, string[]>): Promise<void> {
    await import('../../../core/database/SupabaseClient.js').then(({ db }) =>
      db.client().from('ent_roles').update({ permissions }).eq('id', roleId).eq('org_id', orgId),
    );
    await AuditLogService.log({
      orgId, userId, action: 'role.permissions_updated', entity: 'role', entityId: roleId,
      after: { permissions },
    });
  },
};