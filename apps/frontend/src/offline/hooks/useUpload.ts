import { useCallback, useEffect, useRef, useState } from 'react';
import { FileUploadEngine, type UploadTask, type UploadOptions } from '../upload/FileUploadEngine';

export interface UseUploadReturn {
  tasks:    UploadTask[];
  upload:   (file: File, url: string, opts?: UploadOptions) => Promise<string>;
  pause:    (id: string) => void;
  resume:   (id: string) => void;
  cancel:   (id: string) => void;
  retry:    (id: string, file: File, url: string, opts?: UploadOptions) => Promise<string>;
}

export function useUpload(): UseUploadReturn {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshTasks = useCallback(() => {
    if (mountedRef.current) setTasks(FileUploadEngine.getAllTasks());
  }, []);

  const upload = useCallback(async (file: File, url: string, opts?: UploadOptions): Promise<string> => {
    const id = await FileUploadEngine.add(file, url, opts);
    const off = FileUploadEngine.onTaskUpdate(id, () => refreshTasks());
    refreshTasks();
    return id;
  }, [refreshTasks]);

  const pause  = useCallback((id: string) => { FileUploadEngine.pause(id);  refreshTasks(); }, [refreshTasks]);
  const resume = useCallback((id: string) => { FileUploadEngine.resume(id); refreshTasks(); }, [refreshTasks]);
  const cancel = useCallback((id: string) => { FileUploadEngine.cancel(id); refreshTasks(); }, [refreshTasks]);

  const retry = useCallback(async (id: string, file: File, url: string, opts?: UploadOptions): Promise<string> => {
    FileUploadEngine.cancel(id);
    return upload(file, url, opts);
  }, [upload]);

  return { tasks, upload, pause, resume, cancel, retry };
}