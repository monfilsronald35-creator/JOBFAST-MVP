/**
 * NetworkIntelligence — Adaptive loading, bandwidth estimation, compression, retry.
 * Uses FAZ 5 NetworkDetector as primary source + augments with active probing.
 * Does NOT duplicate NetworkDetector — wraps and extends it.
 */

import { NetworkDetector } from '../../realtime/core/NetworkDetector';

export type BandwidthClass = 'fast' | 'medium' | 'slow' | 'very_slow' | 'offline';

export interface NetworkProfile {
  online:           boolean;
  bandwidthClass:   BandwidthClass;
  estimatedKbps:    number;
  rttMs:            number;
  isMetered:        boolean;
  saveData:         boolean;
  connectionType:   string;
  quality:          number;
}

export interface AdaptiveConfig {
  imageQuality:     number;
  videoEnabled:     boolean;
  prefetchEnabled:  boolean;
  compressionLevel: 'none' | 'low' | 'high';
  pageSize:         number;
  timeout:          number;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?:  number;
  condition?:   (err: Error, attempt: number) => boolean;
}

type NetworkListener = (profile: NetworkProfile) => void;

// ─── Bandwidth thresholds (kbps) ──────────────────────────────────────────────
const BAND_THRESHOLDS: Record<BandwidthClass, number> = {
  fast:      1000,
  medium:    500,
  slow:      100,
  very_slow: 0,
  offline:   -1,
};

function classifyBandwidth(kbps: number, online: boolean): BandwidthClass {
  if (!online) return 'offline';
  if (kbps >= BAND_THRESHOLDS.fast)   return 'fast';
  if (kbps >= BAND_THRESHOLDS.medium) return 'medium';
  if (kbps >= BAND_THRESHOLDS.slow)   return 'slow';
  return 'very_slow';
}

function adaptiveConfigFor(profile: NetworkProfile): AdaptiveConfig {
  switch (profile.bandwidthClass) {
    case 'fast':
      return { imageQuality: 95, videoEnabled: true,  prefetchEnabled: true,  compressionLevel: 'low',  pageSize: 50,  timeout: 10_000 };
    case 'medium':
      return { imageQuality: 80, videoEnabled: true,  prefetchEnabled: true,  compressionLevel: 'low',  pageSize: 30,  timeout: 15_000 };
    case 'slow':
      return { imageQuality: 60, videoEnabled: false, prefetchEnabled: false, compressionLevel: 'high', pageSize: 20,  timeout: 30_000 };
    case 'very_slow':
      return { imageQuality: 40, videoEnabled: false, prefetchEnabled: false, compressionLevel: 'high', pageSize: 10,  timeout: 60_000 };
    case 'offline':
      return { imageQuality: 0,  videoEnabled: false, prefetchEnabled: false, compressionLevel: 'none', pageSize: 0,   timeout: 0 };
  }
}

// ─── NetworkIntelligence ─────────────────────────────────────────────────────

class NetworkIntelligenceImpl {
  private detector   = NetworkDetector.getInstance();
  private listeners: Set<NetworkListener> = new Set();

  private profile: NetworkProfile = {
    online:          navigator.onLine,
    bandwidthClass:  navigator.onLine ? 'medium' : 'offline',
    estimatedKbps:   navigator.onLine ? 1000 : 0,
    rttMs:           0,
    isMetered:       false,
    saveData:        false,
    connectionType:  'unknown',
    quality:         navigator.onLine ? 0.7 : 0,
  };

  private probeTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.syncFromNavigator();
    this.detector.onChange(q => {
      const onlineMap = { excellent: true, good: true, fair: true, poor: true, offline: false };
      const kbpsMap   = { excellent: 10_000, good: 5_000, fair: 1_000, poor: 200, offline: 0 };
      const qualityMap = { excellent: 1.0, good: 0.8, fair: 0.5, poor: 0.2, offline: 0 };

      this.updateProfile({
        online:         onlineMap[q],
        bandwidthClass: classifyBandwidth(kbpsMap[q], onlineMap[q]),
        estimatedKbps:  kbpsMap[q],
        quality:        qualityMap[q],
      });
    });

