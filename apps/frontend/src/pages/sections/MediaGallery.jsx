import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MediaGallery = memo(function MediaGallery({ profile, data }) {
  const [lightbox, setLightbox] = useState(null);
  const media = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📷</span>
        <h3 className="text-base font-black text-white">Media Gallery</h3>
      </div>

      {media.length === 0 ? (
        <p className="text-[11px] text-slate-400">No media uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, i) => (
            <button
              key={item.id ?? i}
              type="button"
              onClick={() => setLightbox(item.url ?? item.thumbnail)}
              className="relative aspect-square overflow-hidden rounded-2xl bg-slate-800"
            >
              <img
                src={item.thumbnail ?? item.url}
                alt={item.title ?? `Media ${i + 1}`}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <img src={lightbox} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
});

export default MediaGallery;