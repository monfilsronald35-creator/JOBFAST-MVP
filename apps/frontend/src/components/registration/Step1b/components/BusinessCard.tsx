import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import type { GlobalCategory } from '../types/business';

interface Props {
  category: GlobalCategory;
  selected: boolean;
  onToggle: (cat: GlobalCategory) => void;
  score?: number | undefined;
  compact?: boolean | undefined;
}

export function BusinessCard({ category, selected, onToggle, score, compact = false }: Props) {
  const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    sky:    { border: 'border-sky-500/40',    bg: 'bg-sky-500/10',    text: 'text-sky-400',    glow: 'shadow-sky-500/20' },
    orange: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
    purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   glow: 'shadow-blue-500/20' },
    teal:   { border: 'border-teal-500/40',   bg: 'bg-teal-500/10',   text: 'text-teal-400',   glow: 'shadow-teal-500/20' },
    pink:   { border: 'border-pink-500/40',   bg: 'bg-pink-500/10',   text: 'text-pink-400',   glow: 'shadow-pink-500/20' },
    green:  { border: 'border-green-500/40',  bg: 'bg-green-500/10',  text: 'text-green-400',  glow: 'shadow-green-500/20' },
    red:    { border: 'border-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-400',    glow: 'shadow-red-500/20' },
    yellow: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
    violet: { border: 'border-violet-500/40', bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
    cyan:   { border: 'border-cyan-500/40',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   glow: 'shadow-cyan-500/20' },
    indigo: { border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
    emerald:{ border: 'border-emerald-500/40',bg: 'bg-emerald-500/10',text: 'text-emerald-400',glow: 'shadow-emerald-500/20' },
    amber:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  glow: 'shadow-amber-500/20' },
    rose:   { border: 'border-rose-500/40',   bg: 'bg-rose-500/10',   text: 'text-rose-400',   glow: 'shadow-rose-500/20' },
    lime:   { border: 'border-lime-500/40',   bg: 'bg-lime-500/10',   text: 'text-lime-400',   glow: 'shadow-lime-500/20' },
    gray:   { border: 'border-gray-500/40',   bg: 'bg-gray-500/10',   text: 'text-gray-400',   glow: 'shadow-gray-500/20' },
    slate:  { border: 'border-slate-500/40',  bg: 'bg-slate-500/10',  text: 'text-slate-400',  glow: 'shadow-slate-500/20' },
    stone:  { border: 'border-stone-500/40',  bg: 'bg-stone-500/10',  text: 'text-stone-400',  glow: 'shadow-stone-500/20' },
  };

  const theme = colorMap[category.color] ?? colorMap['slate']!;

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onToggle(category)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
          selected
            ? `${theme.border} ${theme.bg} shadow-lg ${theme.glow}`
            : 'border-white/10 bg-white/5 hover:border-white/20'
        }`}
      >
        <span className="text-base">{category.emoji}</span>
        <span className={`text-xs font-semibold ${selected ? theme.text : 'text-slate-300'}`}>
          {category.names['en']}
        </span>
        {selected && <Check size={12} className={`ml-auto shrink-0 ${theme.text}`} />}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(category)}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        selected
          ? `${theme.border} ${theme.bg} shadow-lg ${theme.glow}`
          : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          selected ? `${theme.border} ${theme.bg}` : 'border-white/10 bg-white/5'
        }`}>
          <span className="text-xl">{category.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-200'}`}>
              {category.names['en']}
            </span>
            {score !== undefined && score > 50 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${theme.bg} ${theme.text} border ${theme.border}`}>
                {Math.round(score)}% match
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{category.industry}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {category.services.slice(0, 3).map(s => (
              <span key={s} className="rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
            {category.services.length > 3 && (
              <span className="rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
                +{category.services.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
          selected ? `${theme.border} ${theme.bg}` : 'border-white/20 bg-transparent'
        }`}>
          {selected
            ? <Check size={13} className={theme.text} />
            : <ChevronRight size={13} className="text-slate-500" />}
        </div>
      </div>
    </motion.button>
  );
}
