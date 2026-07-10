// ============================================================
// JOBFAST — STEP 4 PROFESSIONAL PROFILE
// Schema Version 2.2 | International Standard
// Comparable: LinkedIn · Uber · Airbnb Onboarding
//
// Props:
//   profession        string | object  — selected profession id
//   metadata          object           — existing profileMetadata
//   onMetadataChange  fn(key, value)   — update a single metadata key
//   requiredFields    string[]
//   optionalFields    string[]
//   onSubmit          fn(professionalProfile) — submit with full schema
//   loading           boolean
// ============================================================

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/AvatarUpload';

// ── Constants ─────────────────────────────────────────────────
const SKILL_LEVELS   = ['beginner', 'intermediate', 'advanced', 'expert'];
const EXP_LEVELS     = ['junior', 'mid', 'senior', 'expert'];
const PRICE_TYPES    = ['hourly', 'fixed', 'negotiable'];
const CURRENCIES     = ['USD', 'EUR', 'HTG', 'DOP'];
const AVAIL_STATUSES = ['available', 'busy', 'unavailable'];
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const BIO_LANGS = [
  { code: 'ht', flag: '🇭🇹', label: 'Kreyòl'   },
  { code: 'fr', flag: '🇫🇷', label: 'Français'  },
  { code: 'en', flag: '🇺🇸', label: 'English'   },
  { code: 'es', flag: '🇩🇴', label: 'Español'   },
];

// ── Deep immutable path setter (supports "a.b.c" notation) ───
function setDeep(obj, path, value) {
  const keys = path.split('.');
  if (keys.length === 1) return { ...obj, [path]: value };
  return {
    ...obj,
    [keys[0]]: setDeep(obj[keys[0]] ?? {}, keys.slice(1).join('.'), value),
  };
}

// ── Build initial schema v2.2 state ──────────────────────────
function buildProfile(profession) {
  const id =
    typeof profession === 'object'
      ? (profession?.professionId ?? profession?.id ?? '')
      : (profession ?? '');
  const cat =
    typeof profession === 'object' ? (profession?.category ?? '') : '';

  return {
    profession: {
      id,
      category: cat,
      labelKey: id ? `profession.${id}` : '',
    },
    headline: '',
    bio: { short: '', languages: ['ht'] },
    skills: [],
    experience: { totalYears: 0, level: 'junior', projectsCompleted: 0 },
    certifications: [],
    services: [],
    availability: {
      status: 'available',
      availableNow: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule: [],
    },
    location: { serviceRadiusKm: 20 },
    currencyPreferences: { primary: 'USD', accepted: ['USD', 'HTG'] },
    media: { profilePhoto: '', portfolio: [] },
    verification: {
      status: 'pending',
      level: 'basic',
      identityVerified: false,
      professionalVerified: false,
      documents: [],
      badges: [],
      trustScore: {
        score: 0, rating: 0, reviews: 0, completedJobs: 0,
        responseRate: 0, completionRate: 0, repeatCustomers: 0,
      },
    },
    emergencyAvailability: { enabled: false, extraFeePercentage: 0 },
    contactPreferences: { allowChat: true, allowPhone: true, allowEmail: false },
    searchOptimization: { keywords: [], searchWeight: 10, aiMatchingEnabled: true },
    analytics: {
      profileViews: 0, searchAppearances: 0, contactRequests: 0,
      completedBookings: 0, conversionRate: 0,
    },
    profileStatus: { status: 'active', visibility: 'public', discoverable: true, slug: '' },
    metadata: {
      platform: 'jobfast',
      schemaVersion: '2.2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user_registration',
    },
  };
}

// ── CSS helpers ───────────────────────────────────────────────
const inp = 'w-full p-3 rounded-xl bg-[#162035] border border-gray-700 text-white placeholder-gray-500 focus:border-amber-400 outline-none transition text-sm';
const lbl = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5';

// ── Toggle switch ─────────────────────────────────────────────
const Toggle = memo(({ id, on, onChange, label }) => (
  <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-amber-500' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
    {label && <span className="text-sm text-gray-300">{label}</span>}
  </label>
));

