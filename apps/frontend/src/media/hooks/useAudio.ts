import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../engines/AudioEngine';
import { MediaAnalytics } from '../analytics/MediaAnalytics';
import type { AudioStreamInfo, WaveformData } from '../types/audio';

export interface AudioState {
  info:        AudioStreamInfo | null;
  waveform:    WaveformData | null;
  loading:     boolean;
  error:       string | null;
  isPlaying:   boolean;
  currentTime: number;
  duration:    number;
  volume:      number;
  muted:       boolean;
  playbackRate: number;
}

export interface UseAudioReturn {
  state:      AudioState;
  audioRef:   React.RefObject<HTMLAudioElement | null>;
  play:       () => void;
  pause:      () => void;
  seek:       (time: number) => void;
  setVol:     (vol: number) => void;
  setRate:    (rate: number) => void;
  mute:       () => void;
  unmute:     () => void;
}

export function useAudio(mediaId: string | undefined | null, autoPlay = false): UseAudioReturn {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const watchedRef = useRef(0);

  const [state, setState] = useState<AudioState>({
    info:         null,
    waveform:     null,
    loading:      false,
    error:        null,
    isPlaying:    false,
    currentTime:  0,
    duration:     0,
    volume:       1,
    muted:        false,
    playbackRate: 1,
  });

  // Load stream info + waveform
  useEffect(() => {
    if (!mediaId) return;
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    Promise.all([
      AudioEngine.getStreamInfo(mediaId),
      AudioEngine.getWaveform(mediaId).catch(() => null),
    ]).then(([info, waveform]) => {
      if (cancelled) return;
      setState(s => ({ ...s, info, waveform, loading: false }));
      if (audioRef.current) {
        audioRef.current.src = info.streamUrl;
        if (autoPlay) void audioRef.current.play();
      }
    }).catch(err => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: err.message }));
    });

    return () => { cancelled = true; };
  }, [mediaId, autoPlay]);

  // Sync audio events to state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onPlay        = () => setState(s => ({ ...s, isPlaying: true }));
    const onPause       = () => setState(s => ({ ...s, isPlaying: false }));
    const onTimeUpdate  = () => {
      watchedRef.current = Math.max(watchedRef.current, a.currentTime);
      setState(s => ({ ...s, currentTime: a.currentTime }));
    };
    const onDuration    = () => setState(s => ({ ...s, duration: a.duration }));
    const onVolumeChange = () => setState(s => ({ ...s, volume: a.volume, muted: a.muted }));
    const onRateChange   = () => setState(s => ({ ...s, playbackRate: a.playbackRate }));

    a.addEventListener('play',           onPlay);
    a.addEventListener('pause',          onPause);
    a.addEventListener('timeupdate',     onTimeUpdate);
    a.addEventListener('durationchange', onDuration);
    a.addEventListener('volumechange',   onVolumeChange);
    a.addEventListener('ratechange',     onRateChange);

    return () => {
      a.removeEventListener('play',           onPlay);
      a.removeEventListener('pause',          onPause);
      a.removeEventListener('timeupdate',     onTimeUpdate);
      a.removeEventListener('durationchange', onDuration);
      a.removeEventListener('volumechange',   onVolumeChange);
      a.removeEventListener('ratechange',     onRateChange);
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

  const play    = useCallback(() => void audioRef.current?.play(), []);
  const pause   = useCallback(() => audioRef.current?.pause(), []);
  const seek    = useCallback((t: number) => { if (audioRef.current) audioRef.current.currentTime = t; }, []);
  const setVol  = useCallback((v: number) => { if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, v)); }, []);
  const setRate = useCallback((r: number) => { if (audioRef.current) audioRef.current.playbackRate = r; }, []);
  const mute    = useCallback(() => { if (audioRef.current) audioRef.current.muted = true; }, []);
  const unmute  = useCallback(() => { if (audioRef.current) audioRef.current.muted = false; }, []);

  return { state, audioRef, play, pause, seek, setVol, setRate, mute, unmute };
}
