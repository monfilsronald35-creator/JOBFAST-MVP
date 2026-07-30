/**
 * ConflictResolver — LWW, vector clocks, 3-way merge, rollback, recovery.
 * Called by SyncEngine when server returns conflicting versions.
 */

export type MergeStrategy = 'lww' | 'server_wins' | 'client_wins' | 'three_way' | 'manual';

export interface VersionedValue<T = unknown> {
  value:        T;
  version:      number;
  updatedAt:    number;
  deviceId?:    string;
  vectorClock?: Record<string, number>;
}

export interface MergeResult<T = unknown> {
  resolved:  boolean;
  value:     T | null;
  strategy:  MergeStrategy;
  winner:    'local' | 'remote' | 'merged' | 'none';
  confident: boolean;
}

// ─── Last-Write-Wins ──────────────────────────────────────────────────────────

export function resolveLWW<T>(
  local:  VersionedValue<T>,
  remote: VersionedValue<T>,
): MergeResult<T> {
  if (local.updatedAt > remote.updatedAt) {
    return { resolved: true, value: local.value, strategy: 'lww', winner: 'local', confident: true };
  }
  if (remote.updatedAt > local.updatedAt) {
    return { resolved: true, value: remote.value, strategy: 'lww', winner: 'remote', confident: true };
  }
  return { resolved: false, value: null, strategy: 'lww', winner: 'none', confident: false };
}

// ─── Vector clocks ────────────────────────────────────────────────────────────

export function mergeVectorClocks(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = { ...a };
  for (const [key, val] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, val);
  }
  return merged;
}

export function happensBefore(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let atLeastOneLess = false;
  for (const key of allKeys) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (av > bv) return false;
    if (av < bv) atLeastOneLess = true;
  }
  return atLeastOneLess;
}

export function compareVectorClocks(
  a: Record<string, number>,
  b: Record<string, number>,
): 'a_before_b' | 'b_before_a' | 'concurrent' | 'equal' {
  if (happensBefore(a, b)) return 'a_before_b';
  if (happensBefore(b, a)) return 'b_before_a';
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let diff = false;
  for (const key of allKeys) {
    if ((a[key] ?? 0) !== (b[key] ?? 0)) { diff = true; break; }
  }
  return diff ? 'concurrent' : 'equal';
}

// ─── 3-way merge for objects ──────────────────────────────────────────────────

export function threeWayMerge<T extends Record<string, unknown>>(
  base:   T,
  local:  T,
  remote: T,
): MergeResult<T> {
  const merged: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  let hadConflict = false;

  for (const key of allKeys) {
    const bv = base[key];
    const lv = local[key];
    const rv = remote[key];

    if (lv === rv) {
      merged[key] = lv;
    } else if (lv === bv) {
      merged[key] = rv;
    } else if (rv === bv) {
      merged[key] = lv;
    } else {
      hadConflict = true;
      merged[key] = lv;
    }
  }

  return {
    resolved:  !hadConflict,
    value:     merged as T,
    strategy:  'three_way',
    winner:    'merged',
    confident: !hadConflict,
  };
}

// ─── Field-level merge for arrays ─────────────────────────────────────────────

export function mergeArrays<T extends { id: string; updatedAt?: number }>(
  local:  T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of local)  map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || (item.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

// ─── Rollback support ─────────────────────────────────────────────────────────

export class RollbackManager {
  private snapshots: Map<string, { value: unknown; at: number }[]> = new Map();
  private maxSnapshots = 10;

  snapshot(key: string, value: unknown): void {
    const snaps = this.snapshots.get(key) ?? [];
    snaps.push({ value: structuredClone(value), at: Date.now() });
    if (snaps.length > this.maxSnapshots) snaps.shift();
    this.snapshots.set(key, snaps);
  }

  rollback<T>(key: string, steps = 1): T | null {
    const snaps = this.snapshots.get(key) ?? [];
    const idx   = snaps.length - 1 - steps;
    if (idx < 0) return null;
    return snaps[idx]?.value as T ?? null;
  }

  clear(key: string): void {
    this.snapshots.delete(key);
  }

  getHistory(key: string): Array<{ value: unknown; at: number }> {
    return this.snapshots.get(key) ?? [];
  }
}

export const rollbackManager = new RollbackManager();

// ─── Top-level resolver ───────────────────────────────────────────────────────

export function resolve<T>(
  strategy: MergeStrategy,
  local:  VersionedValue<T>,
  remote: VersionedValue<T>,
  base?:  T,
): MergeResult<T> {
  switch (strategy) {
    case 'lww':          return resolveLWW(local, remote);
    case 'server_wins':  return { resolved: true, value: remote.value, strategy, winner: 'remote', confident: true };
    case 'client_wins':  return { resolved: true, value: local.value,  strategy, winner: 'local',  confident: true };
    case 'three_way': {
      if (!base || typeof local.value !== 'object' || !local.value) return resolveLWW(local, remote);
      return threeWayMerge(
        base  as Record<string, unknown>,
        local.value  as Record<string, unknown>,
        remote.value as Record<string, unknown>,
      ) as MergeResult<T>;
    }
    case 'manual':
      return { resolved: false, value: null, strategy, winner: 'none', confident: false };
  }
}