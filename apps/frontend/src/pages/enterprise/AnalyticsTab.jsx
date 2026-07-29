import React, { memo } from 'react';
import { motion } from 'framer-motion';

const MOCK_SERIES = [
  { month: 'Jan', revenue: 42000 }, { month: 'Feb', revenue: 58000 },
  { month: 'Mar', revenue: 51000 }, { month: 'Apr', revenue: 74000 },
  { month: 'May', revenue: 89000 }, { month: 'Jun', revenue: 102000 },
];
const MAX = Math.max(...MOCK_SERIES.map(d => d.revenue));

const AnalyticsTab = memo(function AnalyticsTab({ user }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <h2 className="text-base font-black text-white">Advanced Analytics</h2>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Revenue Trend (HTG)</p>
        <div className="flex items-end gap-2 h-28">
          {MOCK_SERIES.map(({ month, revenue }) => (
            <div key={month} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-all"
                style={{ height: `${(revenue / MAX) * 100}%` }}
              />
              <span className="text-[8px] text-slate-400">{month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Revenue', value: '$2.3M' },
          { label: 'Active Users', value: '12,840' },
          { label: 'Conversion Rate', value: '8.4%' },
          { label: 'Avg Order Value', value: '$184' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[9px] text-slate-400">{label}</p>
            <p className="text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

export default AnalyticsTab;