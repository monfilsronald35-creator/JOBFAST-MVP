import { db }                       from '../../../core/database/SupabaseClient.js';
import type { ImageTransformOptions } from '../types/storage.types.js';

export const CDNManager = {
  getPublicUrl(bucket: string, path: string): string {
    const { data } = db.client().storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Supabase Storage image transformations — built-in CDN resize
  getTransformedUrl(bucket: string, path: string, opts: ImageTransformOptions): string {
    const transform: Record<string, unknown> = {};
    if (opts.width)   transform['width']   = opts.width;
    if (opts.height)  transform['height']  = opts.height;
    if (opts.quality) transform['quality'] = opts.quality;
    if (opts.format)  transform['format']  = opts.format;
    if (opts.resize)  transform['resize']  = opts.resize;
    const { data } = db.client().storage.from(bucket).getPublicUrl(path, { transform });
    return data.publicUrl;
  },

  async getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await db.client().storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new Error(`Signed URL echoue: ${error?.message ?? 'unknown'}`);
    return data.signedUrl;
  },

  getThumbnailUrl(bucket: string, path: string): string {
    return CDNManager.getTransformedUrl(bucket, path, { width: 200, height: 200, format: 'webp', resize: 'cover', quality: 80 });
  },

  getPreviewUrl(bucket: string, path: string): string {
    return CDNManager.getTransformedUrl(bucket, path, { width: 800, format: 'webp', quality: 85 });
  },

  getAvatarUrl(bucket: string, path: string): string {
    return CDNManager.getTransformedUrl(bucket, path, { width: 100, height: 100, format: 'webp', resize: 'cover', quality: 90 });
  },

  // Tiny blur placeholder — returns a 20x20 WebP URL
  getBlurPlaceholderUrl(bucket: string, path: string): string {
    return CDNManager.getTransformedUrl(bucket, path, { width: 20, height: 20, format: 'webp', quality: 20 });
  },
};