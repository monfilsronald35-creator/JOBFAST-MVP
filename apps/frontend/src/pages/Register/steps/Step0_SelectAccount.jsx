import React, { memo } from 'react';
import { motion } from 'framer-motion';

const TYPES = [
  { id: 'personal', icon: '👤', label: 'Kont Pèsonèl', desc: 'Pou travayè endividyèl, pwofesyonèl ak konsomatè.' },
  { id: 'business', icon: '🏢', label: 'Kont Biznis', desc: 'Pou antrepriz, restoran, otèl ak lòt òganizasyon.' },
];

const Step0_SelectAccount = memo(function Step0_SelectAccount({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 py-4"
    >
      <p className="text-center text-[13px] text-slate-300 mb-6">
        Ki kalite kont ou vle kreye?
      </p>
      {TYPES.map(({ id, icon, label, desc }) => (
        <motion.button
          key={id}
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect?.(id)}
          className="w-full flex items-center gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left hover:border-amber-400/60 transition-all"
        >
          <span className="text-4xl">{icon}</span>
          <div>
            <p className="font-bold text-white">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
});

export default Step0_SelectAccount;