/**
 * Global Enterprise Storage Platform Module (Backend)
 * Owns: Upload Engine (signed URL flow), Image Engine (Supabase transforms),
 *       CDN Manager, File Permission Engine (RBAC + ACL), Versioning,
 *       Lifecycle Manager (TTL, archive, cleanup), AI File Analyzer,
 *       Document Engine
 * Tables: stor_files, stor_file_versions, stor_file_acl, stor_thumbnails,
 *         stor_ai_analysis
 * Prefix: stor_
 * Migration: 032_storage_platform.sql (run manually in Supabase SQL Editor)
 *
 * Buckets required in Supabase Dashboard:
 *   jobfast-public  (public read)
 *   jobfast-private (private, signed URL only)
 *   jobfast-temp    (private, lifecycle 24h)
 *
 * Upload flow:
 *   1. POST /api/storage/upload/url  → get signed upload URL (30s)
 *   2. Client PUT to Supabase Storage directly (no backend bandwidth)
 *   3. POST /api/storage/upload/confirm → register file metadata
 *
 * Connected to: all domain modules that need file storage.
 * The existing /api/media routes remain active for backward compatibility.
 */
import type { Express } from 'express';
import { storageRouter } from './routes/storage.routes.js';

export function registerStorageModule(app: Express): void {
  app.use('/api/storage', storageRouter);
}

export { CDNManager }         from './services/CDNManager.js';
export { ImageEngine }        from './services/ImageEngine.js';
export { UploadEngine }       from './services/UploadEngine.js';
export { FilePermissionEngine } from './services/FilePermissionEngine.js';