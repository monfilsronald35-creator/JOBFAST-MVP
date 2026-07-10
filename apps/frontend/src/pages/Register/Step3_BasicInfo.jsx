// ============================================================
// JOBFAST — STEP 3 BASIC INFORMATION
// Enterprise Global Registration | Schema v2.2
// Comparable: LinkedIn · Uber · Airbnb Onboarding
//
// Features:
// - ISO country architecture + E.164 phone normalization
// - Password strength indicator + show/hide toggle
// - WCAG 2.1 AA: aria-required, aria-invalid, aria-describedby
// - i18n: ht/en/fr/es
// - API migration ready
// - KYC ready
//
// Output payload:
// { profile, location, preferences, security, metadata }
// ============================================================

import React, { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRY_DATA, getCountryLabel, getZones } from '../../config/countries';

// ── Config ────────────────────────────────────────────────────
const DEFAULT_COUNTRY      = 'ht';
const REGISTRATION_VERSION = '1.0.0';
const MIN_PW_LENGTH        = 8;

// ── Password strength (0=empty, 1=weak, 2=medium, 3=strong) ──
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)            s++;
  if (pw.length >= 12)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return Math.min(s, 3);
}

// ── Validators ────────────────────────────────────────────────
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v) => v.replace(/\D/g, '').length >= 7;
const isPw    = (v) => v.length >= MIN_PW_LENGTH;

// ── E.164 phone normalization ─────────────────────────────────
function normalizePhone(phone, prefix) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits ? `${prefix}${digits}` : '';
}

// ── CSS tokens (same system as Step4) ────────────────────────
const inp = 'w-full p-3 rounded-xl bg-[#162035] border border-gray-700 text-white placeholder-gray-500 focus:border-amber-400 outline-none transition text-sm';
const lbl = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5';
const errCls = 'text-red-400 text-xs mt-1';

// ── Section group divider ─────────────────────────────────────
const SectionLabel = memo(({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
  </div>
));

// ── Password strength bar ─────────────────────────────────────
const StrengthBar = memo(({ strength, t }) => {
  if (!strength) return null;
  const colors  = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const labels  = ['', t('step3.strength_weak', 'Fèb'), t('step3.strength_medium', 'Mwayen'), t('step3.strength_strong', 'Solid')];
  const txtCls  = ['', 'text-red-400', 'text-yellow-400', 'text-green-400'];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-gray-700'}`} />
        ))}
      </div>
      <p className={`text-xs mt-1 ${txtCls[strength]}`}>{labels[strength]}</p>
    </div>
  );
});

