import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import type { AIClassificationResult } from '../types/business';
import { TAXONOMY_BY_ID } from '../constants/taxonomy';

interface Props {
  result: AIClassificationResult | null;
  loading: boolean;
  onConfirm: () => void;
  onRetry: () => void;
}

export function AIAnalysisPanel({ result, loading, onConfirm, onRetry }: Props) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-cyan-400" />
          <div>
            <p className="text-sm font-semibold text-white">Analyzing your business…</p>
            <p className="text-xs text-slate-400 mt-0.5">AI classification in progress</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {['Industry detection', 'Business types', 'Location extraction', 'Capability mapping'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              />
              {step}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const primaryCat = TAXONOMY_BY_ID[result.primaryBusiness];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 backdrop-blur-xl shadow-lg shadow-emerald-500/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Business DNA Detected
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400">
            {result.processingMs}ms
          </span>
        </div>

        {/* Primary business */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
            PRIMARY BUSINESS
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{primaryCat?.emoji ?? '🏢'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white truncate">
                {primaryCat?.names['en'] ?? result.primaryBusiness}
              </p>
              <p className="text-xs text-slate-400">{primaryCat?.industry ?? 'Unknown industry'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-emerald-400">{result.primaryConfidence}%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">confidence</p>
            </div>
          </div>
        </div>

        {/* Secondary businesses */}
        {result.secondaryBusinesses.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              SECONDARY ACTIVITIES
            </p>
            <div className="grid grid-cols-2 gap-2">
              {result.secondaryBusinesses.slice(0, 4).map(sec => {
                const cat = TAXONOMY_BY_ID[sec.type];
                return (
                  <div key={sec.type} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5">
                    <span className="text-lg">{cat?.emoji ?? '🔹'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{cat?.names['en'] ?? sec.type}</p>
                      <p className="text-[10px] text-slate-400">{sec.confidence}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Location */}
        {result.extractedLocation && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 mb-4">
            <MapPin size={14} className="text-cyan-400 shrink-0" />
            <div className="text-xs">
              <span className="text-white font-medium">
                {[result.extractedLocation.city, result.extractedLocation.country].filter(Boolean).join(', ')}
              </span>
              {result.extractedLocation.timezone && (
                <span className="text-slate-400 ml-2">({result.extractedLocation.timezone})</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Adjust
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            <CheckCircle2 size={16} />
            Confirm DNA
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
