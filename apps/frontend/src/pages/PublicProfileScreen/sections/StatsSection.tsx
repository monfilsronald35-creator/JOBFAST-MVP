import { memo } from 'react';
import { motion } from 'framer-motion';

interface StatsData { jobsDone?: number; reviews?: number; rating?: number; responseRate?: number; }
interface ProfileData { jobsDone?: number; reviewCount?: number; rating?: number; }
interface SectionProps { profile?: ProfileData; data?: StatsData; }

const StatsSection = memo(function StatsSection({ profile, data }: SectionProps) {
  const stats = data ?? {};
  const items = [
    { label: 'Jobs Done', value: stats.jobsDone ?? profile?.jobsDone ?? 0 },
    { label: 'Reviews',   value: stats.reviews  ?? profile?.reviewCount ?? 0 },
    { label: 'Rating',    value: (stats.rating  ?? profile?.rating ?? 0).toFixed(1) },
    { label: 'Response',  value: `${stats.responseRate ?? 98}%` },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3 text-center">
          <p className="text-xl font-black text-white">{value}</p>
          <p className="text-[9px] text-slate-400 uppercase mt-0.5">{label}</p>
        </div>
      ))}
    </motion.section>
  );
});

export default StatsSection;