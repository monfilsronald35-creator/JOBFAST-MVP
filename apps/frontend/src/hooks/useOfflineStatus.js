import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [lastSyncAt, setLastSyncAt] = useState(null);

  useEffect(() => {
    const goOnline  = () => { setIsOffline(false); setLastSyncAt(new Date()); };
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOffline, lastSyncAt };
}
