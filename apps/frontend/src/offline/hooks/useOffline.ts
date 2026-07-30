import { useEffect, useState } from 'react';
import { NetworkIntelligence, type NetworkProfile } from '../network/NetworkIntelligence';

export interface UseOfflineReturn {
  isOffline:     boolean;
  isOnline:      boolean;
  isSlow:        boolean;
  profile:       NetworkProfile;
  lastOnlineAt:  number | null;
}

export function useOffline(): UseOfflineReturn {
  const [profile,  setProfile]  = useState<NetworkProfile>(() => NetworkIntelligence.getProfile());
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(() =>
    profile.online ? Date.now() : null
  );

  useEffect(() => {
    const off = NetworkIntelligence.onChange(p => {
      if (p.online && !profile.online) setLastOnlineAt(Date.now());
      setProfile(p);
    });
    return off;
  }, [profile.online]);

  return {
    isOffline:    !profile.online,
    isOnline:     profile.online,
    isSlow:       NetworkIntelligence.isSlowConnection(),
    profile,
    lastOnlineAt,
  };
}