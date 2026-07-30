import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoEngine } from '../engines/VideoEngine';
import { StreamingEngine } from '../engines/StreamingEngine';
import { MediaAnalytics } from '../analytics/MediaAnalytics';
import type { StreamManifest, VideoRendition } from '../types/video';

export interface VideoState {
  manifest:         StreamManifest | null;
  currentRendition: VideoRendition | null;
  loading:          boolean;
  error:            string | null;
  isPlaying:        boolean;
  currentTime:      number;
  duration:         number;
  buffered:         number;
  volume:           number;
  muted:            boolean;
  fullscreen:       boolean;
  stallCount:       number;
}

export interface UseVideoReturn {
  state:    VideoState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  play:     () => void;
  pause:    () => void;
  seek:     (time: number) => void;
  setVol:   (vol: number) => void;
  mute:     () => void;
  unmute:   () => void;
  toggleFS: () => void;
}

export function useVideo(mediaId: string | undefined | null, autoPlay = false): UseVideoReturn {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const watchedRef = useRef(0);

  const [state, setState] = useState<VideoState>({
    manifest:         null,
    currentRendition: null,
    loading:          false,
    error:            null,
    isPlaying:        false,
    currentTime:      0,
    duration:         0,
    buffered:         0,
    volume:           1,
    muted:            false,
    fullscreen:       false,
    stallCount:       0,
  });

  // Load manifest
  useEffect(() => {
    if (!mediaId) return;
    setState(s => ({ ...s, loading: true, error: null }));

    VideoEngine.getManifest(mediaId)
      .then(manifest => {
        const rendition = StreamingEngine.selectRendition(manifest, videoRef.current?.offsetWidth);
        setState(s => ({ ...s, manifest, currentRendition: rendition, loading: false }));

        if (videoRef.current) {
          StreamingEngine.attachToVideoElement(videoRef.current, manifest);
          if (autoPlay) void videoRef.current.play();
        }
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: err.message })));
  }, [mediaId, autoPlay]);

  // Sync video events to state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay     = () => setState(s => ({ ...s, isPlaying: true }));
    const onPause    = () => setState(s => ({ ...s, isPlaying: false }));
    const onTimeUpdate = () => {
      watchedRef.current = Math.max(watchedRef.current, v.currentTime);
      setState(s => ({ ...s, currentTime: v.currentTime }));
    };
    const onDuration   = () => setState(s => ({ ...s, duration: v.duration }));
    const onVolumeChange = () => setState(s => ({ ...s, volume: v.volume, muted: v.muted }));
    const onProgress     = () => {
      const buffered = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0;
      setState(s => ({ ...s, buffered }));
    };
    const onWaiting = () => {
      StreamingEngine.recordStall();
      setState(s => ({ ...s, stallCount: StreamingEngine.stallCount }));
    };

    v.addEventListener('play',         onPlay);
    v.addEventListener('pause',        onPause);
    v.addEventListener('timeupdate',   onTimeUpdate);
    v.addEventListener('durationchange', onDuration);
    v.addEventListener('volumechange', onVolumeChange);
    v.addEventListener('progress',     onProgress);
    v.addEventListener('waiting',      onWaiting);

    return () => {
      v.removeEventListener('play',         onPlay);
      v.removeEventListener('pause',        onPause);
      v.removeEventListener('timeupdate',   onTimeUpdate);
      v.removeEventListener('durationchange', onDuration);
      v.removeEventListener('volumechange', onVolumeChange);
      v.removeEventListener('progress',     onProgress);
      v.removeEventListener('waiting',      onWaiting);
    };
  }, []);

  // Track playback on unmount
  useEffect(() => {
    return () => {
      if (mediaId && watchedRef.current > 0) {
        MediaAnalytics.trackPlayback(mediaId, watchedRef.current);
      }
    };
  }, [mediaId]);

  const play     = useCallback(() => void videoRef.current?.play(), []);
  const pause    = useCallback(() => videoRef.current?.pause(), []);
  const seek     = useCallback((t: number) => { if (videoRef.current) videoRef.current.currentTime = t; }, []);
  const setVol   = useCallback((v: number) => { if (videoRef.current) videoRef.current.volume = Math.max(0, Math.min(1, v)); }, []);
  const mute     = useCallback(() => { if (videoRef.current) videoRef.current.muted = true; }, []);
  const unmute   = useCallback(() => { if (videoRef.current) videoRef.current.muted = false; }, []);
  const toggleFS = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (!document.fullscreenElement) {
      await v.requestFullscreen();
      setState(s => ({ ...s, fullscreen: true }));
    } else {
      await document.exitFullscreen();
      setState(s => ({ ...s, fullscreen: false }));
    }
  }, []);

  return { state, videoRef, play, pause, seek, setVol, mute, unmute, toggleFS };
}
