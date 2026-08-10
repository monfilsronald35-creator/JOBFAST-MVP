import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic, FileText, Sparkles, ChevronRight, ArrowLeft, Globe2, Loader2 } from 'lucide-react';
import type { GlobalCategory, AIClassificationResult, BusinessDNA, Step1bOutput } from '../types/business';
import { GLOBAL_TAXONOMY, INDUSTRIES, TOP_CATEGORIES } from '../constants/taxonomy';
import { classifyBusiness } from '../engines/classificationEngine';
import { searchCategories } from '../engines/searchEngine';
import { buildBusinessDNA, defaultVerificationState, defaultReputation, defaultPresence, defaultCapabilities } from '../engines/businessDNAEngine';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { BusinessCard } from './BusinessCard';
import { BusinessDNAPanel } from './BusinessDNAPanel';

type Phase = 'input' | 'analyzing' | 'ai_result' | 'browse' | 'confirm';

interface Props {
  onComplete: (output: Step1bOutput) => void;
  onBack?: () => void;
  initialData?: Partial<Step1bOutput>;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function BusinessCommandCenter({ onComplete, onBack, initialData }: Props) {
  const [phase, setPhase] = useState<Phase>('input');
  const [rawInput, setRawInput] = useState(initialData?.rawInput ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<GlobalCategory[]>(initialData?.selectedCategories ?? []);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ category: GlobalCategory; score: number }>>([]);
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [dna, setDna] = useState<Partial<BusinessDNA>>(initialData?.businessDNA ?? {});
  const [isSearching, setIsSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 280);

  // ─── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
  }, [rawInput]);

  // ─── Live search as user types in browse phase ─────────────────────────────
  useEffect(() => {
    if (phase !== 'browse') return;
    setIsSearching(true);
    searchCategories(debouncedSearch).then(res => {
      setSearchResults(res.categories.map(c => ({ category: c.category, score: c.score })));
      setIsSearching(false);
    }).catch(() => setIsSearching(false));
  }, [debouncedSearch, phase]);

  // ─── Toggle selection ──────────────────────────────────────────────────────
  const toggleCategory = useCallback((cat: GlobalCategory) => {
    setSelected(prev =>
      prev.some(c => c.id === cat.id)
        ? prev.filter(c => c.id !== cat.id)
        : [...prev, cat]
    );
  }, []);

  // ─── AI analysis ──────────────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!rawInput.trim()) return;
    setPhase('analyzing');
    setAnalyzing(true);
    try {
      const result = await classifyBusiness(rawInput);
      setAiResult(result);
      // Pre-select top matches
      const topCatIds = [result.primaryBusiness, ...result.secondaryBusinesses.slice(0, 3).map(s => s.type)];
      const preSel = topCatIds.map(id => GLOBAL_TAXONOMY.find(c => c.id === id)).filter(Boolean) as GlobalCategory[];
      setSelected(preSel);
      // Build DNA
      const d = buildBusinessDNA(result, preSel, rawInput);
      setDna(d);
      setPhase('ai_result');
    } catch {
      setPhase('browse');
    } finally {
      setAnalyzing(false);
    }
  }, [rawInput]);

  // ─── Confirm AI result → move to browse/confirm ───────────────────────────
  const confirmAI = useCallback(() => {
    if (selected.length > 0) {
      const d = aiResult ? buildBusinessDNA(aiResult, selected, rawInput) : dna;
      setDna(d);
      setPhase('confirm');
    } else {
      setPhase('browse');
    }
  }, [selected, aiResult, rawInput, dna]);

  // ─── Final submit ──────────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    onComplete({
      businessDNA: dna,
      selectedCategories: selected,
      ...(aiResult !== null ? { aiClassification: aiResult } : {}),
      rawInput,
    });
  }, [dna, selected, aiResult, rawInput, onComplete]);

  // ─── Filtered categories in browse ────────────────────────────────────────
  const displayCategories = useMemo(() => {
    if (debouncedSearch.trim()) return searchResults;
    if (activeIndustry) {
      return GLOBAL_TAXONOMY
        .filter(c => c.industryCode === activeIndustry)
        .map(c => ({ category: c, score: c.demandScore }));
    }
    return TOP_CATEGORIES.map(c => ({ category: c, score: c.demandScore }));
  }, [searchResults, activeIndustry, debouncedSearch]);

  const BG = '#030712';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="relative w-full min-h-screen overflow-hidden" style={{ background: BG, color: '#F8FAFC' }}>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[60vw] w-[60vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-[30%] -right-[10%] h-[60vw] w-[60vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 pb-24 md:p-8">

        {/* ── Header ── */}
        <header>
          {onBack && (
            <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
              JOBFAST Business Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {phase === 'input'      && 'Tell us about your business'}
            {phase === 'analyzing'  && 'Analyzing your business…'}
            {phase === 'ai_result'  && 'We understood your business'}
            {phase === 'browse'     && 'Select your business types'}
            {phase === 'confirm'    && 'Review your Business DNA'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {phase === 'input'     && 'Describe what you do, in any language — text, voice, or upload'}
            {phase === 'ai_result' && 'Verify and adjust what we detected'}
            {phase === 'browse'    && 'Search or browse by industry'}
            {phase === 'confirm'   && 'Your Business DNA is ready'}
          </p>
        </header>

        {/* ── Phase: INPUT ── */}
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Main textarea */}
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 backdrop-blur-xl focus-within:border-cyan-400 transition">
                <textarea
                  ref={textareaRef}
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                  placeholder={"Tell JOBFAST what your business does…\n\nExamples:\n• \"I run a hotel in Punta Cana with a restaurant and tour services\"\n• \"Mwen gen yon konpayi transpò ak 12 machin\"\n• \"Tengo una clínica dental y laboratorio en Santo Domingo\""}
                  className="w-full resize-none bg-transparent text-sm text-white placeholder-slate-500 outline-none min-h-[140px]"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) analyze(); }}
                />
              </div>

              {/* Input mode pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: FileText, label: 'Describe', active: true },
                  { icon: Mic,      label: 'Voice (soon)', active: false },
                  { icon: Globe2,   label: 'Browse', active: true, action: () => setPhase('browse') },
                ].map(({ icon: Icon, label, active, action }) => (
                  <button
                    key={label}
                    disabled={!active}
                    onClick={action}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                        : 'border border-white/5 bg-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={analyze}
                disabled={!rawInput.trim() || analyzing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4 text-base font-black text-black transition hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={18} />
                ANALYZE MY BUSINESS
                <ChevronRight size={18} />
              </button>

              <p className="text-center text-[11px] text-slate-500">
                Ctrl + Enter to analyze · Works in any language
              </p>
            </motion.div>
          )}

          {/* ── Phase: ANALYZING / AI_RESULT ── */}
          {(phase === 'analyzing' || phase === 'ai_result') && (
            <motion.div key="analysis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Input preview */}
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 italic">
                "{rawInput.slice(0, 120)}{rawInput.length > 120 ? '…' : ''}"
              </div>

              <AIAnalysisPanel
                result={aiResult}
                loading={analyzing}
                onConfirm={confirmAI}
                onRetry={() => { setPhase('input'); setAiResult(null); setSelected([]); }}
              />

              {/* Selected categories preview after AI */}
              {phase === 'ai_result' && selected.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Pre-selected ({selected.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.map(cat => (
                      <BusinessCard key={cat.id} category={cat} selected onToggle={toggleCategory} compact />
                    ))}
                  </div>
                  <button
                    onClick={() => setPhase('browse')}
                    className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition"
                  >
                    + Add more business types
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Phase: BROWSE ── */}
          {phase === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search any business type, service, or industry…"
                  className="w-full rounded-2xl border border-white/20 bg-slate-900/80 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none backdrop-blur-xl focus:border-cyan-400 transition"
                />
                {isSearching && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
                {searchQuery && !isSearching && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Industry filter pills */}
              {!searchQuery && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setActiveIndustry(null)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      !activeIndustry ? 'bg-cyan-500 text-black' : 'border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind.code}
                      onClick={() => setActiveIndustry(activeIndustry === ind.code ? null : ind.code)}
                      className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        activeIndustry === ind.code
                          ? 'bg-cyan-500 text-black'
                          : 'border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {ind.emoji} {ind.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected summary */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map(cat => (
                    <motion.button
                      key={cat.id}
                      layout
                      onClick={() => toggleCategory(cat)}
                      className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition"
                    >
                      {cat.emoji} {cat.names['en']} <X size={11} />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Category grid */}
              <div className="space-y-2">
                {displayCategories.map(({ category, score }) => (
                  <BusinessCard
                    key={category.id}
                    category={category}
                    selected={selected.some(s => s.id === category.id)}
                    onToggle={toggleCategory}
                    score={searchQuery ? score : undefined}
                  />
                ))}
              </div>

              {/* Browse CTA */}
              {selected.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky bottom-0 pt-4"
                >
                  <button
                    onClick={() => {
                      const d = aiResult ? buildBusinessDNA(aiResult, selected, rawInput) : {
                        entityType: 'company' as const,
                        primaryIndustry: selected[0]?.industry ?? '',
                        primaryIndustryCode: selected[0]?.industryCode ?? '',
                        businessTypes: selected.map(c => c.id),
                        services: [...new Set(selected.flatMap(c => c.services))],
                        products: [...new Set(selected.flatMap(c => c.products))],
                        capabilities: { ...defaultCapabilities(), ...selected.reduce((acc, c) => ({ ...acc, ...c.capabilities }), {}) },
                        currencies: ['USD'],
                        paymentMethods: [],
                        languages: ['en'],
                        schemaVersion: 1,
                        targetMarkets: ['b2c'],
                        operatingCountries: [],
                        locations: [],
                        verification: defaultVerificationState(),
                        reputation: defaultReputation(),
                        presence: defaultPresence(),
                      };
                      setDna(d);
                      setPhase('confirm');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4 text-base font-black text-black transition hover:bg-cyan-400"
                  >
                    Continue with {selected.length} {selected.length === 1 ? 'type' : 'types'} selected
                    <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Phase: CONFIRM ── */}
          {phase === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              <BusinessDNAPanel dna={dna} />

              {/* Selected categories */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Selected business types ({selected.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.map(cat => (
                    <BusinessCard key={cat.id} category={cat} selected onToggle={toggleCategory} compact />
                  ))}
                </div>
                <button
                  onClick={() => setPhase('browse')}
                  className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                  ← Edit selections
                </button>
              </div>

              {/* Final CTA */}
              <button
                onClick={handleComplete}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-base font-black text-black transition hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
              >
                <Sparkles size={18} />
                BUILD MY BUSINESS PROFILE
                <ChevronRight size={18} />
              </button>

              <p className="text-center text-[11px] text-slate-500">
                You can add more details — locations, services, documents — in the next steps
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
