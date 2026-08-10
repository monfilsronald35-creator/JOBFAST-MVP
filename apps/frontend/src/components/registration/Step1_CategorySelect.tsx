import React, {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from 'react';



import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

import {

  ChevronRight,

  Search,

  X,

  Sparkles,

  Cpu,

  Truck,

  Building2,

  Loader2,

  CheckCircle2,

} from 'lucide-react';



import type { LucideIcon } from 'lucide-react';



import { supabase } from '../../lib/supabase';

import { REGISTRATION_CATEGORIES } from '../../config/registrationCategories';

import {

  getSubcategories,

  getProfessions,

} from '../../config/professionData';



const BG = '#050B18';



const COMPONENT_STEP = 3;

const TOTAL_STEPS = 6;



const FALLBACK_CATEGORY = 'slate';



const COLOR_RING: Record<string, string> = {

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



interface CategoryLike {

  id: string;

  label: string;

  color?: string;

  icon?: LucideIcon;

  hasSubcategories?: boolean;

}



interface SubLike {

  id: string;

  label: string;

}



interface ProfLike {

  id: string;

  label: string;

}



export interface CategorySelection {

  categoryId: string;

  subcategoryId: string | null;

  professionId: string;

}



interface SearchEntry {

  prof: ProfLike;

  cat: CategoryLike;

  sub: SubLike | null;

  rawKey: string;

  label: string;

  catLabel: string;

  subLabel: string | null;

}



function buildSearchIndex(): SearchEntry[] {

  const index: SearchEntry[] = [];



  (REGISTRATION_CATEGORIES as CategoryLike[]).forEach((cat) => {

    if (cat.hasSubcategories) {

      const subs = getSubcategories(cat.id) as SubLike[];



      subs.forEach((sub) => {

        const professions =

          getProfessions(cat.id, sub.id) as ProfLike[];



        professions.forEach((prof) => {

          index.push({

            prof,

            cat,

            sub,

            rawKey: [

              prof.id,

              prof.label,

              cat.id,

              cat.label,

              sub.id,

              sub.label,

            ]

              .join(' ')

              .toLocaleLowerCase(undefined),

            label: prof.label,

            catLabel: cat.label,

            subLabel: sub.label,

          });

        });

      });

    } else {

      const professions =

        getProfessions(cat.id, null) as ProfLike[];



      professions.forEach((prof) => {

        index.push({

          prof,

          cat,

          sub: null,

          rawKey: [

            prof.id,

            prof.label,

            cat.id,

            cat.label,

          ]

            .join(' ')

            .toLocaleLowerCase(undefined),

            label: prof.label,

            catLabel: cat.label,

            subLabel: null,

        });

      });

    }

  });



  return index;

}



function getProgressPercentage(

  currentStep: number,

  totalSteps: number,

) {

  if (totalSteps <= 0) return 0;



  return Math.min(

    100,

    Math.max(

      0,

      Math.round((currentStep / totalSteps) * 100),

    ),

  );

}



interface ProgressDotsProps {

  currentStep: number;

  totalSteps: number;

}



function ProgressDots({

  currentStep,

  totalSteps,

}: ProgressDotsProps) {

  const percentage = getProgressPercentage(

    currentStep,

    totalSteps,

  );



  return (

    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-2xl">

      <div className="flex items-center justify-between">

        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/55">

          Step {currentStep} of {totalSteps}

        </p>



        <span className="text-[11px] text-white/45">

          {percentage}%

        </span>

      </div>



      <div className="mt-3 flex items-center gap-2">

        {Array.from({ length: totalSteps }).map(

          (_, index) => {

            const step = index + 1;

            const completed = step <= currentStep;



            return (

              <React.Fragment key={step}>

                <span

                  className={[

                    'h-2.5 w-2.5 shrink-0 rounded-full transition-all',

                    completed

                      ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,.6)]'

                      : 'bg-white/20',

                  ].join(' ')}

                />



                {step < totalSteps && (

                  <div

                    className={[

                      'h-[2px] flex-1 rounded-full transition-all',

                      step < currentStep

                        ? 'bg-white/40'

                        : 'bg-white/10',

                    ].join(' ')}

                  />

                )}

              </React.Fragment>

            );

          },

        )}

      </div>

    </div>

  );

}



interface SearchResultRowProps {

  item: SearchEntry;

  isSelected: boolean;

  onSelect: (selection: CategorySelection) => void;

}



