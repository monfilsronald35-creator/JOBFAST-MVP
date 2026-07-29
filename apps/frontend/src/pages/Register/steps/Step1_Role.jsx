import React, { memo } from 'react';
import { motion } from 'framer-motion';

const PERSONAL_ROLES = [
  { id: 'worker', icon: '👷', label: 'Travayè', desc: 'Ofri sèvis pwofesyonèl' },
  { id: 'client', icon: '👥', label: 'Kliyan', desc: 'Chèche sèvis ak travay' },
  { id: 'tourist', icon: '✈️', label: 'Touris', desc: 'Vizitè chèche sèvis touristik' },
];

const BUSINESS_ROLES = [
  { id: 'company', icon: '🏢', label: 'Konpayi', desc: 'Antrepriz ki ofri sèvis' },
  { id: 'enterprise', icon: '🌐', label: 'Antrepriz', desc: 'Gwo antrepriz ak plizyè sèvis' },
];

const Step1_Role = memo(function Step1_Role({ accountType, onSelect }) {
  const roles = accountType === 'business' ? BUSINESS_ROLES : PERSONAL_ROLES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 py-4"
    >
      <p className="text-center text-[13px] text-slate-300 mb-6">
        Ki wòl ou pral jwe sou JOBFAST?
      </p>
      {roles.map(({ id, icon, label, desc }) => (
        <motion.button
          key={id}
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect?.(id)}
          className="w-full flex items-center gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left hover:border-amber-400/60 transition-all"
        >
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="font-bold text-white">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
});

export default Step1_Role;