import React from 'react';
import { getSubcategories } from '../../config/professionData';

export default function Step2_SubCategory({ category, onSelect, onBack }) {
  const subcategories = getSubcategories(category.id);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label="Retounen"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{category.icon}</span>
          <h2 className="text-sm font-bold text-white">{category.label}</h2>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider font-bold">
        Chwazi yon sous-kategori
      </p>

      <div className="space-y-2">
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub)}
            className="flex items-center justify-between w-full px-4 py-3.5 bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          >
            <span className="text-sm font-semibold text-white">{sub.label}</span>
            <span className="text-slate-500 text-xs">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
