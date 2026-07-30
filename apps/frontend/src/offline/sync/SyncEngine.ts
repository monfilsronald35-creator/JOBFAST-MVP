/**
 * SyncEngine — Background / Foreground / Incremental / Priority / Manual / Automatic sync.
 * Integrates with FAZ 5 realtimeEngine for connection state.
 * Uses OfflineDB sync_state store for version tracking.
 * Uses ConflictResolver for merge decisions.
 */

import { getSyncState, setSyncState, type SyncStateRecord } from '../db/OfflineDB';
import { realtimeEngine } from '../../realtime/core/RealtimeEngine';
import { resolveConflict as dbResolveConflict } from '../db/OfflineDB';
import type { ConflictRecord } from '../db/OfflineDB';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'paused'
  | 'offline';

export type SyncMode =
  | 'background'
  | 'foreground'
  | 'incremental'
  | 'priority'
  | 'manual';

export interface SyncNamespace {
  name:      string;
  endpoint:  string;
  ttlMs:     number;
  priority:  number;
  canMerge:  boolean;
}

export interface SyncResult {
  namespace:    string;
  status:       'ok' | 'error' | 'conflict' | 'skipped';
  synced:       number;
  conflicts:    number;
  durationMs:   number;
  error?:       string;
}

export interface SyncEngineState {
  status:       SyncStatus;
  lastSyncAt:   number | null;
  syncCount:    number;
  errorCount:   number;
  pendingCount: number;
  results:      SyncResult[];
}

type SyncListener = (state: SyncEngineState) => void;

// ─── Default namespaces ───────────────────────────────────────────────────────

const DEFAULT_NAMESPACES: SyncNamespace[] = [
  { name: 'jobs',        endpoint: '/api/sync/jobs',        ttlMs: 5 * 60_000,  priority: 1, canMerge: false },
  { name: 'profiles',    endpoint: '/api/sync/profiles',    ttlMs: 10 * 60_000, priority: 2, canMerge: true  },
  { name: 'wallet',      endpoint: '/api/sync/wallet',      ttlMs: 1 * 60_000,  priority: 0, canMerge: false },
  { name: 'messages',    endpoint: '/api/sync/messages',    ttlMs: 2 * 60_000,  priority: 1, canMerge: false },
  { name: 'marketplace', endpoint: '/api/sync/marketplace', ttlMs: 5 * 60_000,  priority: 2, canMerge: false },
  { name: 'config',      endpoint: '/api/sync/config',      ttlMs: 60 * 60_000, priority: 3, canMerge: false },
];

// ─── SyncEngine ──────────────────────────────────────────────────────────────

export class SyncEngine {
  private static _instance: SyncEngine | null = null;

  private state: SyncEngineState = {
    status:       'idle',
    lastSyncAt:   null,
    syncCount:    0,
    errorCount:   0,
    pendingCount: 0,
    results:      [],
  };

