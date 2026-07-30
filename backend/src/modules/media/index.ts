/**
 * Media Module (Backend)
 * Owns: media records, upload sessions, processing jobs, signed URLs
 * Storage: Supabase Storage (primary), S3/R2 (alt)
 * Processing: delegates to background worker or external service
 * Listens to: nothing (triggered by HTTP upload)
 * Emits: media.uploaded, media.processed
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth, optionalAuth } from '../../core/middleware/auth.middleware.js';
import { DomainEvent } from '../../core/events/DomainEvent.js';
import { TypedEventBus } from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES } from '@shared-events';
import { generateId } from '@shared-utils';
import type { UUID } from '@shared-types';

class MediaUploadedEvent extends DomainEvent {
  constructor(public readonly mediaId: UUID, public readonly userId: UUID, public readonly mimeType: string) {
    super(EVENT_NAMES.MEDIA_UPLOADED);
  }
}

export { MediaUploadedEvent };

export function registerMediaModule(app: Express): void {
  const router = Router();

  // Get media file info
  router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('media_files').select('*').eq('id', req.params['id']).single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  // List media
  router.post('/list', requireAuth, async (req, res, next) => {
    try {
      const { type, limit = 20, cursor } = req.body as { type?: string; limit?: number; cursor?: string };
      let q = db.client().from('media_files').select('*').eq('uploaded_by', req.user!.sub)
        .order('created_at', { ascending: false }).limit(limit);
      if (type)   q = q.eq('type', type);
      if (cursor) q = q.lt('created_at', new Date(Number(cursor)).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  // Init multipart upload session
  router.post('/upload/init', requireAuth, async (req, res, next) => {
    try {
      const { filename, mimeType, totalSize, totalChunks, visibility = 'public' } = req.body as {
        filename: string; mimeType: string; totalSize: number; totalChunks: number; visibility?: string;
      };
      const mediaId  = generateId();
      const uploadId = generateId();
      await db.query(c => c.from('upload_sessions').insert({
        upload_id: uploadId, media_id: mediaId, user_id: req.user!.sub,
        filename, mime_type: mimeType, total_size: totalSize, total_chunks: totalChunks,
        visibility, uploaded_chunks: [], status: 'active', created_at: new Date().toISOString(),
      }));
      res.status(201).json({ success: true, data: { uploadId, mediaId, filename, totalChunks } });
    } catch (err) { next(err); }
  });

  // Upload chunk
  router.post('/upload/chunk', requireAuth, async (req, res, next) => {
    try {
      // Store chunk in Supabase Storage
      const { uploadId, chunkIndex } = req.body as { uploadId: string; chunkIndex: number };
      // In production: stream chunk to storage, track etag
      const etag = generateId();
      await db.client().rpc('record_chunk', { p_upload_id: uploadId, p_chunk_index: chunkIndex, p_etag: etag });
      res.json({ success: true, data: { etag } });
    } catch (err) { next(err); }
  });

  // Complete upload
  router.post('/upload/complete', requireAuth, async (req, res, next) => {
    try {
      const { uploadId, mediaId } = req.body as { uploadId: string; mediaId: UUID };
      const session = await db.queryNullable<{ mime_type: string }>(c =>
        c.from('upload_sessions').select('mime_type').eq('upload_id', uploadId).single());
      if (!session) { res.status(404).json({ code: 'NOT_FOUND' }); return; }

      await db.query(c => c.from('media_files').insert({
        id: mediaId, uploaded_by: req.user!.sub, status: 'pending', created_at: new Date().toISOString(),
      }));
      await db.client().from('upload_sessions').update({ status: 'complete' }).eq('upload_id', uploadId);

      TypedEventBus.publish(new MediaUploadedEvent(mediaId, req.user!.sub, session.mime_type));
      res.json({ success: true, data: { mediaId } });
    } catch (err) { next(err); }
  });

  // Signed URL for private media
  router.post('/:id/signed-url', requireAuth, async (req, res, next) => {
    try {
      const { expiresInSeconds = 3600 } = req.body as { expiresInSeconds?: number };
      const bucket = process.env['SUPABASE_STORAGE_BUCKET'] ?? 'media';
      const { data, error } = await db.client().storage.from(bucket)
        .createSignedUrl(req.params['id']!, expiresInSeconds);
      if (error) throw error;
      res.json({ success: true, data: { url: data.signedUrl, expiresAt: Date.now() + expiresInSeconds * 1000 } });
    } catch (err) { next(err); }
  });

  // Delete media
  router.post('/:id/delete', requireAuth, async (req, res, next) => {
    try {
      await db.query(c => c.from('media_files').update({ status: 'deleted' }).eq('id', req.params['id']).eq('uploaded_by', req.user!.sub));
      res.status(204).end();
    } catch (err) { next(err); }
  });

  app.use('/api/media', router);
}
