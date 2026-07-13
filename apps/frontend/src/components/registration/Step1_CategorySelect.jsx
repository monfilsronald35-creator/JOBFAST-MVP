import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { REGISTRATION_CATEGORIES } from '../../config/registrationCategories';
import { getSubcategories, getProfessions } from '../../config/professionData';

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

// Build a static flat list of all profession entries (computed once at module level)
function buildSearchIndex() {
  const index = [];
  REGISTRATION_CATEGORIES.forEach((cat) => {
    if (cat.hasSubcategories) {
      const subs = getSubcategories(cat.id);
      subs.forEach((sub) => {
        const profs = getProfessions(cat.id, sub.id);
        profs.forEach((prof) => {
          index.push({ prof, cat, sub, rawKey: `${prof.label} ${prof.id}`.toLowerCase() });
        });
      });
    } else {
      const profs = getProfessions(cat.id, null);
      profs.forEach((prof) => {
        index.push({ prof, cat, sub: null, rawKey: `${prof.label} ${prof.id}`.toLowerCase() });
      });
    }
  });
  return index;
}

// Lazily built the first time the user types — not at module load.
// This defers iterating all 100+ profession entries until actually needed.
let _cachedRawIndex = null;
function getRawIndex() {
  if (!_cachedRawIndex) _cachedRawIndex = buildSearchIndex();
  return _cachedRawIndex;
}

export default function Step1_CategorySelect({ onSelect, onDirectSelect }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // Translated search index — only built when user has typed something.
  // Cached between renders; rebuilds only when language (t) changes.
  const searchIndex = useMemo(() => {
    if (!query.trim()) return [];           // don't build until needed
    return getRawIndex().map((item) => ({
      ...item,
      label:    t(`registration.professions.${item.prof.id}`, { defaultValue: item.prof.label }),
      catLabel: t(`registration.categories.${item.cat.id}`,   { defaultValue: item.cat.label  }),
      subLabel: item.sub
        ? t(`registration.subcategories.${item.sub.id}`, { defaultValue: item.sub.label })
        : null,
    }));
  }, [query, t]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.rawKey.includes(q))
      .slice(0, 10);
  }, [query, searchIndex]); // searchIndex already depends on query — this is intentional

  const showResults = query.trim().length > 0;

  return (
    <div className="w-full">
      {/* ── Global search ─────────────────────────────────────── */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('registration.ui.searchProfession')}
          className="w-full pl-9 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Search results ───────────────────────────────────── */}
      {showResults && (
        <div className="mb-4">
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              {t('registration.ui.noResults')}
            </p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                {t('registration.ui.searchResults')}
              </p>
              {results.map((item, idx) => (
                <button
                  key={`${item.cat.id}-${item.sub?.id ?? 'null'}-${item.prof.id}-${idx}`}
                  type="button"
                  onClick={() => onDirectSelect(item.cat, item.sub, item.prof)}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-[#0f172a] rounded-xl border border-slate-800 hover:border-indigo-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 text-left"
                >
                  <span className="text-lg shrink-0">{item.cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.catLabel}
                      {item.subLabel && ` › ${item.subLabel}`}
                    </p>
                  </div>
                  <span className="text-indigo-400 text-xs shrink-0">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Category grid (hidden while searching) ───────────── */}
      {!showResults && (
        <>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            {t('registration.ui.selectCategory')}
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
                    {t(`registration.categories.${cat.id}`, { defaultValue: cat.label })}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
