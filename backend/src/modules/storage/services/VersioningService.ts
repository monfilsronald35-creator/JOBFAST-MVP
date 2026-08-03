import { db }             from '../../../core/database/SupabaseClient.js';
import type { FileVersion } from '../types/storage.types.js';

const MAX_VERSIONS = 10;

export const VersioningService = {
  async createVersion(fileId: string, newPath: string, sizeBytes: number, createdBy: string): Promise<FileVersion> {
    // Get current version count
    const { data: file } = await db.client().from('stor_files').select('version_count').eq('id', fileId).single();
    const currentVersion = file ? Number((file as Record<string, unknown>)['version_count']) : 1;
    const nextVersion    = currentVersion + 1;

    // Save current path as old version
    const { data } = await db.client().from('stor_file_versions').insert({
      file_id: fileId, version: nextVersion, path: newPath, size_bytes: sizeBytes, created_by: createdBy,
    }).select().single();

    // Bump version count on file record
    await db.client().from('stor_files').update({ version_count: nextVersion, path: newPath, size_bytes: sizeBytes, updated_at: new Date().toISOString() }).eq('id', fileId);

    // Prune old versions if over limit
    const { data: all } = await db.client().from('stor_file_versions').select('id').eq('file_id', fileId).order('version', { ascending: false });
    const ids = ((all ?? []) as { id: string }[]).slice(MAX_VERSIONS).map(r => r.id);
    if (ids.length > 0) {
      await db.client().from('stor_file_versions').delete().in('id', ids);
    }

    const v = data as Record<string, unknown>;
    return { id: String(v['id']), fileId, version: nextVersion, path: newPath, sizeBytes, createdBy, createdAt: String(v['created_at']) };
  },

  async getVersions(fileId: string): Promise<FileVersion[]> {
    const { data } = await db.client().from('stor_file_versions').select('*').eq('file_id', fileId).order('version', { ascending: false });
    return ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id: String(r['id']), fileId: String(r['file_id']), version: Number(r['version']),
      path: String(r['path']), sizeBytes: Number(r['size_bytes']),
      createdBy: String(r['created_by']), createdAt: String(r['created_at']),
    }));
  },

  async rollback(fileId: string, versionId: string, requestedBy: string): Promise<void> {
    const { data } = await db.client().from('stor_file_versions').select('*').eq('id', versionId).eq('file_id', fileId).single();
    if (!data) throw new Error('Vèsyon sa a pa jwenn');
    const v = data as Record<string, unknown>;
    await db.client().from('stor_files').update({ path: String(v['path']), size_bytes: Number(v['size_bytes']), updated_at: new Date().toISOString() }).eq('id', fileId);
    void requestedBy;
  },
};