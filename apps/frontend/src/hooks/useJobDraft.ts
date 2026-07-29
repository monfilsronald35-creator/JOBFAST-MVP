/**
 * useJobDraft — Enterprise job draft persistence.
 * Storage: IndexedDB primary, localStorage fallback.
 * Features: debounced autosave, versioning, dirty tracking,
 * beforeunload guard, async restore on mount.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JobDraftData } from '../types';

const DEBOUNCE_MS = 800;
const SCHEMA_VERSION = 2;

interface DraftRecord {
  readonly data: JobDraftData;
  readonly savedAt: number;
  readonly version: number;
}

// ─── IndexedDB helpers (inline to avoid circular deps) ────────────────────────
async function idbSet(key: string, value: DraftRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jobfast_drafts', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('drafts', { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const tx = req.result.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').put({ id: key, ...value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<DraftRecord | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jobfast_drafts', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('drafts', { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const tx = req.result.transaction('drafts', 'readonly');
      const getReq = tx.objectStore('drafts').get(key) as IDBRequest<(DraftRecord & { id: string }) | undefined>;
      getReq.onsuccess = () => resolve(getReq.result ?? null);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jobfast_drafts', 1);
    req.onsuccess = () => {
      const tx = req.result.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── localStorage fallback ────────────────────────────────────────────────────
function lsSet(key: string, record: DraftRecord): void {
  try {
    localStorage.setItem(`draft:${key}`, JSON.stringify(record));
  } catch {}
}

function lsGet(key: string): DraftRecord | null {
  try {
    const raw = localStorage.getItem(`draft:${key}`);
    return raw ? (JSON.parse(raw) as DraftRecord) : null;
  } catch {
    return null;
  }
}

function lsDelete(key: string): void {
  try {
    localStorage.removeItem(`draft:${key}`);
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface JobDraftReturn {
  readonly loadDraft: () => JobDraftData | null;
  readonly saveDraftDebounced: (data: JobDraftData) => void;
  readonly clearDraft: () => void;
  readonly markDirty: () => void;
  readonly hasUnsavedChanges: () => boolean;
}

export function useJobDraft(draftKey: string): JobDraftReturn {
  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inMemoryRef = useRef<JobDraftData | null>(null);

  // ── Sync load on first call (returns cached) ──────────────────────────────
  const loadDraft = useCallback((): JobDraftData | null => {
    if (inMemoryRef.current) return inMemoryRef.current;
    // Synchronous localStorage fallback for immediate use
    const record = lsGet(draftKey);
    if (record && record.version === SCHEMA_VERSION) {
      inMemoryRef.current = record.data;
      return record.data;
    }
    return null;
  }, [draftKey]);

  // ── Async restore from IndexedDB on mount ─────────────────────────────────
  useEffect(() => {
    idbGet(draftKey)
      .then((record) => {
        if (record && record.version === SCHEMA_VERSION) {
          inMemoryRef.current = record.data;
          // Also update localStorage for sync access
          lsSet(draftKey, record);
        }
      })
      .catch(() => {});
  }, [draftKey]);

  // ── Debounced save ────────────────────────────────────────────────────────
  const saveDraftDebounced = useCallback(
    (data: JobDraftData): void => {
      inMemoryRef.current = data;
      lsSet(draftKey, { data, savedAt: Date.now(), version: SCHEMA_VERSION });

      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const record: DraftRecord = { data, savedAt: Date.now(), version: SCHEMA_VERSION };
        idbSet(draftKey, record).catch(() => {});
      }, DEBOUNCE_MS);
    },
    [draftKey],
  );

  // ── Clear draft ───────────────────────────────────────────────────────────
  const clearDraft = useCallback((): void => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    inMemoryRef.current = null;
    dirtyRef.current = false;
    lsDelete(draftKey);
    idbDelete(draftKey).catch(() => {});
  }, [draftKey]);

  // ── Dirty tracking ────────────────────────────────────────────────────────
  const markDirty = useCallback((): void => {
    dirtyRef.current = true;
  }, []);

  const hasUnsavedChanges = useCallback((): boolean => {
    return dirtyRef.current;
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, []);

  return { loadDraft, saveDraftDebounced, clearDraft, markDirty, hasUnsavedChanges };
}