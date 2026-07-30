import { useEffect, useState } from 'react';
import { OfflineMonitor, type OfflineHealthReport, type OfflineMetrics } from '../monitoring/OfflineMonitor';

export interface UseOfflineMonitorReturn {
  report:       OfflineHealthReport | null;
  metrics:      OfflineMetrics;
  isHealthy:    boolean;
  isDegraded:   boolean;
  isCritical:   boolean;
  healthScore:  number;
  forceCheck:   () => Promise<void>;
}

export function useOfflineMonitor(): UseOfflineMonitorReturn {
  const [report,  setReport]  = useState<OfflineHealthReport | null>(() => OfflineMonitor.getLastReport());
  const [metrics, setMetrics] = useState<OfflineMetrics>(() => OfflineMonitor.getMetrics());

  useEffect(() => {
    const off = OfflineMonitor.onChange(r => {
      setReport(r);
      setMetrics(OfflineMonitor.getMetrics());
    });
    return off;
  }, []);

  const forceCheck = async (): Promise<void> => {
    const r = await OfflineMonitor.check();
    setReport(r);
    setMetrics(OfflineMonitor.getMetrics());
  };

  return {
    report,
    metrics,
    isHealthy:   report?.status === 'healthy',
    isDegraded:  report?.status === 'degraded',
    isCritical:  report?.status === 'critical',
    healthScore: report?.score ?? 100,
    forceCheck,
  };
}