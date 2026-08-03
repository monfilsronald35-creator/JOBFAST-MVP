import { db } from '../../../core/database/SupabaseClient.js';

export const LifecycleManager = {
  // Delete expired temp files — run by cron or on-demand
  async cleanupExpired(): Promise<{ deleted: number }> {
    const { data } = await db.client().from('stor_files').select('id, bucket, path')
      .eq('is_temp', true).lte('expires_at', new Date().toISOString()).neq('status', 'deleted');

    const files = (data ?? []) as { id: string; bucket: string; path: string }[];
    let deleted = 0;

    for (const f of files) {
      try {
        await db.client().storage.from(f.bucket).remove([f.path]);
        await db.client().from('stor_files').update({ status: 'deleted' }).eq('id', f.id);
        deleted++;
      } catch { /* log and continue */ }
    }
    return { deleted };
  },

  // Archive old files — move to 'archived' status (keep in storage, remove from active listing)
  async archiveOlderThan(days: number, category?: string): Promise<{ archived: number }> {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    let q = db.client().from('stor_files').update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('status', 'active').lt('created_at', cutoff);
    if (category) q = q.eq('category', category);
    const { count } = await q;
    return { archived: count ?? 0 };
  },

  // Schedule a file for future deletion
  async scheduleDelete(fileId: string, deleteAfterDays: number): Promise<void> {
    const expiresAt = new Date(Date.now() + deleteAfterDays * 86400000).toISOString();
    await db.client().from('stor_files').update({ is_temp: true, expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('id', fileId);
  },

  // Restore archived file back to active
  async restore(fileId: string): Promise<void> {
    await db.client().from('stor_files').update({ status: 'active', is_temp: false, updated_at: new Date().toISOString() }).eq('id', fileId);
  },

  // Get storage usage summary per user
  async getUserStorageUsage(userId: string): Promise<{ totalFiles: number; totalBytes: number; byCategory: Record<string, { count: number; bytes: number }> }> {
    const { data } = await db.client().from('stor_files').select('category, size_bytes')
      .eq('uploaded_by', userId).eq('status', 'active');
    const rows = (data ?? []) as { category: string; size_bytes: number }[];

    const byCategory: Record<string, { count: number; bytes: number }> = {};
    let totalBytes = 0;
    rows.forEach(r => {
      const cat = byCategory[r.category] ?? { count: 0, bytes: 0 };
      cat.count++; cat.bytes += r.size_bytes;
      byCategory[r.category] = cat;
      totalBytes += r.size_bytes;
    });
    return { totalFiles: rows.length, totalBytes, byCategory };
  },

  getRetentionPolicy(): Record<string, { keepDays: number; archiveAfterDays: number }> {
    return {
      medical:      { keepDays: 365 * 10, archiveAfterDays: 365 * 5 },
      government:   { keepDays: 365 * 7,  archiveAfterDays: 365 * 3 },
      contract:     { keepDays: 365 * 7,  archiveAfterDays: 365 * 3 },
      invoice:      { keepDays: 365 * 7,  archiveAfterDays: 365 * 2 },
      chat_attachment: { keepDays: 365 * 2, archiveAfterDays: 365 },
      profile_photo: { keepDays: 0,       archiveAfterDays: 0 },
      general:      { keepDays: 365 * 2,  archiveAfterDays: 365 },
    };
  },
};