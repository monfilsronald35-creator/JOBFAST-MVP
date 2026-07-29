import React, { memo } from 'react';
import { motion } from 'framer-motion';

const REPORTS = [
  { name: 'Revenue Report', period: 'July 2026', status: 'ready' },
  { name: 'HR Summary', period: 'Q2 2026', status: 'ready' },
  { name: 'Compliance Report', period: 'H1 2026', status: 'generating' },
  { name: 'Customer Churn', period: 'July 2026', status: 'ready' },
];

const ReportsTab = memo(function ReportsTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white">Reports</h2>
        <button type="button" className="rounded-2xl bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-black">
          Generate
        </button>
      </div>
      <ul className="space-y-2">
        {REPORTS.map(({ name, period, status }) => (
          <li key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-white">{name}</p>
              <p className="text-[9px] text-slate-400">{period}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              status === 'ready'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-300 animate-pulse'
            }`}>
              {status === 'ready' ? '↓ Download' : 'Generating…'}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export default ReportsTab;