/**
 * usePresence — subscribe to multiple users' presence, control own status.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { PresencePayload } from '../types';
import type { PresenceStatus } from '../../types';

export interface UsePresenceReturn {
  readonly presenceMap:   Readonly<Record<string, PresencePayload>>;
  readonly setStatus:     (status: PresenceStatus) => void;
  readonly setOnline:     () => void;
  readonly setAway:       () => void;
  readonly setBusy:       () => void;
  readonly setOffline:    () => void;
  readonly currentStatus: PresenceStatus;
}

export function usePresence(userIds?: readonly string[]): UsePresenceReturn {
  const { presence } = useRealtimeContext();
  const [presenceMap, setPresenceMap] = useState<Record<string, PresencePayload>>({});

  useEffect(() => {
    const off = presence.onPresenceUpdate(p => {
      setPresenceMap(prev => ({ ...prev, [p.userId]: p }));
    });

    const batchOff = presence.onPresenceBatch(batch => {
      setPresenceMap(prev => {
        const next = { ...prev };
        batch.forEach(p => { next[p.userId] = p; });
        return next;
      });
    });

    if (userIds?.length) presence.subscribe(userIds);

    return () => {
      off();
      batchOff();
      if (userIds?.length) presence.unsubscribe(userIds);
    };
  }, [presence, userIds?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus  = useCallback((status: PresenceStatus) => presence.updateStatus(status), [presence]);
  const setOnline  = useCallback(() => presence.setOnline(),  [presence]);
  const setAway    = useCallback(() => presence.setAway(),    [presence]);
  const setBusy    = useCallback(() => presence.setBusy(),    [presence]);
  const setOffline = useCallback(() => presence.setOffline(), [presence]);

  return {
    presenceMap,
    setStatus,
    setOnline,
    setAway,
    setBusy,
    setOffline,
    currentStatus: presence.currentStatus,
  };
}