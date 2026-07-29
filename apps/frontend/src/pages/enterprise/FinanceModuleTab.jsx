import React, { memo } from 'react';
import { motion } from 'framer-motion';

const FinanceModuleTab = memo(function FinanceModuleTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">Finance Module</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Balance', value: '$48,200', color: 'text-emerald-300' },
          { label: 'Pending', value: '$3,140', color: 'text-amber-300' },
          { label: 'Revenue MTD', value: '$102,000', color: 'text-white' },
          { label: 'Expenses MTD', value: '$31,500', color: 'text-red-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className={`text-lg font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">Stripe · Escrow · Invoicing · Reconciliation — enterprise financial ops.</p>
    </motion.div>
  );
});

export default FinanceModuleTab;