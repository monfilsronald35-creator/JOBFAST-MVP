export type FileCategory =
  | 'profile_photo' | 'cv' | 'marketplace' | 'job_doc'
  | 'medical' | 'government' | 'chat_attachment' | 'invoice'
  | 'contract' | 'travel' | 'certificate' | 'voice' | 'general';

export type PermissionLevel =
  | 'public' | 'authenticated' | 'private'
  | 'company_only' | 'medical_staff' | 'government_officer' | 'admin_only';

export type FileStatus = 'pending' | 'active' | 'processing' | 'archived' | 'deleted' | 'expired';

export interface StorageFile {
  id:              string;
  uploadedBy:      string;
  bucket:          string;
  path:            string;
  filename:        string;
  mimeType:        string;
  sizeBytes:       number;
  category:        FileCategory;
  permissionLevel: PermissionLevel;
  status:          FileStatus;
  isTemp:          boolean;
  expiresAt?:      string | undefined;
  versionCount:    number;
  publicUrl?:      string | undefined;
  metadata:        Record<string, unknown>;
  createdAt:       string;
  updatedAt:       string;
}

export interface FileVersion {
  id:          string;
  fileId:      string;
  version:     number;
  path:        string;
  sizeBytes:   number;
  createdBy:   string;
  createdAt:   string;
}

export interface FileThumbnail {
  fileId:    string;
  width:     number;
  height:    number;
  url:       string;
  createdAt: string;
}

export interface AIAnalysisResult {
  fileId:        string;
  isNsfw:        boolean;
  contentType:   string;
  extractedText?: string | undefined;
  summary?:      string | undefined;
  tags:          string[];
  confidence:    number;
  createdAt:     string;
}

export interface UploadSession {
  sessionId:   string;
  signedUrl:   string;
  path:        string;
  bucket:      string;
  expiresAt:   string;
}

export type AllowedMimeType =
  | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/avif'
  | 'video/mp4' | 'video/webm' | 'video/quicktime'
  | 'application/pdf' | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'text/plain' | 'application/zip'
  | 'audio/mpeg' | 'audio/ogg' | 'audio/wav' | 'audio/webm';

export interface ImageTransformOptions {
  width?:   number | undefined;
  height?:  number | undefined;
  quality?: number | undefined;
  format?:  'webp' | 'avif' | 'origin' | undefined;
  resize?:  'cover' | 'contain' | 'fill' | undefined;
}