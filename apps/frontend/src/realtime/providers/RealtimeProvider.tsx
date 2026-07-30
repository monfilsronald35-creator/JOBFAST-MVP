/**
 * RealtimeProvider — initializes the engine and all channels,
 * exposes them via context. Mount once at app root.
 */

import React, { createContext, useContext, useEffect, useRef, useMemo, useState } from 'react';
import { realtimeEngine, RealtimeEngine } from '../core/RealtimeEngine';
import { ChatChannel }          from '../channels/ChatChannel';
import { PresenceChannel }      from '../channels/PresenceChannel';
import { JobChannel }           from '../channels/JobChannel';
import { MarketplaceChannel }   from '../channels/MarketplaceChannel';
import { WalletChannel }        from '../channels/WalletChannel';
import { GPSChannel }           from '../channels/GPSChannel';
import { DashboardChannel }     from '../channels/DashboardChannel';
import { NotificationChannel }  from '../channels/NotificationChannel';
import { CollaborationChannel } from '../channels/CollaborationChannel';
import { SyncChannel }          from '../channels/SyncChannel';
import type { ConnectionState, RealtimeConfig } from '../types';

export interface RealtimeContextValue {
  readonly engine:        RealtimeEngine;
  readonly chat:          ChatChannel;
  readonly presence:      PresenceChannel;
  readonly jobs:          JobChannel;
  readonly marketplace:   MarketplaceChannel;
  readonly wallet:        WalletChannel;
  readonly gps:           GPSChannel;
  readonly dashboard:     DashboardChannel;
  readonly notifications: NotificationChannel;
  readonly collaboration: CollaborationChannel;
  readonly sync:          SyncChannel;
  readonly connectionState: ConnectionState;
  readonly isConnected:   boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export interface RealtimeProviderProps {
  readonly children:    React.ReactNode;
  readonly config?:     Partial<RealtimeConfig>;
  readonly autoConnect?: boolean;
  readonly userId?:     string;
}

export function RealtimeProvider({
  children,
  config,
  autoConnect = true,
  userId,
}: RealtimeProviderProps): React.JSX.Element {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Channel singletons — stable across renders
  const channels = useRef({
    chat:          new ChatChannel(realtimeEngine),
    presence:      new PresenceChannel(realtimeEngine),
    jobs:          new JobChannel(realtimeEngine),
    marketplace:   new MarketplaceChannel(realtimeEngine),
    wallet:        new WalletChannel(realtimeEngine),
    gps:           new GPSChannel(realtimeEngine),
    dashboard:     new DashboardChannel(realtimeEngine),
    notifications: new NotificationChannel(realtimeEngine),
    collaboration: new CollaborationChannel(realtimeEngine),
    sync:          new SyncChannel(realtimeEngine),
  });

  useEffect(() => {
    const unsubState = realtimeEngine.onStateChange(setConnectionState);

    if (autoConnect) {
      void realtimeEngine.connect(config);
    }

    return () => {
      unsubState();
    };
  }, [autoConnect, config]);

  // Auto-announce presence when userId is known
  useEffect(() => {
    if (!userId || connectionState !== 'connected') return;
    const stopActivity = channels.current.presence.initActivityDetection(userId);
    channels.current.sync.initSession(userId);
    channels.current.notifications.subscribe(userId);
    channels.current.wallet.subscribe(userId);
    channels.current.jobs.subscribeToMyApplications(userId);
    return () => {
      stopActivity();
      channels.current.sync.endSession(userId);
      channels.current.notifications.unsubscribe(userId);
      channels.current.wallet.unsubscribe(userId);
    };
  }, [userId, connectionState]);

  const value = useMemo<RealtimeContextValue>(() => ({
    engine:        realtimeEngine,
    ...channels.current,
    connectionState,
    isConnected:   connectionState === 'connected',
  }), [connectionState]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtimeContext must be used inside <RealtimeProvider>');
  return ctx;
}