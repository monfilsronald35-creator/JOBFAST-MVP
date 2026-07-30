import { useState, useCallback, useRef } from 'react';
import { UploadEngine, type UploadOptions } from '../engines/UploadEngine';
import { MediaGateway } from '../gateway/MediaGateway';
import type { UploadResult } from '../types';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error' | 'offline_queued';

export interface UploadState {
  status:         UploadStatus;
  percent:        number;
  uploadedBytes:  number;
  totalBytes:     number;
  result:         UploadResult | null;
  error:          string | null;
}

export interface UseUploadReturn {
  state:   UploadState;
  upload:  (file: File, options?: UploadOptions) => Promise<UploadResult | null>;
  cancel:  () => void;
  reset:   () => void;
}

const INITIAL_STATE: UploadState = {
  status:        'idle',
  percent:       0,
  uploadedBytes: 0,
  totalBytes:    0,
  result:        null,
  error:         null,
};

export function useUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const abortRef          = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResult | null> => {
    const validation = MediaGateway.validateFile(file);
    if (!validation.valid) {
      setState(s => ({ ...s, status: 'error', error: validation.error ?? 'Fichye envalid' }));
      return null;
    }

    // If offline, queue and return
    if (!navigator.onLine) {
      await UploadEngine.uploadOfflineQueued(file, options);
      setState(s => ({ ...s, status: 'offline_queued' }));
      return null;
    }

    abortRef.current = new AbortController();

    setState({
      status:        'uploading',
      percent:       0,
      uploadedBytes: 0,
      totalBytes:    file.size,
      result:        null,
      error:         null,
    });

    try {
      const result = await UploadEngine.uploadFile(file, {
        ...options,
        signal: abortRef.current.signal,
        onProgress: (percent, uploadedBytes, totalBytes) => {
          setState(s => ({ ...s, percent, uploadedBytes, totalBytes }));
        },
      });

      setState(s => ({ ...s, status: 'done', percent: 100, result }));
      return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState(s => ({ ...s, status: 'idle', percent: 0 }));
        return null;
      }
      const error = err instanceof Error ? err.message : 'Upload echwe';
      setState(s => ({ ...s, status: 'error', error }));
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { state, upload, cancel, reset };
}
