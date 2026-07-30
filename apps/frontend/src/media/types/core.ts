export type MediaType       = 'image' | 'video' | 'audio' | 'document' | 'archive';
export type ProcessingStatus = 'pending' | 'queued' | 'processing' | 'ready' | 'failed' | 'partial';
export type MediaVisibility  = 'public' | 'private' | 'signed';
export type StorageProvider  = 'supabase' | 's3' | 'cloudflare_r2' | 'cloudinary' | 'local';

export interface MediaFile {
  id:                 string;
  type:               MediaType;
  filename:           string;
  originalName:       string;
  mimeType:           string;
  size:               number;         // bytes
  hash:               string;         // SHA-256
  visibility:         MediaVisibility;
  status:             ProcessingStatus;
  variants:           Record<string, string>;  // name → CDN URL
  metadata:           MediaMetadata;
  uploadedBy?:        string;
  storageProvider:    StorageProvider;
  storageKey:         string;
  cdnUrl?:            string;
  signedUrlExpiresAt?: number;
  folderId?:          string;
  tags?:              string[];
  virusScanStatus?:   'pending' | 'clean' | 'infected' | 'error';
  createdAt:          number;
  updatedAt:          number;
}

export interface MediaMetadata {
  width?:       number;
  height?:      number;
  duration?:    number;   // seconds for video/audio
  bitrate?:     number;   // kbps
  fps?:         number;
  colorSpace?:  string;
  hasAlpha?:    boolean;
  format?:      string;
  pageCount?:   number;   // documents
  location?:    { lat: number; lng: number };
  takenAt?:     number;
  aiTags?:      string[];
  nsfw?:        boolean;
  faces?:       number;
  ocrText?:     string;
}

export interface MediaTransform {
  width?:     number;
  height?:    number;
  quality?:   number;    // 1–100
  format?:    'webp' | 'avif' | 'jpeg' | 'png';
  fit?:       'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?:      number;
  grayscale?: boolean;
  flip?:      'h' | 'v' | 'both';
  rotate?:    0 | 90 | 180 | 270;
  watermark?: { text?: string; imageKey?: string; position: 'center' | 'top-right' | 'bottom-right' };
}

export interface UploadResult {
  success:   boolean;
  mediaId?:  string;
  cdnUrl?:   string;
  variants?: Record<string, string>;
  error?:    string;
}

export interface MediaFilter {
  type?:        MediaType | MediaType[];
  visibility?:  MediaVisibility;
  status?:      ProcessingStatus;
  uploadedBy?:  string;
  folderId?:    string;
  tags?:        string[];
  from?:        number;
  to?:          number;
  limit?:       number;
  cursor?:      string;
}
