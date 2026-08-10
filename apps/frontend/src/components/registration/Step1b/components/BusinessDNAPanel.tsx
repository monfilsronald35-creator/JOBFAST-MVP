import React from 'react';
import { motion } from 'framer-motion';
import { Activity, MapPin, Zap, Shield, BarChart3 } from 'lucide-react';
import type { BusinessDNA } from '../types/business';
import { computeCompleteness } from '../engines/businessDNAEngine';

interface Props {
  dna: Partial<BusinessDNA>;
}

export function BusinessDNAPanel({ dna }: Props) {
  const { score, nextSteps } = computeCompleteness(dna);

  const activeCapabilities = Object.entries(dna.capabilities ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim());

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-white">Business DNA</h3>
      </div>

      {/* Completeness ring */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E293B" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#22D3EE" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - score }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-white">{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Profile Completeness</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {score < 40 ? 'Add more details to unlock features'
              : score < 70 ? 'Good start — keep going'
              : score < 90 ? 'Almost there!'
              : 'Profile is complete'}
          </p>
          {nextSteps.length > 0 && (
            <p className="text-[10px] text-cyan-400 mt-1">Next: {nextSteps[0]}</p>
          )}
        </div>
      </div>

      {/* Business types */}
      {dna.businessTypes && dna.businessTypes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Business Types
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dna.businessTypes.map(bt => (
              <span key={bt} className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                {bt.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {dna.locations && dna.locations.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-slate-400 shrink-0" />
          <p className="text-xs text-slate-300">
            {[dna.locations[0]?.city, dna.locations[0]?.country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Capabilities */}
      {activeCapabilities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            <Zap size={10} className="inline mr-1" />
            Capabilities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeCapabilities.map(cap => (
              <span key={cap} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Industry */}
      {dna.primaryIndustry && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-slate-400" />
            <p className="text-xs text-slate-300">
              <span className="text-white font-semibold">{dna.primaryIndustry}</span>
              {dna.operatingCountries && dna.operatingCountries.length > 0 && (
                <span className="text-slate-400"> · {dna.operatingCountries.join(', ')}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Schema version */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <Shield size={10} className="text-slate-600" />
        <p className="text-[10px] text-slate-600">DNA v{dna.schemaVersion ?? 1} · JOBFAST Standard</p>
      </div>
    </div>
  );
}
