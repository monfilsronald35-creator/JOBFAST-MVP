import React, { memo } from 'react';
import { motion } from 'framer-motion';

const MapPanel = memo(function MapPanel({ profile }) {
  const location = profile?.location;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📍</span>
        <h3 className="text-base font-black text-white">Location</h3>
        {location?.label && (
          <span className="ml-2 text-[11px] text-slate-300">{location.label}</span>
        )}
      </div>

      <div
        id={`profile-map-${profile?.id ?? 'map'}`}
        className="h-52 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-2xl mb-1">🗺️</p>
          <p className="text-[10px] text-slate-400">
            {location?.city ? `${location.city}, ${location.country ?? ''}` : 'Location not set'}
          </p>
        </div>
      </div>
    </motion.section>
  );
});

export default MapPanel;