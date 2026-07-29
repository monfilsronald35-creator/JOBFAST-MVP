import { memo } from 'react';
import { motion } from 'framer-motion';

interface TrustBadge { label?: string; }
interface TrustData { trustScore?: number; badges?: Array<string | TrustBadge>; }
interface SectionProps { profile?: Record<string, unknown>; data?: TrustData; }

const TrustCenterSection = memo(function TrustCenterSection({ profile: _profile, data }: SectionProps) {
  const score = data?.trustScore ?? 0;
  const badges = data?.badges ?? [];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-black text-white">🛡️ Trust Center</h3>
        <span className="ml-auto text-emerald-300 font-bold">{score}%</span>
      </div>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span key={i} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] text-emerald-300">
              ✓ {typeof b === 'string' ? b : b.label}
            </span>
          ))}
        </div>
      )}
    </motion.section>
  );
});

export default TrustCenterSection;