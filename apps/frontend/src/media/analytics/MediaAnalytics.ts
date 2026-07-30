export interface ViewEvent {
  mediaId:    string;
  userId?:    string;
  source?:    string;   // page or component name
  referrer?:  string;
  duration?:  number;   // seconds viewed (for video/audio)
  timestamp:  number;
}

export interface DownloadEvent {
  mediaId:   string;
  userId?:   string;
  format?:   string;
  timestamp: number;
}

export interface MediaStats {
  mediaId:       string;
  views:         number;
  uniqueViews:   number;
  downloads:     number;
  totalWatchSec: number;
  avgWatchSec:   number;
  bandwidth:     number;   // bytes served
  lastViewedAt?: number;
}

export interface StorageReport {
  totalBytes:     number;
  imageBytes:     number;
  videoBytes:     number;
  audioBytes:     number;
  documentBytes:  number;
  fileCount:      number;
  bandwidthMonth: number;  // bytes
}

// Batch event queue — flush every 10 events or 30 seconds
const _queue: Array<{ type: string; payload: unknown }> = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (!_queue.length) return;
  const batch = _queue.splice(0, _queue.length);
  try {
    await fetch('/api/media/analytics/batch', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ events: batch }),
    });
  } catch { /* non-fatal — analytics loss is acceptable */ }
}

function enqueue(type: string, payload: unknown): void {
  _queue.push({ type, payload });
  if (_queue.length >= 10) {
    if (_flushTimer) { clearTimeout(_flushTimer); _flushTimer = null; }
    void flush();
    return;
  }
  if (!_flushTimer) {
    _flushTimer = setTimeout(() => { _flushTimer = null; void flush(); }, 30_000);
  }
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/analytics${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

function trackView(event: Omit<ViewEvent, 'timestamp'>): void {
  enqueue('media_view', { ...event, timestamp: Date.now() });
}

function trackDownload(event: Omit<DownloadEvent, 'timestamp'>): void {
  enqueue('media_download', { ...event, timestamp: Date.now() });
}

function trackPlayback(mediaId: string, watchedSeconds: number, userId?: string): void {
  enqueue('media_playback', { mediaId, watchedSeconds, userId, timestamp: Date.now() });
}

async function getStats(mediaId: string): Promise<MediaStats> {
  return api<MediaStats>(`/stats/${mediaId}`);
}

async function getStorageReport(): Promise<StorageReport> {
  return api<StorageReport>('/storage-report');
}

async function getTopMedia(limit = 10, period: 'day' | 'week' | 'month' = 'month'): Promise<MediaStats[]> {
  return api<MediaStats[]>('/top', { limit, period });
}

export const MediaAnalytics = {
  trackView,
  trackDownload,
  trackPlayback,
  flush,
  getStats,
  getStorageReport,
  getTopMedia,
};
