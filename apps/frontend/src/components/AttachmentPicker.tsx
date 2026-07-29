import React, { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPES = [
  { id: 'image', label: 'Photo', icon: '📷', accept: 'image/*' },
  { id: 'video', label: 'Video', icon: '🎬', accept: 'video/*' },
  { id: 'file',  label: 'File',  icon: '📎', accept: '*/*'    },
  { id: 'audio', label: 'Audio', icon: '🎵', accept: 'audio/*'},
] as const;

interface AttachmentPickerProps {
  open:      boolean;
  onClose?:  () => void;
  onSelect?: (files: File[]) => void;
}

const AttachmentPicker = memo(function AttachmentPicker({ open, onClose, onSelect }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (accept: string) => {
    if (!inputRef.current) return;
    inputRef.current.accept = accept;
    inputRef.current.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onSelect?.(files);
      onClose?.();
    }
    e.target.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" multiple onChange={handleChange} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute bottom-16 left-0 right-0 mx-4 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-4 shadow-2xl z-30"
          >
            <div className="grid grid-cols-4 gap-3">
              {TYPES.map(({ id, label, icon, accept }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePick(accept)}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/30 py-3 text-[10px] text-slate-200 hover:border-amber-400/40"
                >
                  <span className="text-2xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="w-full mt-3 text-[11px] text-slate-400">
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default AttachmentPicker;