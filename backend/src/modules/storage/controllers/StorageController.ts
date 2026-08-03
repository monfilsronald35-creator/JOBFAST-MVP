import type { Request, Response } from 'express';
import { UploadEngine }           from '../services/UploadEngine.js';
import { CDNManager }             from '../services/CDNManager.js';
import { ImageEngine }            from '../services/ImageEngine.js';
import { FilePermissionEngine }   from '../services/FilePermissionEngine.js';
import { VersioningService }      from '../services/VersioningService.js';
import { LifecycleManager }       from '../services/LifecycleManager.js';
import { AIFileAnalyzer }         from '../services/AIFileAnalyzer.js';
import type { FileCategory, PermissionLevel } from '../types/storage.types.js';

function uid(req: Request): string { return (req as unknown as { user?: { sub?: string; role?: string } }).user?.sub ?? ''; }
function role(req: Request): string { return (req as unknown as { user?: { sub?: string; role?: string } }).user?.role ?? 'user'; }
function b(req: Request): Record<string, unknown> { return req.body as Record<string, unknown>; }
function q(req: Request): Record<string, unknown> { return req.query as Record<string, unknown>; }
function pid(req: Request): string { return String(req.params['id'] ?? ''); }

export const StorageController = {
  // ── Upload flow (signed URL) ───────────────────────────────────────────────
  async getUploadUrl(req: Request, res: Response): Promise<void> {
    const { filename, mimeType, sizeBytes, category, permissionLevel } = b(req);
    if (!filename || !mimeType || !sizeBytes) { res.status(400).json({ error: 'filename, mimeType, sizeBytes obligatwa' }); return; }

    const validation = UploadEngine.validate(String(filename), String(mimeType), Number(sizeBytes));
    if (!validation.valid) { res.status(422).json({ code: 'INVALID_FILE', error: validation.error }); return; }

    const session = await UploadEngine.getSignedUploadUrl(
      uid(req), String(category ?? 'general') as FileCategory,
      String(filename), String(mimeType),
      String(permissionLevel ?? 'private') as PermissionLevel,
    );
    res.json({ success: true, data: session });
  },

  async confirmUpload(req: Request, res: Response): Promise<void> {
    const { path, bucket, sessionId, filename, mimeType, sizeBytes, category, permissionLevel, isTemp, ttlHours } = b(req);
    if (!path || !bucket || !filename || !mimeType) { res.status(400).json({ error: 'path, bucket, filename, mimeType obligatwa' }); return; }

    const file = await UploadEngine.confirmUpload(uid(req),
      { path: String(path), bucket: String(bucket), sessionId: String(sessionId ?? '') },
      {
        filename:        String(filename),
        mimeType:        String(mimeType),
        sizeBytes:       Number(sizeBytes ?? 0),
        category:        String(category ?? 'general') as FileCategory,
        permissionLevel: String(permissionLevel ?? 'private') as PermissionLevel,
        isTemp:          Boolean(isTemp),
        ttlHours:        ttlHours ? Number(ttlHours) : undefined,
      },
    );

    // Async post-processing (non-blocking)
    if (ImageEngine.isImage(file.mimeType)) {
      ImageEngine.generateThumbnails(file.id, file.bucket, file.path).catch(() => {});
    }
    AIFileAnalyzer.analyze(file.id, file.mimeType, file.category, file.filename).catch(() => {});

    res.status(201).json({ success: true, data: file });
  },

  // ── File access ───────────────────────────────────────────────────────────
  async getFile(req: Request, res: Response): Promise<void> {
    const file = await UploadEngine.getFile(pid(req));
    if (!file) { res.status(404).json({ error: 'Fichye pa jwenn' }); return; }

    const canRead = await FilePermissionEngine.canAccess(file.id, uid(req), role(req));
    if (!canRead) { res.status(403).json({ error: 'Aksè refize' }); return; }

    // Build URL based on visibility
    let url: string;
    if (file.permissionLevel === 'public' && file.publicUrl) {
      url = file.publicUrl;
    } else {
      url = await CDNManager.getSignedUrl(file.bucket, file.path, 3600);
    }

    // Responsive image URLs if it's an image
    const responsive = ImageEngine.isImage(file.mimeType)
      ? ImageEngine.getResponsiveUrls(file.bucket, file.path, file.mimeType)
      : undefined;

    res.json({ success: true, data: { ...file, url, responsive } });
  },

  async listMyFiles(req: Request, res: Response): Promise<void> {
    const category = q(req)['category'] ? String(q(req)['category']) as FileCategory : undefined;
    const page     = Number(q(req)['page'] ?? 1);
    const limit    = Number(q(req)['limit'] ?? 20);
    const files    = await UploadEngine.listUserFiles(uid(req), category, page, limit);
    res.json({ success: true, data: files, page, limit });
  },

  async deleteFile(req: Request, res: Response): Promise<void> {
    await UploadEngine.deleteFile(pid(req), uid(req));
    res.json({ success: true, message: 'Fichye efase.' });
  },

  // ── Signed download URL ───────────────────────────────────────────────────
  async getDownloadUrl(req: Request, res: Response): Promise<void> {
    const file = await UploadEngine.getFile(pid(req));
    if (!file) { res.status(404).json({ error: 'Fichye pa jwenn' }); return; }
    const canRead = await FilePermissionEngine.canAccess(file.id, uid(req), role(req));
    if (!canRead) { res.status(403).json({ error: 'Aksè refize' }); return; }
    const url = await CDNManager.getSignedUrl(file.bucket, file.path, 300); // 5 min download URL
    res.json({ success: true, data: { url, expiresIn: 300 } });
  },

  // ── Thumbnails ─────────────────────────────────────────────────────────────
  async getThumbnails(req: Request, res: Response): Promise<void> {
    const thumbs = await ImageEngine.getThumbnails(pid(req));
    res.json({ success: true, data: thumbs });
  },

  // ── Permissions ────────────────────────────────────────────────────────────
  async setPermission(req: Request, res: Response): Promise<void> {
    const { permissionLevel } = b(req);
    if (!permissionLevel) { res.status(400).json({ error: 'permissionLevel obligatwa' }); return; }
    await FilePermissionEngine.setPermission(pid(req), String(permissionLevel) as PermissionLevel, uid(req));
    res.json({ success: true });
  },

  async grantAccess(req: Request, res: Response): Promise<void> {
    const { subjectType, subjectId, canWrite } = b(req);
    if (!subjectType || !subjectId) { res.status(400).json({ error: 'subjectType, subjectId obligatwa' }); return; }
    await FilePermissionEngine.grantAccess(pid(req), String(subjectType) as 'user' | 'role' | 'company', String(subjectId), uid(req), Boolean(canWrite));
    res.json({ success: true });
  },

  async listACL(req: Request, res: Response): Promise<void> {
    const acl = await FilePermissionEngine.listFileACL(pid(req));
    res.json({ success: true, data: acl });
  },

  // ── Versioning ─────────────────────────────────────────────────────────────
  async getVersions(req: Request, res: Response): Promise<void> {
    const versions = await VersioningService.getVersions(pid(req));
    res.json({ success: true, data: versions });
  },

  async rollback(req: Request, res: Response): Promise<void> {
    const { versionId } = b(req);
    if (!versionId) { res.status(400).json({ error: 'versionId obligatwa' }); return; }
    await VersioningService.rollback(pid(req), String(versionId), uid(req));
    res.json({ success: true, message: 'Fichye retounen sou vèsyon anvan.' });
  },

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  async scheduleDelete(req: Request, res: Response): Promise<void> {
    const { days } = b(req);
    if (!days) { res.status(400).json({ error: 'days obligatwa' }); return; }
    await LifecycleManager.scheduleDelete(pid(req), Number(days));
    res.json({ success: true });
  },

  async restore(req: Request, res: Response): Promise<void> {
    await LifecycleManager.restore(pid(req));
    res.json({ success: true, message: 'Fichye restore.' });
  },

  async getStorageUsage(req: Request, res: Response): Promise<void> {
    const usage = await LifecycleManager.getUserStorageUsage(uid(req));
    res.json({ success: true, data: usage });
  },

  // ── AI Analysis ────────────────────────────────────────────────────────────
  async getAIAnalysis(req: Request, res: Response): Promise<void> {
    const analysis = await AIFileAnalyzer.getAnalysis(pid(req));
    if (!analysis) { res.status(404).json({ error: 'Analiz pa disponib' }); return; }
    res.json({ success: true, data: analysis });
  },

  async extractText(req: Request, res: Response): Promise<void> {
    const file = await UploadEngine.getFile(pid(req));
    if (!file) { res.status(404).json({ error: 'Fichye pa jwenn' }); return; }
    const canRead = await FilePermissionEngine.canAccess(file.id, uid(req), role(req));
    if (!canRead) { res.status(403).json({ error: 'Aksè refize' }); return; }
    const url  = file.publicUrl ?? await CDNManager.getSignedUrl(file.bucket, file.path, 300);
    const text = await AIFileAnalyzer.extractText(file.id, url);
    res.json({ success: true, data: { text } });
  },

  // ── Admin: cleanup ─────────────────────────────────────────────────────────
  async runCleanup(_req: Request, res: Response): Promise<void> {
    const result = await LifecycleManager.cleanupExpired();
    res.json({ success: true, data: result });
  },

  async getRetentionPolicies(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: LifecycleManager.getRetentionPolicy() });
  },
};