import { useState, useCallback } from "react";

export function useOfflineQueue() {
  const [queue, setQueue] = useState([]);
  const enqueue = useCallback((item) => setQueue(q => [...q, item]), []);
  const dequeue = useCallback(() => setQueue(q => q.slice(1)), []);
  const clear    = useCallback(() => setQueue([]), []);
  return { queue, enqueue, dequeue, clear, size: queue.length };
}
