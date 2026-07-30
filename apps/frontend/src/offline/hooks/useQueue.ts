import { useCallback, useEffect, useState } from 'react';
import { getQueueStats, getTotalPending, type QueueDomain } from '../queue/DomainQueues';
import { queueProcessor, type ProcessorStats } from '../queue/QueueProcessor';

export interface UseQueueReturn {
  total:         number;
  byDomain:      Record<QueueDomain, number>;
  processorStats: ProcessorStats;
  isProcessing:  boolean;
  drain:         (domains?: QueueDomain[]) => Promise<void>;
}

export function useQueue(): UseQueueReturn {
  const [total,          setTotal]          = useState(0);
  const [byDomain,       setByDomain]       = useState<Record<QueueDomain, number>>({
    create: 0, update: 0, delete: 0, payment: 0,
    upload: 0, notification: 0, job: 0, marketplace: 0,
  });
  const [processorStats, setProcessorStats] = useState<ProcessorStats>(() => queueProcessor.getStats());

  useEffect(() => {
    let mounted = true;
    const refresh = async (): Promise<void> => {
      const [t, d] = await Promise.all([getTotalPending(), getQueueStats()]);
      if (!mounted) return;
      setTotal(t);
      setByDomain(d);
      setProcessorStats(queueProcessor.getStats());
    };

    void refresh();
    const timer = setInterval(() => void refresh(), 5_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const drain = useCallback(async (domains?: QueueDomain[]) => {
    const stats = await queueProcessor.drain(domains);
    setProcessorStats(stats);
  }, []);

  return {
    total,
    byDomain,
    processorStats,
    isProcessing: processorStats.isRunning,
    drain,
  };
}