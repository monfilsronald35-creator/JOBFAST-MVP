import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ENTERPRISE_MODULES = [
  { label: 'Team Management', icon: '👥', count: null },
  { label: 'Finance Overview', icon: '💰', count: null },
  { label: 'CRM', icon: '🤝', count: null },
  { label: 'Analytics', icon: '📊', count: null },
];

const EnterpriseDashboard = memo(function EnterpriseDashboard({ profile }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-amber-400/20 bg-amber-400/5 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏢</span>
        <h3 className="text-base font-black text-white">Enterprise</h3>
        <span className="ml-auto text-[9px] font-bold text-amber-300 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full">
          ENTERPRISE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ENTERPRISE_MODULES.map(({ label, icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-3 flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="text-[11px] text-slate-200">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-slate-400">
        Enterprise features are available for {profile?.name ?? 'this user'}'s organization.
      </p>
    </motion.section>
  );
});

export default EnterpriseDashboard;