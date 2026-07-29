import React, { memo } from 'react';
import { motion } from 'framer-motion';

const EnterpriseMapsTab = memo(function EnterpriseMapsTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">Enterprise Maps</h2>
      <div
        id="enterprise-map-container"
        className="h-80 rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="text-[11px] text-slate-400">Mapbox / Google Maps integration</p>
          <p className="text-[10px] text-slate-500 mt-1">Live tracking · Heatmap · Cluster markers</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {['Live Tracking', 'Heatmap', 'Zone Analysis'].map(label => (
          <button key={label} type="button" className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-slate-200 hover:border-amber-400/40">
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
});

export default EnterpriseMapsTab;