function SearchResultRow({

  item,

  isSelected,

  onSelect,

}: SearchResultRowProps) {

  const BadgeIcon = item.cat.icon ?? Sparkles;



  const selection: CategorySelection = {

    categoryId: item.cat.id,

    subcategoryId: item.sub?.id ?? null,

    professionId: item.prof.id,

  };



  return (

    <motion.button

      type="button"

      onClick={() => onSelect(selection)}

      whileHover={{

        y: -4,

        scale: 1.01,

      }}

      whileTap={{

        scale: 0.99,

      }}

      className={[

        'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left outline-none backdrop-blur-xl transition focus-visible:ring-2',

        isSelected

          ? 'border-emerald-500/50 bg-emerald-500/10 focus-visible:ring-emerald-400/60'

          : 'border-white/10 bg-white/5 focus-visible:ring-white/20',

      ].join(' ')}

      style={{

        boxShadow: '0 16px 40px rgba(0,0,0,.18)',

      }}

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



      {isSelected && (

        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-emerald-400">

          <CheckCircle2 size={18} />

        </span>

      )}



      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65">

        <ChevronRight size={16} />

      </span>

    </motion.button>

  );

}



interface CategoryCardProps {

  cat: CategoryLike;

  label: string;

  isSelected: boolean;

  onSelect: () => void;

}



function CategoryCard({

  cat,

  label,

  isSelected,

  onSelect,

}: CategoryCardProps) {

  const ring =

    COLOR_RING[cat.color ?? FALLBACK_CATEGORY] ??

    COLOR_RING[FALLBACK_CATEGORY];



  const Icon = cat.icon ?? Sparkles;



  return (

    <motion.button

      type="button"

      onClick={onSelect}

      whileHover={{

        y: -6,

        scale: 1.02,

        rotateX: 2,

      }}

      whileTap={{

        scale: 0.985,

      }}

      aria-label={label}

      className={[

        'group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left outline-none backdrop-blur-xl transition focus-visible:ring-2',

        isSelected

          ? 'border-emerald-500/60 bg-emerald-500/15 ring-2 ring-emerald-500/40'

          : `border-white/10 bg-white/5 ${ring}`,

      ].join(' ')}

      style={{

        boxShadow: '0 16px 40px rgba(0,0,0,.18)',

        transformStyle: 'preserve-3d',

      }}

    >

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.08),transparent_35%)]" />

      </div>



      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white">

        <Icon size={22} />

      </div>



      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold text-white">

          {label}

        </p>

      </div>



      {isSelected && (

        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-emerald-400">

          <CheckCircle2 size={16} />

        </span>

      )}



      <ChevronRight
        size={18}
        className="text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/70"
      />
    </motion.button>
  );
}

interface PopularCategoryRowProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  selectedCategoryId: string | null;
  onSelect: (selection: CategorySelection) => void;
}

