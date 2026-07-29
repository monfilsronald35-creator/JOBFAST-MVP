import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ServicesPanel = memo(function ServicesPanel({ profile }) {
  const services = profile?.services ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🛠️</span>
        <h3 className="text-base font-black text-white">Services</h3>
      </div>

      {services.length === 0 ? (
        <p className="text-[11px] text-slate-400">No services listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((svc, i) => (
            <div key={svc.id ?? i} className="rounded-2xl border border-white/8 bg-black/20 p-3">
              <p className="text-[11px] font-bold text-white">{svc.title ?? 'Service'}</p>
              {svc.price != null && (
                <p className="text-[10px] text-amber-300 mt-0.5">From ${svc.price}</p>
              )}
              {svc.description && (
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{svc.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
});

export default ServicesPanel;