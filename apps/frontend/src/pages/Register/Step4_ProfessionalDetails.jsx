import React, { memo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/AvatarUpload';

// ── Constants ─────────────────────────────────────────────────
const LANGS = [
  { code: 'ht', flag: '🇭🇹', label: 'Kreyòl'   },
  { code: 'fr', flag: '🇫🇷', label: 'Français'  },
  { code: 'en', flag: '🇺🇸', label: 'English'   },
  { code: 'es', flag: '🇩🇴', label: 'Español'   },
];

const inp = 'w-full p-3.5 rounded-2xl bg-[#0d1526] border border-[#1F2937] text-white placeholder-slate-500 focus:border-amber-400 outline-none transition text-sm';
const lbl = 'block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2';

// ── Simple tag chip input ─────────────────────────────────────
const TagInput = memo(({ tags = [], onAdd, onRemove, placeholder }) => {
  const [val, setVal] = useState('');
  const add = useCallback(() => {
    const v = val.trim();
    if (v && !tags.includes(v)) { onAdd(v); setVal(''); }
  }, [val, tags, onAdd]);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={`${inp} flex-1`}
        />
        <button type="button" onClick={add}
          className="px-4 rounded-2xl bg-amber-500 text-black font-black text-lg hover:bg-amber-400 transition active:scale-95">
          +
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              {tag}
              <button type="button" onClick={() => onRemove(tag)}
                className="text-amber-400 hover:text-red-400 transition font-black ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Main component ────────────────────────────────────────────
function Step4_ProfessionalDetails({ profession, onSubmit, loading = false }) {
  const { t } = useTranslation();

  const [photo,     setPhoto]     = useState('');
  const [headline,  setHeadline]  = useState('');
  const [bio,       setBio]       = useState('');
  const [langs,     setLangs]     = useState(['ht']);
  const [years,     setYears]     = useState('');
  const [skills,    setSkills]    = useState([]);
  const [errors,    setErrors]    = useState({});

  const validate = useCallback(() => {
    const e = {};
    if (!headline.trim()) e.headline = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [headline]);

  const handleSubmit = useCallback(() => {
    if (loading) return;
    if (!validate()) return;

    const profId = typeof profession === 'object'
      ? (profession?.id ?? profession?.professionId ?? '')
      : (profession ?? '');

    onSubmit?.({
      profession:   { id: profId },
      headline:     headline.trim(),
      bio:          { short: bio.trim(), languages: langs },
      experience:   { totalYears: Number(years) || 0 },
      skills:       skills.map(s => ({ id: s, level: 'intermediate' })),
      media:        { profilePhoto: photo },
      availability: { status: 'available', availableNow: true },
      contactPreferences: { allowChat: true, allowPhone: true, allowEmail: false },
      metadata: {
        platform: 'jobfast',
        schemaVersion: '2.2',
        createdAt: new Date().toISOString(),
        createdBy: 'user_registration',
      },
    });
  }, [loading, validate, headline, bio, langs, years, skills, photo, profession, onSubmit]);

  const toggleLang = useCallback((code) => {
    setLangs(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(l => l !== code) : prev
        : [...prev, code]
    );
  }, []);

  return (
    <div className="w-full space-y-5 pb-8">

      {/* ── Profile photo ─────────────────────────────────────── */}
      <div>
        <p className={lbl}>{t('step4.photo', 'Foto Pwofil')}</p>
        <AvatarUpload value={photo} onChange={setPhoto} />
      </div>

      {/* ── Professional headline ─────────────────────────────── */}
      <div>
        <label htmlFor="s4-headline" className={lbl}>
          {t('step4.headline', 'Tit Pwofesyonèl')}
          <span className="text-red-400 ml-1">*</span>
        </label>
        <input
          id="s4-headline"
          value={headline}
          onChange={e => { setHeadline(e.target.value); setErrors(p => ({ ...p, headline: false })); }}
          placeholder={t('step4.headline_ph', 'Egz: Elektrisite Sètifye | 8 an eksperyans')}
          className={`${inp} ${errors.headline ? 'border-red-500' : ''}`}
          maxLength={120}
        />
        <div className="flex justify-between mt-1">
          {errors.headline && <p className="text-red-400 text-xs">{t('errors.required', 'Obligatwa')}</p>}
          <p className="text-slate-600 text-xs ml-auto">{headline.length}/120</p>
        </div>
      </div>

      {/* ── Short bio ─────────────────────────────────────────── */}
      <div>
        <label htmlFor="s4-bio" className={lbl}>
          {t('step4.bio_short', 'Deskripsyon Kout')}
        </label>
        <textarea
          id="s4-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder={t('step4.bio_ph', 'Pale de eksperyans ou ak sèvis ou ofri…')}
          className={`${inp} resize-none`}
          rows={3}
          maxLength={300}
        />
        <p className="text-slate-600 text-xs text-right mt-1">{bio.length}/300</p>
      </div>

      {/* ── Languages spoken ──────────────────────────────────── */}
      <div>
        <p className={lbl}>{t('step4.languages_spoken', 'Lang ou pale')}</p>
        <div className="flex flex-wrap gap-2">
          {LANGS.map(({ code, flag, label }) => {
            const active = langs.includes(code);
            return (
              <button key={code} type="button" onClick={() => toggleLang(code)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
                  active
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#0d1526] text-slate-400 border border-[#1F2937] hover:border-amber-500/40'
                }`}>
                {flag} {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Years of experience ───────────────────────────────── */}
      <div>
        <label htmlFor="s4-years" className={lbl}>
          {t('step4.years_exp', 'Ane Eksperyans')}
        </label>
        <input
          id="s4-years"
          type="number"
          min="0"
          max="60"
          value={years}
          onChange={e => setYears(e.target.value)}
          placeholder="0"
          className={inp}
        />
      </div>

      {/* ── Skills ────────────────────────────────────────────── */}
      <div>
        <p className={lbl}>{t('step4.skills', 'Konpetans')}</p>
        <TagInput
          tags={skills}
          onAdd={s => setSkills(prev => [...prev, s])}
          onRemove={s => setSkills(prev => prev.filter(x => x !== s))}
          placeholder={t('step4.skill_ph', 'Ekri yon konpetans epi tape Enter')}
        />
      </div>

      {/* ── Submit ────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-black text-base tracking-wide transition-all duration-200 ${
          loading
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/25 active:scale-[0.98] hover:from-amber-400 hover:to-yellow-300'
        }`}
      >
        {loading
          ? t('common.processing', 'Ap trete…')
          : `🚀 ${t('registration.complete', 'Kreye Kont Mwen')}`}
      </button>

    </div>
  );
}

export default memo(Step4_ProfessionalDetails);
