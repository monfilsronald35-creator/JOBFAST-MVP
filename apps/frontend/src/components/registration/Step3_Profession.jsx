import React, { useState } from 'react';
import { getProfessions } from '../../config/professionData';

export default function Step3_Profession({ category, subcategory, onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  const professions = getProfessions(category.id, subcategory?.id ?? null);

  const handleConfirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label="Retounen"
        >
          ←
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base" aria-hidden="true">{category.icon}</span>
            <span className="text-xs font-bold text-slate-400">{category.label}</span>
            {subcategory && (
              <>
                <span className="text-slate-600">›</span>
                <span className="text-xs font-bold text-slate-300">{subcategory.label}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider font-bold mt-4">
        Chwazi Pwofesyon ou
      </p>

      <div className="space-y-1.5 mb-5">
        {professions.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
              selected?.id === p.id
                ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                : 'bg-[#0f172a] border-slate-800 hover:border-slate-600 text-slate-200'
            }`}
          >
            <span className="text-sm font-semibold">{p.label}</span>
            {selected?.id === p.id && (
              <span className="text-indigo-400 text-xs font-bold">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Confirm button */}
      <button
        type="button"
        disabled={!selected}
        onClick={handleConfirm}
        className="w-full py-3.5 rounded-xl bg-indigo-500 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 active:bg-indigo-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {selected ? `Kontinye — ${selected.label}` : 'Chwazi yon pwofesyon'}
      </button>
    </div>
  );
}