  private namespaces: SyncNamespace[]  = [...DEFAULT_NAMESPACES];
  private listeners:  Set<SyncListener> = new Set();
  private bgTimer:    ReturnType<typeof setInterval> | null = null;
  private unsubEngine: (() => void) | null = null;
  private paused = false;
  private syncPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SyncEngine {
    if (!SyncEngine._instance) SyncEngine._instance = new SyncEngine();
    return SyncEngine._instance;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  start(backgroundIntervalMs = 5 * 60_000): void {
    this.unsubEngine = realtimeEngine.onStateChange(s => {
      if (s === 'connected') void this.syncAll('background');
      if (s === 'disconnected') this.setState({ status: 'offline' });
    });

    window.addEventListener('online',  this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.addEventListener('visibilitychange', this.onVisibility);

    this.bgTimer = setInterval(() => {
      if (!this.paused && navigator.onLine) void this.syncAll('background');
    }, backgroundIntervalMs);

    if (navigator.onLine) void this.syncAll('background');
  }

  stop(): void {
    this.unsubEngine?.();
    this.unsubEngine = null;
    if (this.bgTimer) clearInterval(this.bgTimer);
    this.bgTimer = null;
    window.removeEventListener('online',  this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  pause(): void  { this.paused = true;  this.setState({ status: 'paused' }); }
  resume(): void { this.paused = false; if (navigator.onLine) void this.syncAll('background'); }

  private onOnline  = (): void => { if (!this.paused) void this.syncAll('foreground'); };
  private onOffline = (): void => { this.setState({ status: 'offline' }); };
  private onVisibility = (): void => {
    if (document.visibilityState === 'visible' && !this.paused && navigator.onLine) {
      void this.syncAll('foreground');
    }
  };

  // ─── Sync orchestration ────────────────────────────────────────────────────

  async syncAll(mode: SyncMode = 'manual'): Promise<SyncResult[]> {
    if (this.syncPromise) {
      await this.syncPromise;
      return this.state.results;
    }

    let resolve!: () => void;
    this.syncPromise = new Promise<void>(r => { resolve = r; });

    this.setState({ status: 'syncing' });

    const sorted  = [...this.namespaces].sort((a, b) => a.priority - b.priority);
    const results: SyncResult[] = [];

    try {
      const auth = this.getAuthHeader();

      for (const ns of sorted) {
        if (!navigator.onLine) break;
        const r = await this.syncNamespace(ns, auth, mode);
        results.push(r);
      }

      const errors = results.filter(r => r.status === 'error').length;
      this.setState({
        status:     errors ? 'error' : 'success',
        lastSyncAt: Date.now(),
        syncCount:  this.state.syncCount + 1,
        errorCount: this.state.errorCount + errors,
        results,
      });
    } catch {
      this.setState({ status: 'error', errorCount: this.state.errorCount + 1 });
    } finally {
      this.syncPromise = null;
      resolve();
    }

    return results;
  }

  async syncNamespace(ns: SyncNamespace, authHeader: string | null, mode: SyncMode): Promise<SyncResult> {
    const t0 = Date.now();

    try {
      const state = await getSyncState(ns.name);
      if (mode === 'incremental' && state) {
        const age = Date.now() - state.lastSyncAt;
        if (age < ns.ttlMs) {
          return { namespace: ns.name, status: 'skipped', synced: 0, conflicts: 0, durationMs: Date.now() - t0 };
        }
      }

      const lastVersion = state?.lastVersion ?? 0;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Last-Version': String(lastVersion),
        ...(authHeader ? { Authorization: authHeader } : {}),
      };

      const res = await fetch(`${ns.endpoint}?since=${lastVersion}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json() as {
        items?:   unknown[];
        version?: number;
        conflicts?: Array<{ id: string; localValue: unknown; remoteValue: unknown; localVersion: number; remoteVersion: number }>;
      };

      const conflicts = json.conflicts?.length ?? 0;

      const newState: SyncStateRecord = {
        namespace:    ns.name,
        lastSyncAt:   Date.now(),
        lastVersion:  json.version ?? lastVersion,
        vectorClock:  state?.vectorClock ?? {},
        pendingCount: 0,
        errorCount:   0,
      };
      await setSyncState(newState);

      return {
        namespace:  ns.name,
        status:     conflicts > 0 ? 'conflict' : 'ok',
        synced:     json.items?.length ?? 0,
        conflicts,
        durationMs: Date.now() - t0,
      };
    } catch (err) {
      const newState = await getSyncState(ns.name);
      if (newState) {
        await setSyncState({ ...newState, errorCount: (newState.errorCount ?? 0) + 1 });
      }
      return {
        namespace:  ns.name,
        status:     'error',
        synced:     0,
        conflicts:  0,
        durationMs: Date.now() - t0,
        error:      String(err),
      };
    }
  }

  // ─── Priority sync ─────────────────────────────────────────────────────────

  async syncPriority(namespaceNames: string[]): Promise<SyncResult[]> {
    const targets = this.namespaces.filter(n => namespaceNames.includes(n.name));
    const auth    = this.getAuthHeader();
    return Promise.all(targets.map(ns => this.syncNamespace(ns, auth, 'priority')));
  }

  // ─── Namespace management ──────────────────────────────────────────────────

  registerNamespace(ns: SyncNamespace): void {
    const existing = this.namespaces.findIndex(n => n.name === ns.name);
    if (existing >= 0) this.namespaces[existing] = ns;
    else this.namespaces.push(ns);
  }

  // ─── Conflict resolution ───────────────────────────────────────────────────

  async resolveConflict(id: string, resolution: ConflictRecord['resolution']): Promise<void> {
    await dbResolveConflict(id, resolution);
  }

  // ─── State management ──────────────────────────────────────────────────────

  private setState(partial: Partial<SyncEngineState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(fn => fn(this.state));
  }

  getState(): Readonly<SyncEngineState> { return this.state; }

  onChange(fn: SyncListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ─── Utils ─────────────────────────────────────────────────────────────────

  private getAuthHeader(): string | null {
    try {
      const raw = localStorage.getItem('jobfast_user');
      if (!raw) return null;
      const u = JSON.parse(raw) as { token?: string };
      return u.token ? `Bearer ${u.token}` : null;
    } catch { return null; }
  }
}

export const syncEngine = SyncEngine.getInstance();