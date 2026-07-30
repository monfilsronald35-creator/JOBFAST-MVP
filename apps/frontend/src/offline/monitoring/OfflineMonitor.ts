/**
 * OfflineMonitor — Metrics, health score, conflict logs, retry stats, crash recovery.
 */

import { getStorageStats, getPendingConflicts, offlineDbHealth } from '../db/OfflineDB';
import { getQueueStats, getTotalPending }                        from '../queue/DomainQueues';
import { syncEngine }                                            from '../sync/SyncEngine';
import { NetworkIntelligence }                                   from '../network/NetworkIntelligence';

export interface OfflineHealthReport {
  score:             number;
  status:            'healthy' | 'degraded' | 'critical';
  db:                { ok: boolean; storeCount: number };
  network:           { online: boolean; quality: number; bandwidthClass: string };
  sync:              { status: string; lastSyncAt: number | null; errorCount: number };
  queue:             { total: number; byDomain: Record<string, number> };
  conflicts:         { pending: number };
  storage:           Record<string, number>;
  recommendations:   string[];
  checkedAt:         number;
}

export interface OfflineMetrics {
  totalQueueProcessed:    number;
  totalQueueFailed:       number;
  totalSyncs:             number;
  totalConflicts:         number;
  totalCacheHits:         number;
  totalUploads:           number;
  avgSyncDurationMs:      number;
  sessionStartAt:         number;
  sessionDurationMs:      number;
}

type ReportListener = (report: OfflineHealthReport) => void;

// ─── OfflineMonitor ──────────────────────────────────────────────────────────

class OfflineMonitorImpl {
  private listeners:  Set<ReportListener> = new Set();
  private metrics:    OfflineMetrics = {
    totalQueueProcessed: 0,
    totalQueueFailed:    0,
    totalSyncs:          0,
    totalConflicts:      0,
    totalCacheHits:      0,
    totalUploads:        0,
    avgSyncDurationMs:   0,
    sessionStartAt:      Date.now(),
    sessionDurationMs:   0,
  };

  private monitorTimer:  ReturnType<typeof setInterval> | null = null;
  private lastReport:    OfflineHealthReport | null = null;
  private crashState:    unknown = null;

  start(intervalMs = 60_000): void {
    void this.check();
    this.monitorTimer = setInterval(() => void this.check(), intervalMs);
    this.setupCrashRecovery();
  }

  stop(): void {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
    this.monitorTimer = null;
  }

  async check(): Promise<OfflineHealthReport> {
    const [db, conflicts, storage, queueTotal, queueByDomain] = await Promise.all([
      offlineDbHealth(),
      getPendingConflicts().then(c => c.length),
      getStorageStats(),
      getTotalPending(),
      getQueueStats(),
    ]);

    const network = NetworkIntelligence.getProfile();
    const sync    = syncEngine.getState();

    const report = this.buildReport({
      db, conflicts, storage,
      queueTotal, queueByDomain,
      network, sync,
    });

    this.lastReport = report;
    this.notify(report);
    return report;
  }

  private buildReport(data: {
    db:            { ok: boolean; storeCount: number };
    conflicts:     number;
    storage:       Record<string, number>;
    queueTotal:    number;
    queueByDomain: Record<string, number>;
    network:       { online: boolean; quality: number; bandwidthClass: string };
    sync:          { status: string; lastSyncAt: number | null; errorCount: number; syncCount: number };
  }): OfflineHealthReport {
    const recommendations: string[] = [];
    let score = 100;

    if (!data.db.ok) { score -= 30; recommendations.push('IndexedDB unavailable — offline storage disabled'); }
    if (!data.network.online) { score -= 20; recommendations.push('Device is offline'); }
    if (data.network.bandwidthClass === 'very_slow') { score -= 10; recommendations.push('Very slow connection detected'); }
    if (data.queueTotal > 50)  { score -= 15; recommendations.push(`${data.queueTotal} items pending in offline queue`); }
    if (data.conflicts > 0)    { score -= 10 * Math.min(data.conflicts, 3); recommendations.push(`${data.conflicts} sync conflicts need resolution`); }
    if (data.sync.errorCount > 5) { score -= 10; recommendations.push('Multiple sync errors — check network or server'); }
    if (data.sync.status === 'error') { score -= 5; recommendations.push('Last sync failed'); }

    score = Math.max(0, score);
    const status: OfflineHealthReport['status'] =
      score >= 80 ? 'healthy' :
      score >= 50 ? 'degraded' :
      'critical';

    return {
      score,
      status,
      db:       data.db,
      network: { online: data.network.online, quality: data.network.quality, bandwidthClass: data.network.bandwidthClass },
      sync:    { status: data.sync.status, lastSyncAt: data.sync.lastSyncAt, errorCount: data.sync.errorCount },
      queue:   { total: data.queueTotal, byDomain: data.queueByDomain },
      conflicts: { pending: data.conflicts },
      storage:  data.storage,
      recommendations,
      checkedAt: Date.now(),
    };
  }

  // ─── Crash recovery ────────────────────────────────────────────────────────

  private setupCrashRecovery(): void {
    window.addEventListener('beforeunload', () => {
      try {
        const state = {
          timestamp: Date.now(),
          metrics:   this.metrics,
          report:    this.lastReport,
        };
        sessionStorage.setItem('jf_offline_crash_state', JSON.stringify(state));
      } catch { /* ignore */ }
    });

    try {
      const raw = sessionStorage.getItem('jf_offline_crash_state');
      if (raw) {
        this.crashState = JSON.parse(raw);
        sessionStorage.removeItem('jf_offline_crash_state');
      }
    } catch { /* ignore */ }
  }

  getCrashState(): unknown { return this.crashState; }
  hasCrashState(): boolean { return !!this.crashState; }

  // ─── Metric recording ──────────────────────────────────────────────────────

  recordQueueSuccess(count = 1): void { this.metrics.totalQueueProcessed += count; }
  recordQueueFailure(count = 1): void { this.metrics.totalQueueFailed    += count; }
  recordSync():                  void { this.metrics.totalSyncs++; }
  recordConflict():              void { this.metrics.totalConflicts++; }
  recordCacheHit():              void { this.metrics.totalCacheHits++; }
  recordUpload():                void { this.metrics.totalUploads++; }

  recordSyncDuration(ms: number): void {
    const total = this.metrics.totalSyncs || 1;
    this.metrics.avgSyncDurationMs =
      (this.metrics.avgSyncDurationMs * (total - 1) + ms) / total;
  }

  getMetrics(): OfflineMetrics {
    return {
      ...this.metrics,
      sessionDurationMs: Date.now() - this.metrics.sessionStartAt,
    };
  }

  getLastReport(): OfflineHealthReport | null { return this.lastReport; }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  onChange(fn: ReportListener): () => void {
    this.listeners.add(fn);
    if (this.lastReport) fn(this.lastReport);
    return () => this.listeners.delete(fn);
  }

  private notify(report: OfflineHealthReport): void {
    this.listeners.forEach(fn => fn(report));
  }
}

export const OfflineMonitor = new OfflineMonitorImpl();