// ── Accordion section ─────────────────────────────────────────
const Section = memo(({ title, icon, open, onToggle, done, children }) => (
  <div className={`rounded-2xl border transition-all duration-200 ${
    open
      ? 'border-amber-500/50 bg-[#0d1b35]'
      : done
        ? 'border-green-600/30 bg-[#091524]'
        : 'border-gray-800 bg-[#091524]'
  }`}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between p-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-amber-400 outline-none text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className={`font-semibold text-sm ${open ? 'text-amber-300' : done ? 'text-green-400' : 'text-gray-300'}`}>
          {title}
        </span>
      </div>
      <span className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
        {done && !open
          ? <span className="text-green-400">✓</span>
          : <span>▾</span>}
      </span>
    </button>

    {open && (
      <div className="px-4 pb-5 space-y-4 border-t border-gray-800/50 pt-4">
        {children}
      </div>
    )}
  </div>
));

// ── Tag chip input ────────────────────────────────────────────
const TagInput = memo(({ tags = [], onAdd, onRemove, placeholder }) => {
  const [val, setVal] = useState('');
  const add = useCallback(() => {
    const v = val.trim();
    if (v && !tags.includes(v)) { onAdd(v); setVal(''); }
  }, [val, tags, onAdd]);
  return (
    <>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={`${inp} flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition"
        >
          +
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                aria-label={`Retire ${t}`}
                className="text-amber-400 hover:text-red-400 transition leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
});

// ── Step 4 main component ─────────────────────────────────────
function Step4_ProfessionalDetails({
  profession,
  metadata,
  onMetadataChange,
  requiredFields,
  optionalFields,
  onSubmit,
  loading = false,
}) {
  const { t } = useTranslation();

  const [profile, setProfile]   = useState(() => buildProfile(profession));
  const [openSec, setOpenSec]   = useState('identity');
  const [errors,  setErrors]    = useState({});

  // Always read the latest profile in callbacks without stale closure
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // ── Generic deep updater ────────────────────────────────────
  const set = useCallback((path, value) => {
    setProfile(prev => setDeep(prev, path, value));
    setErrors(prev => ({ ...prev, [path]: null }));
  }, []);

  const toggleSec = useCallback((id) =>
    setOpenSec(prev => prev === id ? null : id), []);

  // ── Skills ──────────────────────────────────────────────────
  const addSkill = useCallback((id) => {
    setProfile(prev =>
      prev.skills.some(s => s.id === id)
        ? prev
        : { ...prev, skills: [...prev.skills, { id, level: 'intermediate', verified: false, searchWeight: 5 }] }
    );
  }, []);

  const removeSkill = useCallback((id) =>
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) })), []);

  const setSkillLevel = useCallback((id, level) =>
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, level } : s),
    })), []);

  // ── Services ────────────────────────────────────────────────
  const addService = useCallback(() =>
    setProfile(prev => ({
      ...prev,
      services: [...prev.services, {
        id: `svc_${Date.now()}`,
        name: '',
        status: 'active',
        pricing:     { type: 'hourly', amount: '', currency: 'USD' },
        duration:    { estimatedMinutes: 60 },
        serviceArea: { remoteAvailable: false, onSiteAvailable: true },
      }],
    })), []);

  const removeService = useCallback((id) =>
    setProfile(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) })), []);

  const setSvc = useCallback((id, path, value) =>
    setProfile(prev => ({
      ...prev,
      services: prev.services.map(s => s.id !== id ? s : setDeep(s, path, value)),
    })), []);

  // ── Schedule ────────────────────────────────────────────────
  const toggleDay = useCallback((day) =>
    setProfile(prev => {
      const exists = prev.availability.schedule.some(s => s.day === day);
      const schedule = exists
        ? prev.availability.schedule.filter(s => s.day !== day)
        : [...prev.availability.schedule, { day, start: '08:00', end: '18:00' }];
      return { ...prev, availability: { ...prev.availability, schedule } };
    }), []);

  const setSlot = useCallback((day, field, value) =>
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        schedule: prev.availability.schedule.map(s =>
          s.day === day ? { ...s, [field]: value } : s
        ),
      },
    })), []);

  // ── Validation ──────────────────────────────────────────────
  const validate = useCallback(() => {
    const p = profileRef.current;
    const e = {};
    if (!p.headline.trim())    e['headline']  = true;
    if (!p.bio.short.trim())   e['bio.short'] = true;
    setErrors(e);
    if (Object.keys(e).length > 0) setOpenSec('identity');
    return Object.keys(e).length === 0;
  }, []);

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (loading) return;
    if (!validate()) return;
    const final = {
      ...profileRef.current,
      metadata: { ...profileRef.current.metadata, updatedAt: new Date().toISOString() },
    };
    // Pass complete schema directly — parent merges before API call
    onSubmit?.(final);
  }, [loading, validate, onSubmit]);

  // ── Completeness signals ────────────────────────────────────
  const doneId    = profile.headline.trim().length > 0 && profile.bio.short.trim().length > 0;
  const doneExp   = profile.experience.totalYears > 0;
  const doneSvc   = profile.services.length > 0;
  const doneAvail = profile.availability.schedule.length > 0;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="w-full space-y-3 pb-8">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — Professional Identity
      ═══════════════════════════════════════════════════════ */}
      <Section
        title={t('step4.section_identity', 'Idantite Pwofesyonèl')}
        icon="👤"
        open={openSec === 'identity'}
        onToggle={() => toggleSec('identity')}
        done={doneId}
      >
        {/* Photo */}
        <div>
          <p className={lbl}>{t('step4.photo', 'Foto Pwofil')}</p>
          <AvatarUpload
            value={profile.media.profilePhoto}
            onChange={url => set('media.profilePhoto', url)}
          />
        </div>

        {/* Headline */}
        <div>
          <label htmlFor="s4-headline" className={lbl}>
            {t('step4.headline', 'Tit Pwofesyonèl')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <input
            id="s4-headline"
            value={profile.headline}
            onChange={e => set('headline', e.target.value)}
            placeholder={t('step4.headline_ph', 'Ex: Elektrisite Sètifye | 8 an eksperyans')}
            className={`${inp} ${errors.headline ? 'border-red-500' : ''}`}
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.headline}
          />
          <div className="flex justify-between mt-1">
            {errors.headline && <p className="text-red-400 text-xs">{t('errors.required', 'Obligatwa')}</p>}
            <p className="text-gray-600 text-xs ml-auto">{profile.headline.length}/120</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="s4-bio" className={lbl}>
            {t('step4.bio_short', 'Deskripsyon Kout')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <textarea
            id="s4-bio"
            value={profile.bio.short}
            onChange={e => set('bio.short', e.target.value)}
            placeholder={t('step4.bio_ph', 'Pale de eksperyans ou, sèvis ou ofri, ak valè ou pote pou kliyan...')}
            className={`${inp} ${errors['bio.short'] ? 'border-red-500' : ''} resize-none`}
            rows={3}
            maxLength={500}
            aria-required="true"
            aria-invalid={!!errors['bio.short']}
          />
          <div className="flex justify-between mt-1">
            {errors['bio.short'] && <p className="text-red-400 text-xs">{t('errors.required', 'Obligatwa')}</p>}
            <p className="text-gray-600 text-xs ml-auto">{profile.bio.short.length}/500</p>
          </div>
        </div>

        {/* Languages spoken */}
        <div>
          <p className={lbl}>{t('step4.languages_spoken', 'Lang ou pale')}</p>
          <div className="flex flex-wrap gap-2">
            {BIO_LANGS.map(({ code, flag, label }) => {
              const active = profile.bio.languages.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const next = active
                      ? profile.bio.languages.filter(l => l !== code)
                      : [...profile.bio.languages, code];
                    set('bio.languages', next.length ? next : [code]);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-[#162035] text-gray-400 border border-gray-700 hover:border-amber-500/50'
                  }`}
                >
                  {flag} {label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenSec('experience')}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition active:scale-95"
        >
          {t('common.next', 'Kontinye')} →
        </button>
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — Experience & Skills
      ═══════════════════════════════════════════════════════ */}
      <Section
        title={t('step4.section_experience', 'Eksperyans & Konpetans')}
        icon="🏆"
        open={openSec === 'experience'}
        onToggle={() => toggleSec('experience')}
        done={doneExp}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="s4-years" className={lbl}>
              {t('step4.years_exp', 'Ane Eksperyans')}
            </label>
            <input
              id="s4-years"
              type="number"
              min="0"
              max="50"
              value={profile.experience.totalYears}
              onChange={e => set('experience.totalYears', Math.max(0, Number(e.target.value)))}
              className={inp}
            />
          </div>
          <div>
            <label htmlFor="s4-exp-level" className={lbl}>
              {t('step4.exp_level', 'Nivo')}
            </label>
            <select
              id="s4-exp-level"
              value={profile.experience.level}
              onChange={e => set('experience.level', e.target.value)}
              className={inp}
            >
              {EXP_LEVELS.map(l => (
                <option key={l} value={l}>{t(`step4.level_${l}`, l)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="s4-projects" className={lbl}>
            {t('step4.projects_completed', 'Pwojè Fini')}
          </label>
          <input
            id="s4-projects"
            type="number"
            min="0"
            value={profile.experience.projectsCompleted}
            onChange={e => set('experience.projectsCompleted', Math.max(0, Number(e.target.value)))}
            className={inp}
          />
        </div>

        {/* Skills tag builder */}
        <div>
          <p className={lbl}>{t('step4.skills', 'Konpetans / Espesyalite')}</p>
          <TagInput
            tags={profile.skills.map(s => s.id)}
            onAdd={addSkill}
            onRemove={removeSkill}
            placeholder={t('step4.skill_ph', 'Ekri yon konpetans epi appiye Enter')}
          />
          {profile.skills.length > 0 && (
            <div className="mt-3 space-y-2">
              {profile.skills.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#162035] border border-gray-800">
                  <span className="flex-1 text-sm text-white truncate">{s.id}</span>
                  <select
                    value={s.level}
                    onChange={e => setSkillLevel(s.id, e.target.value)}
                    className="text-xs bg-[#0d1b35] border border-gray-700 text-amber-300 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400"
                  >
                    {SKILL_LEVELS.map(l => (
                      <option key={l} value={l}>{t(`step4.skill_${l}`, l)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSkill(s.id)}
                    aria-label={`Retire ${s.id}`}
                    className="text-gray-500 hover:text-red-400 transition text-xl leading-none w-5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service radius slider */}
        <div>
          <p className={lbl}>
            {t('step4.service_radius', 'Reyon Sèvis')}
            <span className="ml-2 text-amber-400 font-bold normal-case">{profile.location.serviceRadiusKm} km</span>
          </p>
          <input
            type="range"
            min="1"
            max="200"
            value={profile.location.serviceRadiusKm}
            onChange={e => set('location.serviceRadiusKm', Number(e.target.value))}
            className="w-full accent-amber-500"
            aria-label={t('step4.service_radius', 'Reyon Sèvis')}
          />
          <div className="flex justify-between text-gray-600 text-xs">
            <span>1 km</span><span>200 km</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenSec('services')}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition active:scale-95"
        >
          {t('common.next', 'Kontinye')} →
        </button>
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — Services & Pricing
      ═══════════════════════════════════════════════════════ */}
      <Section
        title={t('step4.section_services', 'Sèvis & Pri')}
        icon="💼"
        open={openSec === 'services'}
        onToggle={() => toggleSec('services')}
        done={doneSvc}
      >
        {profile.services.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-2">
            {t('step4.no_services', 'Ou poko ajoute okenn sèvis.')}
          </p>
        )}

        <div className="space-y-3">
          {profile.services.map((svc, i) => (
            <div key={svc.id} className="p-4 rounded-xl border border-gray-700 bg-[#162035] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  {t('step4.service_n', 'Sèvis')} {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeService(svc.id)}
                  aria-label={`Retire sèvis ${i + 1}`}
                  className="text-gray-500 hover:text-red-400 transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Service name */}
              <input
                value={svc.name}
                onChange={e => setSvc(svc.id, 'name', e.target.value)}
                placeholder={t('step4.service_name_ph', 'Non sèvis (ex: Instalasyon Elektrik)')}
                className={inp}
              />

              {/* Pricing row */}
              <div className={`grid gap-2 ${svc.pricing.type === 'negotiable' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <select
                  value={svc.pricing.type}
                  onChange={e => setSvc(svc.id, 'pricing.type', e.target.value)}
                  className={inp}
                  aria-label={t('step4.pricing_type', 'Tip Pri')}
                >
                  {PRICE_TYPES.map(p => (
                    <option key={p} value={p}>{t(`step4.pricing_${p}`, p)}</option>
                  ))}
                </select>

                {svc.pricing.type !== 'negotiable' && (
                  <input
                    type="number"
                    min="0"
                    value={svc.pricing.amount}
                    onChange={e => setSvc(svc.id, 'pricing.amount', Number(e.target.value))}
                    placeholder="0.00"
                    className={inp}
                    aria-label={t('step4.amount', 'Montan')}
                  />
                )}

                <select
                  value={svc.pricing.currency}
                  onChange={e => setSvc(svc.id, 'pricing.currency', e.target.value)}
                  className={inp}
                  aria-label={t('step4.currency', 'Monè')}
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Service area */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={svc.serviceArea.remoteAvailable}
                    onChange={e => setSvc(svc.id, 'serviceArea.remoteAvailable', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-gray-300">{t('step4.remote', 'Remote')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={svc.serviceArea.onSiteAvailable}
                    onChange={e => setSvc(svc.id, 'serviceArea.onSiteAvailable', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-gray-300">{t('step4.on_site', 'Sou Plas')}</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addService}
          className="w-full py-3 rounded-xl border-2 border-dashed border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/8 hover:border-amber-500/70 transition"
        >
          + {t('step4.add_service', 'Ajoute Sèvis')}
        </button>

        <button
          type="button"
          onClick={() => setOpenSec('availability')}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition active:scale-95"
        >
          {t('common.next', 'Kontinye')} →
        </button>
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — Availability & Schedule
      ═══════════════════════════════════════════════════════ */}
      <Section
        title={t('step4.section_availability', 'Disponiblite')}
        icon="📅"
        open={openSec === 'availability'}
        onToggle={() => toggleSec('availability')}
        done={doneAvail}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="s4-avail-status" className={lbl}>
              {t('step4.status', 'Estati')}
            </label>
            <select
              id="s4-avail-status"
              value={profile.availability.status}
              onChange={e => set('availability.status', e.target.value)}
              className={inp}
            >
              {AVAIL_STATUSES.map(s => (
                <option key={s} value={s}>{t(`step4.status_${s}`, s)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <Toggle
              id="s4-avail-now"
              on={profile.availability.availableNow}
              onChange={v => set('availability.availableNow', v)}
              label={t('step4.available_now', 'Disponib Kounye')}
            />
          </div>
        </div>

        {/* Weekly schedule */}
        <div>
          <p className={lbl}>{t('step4.schedule', 'Orè Semèn')}</p>
          <div className="space-y-2">
            {DAYS.map(day => {
              const slot   = profile.availability.schedule.find(s => s.day === day);
              const active = !!slot;
              return (
                <div
                  key={day}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    active ? 'bg-amber-500/8 border border-amber-500/20' : 'bg-[#162035]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={active}
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold transition ${
                      active ? 'bg-amber-500 text-black' : 'border border-gray-600 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <span className={`capitalize text-sm flex-1 ${active ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {t(`step4.day_${day}`, day)}
                  </span>
                  {active && slot && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={e => setSlot(day, 'start', e.target.value)}
                        className="bg-[#0d1b35] border border-gray-700 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-400"
                      />
                      <span className="text-gray-500 text-xs">–</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={e => setSlot(day, 'end', e.target.value)}
                        className="bg-[#0d1b35] border border-gray-700 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenSec('settings')}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition active:scale-95"
        >
          {t('common.next', 'Kontinye')} →
        </button>
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — Preferences & Settings
      ═══════════════════════════════════════════════════════ */}
      <Section
        title={t('step4.section_settings', 'Preferans & Paramèt')}
        icon="⚙️"
        open={openSec === 'settings'}
        onToggle={() => toggleSec('settings')}
        done={false}
      >
        {/* Primary currency */}
        <div>
          <p className={lbl}>{t('step4.primary_currency', 'Monè Prensipal')}</p>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('currencyPreferences.primary', c)}
                className={`py-2.5 rounded-xl text-sm font-bold transition ${
                  profile.currencyPreferences.primary === c
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-[#162035] text-gray-400 border border-gray-700 hover:border-amber-500/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Accepted currencies */}
        <div>
          <p className={lbl}>{t('step4.accepted_currencies', 'Monè Aksepte')}</p>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map(c => {
              const on = profile.currencyPreferences.accepted.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const next = on
                      ? profile.currencyPreferences.accepted.filter(x => x !== c)
                      : [...profile.currencyPreferences.accepted, c];
                    set('currencyPreferences.accepted', next.length ? next : [c]);
                  }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition ${
                    on
                      ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                      : 'bg-[#162035] text-gray-500 border border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact preferences */}
        <div>
          <p className={lbl}>{t('step4.contact_prefs', 'Kominikasyon')}</p>
          <div className="space-y-3">
            {[
              ['allowChat',  'step4.allow_chat',  'Chat'],
              ['allowPhone', 'step4.allow_phone', 'Telefòn'],
              ['allowEmail', 'step4.allow_email', 'Email'],
            ].map(([key, tk, fb]) => (
              <Toggle
                key={key}
                id={`s4-${key}`}
                on={profile.contactPreferences[key]}
                onChange={v => set(`contactPreferences.${key}`, v)}
                label={t(tk, fb)}
              />
            ))}
          </div>
        </div>

        {/* Emergency availability */}
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {t('step4.emergency_avail', 'Sèvis Ijans')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('step4.emergency_desc', 'Disponib pou travay ijans ak pri siplemantè')}
              </p>
            </div>
            <Toggle
              id="s4-emergency"
              on={profile.emergencyAvailability.enabled}
              onChange={v => set('emergencyAvailability.enabled', v)}
            />
          </div>
          {profile.emergencyAvailability.enabled && (
            <div className="mt-4">
              <label htmlFor="s4-extra-fee" className={lbl}>
                {t('step4.extra_fee_pct', 'Siplemantè (%)')}
              </label>
              <input
                id="s4-extra-fee"
                type="number"
                min="0"
                max="200"
                step="5"
                value={profile.emergencyAvailability.extraFeePercentage}
                onChange={e => set('emergencyAvailability.extraFeePercentage', Number(e.target.value))}
                className={inp}
              />
            </div>
          )}
        </div>

        {/* AI matching */}
        <Toggle
          id="s4-ai"
          on={profile.searchOptimization.aiMatchingEnabled}
          onChange={v => set('searchOptimization.aiMatchingEnabled', v)}
          label={t('step4.ai_matching', 'Aktivite IA Matching')}
        />

        {/* Keywords */}
        <div>
          <p className={lbl}>{t('step4.keywords', 'Mo-Kle Rechèch')}</p>
          <TagInput
            tags={profile.searchOptimization.keywords}
            onAdd={kw => set('searchOptimization.keywords', [...profile.searchOptimization.keywords, kw])}
            onRemove={kw => set('searchOptimization.keywords', profile.searchOptimization.keywords.filter(k => k !== kw))}
            placeholder={t('step4.keyword_ph', 'Ajoute yon mo-kle epi appiye Enter')}
          />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════
          SUBMIT
      ═══════════════════════════════════════════════════════ */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-200 ${
          loading
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
        }`}
      >
        {loading
          ? t('common.processing', 'Ap trete...')
          : t('registration.complete', 'Kreye Kont Mwen')}
      </button>

      <p className="text-center text-xs text-gray-700">
        {t('step4.schema_version', 'Schema v2.2 · JOBFAST Professional')}
      </p>
    </div>
  );
}

export default memo(Step4_ProfessionalDetails);