    window.addEventListener('online',  () => this.updateProfile({ online: true }));
    window.addEventListener('offline', () => this.updateProfile({ online: false, bandwidthClass: 'offline', quality: 0 }));
  }

  private syncFromNavigator(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
    if (!conn) return;

    this.profile.connectionType = conn.effectiveType ?? 'unknown';
    this.profile.isMetered      = conn.metered ?? false;
    this.profile.saveData       = conn.saveData ?? false;

    const rawMbps = conn.downlink ?? 1;
    this.profile.estimatedKbps  = rawMbps * 1000;
    this.profile.rttMs          = conn.rtt ?? 0;
    this.profile.bandwidthClass = classifyBandwidth(this.profile.estimatedKbps, this.profile.online);

    conn.addEventListener?.('change', () => this.syncFromNavigator());
  }

  private updateProfile(partial: Partial<NetworkProfile>): void {
    this.profile = { ...this.profile, ...partial };
    if ('online' in partial) {
      if (!partial.online) {
        this.profile.bandwidthClass = 'offline';
        this.profile.quality        = 0;
      }
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(fn => fn(this.profile));
  }

  // ─── Active probing ────────────────────────────────────────────────────────

  startProbing(intervalMs = 30_000): () => void {
    const probe = async (): Promise<void> => {
      if (!navigator.onLine) return;
      try {
        const t0  = performance.now();
        const res = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        if (!res.ok) return;
        const rtt = performance.now() - t0;
        this.updateProfile({ rttMs: rtt });
      } catch { /* probe failed, connectivity already handled by online event */ }
    };

    void probe();
    this.probeTimer = setInterval(() => void probe(), intervalMs);
    return () => {
      if (this.probeTimer) clearInterval(this.probeTimer);
    };
  }

  // ─── Fetch with retry + adaptive timeout ──────────────────────────────────

  async fetchWithRetry<T>(
    input:   RequestInfo,
    init:    RequestInit = {},
    opts:    RetryOptions = {},
  ): Promise<T> {
    const maxAttempts = opts.maxAttempts ?? 3;
    const baseDelay   = opts.baseDelayMs ?? 1000;
    const maxDelay    = opts.maxDelayMs  ?? 30_000;
    const cfg         = this.getAdaptiveConfig();

    const controller  = new AbortController();
    const timeout     = setTimeout(() => controller.abort(), cfg.timeout || 30_000);

    let lastError: Error = new Error('unknown');

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (opts.condition && !opts.condition(lastError, attempt)) break;
        if (attempt < maxAttempts - 1) {
          const delay = Math.random() * Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    clearTimeout(timeout);
    throw lastError;
  }

  // ─── Compression ──────────────────────────────────────────────────────────

  async compressPayload(data: string): Promise<string> {
    const cfg = this.getAdaptiveConfig();
    if (cfg.compressionLevel === 'none') return data;
    if (typeof CompressionStream === 'undefined') return data;

    try {
      const stream = new CompressionStream('deflate-raw');
      const writer = stream.writable.getWriter();
      void writer.write(new TextEncoder().encode(data));
      void writer.close();

      const chunks: Uint8Array[] = [];
      const reader = stream.readable.getReader();
      let done = false;
      while (!done) {
        const r = await reader.read();
        done = r.done;
        if (r.value) chunks.push(r.value);
      }

      const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }

      const compressed = btoa(String.fromCharCode(...merged));
      return compressed.length < data.length ? `cmp:${compressed}` : data;
    } catch { return data; }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  getProfile(): NetworkProfile { return { ...this.profile }; }

  getAdaptiveConfig(): AdaptiveConfig { return adaptiveConfigFor(this.profile); }

  isOffline(): boolean { return !this.profile.online; }

  isSlowConnection(): boolean {
    return this.profile.bandwidthClass === 'slow' || this.profile.bandwidthClass === 'very_slow';
  }

  onChange(fn: NetworkListener): () => void {
    this.listeners.add(fn);
    fn(this.profile);
    return () => this.listeners.delete(fn);
  }

  shouldLoadImages(): boolean { return this.profile.bandwidthClass !== 'offline' && !this.profile.saveData; }
  shouldLoadVideos(): boolean { return this.getAdaptiveConfig().videoEnabled; }
  shouldPrefetch():  boolean  { return this.getAdaptiveConfig().prefetchEnabled; }
}

export const NetworkIntelligence = new NetworkIntelligenceImpl();