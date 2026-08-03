import { randomUUID }     from 'crypto';
import { db }             from '../../../core/database/SupabaseClient.js';
import { TypedEventBus }  from '../../../core/events/TypedEventBus.js';
import type { FileCategory, PermissionLevel, StorageFile, UploadSession, AllowedMimeType } from '../types/storage.types.js';

// Buckets
const BUCKET_PUBLIC  = 'jobfast-public';
const BUCKET_PRIVATE = 'jobfast-private';
const BUCKET_TEMP    = 'jobfast-temp';

// Size limits in bytes per MIME group
const SIZE_LIMITS: Record<string, number> = {
  'image/':       50  * 1024 * 1024,   // 50 MB
  'video/':       500 * 1024 * 1024,   // 500 MB
  'audio/':       50  * 1024 * 1024,   // 50 MB
  'application/': 100 * 1024 * 1024,   // 100 MB
  'text/':        10  * 1024 * 1024,   // 10 MB
};

const ALLOWED_MIMES = new Set<AllowedMimeType>([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'application/zip',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
]);

// Private categories always go to private bucket
const PRIVATE_CATEGORIES = new Set<FileCategory>(['medical', 'government', 'contract', 'invoice', 'cv']);

function getBucket(category: FileCategory, permissionLevel: PermissionLevel): string {
  if (permissionLevel === 'public') return BUCKET_PUBLIC;
  if (PRIVATE_CATEGORIES.has(category)) return BUCKET_PRIVATE;
  return BUCKET_PRIVATE;
}

function buildPath(userId: string, category: FileCategory, filename: string): string {
  const date   = new Date().toISOString().slice(0, 7); // YYYY-MM
  const ext    = filename.includes('.') ? '.' + filename.split('.').pop()! : '';
  const fileId = randomUUID().replace(/-/g, '').slice(0, 16);
  return `${category}/${userId}/${date}/${fileId}${ext}`;
}

export const UploadEngine = {
  validate(filename: string, mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIMES.has(mimeType as AllowedMimeType)) {
      return { valid: false, error: `Kalite fichye ${mimeType} pa aksepte.` };
    }
    const group  = Object.keys(SIZE_LIMITS).find(k => mimeType.startsWith(k));
    const limit  = group ? SIZE_LIMITS[group]! : 10 * 1024 * 1024;
    if (sizeBytes > limit) {
      return { valid: false, error: `Fichye a twò gwo. Limit: ${Math.round(limit / 1024 / 1024)} MB.` };
    }
    if (filename.length > 255) {
      return { valid: false, error: 'Non fichye a twò long (max 255 karaktè).' };
    }
    return { valid: true };
  },

  // Generate a signed upload URL — client uploads directly to Supabase Storage
  async getSignedUploadUrl(userId: string, category: FileCategory, filename: string, mimeType: string, permissionLevel: PermissionLevel = 'private'): Promise<UploadSession> {
    const bucket  = getBucket(category, permissionLevel);
    const path    = buildPath(userId, category, filename);
    const EXPIRY  = 3600; // 1 hour

    const { data, error } = await db.client().storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) throw new Error(`Upload URL génération echoué: ${error?.message ?? 'unknown'}`);

    return {
      sessionId: randomUUID(),
      signedUrl: data.signedUrl,
      path:      data.path,
      bucket,
      expiresAt: new Date(Date.now() + EXPIRY * 1000).toISOString(),
    };
  },

  // Called after client finishes uploading — creates the DB record
  async confirmUpload(userId: string, session: { path: string; bucket: string; sessionId: string }, metadata: {
    filename:  string;
    mimeType:  string;
    sizeBytes: number;
    category:  FileCategory;
    permissionLevel: PermissionLevel;
    isTemp?:   boolean;
    ttlHours?: number;
    extra?:    Record<string, unknown>;
  }): Promise<StorageFile> {
    // Get public URL (only if in public bucket)
    let publicUrl: string | undefined;
    if (metadata.permissionLevel === 'public') {
      const { data } = db.client().storage.from(session.bucket).getPublicUrl(session.path);
      publicUrl = data.publicUrl;
    }

    const row: Record<string, unknown> = {
      uploaded_by:      userId,
      bucket:           session.bucket,
      path:             session.path,
      filename:         metadata.filename,
      mime_type:        metadata.mimeType,
      size_bytes:       metadata.sizeBytes,
      category:         metadata.category,
      permission_level: metadata.permissionLevel,
      status:           'active',
      is_temp:          metadata.isTemp ?? false,
      version_count:    1,
      metadata:         metadata.extra ?? {},
    };
    if (publicUrl)        row['public_url'] = publicUrl;
    if (metadata.isTemp && metadata.ttlHours) {
      row['expires_at'] = new Date(Date.now() + metadata.ttlHours * 3600000).toISOString();
    }

    const { data } = await db.client().from('stor_files').insert(row).select().single();
    const d = data as Record<string, unknown>;

    TypedEventBus.publish({ eventName: 'storage.file_uploaded', payload: { fileId: String(d['id']), userId, category: metadata.category, mimeType: metadata.mimeType } });

    return UploadEngine._mapFile(d);
  },

  _mapFile(r: Record<string, unknown>): StorageFile {
    const f: StorageFile = {
      id: String(r['id']), uploadedBy: String(r['uploaded_by']),
      bucket: String(r['bucket']), path: String(r['path']), filename: String(r['filename']),
      mimeType: String(r['mime_type']), sizeBytes: Number(r['size_bytes']),
      category: String(r['category']) as FileCategory,
      permissionLevel: String(r['permission_level']) as PermissionLevel,
      status: String(r['status']) as StorageFile['status'],
      isTemp: Boolean(r['is_temp']), versionCount: Number(r['version_count']),
      metadata: (r['metadata'] as Record<string, unknown>) ?? {},
      createdAt: String(r['created_at']), updatedAt: String(r['updated_at']),
    };
    if (r['public_url'])  f.publicUrl = String(r['public_url']);
    if (r['expires_at'])  f.expiresAt = String(r['expires_at']);
    return f;
  },

  async getFile(fileId: string): Promise<StorageFile | null> {
    const { data } = await db.client().from('stor_files').select('*').eq('id', fileId).neq('status', 'deleted').single();
    return data ? UploadEngine._mapFile(data as Record<string, unknown>) : null;
  },

  async listUserFiles(userId: string, category?: FileCategory, page = 1, limit = 20): Promise<StorageFile[]> {
    let q = db.client().from('stor_files').select('*').eq('uploaded_by', userId).neq('status', 'deleted').order('created_at', { ascending: false });
    if (category) q = q.eq('category', category);
    const { data } = await q.range((page - 1) * limit, page * limit - 1);
    return ((data ?? []) as Record<string, unknown>[]).map(UploadEngine._mapFile);
  },

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await UploadEngine.getFile(fileId);
    if (!file || file.uploadedBy !== userId) throw new Error('Fichye pa jwenn oswa aksè refize');
    // Soft delete in DB
    await db.client().from('stor_files').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', fileId);
    // Remove from storage
    await db.client().storage.from(file.bucket).remove([file.path]);
    TypedEventBus.publish({ eventName: 'storage.file_deleted', payload: { fileId, userId } });
  },
};