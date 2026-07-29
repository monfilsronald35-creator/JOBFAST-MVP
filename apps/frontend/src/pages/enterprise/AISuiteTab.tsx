import { memo, useState } from 'react';
import { motion } from 'framer-motion';

const AI_TOOLS = [
  { label: 'Smart Job Matching',  icon: '🤝', desc: 'AI matches workers to jobs in real time' },
  { label: 'Fraud Detection',     icon: '🛡️', desc: 'ML-based anomaly detection on transactions' },
  { label: 'Demand Forecasting',  icon: '📈', desc: 'Predict service demand 30 days ahead' },
  { label: 'Resume Parser',       icon: '📄', desc: 'Extracts skills and experience from CVs' },
  { label: 'Price Optimizer',     icon: '💰', desc: 'Dynamic pricing based on supply/demand' },
  { label: 'Chatbot Assistant',   icon: '🤖', desc: 'Multi-lingual AI support agent' },
];

interface TabProps { user?: Record<string, unknown>; }

const AISuiteTab = memo(function AISuiteTab({ user: _user }: TabProps) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">AI Suite</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AI_TOOLS.map(({ label, icon, desc }) => (
          <button key={label} type="button" onClick={() => setActive(active === label ? null : label)}
            className={`text-left rounded-2xl border p-3 transition-all ${active === label ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{icon}</span>
              <span className="text-[11px] font-bold text-white">{label}</span>
            </div>
            <p className="text-[10px] text-slate-400">{desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
});

export default AISuiteTab;