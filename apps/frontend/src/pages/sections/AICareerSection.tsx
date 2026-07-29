import { memo } from 'react';
import { motion } from 'framer-motion';

interface Suggestion { text?: string; }
interface AIData { aiScore?: number; suggestions?: Array<string | Suggestion>; }
interface SectionProps { profile?: { name?: string; [key: string]: unknown }; data?: AIData; }

const AICareerSection = memo(function AICareerSection({ profile, data }: SectionProps) {
  const score = data?.aiScore ?? 0;
  const suggestions = data?.suggestions ?? [];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-black text-white">🤖 AI Career Insights</h3>
        {score > 0 && <span className="ml-auto text-amber-300 font-bold text-lg">{score}<span className="text-xs text-slate-400">/100</span></span>}
      </div>
      {suggestions.length > 0 ? (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="text-[11px] text-slate-200 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">→</span>
              <span>{typeof s === 'string' ? s : s.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-slate-400">AI insights generating for {profile?.name}…</p>
      )}
    </motion.section>
  );
});

export default AICareerSection;