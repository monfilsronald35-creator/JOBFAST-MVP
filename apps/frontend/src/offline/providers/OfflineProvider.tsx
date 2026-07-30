/**
 * OfflineProvider — mounts all FAZ 6 singletons and exposes context.
 * Must be placed inside RealtimeProvider (FAZ 5) so the engine is already available.
 */

import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { syncEngine }       from '../sync/SyncEngine';
import { queueProcessor }   from '../queue/QueueProcessor';
import { OfflineMonitor }   from '../monitoring/OfflineMonitor';
import { NetworkIntelligence } from '../network/NetworkIntelligence';
import { registerSW }       from '../sw/register';
import { DeviceIntegrity }  from '../security/DeviceIntegrity';

export interface OfflineContextValue {
  readonly isOffline:    boolean;
  readonly isSlow:       boolean;
  readonly syncStatus:   string;
  readonly healthScore:  number;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOffline:   false,
  isSlow:      false,
  syncStatus:  'idle',
  healthScore: 100,
});

export interface OfflineProviderProps {
  children:          ReactNode;
  autoRegisterSW?:   boolean;
  syncIntervalMs?:   number;
  monitorIntervalMs?: number;
}

export function OfflineProvider({
  children,
  autoRegisterSW   = true,
  syncIntervalMs   = 5 * 60_000,
  monitorIntervalMs = 60_000,
}: OfflineProviderProps): React.ReactElement {
  const [isOffline,   setIsOffline]   = React.useState(!navigator.onLine);
  const [isSlow,      setIsSlow]      = React.useState(NetworkIntelligence.isSlowConnection());
  const [syncStatus,  setSyncStatus]  = React.useState('idle');
  const [healthScore, setHealthScore] = React.useState(100);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void DeviceIntegrity.getOrCreateDeviceId();

    syncEngine.start(syncIntervalMs);
    queueProcessor.start();
    OfflineMonitor.start(monitorIntervalMs);
    NetworkIntelligence.startProbing(30_000);

    if (autoRegisterSW) void registerSW('/sw.js');

    const offNetwork = NetworkIntelligence.onChange(p => {
      setIsOffline(!p.online);
      setIsSlow(p.bandwidthClass === 'slow' || p.bandwidthClass === 'very_slow');
    });

    const offSync = syncEngine.onChange(s => setSyncStatus(s.status));

    const offMonitor = OfflineMonitor.onChange(r => setHealthScore(r.score));

    return () => {
      offNetwork();
      offSync();
      offMonitor();
      syncEngine.stop();
      queueProcessor.stop();
      OfflineMonitor.stop();
    };
  }, [syncIntervalMs, monitorIntervalMs, autoRegisterSW]);

  const value: OfflineContextValue = { isOffline, isSlow, syncStatus, healthScore };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext(): OfflineContextValue {
  return useContext(OfflineContext);
}