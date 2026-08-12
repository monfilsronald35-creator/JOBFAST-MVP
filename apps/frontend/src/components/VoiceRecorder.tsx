import React, { memo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type RecordingState = 'idle' | 'recording' | 'done';

interface VoiceRecorderProps {
  open:       boolean;
  onClose?:   () => void;
  onRecord?:  (file: File) => void;
}

const VoiceRecorder = memo(function VoiceRecorder({ open, onClose, onRecord }: VoiceRecorderProps) {
  const [state,    setState]    = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      stop();
      setState('idle');
      setDuration(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e: BlobEvent) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        onRecord?.(file);
        stream.getTracks().forEach(t => t.stop());
        onClose?.();
      };

      mr.start(200);
      mediaRecorderRef.current = mr;
      setState('recording');
      intervalRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      onClose?.();
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="absolute bottom-16 left-0 right-0 mx-4 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-5 shadow-2xl z-30 flex flex-col items-center gap-4"
        >
          {state === 'recording' && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-white">{fmt(duration)}</span>
            </div>
          )}

          {state === 'idle' ? (
            <button type="button" onClick={start}
              className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg hover:bg-red-400">
              🎙️
            </button>
          ) : (
            <button type="button" onClick={stop}
              className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl border-2 border-red-500 hover:bg-slate-600">
              ⏹️
            </button>
          )}

          <button type="button" onClick={onClose} className="text-[11px] text-slate-400">{t('common.cancel', 'Anile')}</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default VoiceRecorder;