// Types
export * from './types';

// Gateway
export { MediaGateway } from './gateway/MediaGateway';

// Engines
export { UploadEngine }       from './engines/UploadEngine';
export { ProcessingPipeline } from './engines/ProcessingPipeline';
export { ImageOptimizer }     from './engines/ImageOptimizer';
export { VideoEngine }        from './engines/VideoEngine';
export { AudioEngine }        from './engines/AudioEngine';
export { DocumentEngine }     from './engines/DocumentEngine';
export { StreamingEngine }    from './engines/StreamingEngine';
export { StorageManager }     from './engines/StorageManager';

// CDN + Cache
export { CDNManager }  from './cdn/CDNManager';
export { MediaCache }  from './cache/MediaCache';

// AI + Security + Analytics
export { AIMediaEngine }  from './ai/AIMediaEngine';
export { MediaSecurity }  from './security/MediaSecurity';
export { MediaAnalytics } from './analytics/MediaAnalytics';

// React
export { MediaProvider, useMediaContext } from './providers/MediaProvider';
export { useUpload }   from './hooks/useUpload';
export { useMedia }    from './hooks/useMedia';
export { useVideo }    from './hooks/useVideo';
export { useAudio }    from './hooks/useAudio';

// Re-export key types for convenience
export type { UploadOptions }  from './engines/UploadEngine';
export type { UseUploadReturn, UploadStatus, UploadState } from './hooks/useUpload';
export type { UseMediaReturn } from './hooks/useMedia';
export type { UseVideoReturn, VideoState } from './hooks/useVideo';
export type { UseAudioReturn, AudioState } from './hooks/useAudio';
export type { ProcessingJob, ProcessingStep } from './engines/ProcessingPipeline';
export type { TaggingResult, NSFWResult, OCRResult } from './ai/AIMediaEngine';
export type { MediaContextValue } from './providers/MediaProvider';
