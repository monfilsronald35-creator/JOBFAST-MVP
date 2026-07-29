import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ProfilePortfolio = memo(function ProfilePortfolio({ profile, data }) {
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🖼️</span>
        <h3 className="text-base font-black text-white">Portfolio</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-slate-400">No portfolio items yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="relative overflow-hidden rounded-2xl aspect-square bg-slate-800">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.title ?? 'Portfolio item'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2">
                <p className="text-[10px] font-bold text-white truncate">{item.title ?? ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
});

export default ProfilePortfolio;