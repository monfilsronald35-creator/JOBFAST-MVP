import React, { memo } from 'react';
import { motion } from 'framer-motion';

const CRMModuleTab = memo(function CRMModuleTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">CRM</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Clients', value: '1,842' },
          { label: 'New This Month', value: '143' },
          { label: 'Retention Rate', value: '91%' },
          { label: 'NPS Score', value: '72' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">Lead pipeline · Contact management · Deal tracking · Automation.</p>
    </motion.div>
  );
});

export default CRMModuleTab;