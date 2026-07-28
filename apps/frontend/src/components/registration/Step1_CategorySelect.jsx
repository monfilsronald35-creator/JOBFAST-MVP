import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Search,
  X,
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
  Hammer,
  Laptop2,
  Truck,
  Building2,
  Cpu,
} from 'lucide-react';
import { REGISTRATION_CATEGORIES } from '../../config/registrationCategories';
import { getSubcategories, getProfessions } from '../../config/professionData';

const BG = '#050B18';

const COLOR_RING = {
  amber: 'hover:border-amber-500/50 focus-visible:ring-amber-400/60',
  blue: 'hover:border-blue-500/50 focus-visible:ring-blue-400/60',
  red: 'hover:border-red-500/50 focus-visible:ring-red-400/60',
  rose: 'hover:border-rose-500/50 focus-visible:ring-rose-400/60',
  slate: 'hover:border-slate-400/50 focus-visible:ring-slate-400/60',
  purple: 'hover:border-purple-500/50 focus-visible:ring-purple-400/60',
  orange: 'hover:border-orange-500/50 focus-visible:ring-orange-400/60',
  teal: 'hover:border-teal-500/50 focus-visible:ring-teal-400/60',
  sky: 'hover:border-sky-500/50 focus-visible:ring-sky-400/60',
  yellow: 'hover:border-yellow-500/50 focus-visible:ring-yellow-400/60',
  indigo: 'hover:border-indigo-500/50 focus-visible:ring-indigo-400/60',
  cyan: 'hover:border-cyan-500/50 focus-visible:ring-cyan-400/60',
  pink: 'hover:border-pink-500/50 focus-visible:ring-pink-400/60',
  green: 'hover:border-green-500/50 focus-visible:ring-green-400/60',
  emerald: 'hover:border-emerald-500/50 focus-visible:ring-emerald-400/60',
  lime: 'hover:border-lime-500/50 focus-visible:ring-lime-400/60',
  gray: 'hover:border-gray-400/50 focus-visible:ring-gray-400/60',
  violet: 'hover:border-violet-500/50 focus-visible:ring-violet-400/60',
};

const CATEGORY_ICONS = {
  construction: Building2,
  technology: Cpu,
  delivery: Truck,
};

const FALLBACK_ICON = Sparkles;

function buildSearchIndex() {
  const index = [];
  REGISTRATION_CATEGORIES.forEach((cat) => {
    if (cat.hasSubcategories) {
      const subs = getSubcategories(cat.id);
      subs.forEach((sub) => {
        const profs = getProfessions(cat.id, sub.id);
        profs.forEach((prof) => {
          index.push({
            prof,
            cat,
            sub,
            rawKey: `${prof.label} ${prof.id} ${cat.label} ${sub.label}`.toLowerCase(),
          });
        });
      });
    } else {
      const profs = getProfessions(cat.id, null);
      profs.forEach((prof) => {
        index.push({
          prof,
          cat,
          sub: null,
          rawKey: `${prof.label} ${prof.id} ${cat.label}`.toLowerCase(),
        });
      });
    }
  });
  return index;
}

let _cachedRawIndex = null;
function getRawIndex() {
  if (!_cachedRawIndex) _cachedRawIndex = buildSearchIndex();
  return _cachedRawIndex;
}

function SearchResultRow({ item, onDirectSelect }) {
  const BadgeIcon = item.cat.icon || FALLBACK_ICON;
  return (
    <motion.button
      type="button"
      onClick={() => onDirectSelect(item.cat, item.sub, item.prof)}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left outline-none backdrop-blur-xl transition"
      style={{ boxShadow: '0 16px 40px rgba(0,0,0,.18)' }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg">
        <BadgeIcon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {item.label}
        </p>
        <p className="truncate text-xs text-white/50">
          {item.catLabel}
          {item.subLabel ? ` › ${item.subLabel}` : ''}
        </p>
      </div>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65">
        <ChevronRight size={16} />
      </span>
    </motion.button>
  );
}

function CategoryCard({ cat, t, onSelect }) {
  const ring = COLOR_RING[cat.color] || COLOR_RING.slate;
  const Icon = cat.icon || FALLBACK_ICON;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(cat)}
      whileHover={{ y: -6, scale: 1.02, rotateX: 2 }}
      whileTap={{ scale: 0.985 }}
      aria-label={`Select ${cat.label}`}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-3.5 text-left outline-none backdrop-blur-xl transition ${ring}`}
      style={{
        boxShadow: '0 16px 40px rgba(0,0,0,.18)',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.08), transparent 35%)',
        }}
      />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white">
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {t(`registration.categories.${cat.id}`, { defaultValue: cat.label })}
        </p>
      </div>

      <span className="text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/70">
        <ChevronRight size={18} />
      </span>
    </motion.button>
  );
}

function RecommendedSection({ t, onDirectSelect, onSelect }) {
  const recommendations = [
    {
      id: 'construction',
      label: 'Construction',
      icon: Building2,
      note: 'Buildings, repairs, and site work.',
    },
    {
      id: 'technology',
      label: 'Technology',
      icon: Cpu,
      note: 'Software, IT, and digital work.',
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: Truck,
      note: 'Transport, courier, and logistics.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mb-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
        <Sparkles size={14} />
        AI Recommendations
      </div>
      <p className="text-sm leading-6 text-white/70">
        Based on your profile, we recommend these starting categories:
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {recommendations.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const cat = REGISTRATION_CATEGORIES.find((c) => c.id === item.id);
                if (cat) onSelect(cat);
              }}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/5"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                <Icon size={18} />
              </div>
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/50">{item.note}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function Step1_CategorySelect({ onSelect, onDirectSelect }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const translatedIndex = useMemo(() => {
    return getRawIndex().map((item) => ({
      ...item,
      label: t(`registration.professions.${item.prof.id}`, { defaultValue: item.prof.label }),
      catLabel: t(`registration.categories.${item.cat.id}`, { defaultValue: item.cat.label }),
      subLabel: item.sub ? t(`registration.subcategories.${item.sub.id}`, { defaultValue: item.sub.label }) : null,
    }));
  }, [t]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return translatedIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.rawKey.includes(q))
      .slice(0, 10);
  }, [query, translatedIndex]);

  const showResults = query.trim().length > 0;

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] px-4 py-6 md:px-6 md:py-8" style={{ background: BG, color: '#fff' }}>
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at top, #1e293b, transparent 42%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/45">
            Step 2 of 6
          </p>
          <h2 className="mt-2 text-[22px] font-black tracking-tight text-white md:text-[26px]">
            Find the right profession faster
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70 md:text-[15px]">
            Search by profession, or browse categories to continue.
          </p>
          <div className="mt-3 text-[11px] font-medium text-white/45">
            33%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: 'easeOut' }}
          className="relative mb-4"
        >
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
            <Search size={16} />
          </span>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('registration.ui.searchProfession')}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/45 transition hover:bg-white/5 hover:text-white/80"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mb-4"
          >
            {results.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/50 backdrop-blur-xl">
                {t('registration.ui.noResults')}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                  {t('registration.ui.searchResults')}
                </div>
                {results.map((item, idx) => (
                  <SearchResultRow
                    key={`${item.cat.id}-${item.sub?.id ?? 'null'}-${item.prof.id}-${idx}`}
                    item={item}
                    onDirectSelect={onDirectSelect}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {!showResults && (
          <>
            <RecommendedSection t={t} onSelect={onSelect} onDirectSelect={onDirectSelect} />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
            >
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                {t('registration.ui.selectCategory')}
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                {REGISTRATION_CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} t={t} onSelect={onSelect} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
