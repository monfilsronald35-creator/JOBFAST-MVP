import React, { createContext, useContext, useMemo } from 'react';
import { MediaGateway } from '../gateway/MediaGateway';
import { UploadEngine } from '../engines/UploadEngine';
import { ProcessingPipeline } from '../engines/ProcessingPipeline';
import { ImageOptimizer } from '../engines/ImageOptimizer';
import { VideoEngine } from '../engines/VideoEngine';
import { AudioEngine } from '../engines/AudioEngine';
import { DocumentEngine } from '../engines/DocumentEngine';
import { StreamingEngine } from '../engines/StreamingEngine';
import { StorageManager } from '../engines/StorageManager';
import { CDNManager } from '../cdn/CDNManager';
import { MediaCache } from '../cache/MediaCache';
import { AIMediaEngine } from '../ai/AIMediaEngine';
import { MediaSecurity } from '../security/MediaSecurity';
import { MediaAnalytics } from '../analytics/MediaAnalytics';

export interface MediaContextValue {
  gateway:    typeof MediaGateway;
  upload:     typeof UploadEngine;
  pipeline:   typeof ProcessingPipeline;
  images:     typeof ImageOptimizer;
  video:      typeof VideoEngine;
  audio:      typeof AudioEngine;
  document:   typeof DocumentEngine;
  streaming:  typeof StreamingEngine;
  storage:    typeof StorageManager;
  cdn:        typeof CDNManager;
  cache:      typeof MediaCache;
  ai:         typeof AIMediaEngine;
  security:   typeof MediaSecurity;
  analytics:  typeof MediaAnalytics;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<MediaContextValue>(() => ({
    gateway:   MediaGateway,
    upload:    UploadEngine,
    pipeline:  ProcessingPipeline,
    images:    ImageOptimizer,
    video:     VideoEngine,
    audio:     AudioEngine,
    document:  DocumentEngine,
    streaming: StreamingEngine,
    storage:   StorageManager,
    cdn:       CDNManager,
    cache:     MediaCache,
    ai:        AIMediaEngine,
    security:  MediaSecurity,
    analytics: MediaAnalytics,
  }), []);

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMediaContext(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMediaContext must be used inside <MediaProvider>');
  return ctx;
}
