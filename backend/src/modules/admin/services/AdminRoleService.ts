import { db } from '../../../core/database/SupabaseClient.js';

export type AdminRoleType =
  | 'founder' | 'global_administrator' | 'regional_administrator'
  | 'country_administrator' | 'city_administrator' | 'support_manager'
  | 'fraud_manager' | 'finance_manager' | 'content_moderator'
  | 'ai_administrator' | 'security_administrator' | 'developer'
  | 'read_only_auditor';

export interface RoleDefinition {
  role: AdminRoleType;
  displayName: string;
  level: number;
  permissions: string[];
  countryScope?: string;
  cityScope?: string;
}

// In-memory role definitions (also seeded in migration)
const ROLES: Record<AdminRoleType, RoleDefinition> = {
  founder:               { role: 'founder',               displayName: 'Founder',                level: 100, permissions: ['*'] },
  global_administrator:  { role: 'global_administrator',  displayName: 'Global Administrator',    level: 90,  permissions: ['users.*','content.*','flags.*','config.*','monetization.*','security.*','ai.*','countries.*','broadcast.*','audit.read','roles.assign'] },
  regional_administrator:{ role: 'regional_administrator',displayName: 'Regional Administrator',  level: 70,  permissions: ['users.*','content.*','flags.read','config.read','monetization.read','audit.read'] },
  country_administrator: { role: 'country_administrator', displayName: 'Country Administrator',   level: 60,  permissions: ['users.read','users.suspend','content.*','audit.read'] },
  city_administrator:    { role: 'city_administrator',    displayName: 'City Administrator',      level: 50,  permissions: ['users.read','content.read','content.approve','content.reject','audit.read'] },
  support_manager:       { role: 'support_manager',       displayName: 'Support Manager',         level: 40,  permissions: ['users.read','users.suspend','content.read','content.approve','audit.read'] },
  fraud_manager:         { role: 'fraud_manager',         displayName: 'Fraud Manager',           level: 45,  permissions: ['users.read','users.suspend','users.ban','security.*','audit.*'] },
  finance_manager:       { role: 'finance_manager',       displayName: 'Finance Manager',         level: 45,  permissions: ['monetization.*','billing.*','audit.read','users.read'] },
  content_moderator:     { role: 'content_moderator',     displayName: 'Content Moderator',       level: 30,  permissions: ['content.*','audit.read'] },
  ai_administrator:      { role: 'ai_administrator',      displayName: 'AI Administrator',        level: 40,  permissions: ['ai.*','flags.read','audit.read'] },
  security_administrator:{ role: 'security_administrator',displayName: 'Security Administrator',  level: 45,  permissions: ['security.*','users.read','audit.*'] },
  developer:             { role: 'developer',             displayName: 'Developer',               level: 35,  permissions: ['flags.*','config.read','audit.read','health.*','ai.read'] },
  read_only_auditor:     { role: 'read_only_auditor',     displayName: 'Read Only Auditor',       level: 10,  permissions: ['audit.read','stats.read'] },
};

export const AdminRoleService = {
  listRoles(): RoleDefinition[] {
    return Object.values(ROLES).sort((a, b) => b.level - a.level);
  },

  getRole(role: string): RoleDefinition | null {
    return ROLES[role as AdminRoleType] ?? null;
  },

  canAccess(role: string, resource: string, action: string): boolean {
    const def = ROLES[role as AdminRoleType];
    if (!def) return false;
    // Founder has all permissions
    if (def.permissions.includes('*')) return true;
    const perm    = `${resource}.${action}`;
    const wildcard = `${resource}.*`;
    const readAll  = '*.read';
    return def.permissions.includes(perm)
        || def.permissions.includes(wildcard)
        || (action === 'read' && def.permissions.includes(readAll));
  },

  async assignRole(actorId: string, userId: string, role: AdminRoleType): Promise<void> {
    // Map extended role → base role for auth middleware (admin or superadmin)
    const isHighLevel = ['founder', 'global_administrator', 'regional_administrator'].includes(role);
    const baseRole = role === 'founder' ? 'superadmin' : isHighLevel ? 'admin' : 'admin';

    const { error } = await db.client()
      .from('profiles')
      .update({ role: baseRole, admin_role: role, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  async getUserAdminRole(userId: string): Promise<string | null> {
    const { data } = await db.client()
      .from('profiles')
      .select('admin_role, role')
      .eq('id', userId)
      .single();
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return (row['admin_role'] as string | null) ?? (row['role'] as string | null);
  },

  async getAdminUsers(limit = 50): Promise<Array<{ id: string; name: string; email: string; role: string; adminRole?: string }>> {
    const { data, error } = await db.client()
      .from('profiles')
      .select('id, name, email, role, admin_role')
      .in('role', ['admin', 'superadmin'])
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(row => ({
      id:        row['id']         as string,
      name:      row['name']       as string,
      email:     row['email']      as string,
      role:      row['role']       as string,
      adminRole: row['admin_role'] as string | undefined,
    }));
  },
};
