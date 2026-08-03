import { db }        from '../../../core/database/SupabaseClient.js';
import { CDNManager } from './CDNManager.js';

// Image MIME types that support transform
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);

export const ImageEngine = {
  isImage(mimeType: string): boolean {
    return IMAGE_MIMES.has(mimeType);
  },

  async generateThumbnails(fileId: string, bucket: string, path: string): Promise<void> {
    const sizes = [
      { width: 48,  height: 48  },   // avatar micro
      { width: 200, height: 200 },   // standard thumbnail
      { width: 400, height: 300 },   // card preview
    ];

    const rows = sizes.map(({ width, height }) => ({
      file_id:    fileId,
      width,
      height,
      url:        CDNManager.getTransformedUrl(bucket, path, { width, height, format: 'webp', resize: 'cover', quality: 80 }),
      created_at: new Date().toISOString(),
    }));

    await db.client().from('stor_thumbnails').upsert(rows, { onConflict: 'file_id,width,height' });
  },

  async getThumbnails(fileId: string): Promise<Array<{ width: number; height: number; url: string }>> {
    const { data } = await db.client().from('stor_thumbnails').select('width, height, url').eq('file_id', fileId).order('width');
    return (data ?? []) as { width: number; height: number; url: string }[];
  },

  getResponsiveUrls(bucket: string, path: string, mimeType: string): Record<string, string> {
    if (!ImageEngine.isImage(mimeType)) return {};
    return {
      micro:    CDNManager.getTransformedUrl(bucket, path, { width: 48,   height: 48,  format: 'webp', resize: 'cover',   quality: 80 }),
      thumb:    CDNManager.getTransformedUrl(bucket, path, { width: 200,  height: 200, format: 'webp', resize: 'cover',   quality: 80 }),
      preview:  CDNManager.getTransformedUrl(bucket, path, { width: 800,               format: 'webp',                    quality: 85 }),
      full:     CDNManager.getTransformedUrl(bucket, path, { width: 1920,              format: 'webp',                    quality: 90 }),
      blur:     CDNManager.getTransformedUrl(bucket, path, { width: 20,   height: 20,  format: 'webp',                    quality: 20 }),
      avif:     CDNManager.getTransformedUrl(bucket, path, { width: 800,               format: 'avif',                    quality: 80 }),
    };
  },

  // Add watermark text to image metadata (actual watermark needs server-side processing)
  async markWatermark(fileId: string, text: string): Promise<void> {
    await db.client().from('stor_files').update({
      metadata: { watermark: text, watermarked_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }).eq('id', fileId);
  },
};