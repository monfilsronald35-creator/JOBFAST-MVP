import { db }                from '../../../core/database/SupabaseClient.js';
import type { PermissionLevel } from '../types/storage.types.js';

// Role → permission level mapping
const ROLE_PERMISSIONS: Record<string, PermissionLevel[]> = {
  admin:              ['public', 'authenticated', 'private', 'company_only', 'medical_staff', 'government_officer', 'admin_only'],
  superadmin:         ['public', 'authenticated', 'private', 'company_only', 'medical_staff', 'government_officer', 'admin_only'],
  doctor:             ['public', 'authenticated', 'medical_staff'],
  nurse:              ['public', 'authenticated', 'medical_staff'],
  gov_officer:        ['public', 'authenticated', 'government_officer'],
  company:            ['public', 'authenticated', 'company_only'],
  worker:             ['public', 'authenticated'],
  user:               ['public', 'authenticated'],
};

function roleCanAccess(role: string, level: PermissionLevel): boolean {
  const allowed = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS['user']!;
  return allowed.includes(level);
}

export const FilePermissionEngine = {
  // Check if a user can access a file
  async canAccess(fileId: string, userId: string, role: string): Promise<boolean> {
    const { data: file } = await db.client().from('stor_files').select('uploaded_by, permission_level').eq('id', fileId).single();
    if (!file) return false;
    const f = file as Record<string, unknown>;

    // Owner always has access
    if (String(f['uploaded_by']) === userId) return true;

    const level = String(f['permission_level']) as PermissionLevel;

    // Check role-based access
    if (roleCanAccess(role, level)) return true;

    // Check explicit ACL grant
    const { data: acl } = await db.client().from('stor_file_acl')
      .select('can_read').eq('file_id', fileId)
      .or(`subject_id.eq.${userId},subject_id.eq.${role}`)
      .eq('can_read', true).limit(1).single();

    return !!acl;
  },

  async setPermission(fileId: string, level: PermissionLevel, grantedBy: string): Promise<void> {
    await db.client().from('stor_files').update({ permission_level: level, updated_at: new Date().toISOString() }).eq('id', fileId);
    await db.client().from('stor_file_acl').delete().eq('file_id', fileId); // Clear custom ACL when changing level
    void grantedBy;
  },

  async grantAccess(fileId: string, subjectType: 'user' | 'role' | 'company', subjectId: string, grantedBy: string, canWrite = false): Promise<void> {
    await db.client().from('stor_file_acl').upsert({
      file_id: fileId, subject_type: subjectType, subject_id: subjectId,
      can_read: true, can_write: canWrite, can_delete: false, granted_by: grantedBy,
    }, { onConflict: 'file_id,subject_type,subject_id' });
  },

  async revokeAccess(fileId: string, subjectType: string, subjectId: string): Promise<void> {
    await db.client().from('stor_file_acl').delete().eq('file_id', fileId).eq('subject_type', subjectType).eq('subject_id', subjectId);
  },

  async listFileACL(fileId: string) {
    const { data } = await db.client().from('stor_file_acl').select('*').eq('file_id', fileId);
    return (data ?? []) as Record<string, unknown>[];
  },
};