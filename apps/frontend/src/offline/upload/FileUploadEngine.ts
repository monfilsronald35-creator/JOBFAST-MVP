/**
 * FileUploadEngine — Chunked + Resume + Retry + Parallel + Compression + Background upload.
 * Persists upload state to OfflineDB upload_queue store.
 * Integrates with NetworkIntelligence for adaptive chunk size.
 */

import { enqueueUpload, getUploadQueue, updateUploadRecord } from '../db/OfflineDB';
import { NetworkIntelligence } from '../network/NetworkIntelligence';

const CHUNK_SIZE_DEFAULT = 1 * 1024 * 1024;   // 1 MB
const MAX_PARALLEL       = 3;
const VAPID_MAX_FILE     = 25 * 1024 * 1024;  // 25 MB guard

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';

export interface UploadTask {
  id:               string;
  file:             File;
  uploadUrl:        string;
  status:           UploadStatus;
  progress:         number;
  uploadedBytes:    number;
  totalBytes:       number;
  uploadedUrl?:     string;
  error?:           string;
  onProgress?:      (pct: number, uploadedBytes: number) => void;
  onComplete?:      (url: string) => void;
  onError?:         (error: string) => void;
}

export interface UploadOptions {
  chunkSizeBytes?: number;
  maxAttempts?:    number;
  priority?:       'critical' | 'high' | 'normal' | 'low';
  compress?:       boolean;
  maxWidthPx?:     number;
  maxHeightPx?:    number;
  quality?:        number;
  headers?:        Record<string, string>;
  metadata?:       Record<string, unknown>;
}

// ─── Image compression (Canvas API) ──────────────────────────────────────────

async function compressImage(
  file:       File,
  maxWidth:   number,
  maxHeight:  number,
  quality:    number,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (typeof createImageBitmap === 'undefined') return file;

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas   = document.createElement('canvas');
      let { width: w, height: h } = img;
      const ratio    = Math.min(maxWidth / w, maxHeight / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      canvas.width   = w;
      canvas.height  = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
        resolve(compressed.size < file.size ? compressed : file);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src     = URL.createObjectURL(file);
  });
}

// ─── FileUploadEngine ─────────────────────────────────────────────────────────

class FileUploadEngineImpl {
  private tasks:   Map<string, UploadTask>     = new Map();
  private active:  Map<string, AbortController> = new Map();
  private queue:   string[]                    = [];
  private running  = 0;

  private getAuthHeader(): string | null {
    try {
      const raw = localStorage.getItem('jobfast_user');
      if (!raw) return null;
      const u = JSON.parse(raw) as { token?: string };
      return u.token ? `Bearer ${u.token}` : null;
    } catch { return null; }
  }

  // ─── Enqueue ──────────────────────────────────────────────────────────────

  async add(file: File, uploadUrl: string, opts: UploadOptions = {}): Promise<string> {
    if (file.size > VAPID_MAX_FILE && !opts.chunkSizeBytes) {
      opts.chunkSizeBytes = CHUNK_SIZE_DEFAULT;
    }

    let processedFile = file;
    if (opts.compress ?? true) {
      processedFile = await compressImage(
        file,
        opts.maxWidthPx  ?? 1920,
        opts.maxHeightPx ?? 1920,
        (opts.quality    ?? 85) / 100,
      );
    }

    const id = await enqueueUpload({
      fileId:      crypto.randomUUID(),
      fileName:    processedFile.name,
      fileSize:    processedFile.size,
      mimeType:    processedFile.type,
      chunks:      Math.ceil(processedFile.size / (opts.chunkSizeBytes ?? CHUNK_SIZE_DEFAULT)),
      uploadUrl,
      maxAttempts: opts.maxAttempts ?? 5,
      nextRetryAt: 0,
      priority:    opts.priority ?? 'normal',
    });

    const task: UploadTask = {
      id,
      file: processedFile,
      uploadUrl,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: processedFile.size,
    };

    this.tasks.set(id, task);
    this.queue.push(id);
    this.processQueue();
    return id;
  }

  // ─── Queue processing ─────────────────────────────────────────────────────

  private processQueue(): void {
    while (this.running < MAX_PARALLEL && this.queue.length > 0) {
      const id = this.queue.shift();
      if (!id || !this.tasks.has(id)) continue;
      this.running++;
      void this.uploadTask(id).finally(() => {
        this.running--;
        this.processQueue();
      });
    }
  }

