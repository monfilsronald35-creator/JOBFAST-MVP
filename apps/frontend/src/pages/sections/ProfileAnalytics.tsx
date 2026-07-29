import { memo } from 'react';
import { motion } from 'framer-motion';

const METRICS = [
  { key: 'profileViews',  label: 'Profile Views',  icon: '👁️', prefix: '',  suffix: '' },
  { key: 'jobsCompleted', label: 'Jobs Completed', icon: '✅', prefix: '',  suffix: '' },
  { key: 'earnings',      label: 'Total Earnings', icon: '💰', prefix: '$', suffix: '' },
  { key: 'responseRate',  label: 'Response Rate',  icon: '⚡', prefix: '',  suffix: '%' },
];

interface SectionProps { profile?: Record<string, unknown>; data?: Record<string, unknown>; }

const ProfileAnalytics = memo(function ProfileAnalytics({ profile: _profile, data }: SectionProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h3 className="text-base font-black text-white">Performance Analytics</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map(({ key, label, icon, prefix, suffix }) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[9px] text-slate-400 uppercase mb-1">{icon} {label}</p>
            <p className="text-xl font-black text-white">
              {prefix}{data?.[key] != null ? Number(data[key]).toLocaleString() : '—'}{suffix}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
});

export default ProfileAnalytics;