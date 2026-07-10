import React from 'react';
import { REGISTRATION_CATEGORIES } from '../../config/registrationCategories';

const COLOR_RING = {
  amber:   'hover:border-amber-500/50 focus-visible:ring-amber-400/60',
  blue:    'hover:border-blue-500/50 focus-visible:ring-blue-400/60',
  red:     'hover:border-red-500/50 focus-visible:ring-red-400/60',
  rose:    'hover:border-rose-500/50 focus-visible:ring-rose-400/60',
  slate:   'hover:border-slate-400/50 focus-visible:ring-slate-400/60',
  purple:  'hover:border-purple-500/50 focus-visible:ring-purple-400/60',
  orange:  'hover:border-orange-500/50 focus-visible:ring-orange-400/60',
  teal:    'hover:border-teal-500/50 focus-visible:ring-teal-400/60',
  sky:     'hover:border-sky-500/50 focus-visible:ring-sky-400/60',
  yellow:  'hover:border-yellow-500/50 focus-visible:ring-yellow-400/60',
  indigo:  'hover:border-indigo-500/50 focus-visible:ring-indigo-400/60',
  cyan:    'hover:border-cyan-500/50 focus-visible:ring-cyan-400/60',
  pink:    'hover:border-pink-500/50 focus-visible:ring-pink-400/60',
  green:   'hover:border-green-500/50 focus-visible:ring-green-400/60',
  emerald: 'hover:border-emerald-500/50 focus-visible:ring-emerald-400/60',
  lime:    'hover:border-lime-500/50 focus-visible:ring-lime-400/60',
  gray:    'hover:border-gray-400/50 focus-visible:ring-gray-400/60',
  violet:  'hover:border-violet-500/50 focus-visible:ring-violet-400/60',
};

export default function Step1_CategorySelect({ onSelect }) {
  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
        Chwazi Kategori ou
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        {REGISTRATION_CATEGORIES.map((cat) => {
          const ring = COLOR_RING[cat.color] || COLOR_RING.slate;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat)}
              className={`flex items-center gap-3 p-3.5 bg-[#0f172a] rounded-2xl border border-slate-800 ${ring} transition text-left w-full focus-visible:outline-none focus-visible:ring-2`}
            >
              <span className="text-2xl shrink-0" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="text-sm font-semibold text-white leading-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
