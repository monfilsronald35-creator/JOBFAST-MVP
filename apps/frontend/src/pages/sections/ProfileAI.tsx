import { memo } from 'react';
import { motion } from 'framer-motion';

interface ProfileData { name?: string; [key: string]: unknown; }
interface SectionProps { profile?: ProfileData; data?: Record<string, unknown>; }

const ProfileAI = memo(function ProfileAI({ profile, data }: SectionProps) {
  const skills = (data?.skills as unknown[]) ?? [];
  const score = (data?.aiScore as number) ?? 0;
  const insights = (data?.insights as string[]) ?? [];

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h3 className="text-base font-black text-white">AI Career Score</h3>
        <span className="ml-auto text-2xl font-black text-amber-300">{score}<span className="text-sm text-slate-400">/100</span></span>
      </div>
      {skills.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Top Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((sk, i) => (
              <span key={i} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] text-amber-300">
                {typeof sk === 'string' ? sk : (sk as Record<string, string>).name}
              </span>
            ))}
          </div>
        </div>
      )}
      {insights.length > 0 && (
        <ul className="space-y-2">
          {insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-200">
              <span className="mt-0.5 text-emerald-400">✓</span><span>{ins}</span>
            </li>
          ))}
        </ul>
      )}
      {!data && <p className="text-[11px] text-slate-400">AI analysis is being generated for {profile?.name}…</p>}
    </motion.section>
  );
});

export default ProfileAI;