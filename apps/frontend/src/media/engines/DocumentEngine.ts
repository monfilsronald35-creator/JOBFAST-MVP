import type { DocumentFile, DocumentPreview, DocumentFormat } from '../types/document';

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/document${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function getDocumentInfo(mediaId: string): Promise<DocumentFile> {
  return api<DocumentFile>(`/${mediaId}`);
}

async function getPreview(mediaId: string, page = 1): Promise<DocumentPreview> {
  return api<DocumentPreview>(`/${mediaId}/preview?page=${page}`);
}

async function extractText(mediaId: string): Promise<string> {
  const result = await api<{ text: string }>(`/${mediaId}/extract-text`);
  return result.text;
}

async function getDownloadUrl(mediaId: string, expiresInSeconds = 3600): Promise<string> {
  const result = await api<{ url: string; expiresAt: number }>(`/${mediaId}/download-url`, { expiresInSeconds });
  return result.url;
}

async function convertTo(mediaId: string, targetFormat: DocumentFormat): Promise<string> {
  const result = await api<{ jobId: string }>('/convert', { mediaId, targetFormat });
  return result.jobId;
}

async function mergeDocuments(mediaIds: string[], outputFormat: DocumentFormat = 'pdf'): Promise<string> {
  const result = await api<{ jobId: string }>('/merge', { mediaIds, outputFormat });
  return result.jobId;
}

function isViewableInBrowser(format: DocumentFormat): boolean {
  return format === 'pdf' || format === 'txt' || format === 'csv';
}

function getViewerType(format: DocumentFormat): 'pdf_embed' | 'image_pages' | 'html' | 'text' {
  if (format === 'pdf')  return 'pdf_embed';
  if (format === 'txt' || format === 'csv') return 'text';
  if (format === 'docx' || format === 'doc' || format === 'odt') return 'image_pages';
  if (format === 'xlsx' || format === 'xls' || format === 'ods') return 'html';
  return 'image_pages';
}

// Human-readable file size
function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const DocumentEngine = {
  getDocumentInfo,
  getPreview,
  extractText,
  getDownloadUrl,
  convertTo,
  mergeDocuments,
  isViewableInBrowser,
  getViewerType,
  formatBytes,
};