function PopularCategoryRow({
  t,
  selectedCategoryId,
  onSelect,
}: PopularCategoryRowProps) {
  const popularItems = [
    {
      id: 'construction',
      labelKey: 'registration.categories.construction',
      noteKey: 'registration.recommendations.construction',
      icon: Building2,
    },
    {
      id: 'technology',
      labelKey: 'registration.categories.technology',
      noteKey: 'registration.recommendations.technology',
      icon: Cpu,
    },
    {
      id: 'delivery',
      labelKey: 'registration.categories.delivery',
      noteKey: 'registration.recommendations.delivery',
      icon: Truck,
    },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        ease: 'easeOut',
      }}
      className="mb-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
        <Sparkles size={14} />
        {t('registration.popular.title', {
          defaultValue: 'Popular Categories',
        })}
      </div>

      <p className="text-sm leading-6 text-white/70">
        {t('registration.popular.description', {
          defaultValue: 'Quickly pick from frequently selected categories below.',
        })}
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {popularItems.map((item) => {
          const Icon = item.icon;
          const category = (
            REGISTRATION_CATEGORIES as CategoryLike[]
          ).find((cat) => cat.id === item.id);

          if (!category) return null;

          const isSelected = selectedCategoryId === category.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onSelect({
                  categoryId: category.id,
                  subcategoryId: null,
                  professionId: '',
                })
              }
              className={[
                'rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-500/15'
                  : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5',
              ].join(' ')}
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                <Icon size={18} />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {t(item.labelKey, {
                    defaultValue: category.label,
                  })}
                </p>
                {isSelected && (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-white/50">
                {t(item.noteKey, {
                  defaultValue: '',
                })}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

interface Step3CategorySelectProps {
  onSelect: (selection: CategorySelection) => void;
  currentStep?: number;
  totalSteps?: number;
}

export default function Step3_CategorySelect({
  onSelect,
  currentStep = COMPONENT_STEP,
  totalSteps = TOTAL_STEPS,
}: Step3CategorySelectProps) {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CategorySelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawIndex = useMemo(() => buildSearchIndex(), []);

  const translatedIndex = useMemo<SearchEntry[]>(() => {
    return rawIndex.map((item) => ({
      ...item,
      label: t(`registration.professions.${item.prof.id}`, {
        defaultValue: item.prof.label,
      }),
      catLabel: t(`registration.categories.${item.cat.id}`, {
        defaultValue: item.cat.label,
      }),
      subLabel: item.sub
        ? t(`registration.subcategories.${item.sub.id}`, {
            defaultValue: item.sub.label,
          })
        : null,
    }));
  }, [t, rawIndex]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(undefined);

    if (!normalizedQuery) {
      return [];
    }

    return translatedIndex
      .filter((item) => {
        const translatedText = [
          item.label,
          item.catLabel,
          item.subLabel ?? '',
        ]
          .join(' ')
          .toLocaleLowerCase(undefined);

        return (
          translatedText.includes(normalizedQuery) ||
          item.rawKey.includes(normalizedQuery)
        );
      })
      .slice(0, 10);
  }, [query, translatedIndex]);

  const loadExistingSelection = useCallback(async () => {
    setInitializing(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          t('registration.errors.sessionRequired', {
            defaultValue: 'Please sign in before continuing.',
          }),
        );
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('category_id, subcategory_id, profession_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (data?.category_id) {
        setSelected({
          categoryId: data.category_id,
          subcategoryId: data.subcategory_id ?? null,
          professionId: data.profession_id ?? '',
        });
      }
    } catch (err) {
      console.error('[JOBFAST][CategorySelect][Load]', err);
      setError(
        err instanceof Error
          ? err.message
          : t('registration.errors.loadFailed', {
              defaultValue: 'Unable to load your profile.',
            }),
      );
    } finally {
      setInitializing(false);
    }
  }, [t]);

  useEffect(() => {
    let isCancelled = false;

    async function init() {
      await loadExistingSelection();
    }

    init();

    return () => {
      isCancelled = true;
      void isCancelled;
    };
  }, [loadExistingSelection]);

  const saveSelection = useCallback(
    async (selection: CategorySelection) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            t('registration.errors.sessionRequired', {
              defaultValue: 'Your session has expired. Please sign in again.',
            }),
          );
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            category_id: selection.categoryId,
            subcategory_id: selection.subcategoryId,
            profession_id: selection.professionId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setSelected(selection);
        onSelect(selection);
      } catch (err) {
        console.error('[JOBFAST][CategorySelect][Save]', err);
        setError(
          err instanceof Error
            ? err.message
            : t('registration.errors.saveFailed', {
                defaultValue: 'Unable to save your selection.',
              }),
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, onSelect, t],
  );

  const handleCategoryClick = useCallback(
    (category: CategoryLike) => {
      saveSelection({
        categoryId: category.id,
        subcategoryId: null,
        professionId: '',
      });
    },
    [saveSelection],
  );

  if (initializing) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center"
        style={{
          background: BG,
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Loader2 size={20} className="animate-spin" />
          {t('registration.ui.loading', {
            defaultValue: 'Loading your profile…',
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] px-4 py-6 md:px-6 md:py-8"
      style={{
        background: BG,
        color: '#fff',
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle at top, #1e293b, transparent 42%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-3xl space-y-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
        >
          <ProgressDots currentStep={currentStep} totalSteps={totalSteps} />

          <h2 className="mt-5 text-[22px] font-black tracking-tight text-white md:text-[26px]">
            {t('registration.profession.title', {
              defaultValue: 'Find the right profession faster',
            })}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/70 md:text-[15px]">
            {t('registration.profession.description', {
              defaultValue:
                'Search by profession, or browse categories to continue.',
            })}
          </p>
        </motion.div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('registration.ui.searchProfession', {
              defaultValue: 'Search profession…',
            })}
            aria-label={t('registration.ui.searchProfession', {
              defaultValue: 'Search profession',
            })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('registration.ui.clearSearch', {
                defaultValue: 'Clear search',
              })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/45 transition hover:bg-white/5 hover:text-white/80"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {query.trim() ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            {results.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/50">
                {t('registration.ui.noResults', {
                  defaultValue: 'No professions found.',
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                  {t('registration.ui.searchResults', {
                    defaultValue: 'Search results',
                  })}
                </div>

                {results.map((item) => {
                  const isSelected =
                    selected?.categoryId === item.cat.id &&
                    selected?.professionId === item.prof.id;

                  return (
                    <SearchResultRow
                      key={[
                        item.cat.id,
                        item.sub?.id ?? 'none',
                        item.prof.id,
                      ].join(':')}
                      item={item}
                      isSelected={isSelected}
                      onSelect={saveSelection}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            <PopularCategoryRow
              t={t}
              selectedCategoryId={selected?.categoryId ?? null}
              onSelect={saveSelection}
            />

            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
                {t('registration.ui.selectCategory', {
                  defaultValue: 'Select category',
                })}
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                {(REGISTRATION_CATEGORIES as CategoryLike[]).map((cat) => {
                  const label = t(`registration.categories.${cat.id}`, {
                    defaultValue: cat.label,
                  });

                  const isSelected = selected?.categoryId === cat.id;

                  return (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      label={label}
                      isSelected={isSelected}
                      onSelect={() => handleCategoryClick(cat)}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-white/45">
            <Loader2 size={15} className="animate-spin" />
            {t('registration.ui.saving', {
              defaultValue: 'Saving…',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