// ── Eye toggle icon ───────────────────────────────────────────
const EyeIcon = ({ show }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    {show ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

// ── Main component ────────────────────────────────────────────
function Step3_BasicInfo({ data = {}, onNext, loading = false }) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language || 'ht';

  const [form, setForm] = useState({
    fullName:        data.fullName    ?? '',
    email:           data.email       ?? '',
    phone:           data.phone       ?? '',
    countryCode:     data.countryCode ?? data.country ?? DEFAULT_COUNTRY,
    region:          data.region      ?? data.zone    ?? '',
    city:            data.city        ?? '',
    password:        '',
    confirmPassword: '',
  });

  const [errors,      setErrors]      = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Derived ────────────────────────────────────────────────
  const selectedCountry = useMemo(() =>
    COUNTRY_DATA.find(c => c.code === form.countryCode) ?? COUNTRY_DATA[0],
    [form.countryCode]
  );

  const regions = useMemo(() =>
    getZones(selectedCountry, locale) ?? [],
    [selectedCountry, locale]
  );

  const pwStrength = useMemo(() => getStrength(form.password), [form.password]);

  // ── Field updater ─────────────────────────────────────────
  const change = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'countryCode' ? { region: '' } : {}),
    }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }, []);

  // ── Validation ─────────────────────────────────────────────
  const validate = useCallback(() => {
    const e = {};
    if (!form.fullName.trim())                    e.fullName        = t('errors.required',          'Obligatwa');
    if (!isEmail(form.email))                     e.email           = t('errors.email_invalid',     'Imèl la pa valid');
    if (!isPhone(form.phone))                     e.phone           = t('errors.phone_invalid',     'Nimewo pa valid');
    if (!form.region)                             e.region          = t('errors.required',          'Obligatwa');
    if (!isPw(form.password))                     e.password        = t('errors.password_weak',     'Minimòm 8 karaktè');
    if (form.password !== form.confirmPassword)   e.confirmPassword = t('errors.password_mismatch', 'Modpas yo pa menm');
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, t]);

  // ── Submit ─────────────────────────────────────────────────
  const submit = useCallback(() => {
    if (loading || !validate()) return;
    onNext?.({
      profile: {
        fullName: form.fullName.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    normalizePhone(form.phone, selectedCountry.phonePrefix),
      },
      location: {
        countryCode:  selectedCountry.code,
        countryName:  getCountryLabel(selectedCountry, locale),
        region:       form.region,
        city:         form.city.trim(),
      },
      preferences: {
        language: locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      security: {
        password: form.password,
      },
      metadata: {
        platform:            'jobfast',
        registrationVersion: REGISTRATION_VERSION,
        source:              'web',
        createdAt:           new Date().toISOString(),
      },
    });
  }, [loading, validate, form, selectedCountry, locale, onNext]);

  // ── Render ─────────────────────────────────────────────────
  return (
    <form
      onSubmit={e => { e.preventDefault(); submit(); }}
      aria-busy={loading}
      className="w-full space-y-6"
      noValidate
    >

      {/* ── Section 1: Personal Info ─────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel icon="👤" title={t('step3.section_personal', 'Enfòmasyon Pèsonèl')} />

        {/* Full name */}
        <div>
          <label htmlFor="s3-fullName" className={lbl}>
            {t('step3.full_name', 'Non Konplè')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <input
            id="s3-fullName"
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={change}
            placeholder={t('step3.full_name_ph', 'Jean Pierre...')}
            className={`${inp} ${errors.fullName ? 'border-red-500' : ''}`}
            aria-required="true"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 's3-fullName-err' : undefined}
          />
          {errors.fullName && <p id="s3-fullName-err" className={errCls}>{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="s3-email" className={lbl}>
            {t('step3.email', 'Imèl')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <input
            id="s3-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={change}
            placeholder="email@exemple.com"
            className={`${inp} ${errors.email ? 'border-red-500' : ''}`}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 's3-email-err' : undefined}
          />
          {errors.email && <p id="s3-email-err" className={errCls}>{errors.email}</p>}
        </div>

        {/* Phone with country prefix badge */}
        <div>
          <label htmlFor="s3-phone" className={lbl}>
            {t('step3.phone', 'Nimewo Telefòn')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex gap-2">
            <div
              aria-label={t('step3.dial_code', 'Kòd peyi')}
              className="flex items-center gap-1.5 px-3 rounded-xl bg-[#162035] border border-gray-700 text-amber-400 font-bold text-sm flex-shrink-0 select-none"
            >
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.phonePrefix}</span>
            </div>
            <input
              id="s3-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={change}
              placeholder={t('step3.phone_ph', '3760-0000')}
              className={`${inp} flex-1 ${errors.phone ? 'border-red-500' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 's3-phone-err' : undefined}
            />
          </div>
          {errors.phone && <p id="s3-phone-err" className={errCls}>{errors.phone}</p>}
        </div>
      </div>

      {/* ── Section 2: Location ──────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel icon="📍" title={t('step3.section_location', 'Lokal')} />

        {/* Country */}
        <div>
          <label htmlFor="s3-countryCode" className={lbl}>
            {t('step3.country', 'Peyi')}
          </label>
          <select
            id="s3-countryCode"
            name="countryCode"
            value={form.countryCode}
            onChange={change}
            className={inp}
          >
            {COUNTRY_DATA.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {getCountryLabel(c, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label htmlFor="s3-region" className={lbl}>
            {t('step3.region', 'Rejyon / Depatman')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <select
            id="s3-region"
            name="region"
            value={form.region}
            onChange={change}
            className={`${inp} ${errors.region ? 'border-red-500' : ''}`}
            aria-required="true"
            aria-invalid={!!errors.region}
            aria-describedby={errors.region ? 's3-region-err' : undefined}
          >
            <option value="">{t('step3.region_select', 'Chwazi rejyon ou')}</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {errors.region && <p id="s3-region-err" className={errCls}>{errors.region}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="s3-city" className={lbl}>
            {t('step3.city', 'Vil')}
          </label>
          <input
            id="s3-city"
            name="city"
            value={form.city}
            onChange={change}
            placeholder={t('step3.city_ph', 'Port-au-Prince...')}
            className={inp}
            autoComplete="address-level2"
          />
        </div>
      </div>

      {/* ── Section 3: Account Security ──────────────────────── */}
      <div className="space-y-4">
        <SectionLabel icon="🔒" title={t('step3.section_security', 'Sekirite Kont')} />

        {/* Password */}
        <div>
          <label htmlFor="s3-password" className={lbl}>
            {t('step3.password', 'Modpas')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              id="s3-password"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={change}
              placeholder={t('step3.password_ph', 'Minimòm 8 karaktè')}
              className={`${inp} ${errors.password ? 'border-red-500' : ''} pr-11`}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby="s3-pw-strength"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? t('step3.hide_password', 'Kache modpas') : t('step3.show_password', 'Montre modpas')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition"
            >
              <EyeIcon show={showPass} />
            </button>
          </div>
          <div id="s3-pw-strength">
            <StrengthBar strength={pwStrength} t={t} />
            {errors.password && <p className={errCls}>{errors.password}</p>}
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="s3-confirmPassword" className={lbl}>
            {t('step3.confirm_password', 'Konfime Modpas')}
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              id="s3-confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={change}
              placeholder={t('step3.confirm_password_ph', 'Retape modpas ou')}
              className={`${inp} ${errors.confirmPassword ? 'border-red-500' : ''} pr-11`}
              aria-required="true"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 's3-confirm-err' : undefined}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? t('step3.hide_password', 'Kache modpas') : t('step3.show_password', 'Montre modpas')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition"
            >
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {errors.confirmPassword && <p id="s3-confirm-err" className={errCls}>{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-200 ${
          loading
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
        }`}
      >
        {loading
          ? t('common.processing', 'Ap trete...')
          : t('common.next', 'Kontinye')}
      </button>
    </form>
  );
}

export default memo(Step3_BasicInfo);