  private async uploadTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) return;

    const cfg = NetworkIntelligence.getAdaptiveConfig();
    if (NetworkIntelligence.isOffline()) {
      this.updateTask(id, { status: 'paused' });
      return;
    }

    const controller = new AbortController();
    this.active.set(id, controller);
    this.updateTask(id, { status: 'uploading' });

    const chunkSize = Math.min(
      CHUNK_SIZE_DEFAULT,
      cfg.timeout > 15_000 ? CHUNK_SIZE_DEFAULT : 256 * 1024,
    );

    try {
      const url = await this.uploadFile(task, chunkSize, controller.signal);
      this.updateTask(id, { status: 'completed', progress: 100, uploadedUrl: url });
      await updateUploadRecord(id, { status: 'completed', uploadedUrl: url, completedAt: Date.now() });
      task.onComplete?.(url);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        this.updateTask(id, { status: 'paused' });
      } else {
        const msg = String(err);
        this.updateTask(id, { status: 'failed', error: msg });
        await updateUploadRecord(id, { status: 'failed', error: msg });
        task.onError?.(msg);
      }
    } finally {
      this.active.delete(id);
    }
  }

  // ─── Actual upload ────────────────────────────────────────────────────────

  private async uploadFile(
    task:      UploadTask,
    chunkSize: number,
    signal:    AbortSignal,
  ): Promise<string> {
    const { file, uploadUrl } = task;

    if (file.size <= chunkSize) {
      return this.uploadSingle(task, signal);
    }

    return this.uploadChunked(task, chunkSize, signal);
  }

  private async uploadSingle(task: UploadTask, signal: AbortSignal): Promise<string> {
    const auth    = this.getAuthHeader();
    const form    = new FormData();
    form.append('file', task.file);

    const res = await fetch(task.uploadUrl, {
      method:  'POST',
      headers: auth ? { Authorization: auth } : undefined,
      body:    form,
      signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { url?: string; fileUrl?: string };
    this.updateTask(task.id, { progress: 100, uploadedBytes: task.file.size });
    task.onProgress?.(100, task.file.size);
    return json.url ?? json.fileUrl ?? '';
  }

  private async uploadChunked(
    task:      UploadTask,
    chunkSize: number,
    signal:    AbortSignal,
  ): Promise<string> {
    const auth        = this.getAuthHeader();
    const { file }    = task;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId    = task.id;

    const initRes = await fetch(`${task.uploadUrl}/initiate`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({
        uploadId,
        fileName:    file.name,
        fileSize:    file.size,
        mimeType:    file.type,
        totalChunks,
      }),
      signal,
    });
    if (!initRes.ok) throw new Error(`Initiate HTTP ${initRes.status}`);

    let uploaded = 0;
    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const start  = i * chunkSize;
      const end    = Math.min(start + chunkSize, file.size);
      const chunk  = file.slice(start, end);
      const form   = new FormData();
      form.append('uploadId',   uploadId);
      form.append('chunkIndex', String(i));
      form.append('chunk',      chunk);

      const res = await fetch(`${task.uploadUrl}/chunk`, {
        method:  'POST',
        headers: auth ? { Authorization: auth } : undefined,
        body:    form,
        signal,
      });
      if (!res.ok) throw new Error(`Chunk ${i} HTTP ${res.status}`);

      uploaded += chunk.size;
      const pct = Math.round((uploaded / file.size) * 100);
      this.updateTask(task.id, { progress: pct, uploadedBytes: uploaded });
      task.onProgress?.(pct, uploaded);
    }

    const completeRes = await fetch(`${task.uploadUrl}/complete`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body:   JSON.stringify({ uploadId, totalChunks }),
      signal,
    });
    if (!completeRes.ok) throw new Error(`Complete HTTP ${completeRes.status}`);
    const json = await completeRes.json() as { url?: string };
    return json.url ?? '';
  }

  // ─── Control ──────────────────────────────────────────────────────────────

  pause(id: string): void {
    this.active.get(id)?.abort();
    this.updateTask(id, { status: 'paused' });
  }

  resume(id: string): void {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'paused') return;
    this.queue.push(id);
    this.processQueue();
  }

  cancel(id: string): void {
    this.active.get(id)?.abort();
    this.tasks.delete(id);
    this.queue.splice(this.queue.indexOf(id), 1);
  }

  // ─── Restore pending from DB ───────────────────────────────────────────────

  async restorePending(fileMap: Map<string, File>): Promise<void> {
    const pending = await getUploadQueue();
    for (const rec of pending) {
      if (rec.status === 'completed') continue;
      const file = fileMap.get(rec.fileId);
      if (!file) continue;
      const task: UploadTask = {
        id:            rec.id,
        file,
        uploadUrl:     rec.uploadUrl,
        status:        'pending',
        progress:      Math.round((rec.uploadedChunks / rec.chunks) * 100),
        uploadedBytes: rec.uploadedChunks * CHUNK_SIZE_DEFAULT,
        totalBytes:    rec.fileSize,
      };
      this.tasks.set(rec.id, task);
      this.queue.push(rec.id);
    }
    this.processQueue();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private updateTask(id: string, update: Partial<UploadTask>): void {
    const task = this.tasks.get(id);
    if (!task) return;
    Object.assign(task, update);
  }

  getTask(id: string): UploadTask | null { return this.tasks.get(id) ?? null; }
  getAllTasks(): UploadTask[]             { return Array.from(this.tasks.values()); }

  onTaskUpdate(id: string, fn: (task: UploadTask) => void): () => void {
    const task = this.tasks.get(id);
    if (task) {
      task.onProgress = (pct, bytes) => fn({ ...task, progress: pct, uploadedBytes: bytes });
      task.onComplete = (url)        => fn({ ...task, status: 'completed', uploadedUrl: url });
      task.onError    = (err)        => fn({ ...task, status: 'failed',    error: err });
    }
    return () => {
      const t = this.tasks.get(id);
      if (t) { delete t.onProgress; delete t.onComplete; delete t.onError; }
    };
  }
}

export const FileUploadEngine = new FileUploadEngineImpl();