/**
 * useRealtimeEngine — low-level access to the engine singleton + metrics.
 */

import { useCallback, useEffect, useState } from 'react';
import { realtimeEngine } from '../core/RealtimeEngine';
import type { ConnectionState, EngineMetrics } from '../types';

export interface UseRealtimeEngineReturn {
  readonly connectionState: ConnectionState;
  readonly isConnected:     boolean;
  readonly isDegraded:      boolean;
  readonly metrics:         EngineMetrics;
  readonly connect:         () => Promise<void>;
  readonly disconnect:      () => void;
}

export function useRealtimeEngine(): UseRealtimeEngineReturn {
  const [state, setState]     = useState<ConnectionState>(realtimeEngine.state);
  const [metrics, setMetrics] = useState<EngineMetrics>(realtimeEngine.getMetrics());

  useEffect(() => {
    const unsubState = realtimeEngine.onStateChange(s => {
      setState(s);
      setMetrics(realtimeEngine.getMetrics());
    });

    // Poll metrics every 5s
    const interval = setInterval(() => {
      setMetrics(realtimeEngine.getMetrics());
    }, 5_000);

    return () => {
      unsubState();
      clearInterval(interval);
    };
  }, []);

  const connect    = useCallback(() => realtimeEngine.connect(), []);
  const disconnect = useCallback(() => { realtimeEngine.disconnect(); }, []);

  return {
    connectionState: state,
    isConnected:     state === 'connected',
    isDegraded:      state === 'degraded',
    metrics,
    connect,
    disconnect,
  };
}