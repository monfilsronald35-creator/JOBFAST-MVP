import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTRIES = [
  { code:'HT', name:'Haiti' }, { code:'DO', name:'République Dominicaine' },
  { code:'US', name:'États-Unis' }, { code:'CA', name:'Canada' },
  { code:'FR', name:'France' }, { code:'BR', name:'Brésil' },
  { code:'MX', name:'Mexique' }, { code:'JM', name:'Jamaïque' },
  { code:'CU', name:'Cuba' }, { code:'CO', name:'Colombie' },
];
const LANGUAGES = ['Kreyòl', 'Français', 'English', 'Español', 'Português'];
const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];
const EXPERIENCE_OPTIONS = ['entry', 'junior', 'mid', 'senior', 'expert'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'];

export const DEFAULT_ADV_FILTERS = {
  country: '', city: '', distance: 0,
  salaryMin: '', salaryMax: '',
  language: '', experience: '',
  availableOnly: false, remote: false,
  jobTypes: [], urgentOnly: false,
};

// ── Toggle pill ───────────────────────────────────────────────
function Pill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
        active
          ? 'bg-amber-500 border-amber-500 text-slate-950'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
      }`}>
      {label}
    </button>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHead({ label }) {
  return <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 mt-4">{label}</p>;
}

export default function AdvancedFiltersSheet({ filters = DEFAULT_ADV_FILTERS, onApply, onClose }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ ...DEFAULT_ADV_FILTERS, ...filters });

  const set = useCallback((key, val) => setLocal(prev => ({ ...prev, [key]: val })), []);

  const toggleJobType = useCallback((type) => {
    setLocal(prev => {
      const has = prev.jobTypes.includes(type);
      return { ...prev, jobTypes: has ? prev.jobTypes.filter(x => x !== type) : [...prev.jobTypes, type] };
    });
  }, []);

  const handleApply = () => { onApply(local); onClose(); };

  const handleReset = () => setLocal({ ...DEFAULT_ADV_FILTERS });

  const activeCount = [
    local.country, local.city, local.language, local.experience,
  ].filter(Boolean).length
    + (local.distance > 0 ? 1 : 0)
    + (local.salaryMin || local.salaryMax ? 1 : 0)
    + (local.availableOnly ? 1 : 0)
    + (local.remote ? 1 : 0)
    + (local.urgentOnly ? 1 : 0)
    + local.jobTypes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 flex flex-col max-h-[90vh]">
        {/* Handle + header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="w-10 h-1 bg-slate-600 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <h3 className="text-base font-black text-white">
            {t('filters.title', { defaultValue: 'Filtè Avanse' })}
            {activeCount > 0 && (
              <span className="ml-2 text-xs bg-amber-500 text-slate-950 rounded-full px-2 py-0.5 font-black">{activeCount}</span>
            )}
          </h3>
          <button type="button" onClick={handleReset} className="text-xs text-amber-400 font-bold">
            {t('filters.reset', { defaultValue: 'Réinitialiser' })}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-4">

          {/* Country */}
          <SectionHead label={t('filters.country', { defaultValue: 'Peyi' })} />
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map(c => (
              <Pill key={c.code} label={c.name} active={local.country === c.code} onClick={() => set('country', local.country === c.code ? '' : c.code)} />
            ))}
          </div>

          {/* City */}
          <SectionHead label={t('filters.city', { defaultValue: 'Vil' })} />
          <input value={local.city} onChange={e => set('city', e.target.value)} placeholder={t('filters.cityPlaceholder', { defaultValue: 'Port-au-Prince, Cap-Haïtien…' })}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />

          {/* Distance */}
          <SectionHead label={t('filters.distance', { defaultValue: 'Distans (km)' })} />
          <div className="flex flex-wrap gap-2">
            <Pill label={t('filters.any', { defaultValue: 'Nenpòt' })} active={local.distance === 0} onClick={() => set('distance', 0)} />
            {DISTANCE_OPTIONS.map(d => (
              <Pill key={d} label={`${d} km`} active={local.distance === d} onClick={() => set('distance', d)} />
            ))}
          </div>

          {/* Salary */}
          <SectionHead label={t('filters.salary', { defaultValue: 'Salè (HTG)' })} />
          <div className="flex gap-2">
            <input value={local.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="Min" type="number"
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            <input value={local.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="Max" type="number"
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          </div>

          {/* Language */}
          <SectionHead label={t('filters.language', { defaultValue: 'Lang' })} />
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <Pill key={l} label={l} active={local.language === l} onClick={() => set('language', local.language === l ? '' : l)} />
            ))}
          </div>

          {/* Experience */}
          <SectionHead label={t('filters.experience', { defaultValue: 'Eksperyans' })} />
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map(e => (
              <Pill key={e} label={t(`filters.exp.${e}`, { defaultValue: e })} active={local.experience === e}
                onClick={() => set('experience', local.experience === e ? '' : e)} />
            ))}
          </div>

          {/* Job Types */}
          <SectionHead label={t('filters.jobType', { defaultValue: 'Tip Travay' })} />
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map(jt => (
              <Pill key={jt} label={t(`filters.type.${jt}`, { defaultValue: jt.replace('_', ' ') })} active={local.jobTypes.includes(jt)}
                onClick={() => toggleJobType(jt)} />
            ))}
          </div>

          {/* Toggles */}
          <SectionHead label={t('filters.options', { defaultValue: 'Opsyon' })} />
          <div className="space-y-1 bg-slate-800/40 rounded-xl px-3">
            <Toggle label={t('filters.availableOnly', { defaultValue: 'Disponib sèlman' })} value={local.availableOnly} onChange={v => set('availableOnly', v)} />
            <div className="h-px bg-slate-700/50" />
            <Toggle label={t('filters.remote', { defaultValue: 'Travay a distans (Remote)' })} value={local.remote} onChange={v => set('remote', v)} />
            <div className="h-px bg-slate-700/50" />
            <Toggle label={t('filters.urgentOnly', { defaultValue: '🔥 Ijan sèlman' })} value={local.urgentOnly} onChange={v => set('urgentOnly', v)} />
          </div>
        </div>

        {/* Apply button */}
        <div className="px-5 pb-10 pt-3 border-t border-slate-800 shrink-0">
          <button type="button" onClick={handleApply}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/20">
            {t('filters.apply', { defaultValue: 'Aplike Filtè' })}
            {activeCount > 0 && ` (${activeCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
