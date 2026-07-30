import type { UploadResult } from '../types';

const CHUNK_SIZE     = 5 * 1024 * 1024;  // 5 MB per chunk
const MAX_PARALLEL   = 3;                 // concurrent chunk uploads
const MAX_RETRIES    = 3;
const RETRY_BASE_MS  = 1000;

export interface UploadOptions {
  visibility?:   'public' | 'private' | 'signed';
  folder?:       string;
  metadata?:     Record<string, unknown>;
  chunkSize?:    number;
  parallel?:     number;
  onProgress?:   (percent: number, uploadedBytes: number, totalBytes: number) => void;
  onChunkDone?:  (chunk: number, total: number) => void;
  signal?:       AbortSignal;
}

interface UploadSession {
  uploadId:       string;
  mediaId:        string;
  filename:       string;
  totalSize:      number;
  totalChunks:    number;
  uploadedChunks: number[];
  createdAt:      number;
}

interface OfflineEntry {
  id:         string;
  filename:   string;
  fileData:   ArrayBuffer;
  mimeType:   string;
  options:    UploadOptions;
  createdAt:  number;
  retries:    number;
}

const SESSION_KEY = (uploadId: string) => `media_upload_session_${uploadId}`;

async function api<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api/media/upload${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function uploadChunkBytes(
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
  data: ArrayBuffer,
  signal?: AbortSignal,
): Promise<string> {
  const blob   = new Blob([data]);
  const form   = new FormData();
  form.append('uploadId',    uploadId);
  form.append('chunkIndex',  String(chunkIndex));
  form.append('totalChunks', String(totalChunks));
  form.append('chunk',       blob);

  const res = await fetch('/api/media/upload/chunk', { method: 'POST', body: form, signal });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { etag: string };
  return json.etag;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts = MAX_RETRIES): Promise<T> {
  let lastErr: Error | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

// ——— IndexedDB offline queue ———————————————————————————————————————————————

const IDB_NAME    = 'media_upload_queue';
const IDB_STORE   = 'pending';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function queueOffline(entry: OfflineEntry): Promise<void> {
  const db  = await openIDB();
  const tx  = db.transaction(IDB_STORE, 'readwrite');
  const store = tx.objectStore(IDB_STORE);
  await new Promise<void>((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
  db.close();
}

async function drainOfflineQueue(options?: UploadOptions): Promise<void> {
  if (!navigator.onLine) return;
  const db    = await openIDB();
  const tx    = db.transaction(IDB_STORE, 'readwrite');
  const store = tx.objectStore(IDB_STORE);

  const entries = await new Promise<OfflineEntry[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as OfflineEntry[]);
    req.onerror   = () => reject(req.error);
  });

  db.close();

  for (const entry of entries) {
    try {
      const file = new File([entry.fileData], entry.filename, { type: entry.mimeType });
      await uploadFile(file, { ...entry.options, ...options });
      const db2  = await openIDB();
      const tx2  = db2.transaction(IDB_STORE, 'readwrite');
      tx2.objectStore(IDB_STORE).delete(entry.id);
      db2.close();
    } catch {
      // leave in queue, will retry next drain
    }
  }
}

// ——— Main upload function ——————————————————————————————————————————————————

async function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const { chunkSize = CHUNK_SIZE, parallel = MAX_PARALLEL, signal } = options;

  // Small file: single direct upload
  if (file.size <= chunkSize) {
    return uploadDirect(file, options);
  }

  // Large file: multipart chunked upload
  return uploadMultipart(file, { ...options, chunkSize, parallel, signal });
}

async function uploadDirect(file: File, options: UploadOptions): Promise<UploadResult> {
  const form = new FormData();
  form.append('file',       file);
  form.append('visibility', options.visibility ?? 'public');
  if (options.folder)   form.append('folder',   options.folder);
  if (options.metadata) form.append('metadata', JSON.stringify(options.metadata));

  const res = await fetch('/api/media/upload/direct', {
    method: 'POST',
    body:   form,
    signal: options.signal,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<UploadResult>;
}

async function uploadMultipart(file: File, options: UploadOptions & { chunkSize: number; parallel: number }): Promise<UploadResult> {
  const { chunkSize, parallel, signal } = options;
  const totalChunks = Math.ceil(file.size / chunkSize);

  // Init session (resume if session already exists in localStorage)
  let session = findExistingSession(file.name, file.size);
  if (!session) {
    session = await api<UploadSession>('/init', {
      filename:    file.name,
      mimeType:    file.type,
      totalSize:   file.size,
      totalChunks,
      visibility:  options.visibility ?? 'public',
      folder:      options.folder,
      metadata:    options.metadata,
    }, signal);
    localStorage.setItem(SESSION_KEY(session.uploadId), JSON.stringify(session));
  }

  const { uploadId, mediaId } = session;
  const remaining = Array.from({ length: totalChunks }, (_, i) => i)
    .filter(i => !session!.uploadedChunks.includes(i));

  let uploadedBytes = session.uploadedChunks.length * chunkSize;
  const etags: string[] = Array(totalChunks).fill('');
  for (const i of session.uploadedChunks) etags[i] = 'cached';

  // Upload chunks in parallel batches
  for (let batch = 0; batch < remaining.length; batch += parallel) {
    if (signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');

    const batchChunks = remaining.slice(batch, batch + parallel);
    await Promise.all(batchChunks.map(async chunkIndex => {
      const start  = chunkIndex * chunkSize;
      const end    = Math.min(start + chunkSize, file.size);
      const buffer = await file.slice(start, end).arrayBuffer();

      const etag = await retryWithBackoff(() =>
        uploadChunkBytes(uploadId, chunkIndex, totalChunks, buffer, signal),
      );

      etags[chunkIndex] = etag;
      uploadedBytes += (end - start);
      session!.uploadedChunks.push(chunkIndex);
      localStorage.setItem(SESSION_KEY(uploadId), JSON.stringify(session));

      options.onChunkDone?.(chunkIndex + 1, totalChunks);
      options.onProgress?.(
        Math.round((uploadedBytes / file.size) * 100),
        uploadedBytes,
        file.size,
      );
    }));
  }

  // Complete multipart upload
  const result = await api<UploadResult>('/complete', { uploadId, mediaId, etags }, signal);
  localStorage.removeItem(SESSION_KEY(uploadId));
  return result;
}

function findExistingSession(filename: string, size: number): UploadSession | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('media_upload_session_')) continue;
    try {
      const s = JSON.parse(localStorage.getItem(key) ?? '') as UploadSession;
      if (s.filename === filename && s.totalSize === size) return s;
    } catch { /* skip corrupt entry */ }
  }
  return null;
}

async function uploadOfflineQueued(file: File, options: UploadOptions = {}): Promise<void> {
  const fileData = await file.arrayBuffer();
  const entry: OfflineEntry = {
    id:        crypto.randomUUID(),
    filename:  file.name,
    fileData,
    mimeType:  file.type,
    options:   { ...options, signal: undefined },
    createdAt: Date.now(),
    retries:   0,
  };
  await queueOffline(entry);
}

async function pendingOfflineCount(): Promise<number> {
  const db    = await openIDB();
  const tx    = db.transaction(IDB_STORE, 'readonly');
  const count = await new Promise<number>((resolve, reject) => {
    const req = tx.objectStore(IDB_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  db.close();
  return count;
}

window.addEventListener('online', () => { void drainOfflineQueue(); });

export const UploadEngine = {
  uploadFile,
  uploadDirect,
  uploadOfflineQueued,
  drainOfflineQueue,
  pendingOfflineCount,
};
