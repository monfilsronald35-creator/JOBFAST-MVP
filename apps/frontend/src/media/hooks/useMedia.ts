import { useState, useEffect, useCallback } from 'react';
import { MediaGateway } from '../gateway/MediaGateway';
import { MediaAnalytics } from '../analytics/MediaAnalytics';
import type { MediaFile } from '../types';

export interface UseMediaReturn {
  media:    MediaFile | null;
  loading:  boolean;
  error:    string | null;
  reload:   () => void;
  remove:   () => Promise<void>;
}

export function useMedia(mediaId: string | undefined | null): UseMediaReturn {
  const [media,   setMedia]   = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    if (!mediaId) { setMedia(null); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    MediaGateway.getMedia(mediaId)
      .then(m => { if (!cancelled) { setMedia(m); setLoading(false); } })
      .catch(e => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erè chajman medya');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [mediaId, tick]);

  useEffect(() => {
    if (mediaId && media) {
      MediaAnalytics.trackView({ mediaId, source: 'useMedia' });
    }
  }, [mediaId, media]);

  const reload = useCallback(() => setTick(t => t + 1), []);

  const remove = useCallback(async () => {
    if (!mediaId) return;
    await MediaGateway.deleteMedia(mediaId);
    setMedia(null);
  }, [mediaId]);

  return { media, loading, error, reload, remove };
}
