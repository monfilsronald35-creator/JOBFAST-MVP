import type { MediaFile, MediaFilter, MediaTransform, StorageProvider } from '../types';

interface GatewayConfig {
  defaultProvider:  StorageProvider;
  cdnBaseUrl:       string;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
}

const DEFAULT_CONFIG: GatewayConfig = {
  defaultProvider:  'supabase',
  cdnBaseUrl:       (typeof process !== 'undefined' ? process.env['VITE_CDN_BASE_URL'] : undefined) ?? '',
  maxFileSizeBytes: 500 * 1024 * 1024,  // 500 MB
  allowedMimeTypes: [
    'image/*', 'video/*', 'audio/*',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.*',
    'text/*',
  ],
};

async function api<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/media${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

class MediaGatewayImpl {
  private _config: GatewayConfig = DEFAULT_CONFIG;

  configure(overrides: Partial<GatewayConfig>): void {
    this._config = { ...this._config, ...overrides };
  }

  get cdnBaseUrl(): string { return this._config.cdnBaseUrl; }
  get maxFileSizeBytes(): number { return this._config.maxFileSizeBytes; }

  async getMedia(mediaId: string): Promise<MediaFile> {
    return api<MediaFile>(`/${mediaId}`);
  }

  async listMedia(filter: MediaFilter): Promise<{ items: MediaFile[]; nextCursor?: string }> {
    return api('/list', filter);
  }

  async deleteMedia(mediaId: string): Promise<void> {
    await api(`/${mediaId}/delete`, {});
  }

  async updateMetadata(mediaId: string, patch: Partial<Pick<MediaFile, 'tags' | 'visibility' | 'folderId'>>): Promise<MediaFile> {
    return api(`/${mediaId}/update`, patch);
  }

  async getSignedUrl(mediaId: string, expiresInSeconds = 3600): Promise<{ url: string; expiresAt: number }> {
    return api(`/${mediaId}/signed-url`, { expiresInSeconds });
  }

  async getTransformUrl(mediaId: string, transform: MediaTransform): Promise<string> {
    const result = await api<{ url: string }>(`/${mediaId}/transform-url`, transform);
    return result.url;
  }

  async getProcessingStatus(mediaId: string): Promise<{ status: string; progress?: number }> {
    return api<{ status: string; progress?: number }>(`/${mediaId}/status`);
  }

  async moveToFolder(mediaId: string, folderId: string): Promise<void> {
    await api(`/${mediaId}/move`, { folderId });
  }

  async duplicateMedia(mediaId: string): Promise<MediaFile> {
    return api<MediaFile>(`/${mediaId}/duplicate`, {});
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this._config.maxFileSizeBytes) {
      return { valid: false, error: `Fichye a twò gwo. Maksimòm: ${this._config.maxFileSizeBytes / 1024 / 1024} MB` };
    }

    const allowed = this._config.allowedMimeTypes.some(pattern => {
      if (pattern.endsWith('/*')) return file.type.startsWith(pattern.slice(0, -1));
      if (pattern.endsWith('*'))  return file.type.startsWith(pattern.slice(0, -1));
      return file.type === pattern;
    });

    if (!allowed) {
      return { valid: false, error: `Tip fichye "${file.type}" pa sipòte.` };
    }

    return { valid: true };
  }
}

export const MediaGateway = new MediaGatewayImpl();
