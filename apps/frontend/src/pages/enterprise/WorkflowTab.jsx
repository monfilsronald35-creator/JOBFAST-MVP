import React, { memo } from 'react';
import { motion } from 'framer-motion';

const WORKFLOWS = [
  { name: 'New Employee Onboarding', steps: 8, status: 'active' },
  { name: 'Job Post Approval', steps: 4, status: 'active' },
  { name: 'Payment Release', steps: 6, status: 'active' },
  { name: 'Dispute Resolution', steps: 5, status: 'paused' },
];

const WorkflowTab = memo(function WorkflowTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white">Workflows</h2>
        <button type="button" className="rounded-2xl bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-black">
          + New
        </button>
      </div>
      <ul className="space-y-2">
        {WORKFLOWS.map(({ name, steps, status }) => (
          <li key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-white">{name}</p>
              <p className="text-[9px] text-slate-400">{steps} steps</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              status === 'active'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
            }`}>
              {status}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export default WorkflowTab;