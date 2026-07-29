import { memo } from 'react';
import { motion } from 'framer-motion';

interface TabProps { user?: Record<string, unknown>; }

const HRModuleTab = memo(function HRModuleTab({ user: _user }: TabProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">HR Module</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Employees', value: '284' },
          { label: 'Active Today',    value: '241' },
          { label: 'Open Positions',  value: '18' },
          { label: 'Avg Tenure',      value: '2.4 yrs' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">Payroll · Attendance · Performance · Contracts · Leave management.</p>
    </motion.div>
  );
});

export default HRModuleTab;