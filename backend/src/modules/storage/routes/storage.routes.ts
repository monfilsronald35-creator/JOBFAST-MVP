import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { StorageController }        from '../controllers/StorageController.js';

export const storageRouter = Router();
const R = requireAuth;
const A = requireRole('admin', 'superadmin');
const C = StorageController;

// ── Upload flow (client-side direct upload to Supabase Storage) ───────────────
storageRouter.post  ('/upload/url',               R, C.getUploadUrl);     // Step 1: get signed upload URL
storageRouter.post  ('/upload/confirm',            R, C.confirmUpload);    // Step 2: confirm & register

// ── File management ───────────────────────────────────────────────────────────
storageRouter.get   ('/files',                     R, C.listMyFiles);
storageRouter.get   ('/files/:id',                 R, C.getFile);
storageRouter.delete('/files/:id',                 R, C.deleteFile);
storageRouter.get   ('/files/:id/download',        R, C.getDownloadUrl);

// ── Thumbnails & responsive images ────────────────────────────────────────────
storageRouter.get   ('/files/:id/thumbnails',      R, C.getThumbnails);

// ── Permissions ───────────────────────────────────────────────────────────────
storageRouter.patch ('/files/:id/permission',      R, C.setPermission);
storageRouter.post  ('/files/:id/acl',             R, C.grantAccess);
storageRouter.get   ('/files/:id/acl',             R, C.listACL);

// ── Versioning ────────────────────────────────────────────────────────────────
storageRouter.get   ('/files/:id/versions',        R, C.getVersions);
storageRouter.post  ('/files/:id/rollback',        R, C.rollback);

// ── Lifecycle ─────────────────────────────────────────────────────────────────
storageRouter.post  ('/files/:id/schedule-delete', R, C.scheduleDelete);
storageRouter.post  ('/files/:id/restore',         R, C.restore);
storageRouter.get   ('/usage',                     R, C.getStorageUsage);

// ── AI Analysis ───────────────────────────────────────────────────────────────
storageRouter.get   ('/files/:id/analysis',        R, C.getAIAnalysis);
storageRouter.post  ('/files/:id/extract-text',    R, C.extractText);

// ── Admin ─────────────────────────────────────────────────────────────────────
storageRouter.post  ('/admin/cleanup',             R, A, C.runCleanup);
storageRouter.get   ('/admin/retention',           R, A, C.getRetentionPolicies);