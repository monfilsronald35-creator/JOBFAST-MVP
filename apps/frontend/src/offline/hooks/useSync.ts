import { useCallback, useEffect, useState } from 'react';
import { syncEngine, type SyncEngineState, type SyncResult } from '../sync/SyncEngine';
import { getTotalPending } from '../queue/DomainQueues';

export interface UseSyncReturn {
  status:       SyncEngineState['status'];
  lastSyncAt:   number | null;
  syncCount:    number;
  errorCount:   number;
  pendingCount: number;
  results:      readonly SyncResult[];
  isSyncing:    boolean;
  forceSync:    () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const [state,        setState]        = useState<SyncEngineState>(() => syncEngine.getState());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const offSync = syncEngine.onChange(s => setState(s));
    let timer: ReturnType<typeof setInterval>;

    const refreshPending = async (): Promise<void> => {
      const n = await getTotalPending();
      setPendingCount(n);
    };

    void refreshPending();
    timer = setInterval(() => void refreshPending(), 10_000);

    return () => { offSync(); clearInterval(timer); };
  }, []);

  const forceSync = useCallback(async () => {
    await syncEngine.syncAll('manual');
  }, []);

  return {
    status:       state.status,
    lastSyncAt:   state.lastSyncAt,
    syncCount:    state.syncCount,
    errorCount:   state.errorCount,
    pendingCount,
    results:      state.results,
    isSyncing:    state.status === 'syncing',
    forceSync,
  };
}