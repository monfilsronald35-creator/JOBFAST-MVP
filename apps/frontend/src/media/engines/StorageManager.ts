import type { StorageProvider } from '../types/core';

export interface StorageUploadUrl {
  uploadUrl:   string;
  storageKey:  string;
  expiresAt:   number;
  fields?:     Record<string, string>;  // for S3 pre-signed POST
}

export interface StorageQuota {
  usedBytes:    number;
  totalBytes:   number;
  fileCount:    number;
  byType:       Record<string, number>;
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/storage${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// Get a pre-signed upload URL for direct client-to-storage upload (bypasses our server for large files)
async function getDirectUploadUrl(
  filename:  string,
  mimeType:  string,
  sizeBytes: number,
  provider?: StorageProvider,
): Promise<StorageUploadUrl> {
  return api<StorageUploadUrl>('/presign-upload', { filename, mimeType, sizeBytes, provider });
}

// Upload a file directly to storage using the pre-signed URL
async function uploadDirect(
  url:    StorageUploadUrl,
  file:   File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`Storage upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error during direct storage upload'));
    xhr.send(file);
  });
}

// Move a file between storage buckets/folders (backend operation)
async function moveFile(storageKey: string, destinationKey: string, provider?: StorageProvider): Promise<void> {
  await api('/move', { storageKey, destinationKey, provider });
}

// Copy a file within storage
async function copyFile(storageKey: string, destinationKey: string): Promise<string> {
  const result = await api<{ newKey: string }>('/copy', { storageKey, destinationKey });
  return result.newKey;
}

// Delete a file from storage
async function deleteFile(storageKey: string, provider?: StorageProvider): Promise<void> {
  await api('/delete', { storageKey, provider });
}

// Get storage quota for current user/organization
async function getQuota(): Promise<StorageQuota> {
  return api<StorageQuota>('/quota');
}

// List files in a storage prefix/folder
async function listFiles(prefix: string, cursor?: string, limit = 50): Promise<{
  keys:       string[];
  nextCursor?: string;
}> {
  return api('/list', { prefix, cursor, limit });
}

export const StorageManager = {
  getDirectUploadUrl,
  uploadDirect,
  moveFile,
  copyFile,
  deleteFile,
  getQuota,
  listFiles,
};
