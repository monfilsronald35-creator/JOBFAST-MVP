import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_COUNTRY = 'US';
const REGISTRATION_VERSION = '5.0.2';

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function normalizeText(v) {
  return String(v || '').trim();
}

function normalizeEmail(email) {
  return normalizeText(email).toLowerCase();
}

function isStrongPassword(password, blacklist = []) {
  const p = String(password || '');
  if (p.length < 12) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/\d/.test(p)) return false;
  if (!/[^\w\s]/.test(p)) return false;
  if (blacklist.some((x) => x && p.toLowerCase().includes(String(x).toLowerCase()))) return false;
  return true;
}

function isValidEmail(email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes('@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function getPasswordStrength(password) {
  const p = String(password || '');
  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 12) score += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^\w\s]/.test(p)) score += 1;
  if (score <= 1) return 'Weak';
  if (score === 2 || score === 3) return 'Medium';
  if (score === 4) return 'Strong';
  return 'Excellent';
}

export const apiClient = {
  async request(method, path, body, opts = {}) {
    const timeoutMs = opts.timeout || 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = opts.signal || controller.signal;

    try {
      const res = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(opts.headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(json?.message || `${method} ${path} failed`);
        error.status = res.status;
        error.data = json;
        throw error;
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  get(path, opts) {
    return this.request('GET', path, null, opts);
  },
  post(path, body, opts) {
    return this.request('POST', path, body, opts);
  },
  patch(path, body, opts) {
    return this.request('PATCH', path, body, opts);
  },
  delete(path, body, opts) {
    return this.request('DELETE', path, body, opts);
  },
};

function useOfflineQueue(queueAdapter) {
  return useCallback((payload) => {
    if (!queueAdapter?.enqueue) return;
    queueAdapter.enqueue({
      ...payload,
      security: {
        ...payload.security,
        password: undefined,
      },
    });
  }, [queueAdapter]);
}

function Step3_BasicInfo({
  data = {},
  onNext,
  onAutoSave,
  loading = false,
  countriesApiBase = '/api/v1/geo/countries',
  captchaToken,
  captchaProvider = 'turnstile',
  localeOverride,
  theme = {},
  onAnalytics,
  queueAdapter,
  api = apiClient,
}) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = localeOverride || i18n.language || 'en';
  const saveTimerRef = useRef(null);
  const submitAbortRef = useRef(null);
  const lastAnalyticsRef = useRef(0);

  const [form, setForm] = useState({
    username: data.username || '',
    displayName: data.displayName || data.fullName || '',
    slug: data.slug || '',
    referralCode: data.referralCode || '',
    inviteCode: data.inviteCode || '',
    campaign: data.campaign || '',
    affiliate: data.affiliate || '',
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    countryCode: data.countryCode || DEFAULT_COUNTRY,
    addressLevel1: data.addressLevel1 || '',
    addressLevel2: data.addressLevel2 || '',
    addressLevel3: data.addressLevel3 || '',
    city: data.city || '',
    postalCode: data.postalCode || '',
    password: '',
    confirmPassword: '',
    privacyAccepted: Boolean(data.privacyAccepted),
    termsAccepted: Boolean(data.termsAccepted),
    marketingConsent: Boolean(data.marketingConsent),
    cookiesConsent: Boolean(data.cookiesConsent),
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const debouncedForm = useDebouncedValue(form, 800);

  const themeVars = useMemo(() => ({
    '--c-primary': theme.primary || '#F59E0B',
    '--c-surface': theme.surface || '#0F172A',
    '--c-text': theme.text || '#F8FAFC',
    '--c-muted': theme.muted || '#94A3B8',
    '--c-border': theme.border || 'rgba(148,163,184,0.22)',
  }), [theme]);

  const analyticsEvent = useCallback((name, payload = {}) => {
    const now = Date.now();
    if (now - lastAnalyticsRef.current < 250) return;
    lastAnalyticsRef.current = now;
    try {
      onAnalytics?.(name, payload);
    } catch {}
  }, [onAnalytics]);

  useEffect(() => {
    analyticsEvent('registration_started', { step: 3 });
  }, [analyticsEvent]);

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onAutoSave?.({
        ...debouncedForm,
        security: { password: undefined },
      });
    }, 1200);
    return () => clearTimeout(saveTimerRef.current);
  }, [debouncedForm, onAutoSave]);

  const { data: countriesPayload } = useQuery({
    queryKey: ['countries', locale],
    queryFn: ({ signal }) =>
      api.get(`${countriesApiBase}?locale=${encodeURIComponent(locale)}&fields=code,name,flag,dialCode,subdivisions,timezones,currencies,locale,phoneMasks,taxIds`, { signal, timeout: 15000 }),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });

  const countries = useMemo(() => {
    const list = countriesPayload?.countries || countriesPayload || [];
    return Array.isArray(list) ? list : [];
  }, [countriesPayload]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === form.countryCode) || countries[0] || null,
    [countries, form.countryCode],
  );

  const validate = useCallback(() => {
    const e = {};
    const email = normalizeEmail(form.email);
    const phoneRaw = normalizeText(form.phone);
    const phoneInput = phoneRaw.startsWith('+')
      ? phoneRaw
      : `+${selectedCountry?.dialCode || ''}${phoneRaw}`;
    const parsedPhone = parsePhoneNumberFromString(phoneInput);

    const username = normalizeText(form.username);
    if (!username) e.username = 'required';
    else if (username.length < 3) e.username = 'too_short';
    else if (!/^[\p{L}\p{N}._-]+$/u.test(username)) e.username = 'invalid';
    else if (['admin', 'root', 'support', 'system'].includes(username.toLowerCase())) e.username = 'reserved';

    if (!normalizeText(form.displayName)) e.displayName = 'required';
    if (!normalizeText(form.fullName)) e.fullName = 'required';
    if (!isValidEmail(email)) e.email = 'invalid';
    if (!parsedPhone?.isValid?.()) e.phone = 'invalid';
    if (!normalizeText(form.countryCode)) e.countryCode = 'required';
    if (!isStrongPassword(form.password, [form.username, form.email, form.fullName])) e.password = 'weak';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'match';
    if (!form.privacyAccepted) e.privacyAccepted = 'required';
    if (!form.termsAccepted) e.termsAccepted = 'required';
    if (!captchaToken) e.captcha = 'required';

    setErrors(e);
    return { ok: Object.keys(e).length === 0, parsedPhone };
  }, [captchaToken, form, selectedCountry]);

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(form.password));
  }, [form.password]);

  const buildPayload = useCallback((parsedPhone) => ({
    profile: {
      username: normalizeText(form.username),
      displayName: normalizeText(form.displayName),
      slug: normalizeText(form.slug) || normalizeText(form.username).toLowerCase().replace(/\s+/g, '-'),
      fullName: normalizeText(form.fullName),
    },
    contact: {
      email: normalizeEmail(form.email),
      phone: parsedPhone?.number || normalizeText(form.phone),
      emailVerified: false,
      phoneVerified: false,
    },
    location: {
      countryCode: selectedCountry?.code || form.countryCode,
      countryName: selectedCountry?.name || '',
      subdivisions: {
        level1: normalizeText(form.addressLevel1),
        level2: normalizeText(form.addressLevel2),
        level3: normalizeText(form.addressLevel3),
      },
      city: normalizeText(form.city),
      postalCode: normalizeText(form.postalCode),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: selectedCountry?.currency || '',
      language: locale,
    },
    security: {
      captchaProvider,
      captchaToken,
      deviceFingerprint: data.deviceFingerprint || null,
      browser: navigator?.userAgent || '',
      platform: navigator?.platform || '',
      os: navigator?.userAgentData?.platform || '',
    },
    verification: {
      kycStatus: data.kycStatus || 'pending',
      identityStatus: data.identityStatus || 'unverified',
      emailVerified: false,
      phoneVerified: false,
    },
    consents: {
      privacyAccepted: form.privacyAccepted,
      termsAccepted: form.termsAccepted,
      marketingConsent: form.marketingConsent,
      cookiesConsent: form.cookiesConsent,
      termsVersion: data.termsVersion || REGISTRATION_VERSION,
      privacyVersion: data.privacyVersion || REGISTRATION_VERSION,
    },
    referral: {
      referralCode: normalizeText(form.referralCode),
      inviteCode: normalizeText(form.inviteCode),
      campaign: normalizeText(form.campaign),
      affiliate: normalizeText(form.affiliate),
    },
    preferences: {
      language: locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    metadata: {
      registrationVersion: REGISTRATION_VERSION,
      source: 'web',
      createdAt: new Date().toISOString(),
    },
  }), [captchaProvider, captchaToken, data, form, locale, selectedCountry]);

  const queuePayload = useOfflineQueue(queueAdapter);

  const registrationMutation = useMutation({
    mutationFn: async ({ payload, signal }) => api.post('/api/v1/auth/register/basic-info', payload, { signal, timeout: 20000 }),
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: ['registration-step3'] });
      const previous = queryClient.getQueryData(['registration-step3']);
      queryClient.setQueryData(['registration-step3'], payload);
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) queryClient.setQueryData(['registration-step3'], context.previous);
      queuePayload(variables?.payload);
      analyticsEvent('submit_failed', { message: error?.message || 'unknown' });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['registration-step3-result'], result);
      analyticsEvent('submit_success', {});
      onNext?.(result);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-step3'] });
    },
    retry: (failureCount) => failureCount < 3,
    networkMode: 'offlineFirst',
    meta: { feature: 'registration_step3' },
  });

  const submit = useCallback(() => {
    if (loading || registrationMutation.isPending) return;
    submitAbortRef.current?.abort?.();
    const controller = new AbortController();
    submitAbortRef.current = controller;

    const { ok, parsedPhone } = validate();
    if (!ok) return;

    analyticsEvent('submit_clicked', {});
    const payload = buildPayload(parsedPhone);
    registrationMutation.mutate({ payload, signal: controller.signal });
  }, [analyticsEvent, buildPayload, loading, registrationMutation, validate]);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      aria-busy={loading || registrationMutation.isPending}
      className="w-full space-y-4"
      style={themeVars}
    >
      <input name="username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} autoComplete="username" placeholder={t('registration.username', { defaultValue: 'Username' })} aria-describedby="username-help username-error" aria-errormessage="username-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <p id="username-help" className="text-xs text-[var(--c-muted)]">{t('registration.username_help', { defaultValue: 'Use a unique username' })}</p>
      {errors.username ? <p id="username-error" role="alert" className="text-xs text-red-400">{t(`registration.errors.${errors.username}`, { defaultValue: t('errors.required') })}</p> : null}

      <input name="displayName" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} autoComplete="name" placeholder={t('registration.display_name', { defaultValue: 'Display name' })} aria-describedby="displayName-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.displayName ? <p id="displayName-error" role="alert" className="text-xs text-red-400">{t('errors.required')}</p> : null}

      <input name="fullName" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} autoComplete="name" placeholder={t('registration.full_name')} aria-describedby="fullName-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.fullName ? <p id="fullName-error" role="alert" className="text-xs text-red-400">{t('errors.required')}</p> : null}

      <input name="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} autoComplete="email" placeholder={t('registration.email')} aria-describedby="email-error" spellCheck="false" inputMode="email" enterKeyHint="next" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.email ? <p id="email-error" role="alert" className="text-xs text-red-400">{t('errors.email_invalid')}</p> : null}

      <input name="phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} autoComplete="tel" placeholder={t('registration.phone')} aria-describedby="phone-error" inputMode="tel" enterKeyHint="next" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.phone ? <p id="phone-error" role="alert" className="text-xs text-red-400">{t('errors.phone_invalid', { defaultValue: 'Invalid phone number' })}</p> : null}

      <select name="countryCode" value={form.countryCode} onChange={(e) => { setForm((p) => ({ ...p, countryCode: e.target.value })); analyticsEvent('country_selected', { countryCode: e.target.value }); }} aria-describedby="country-help" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none">
        {(Array.isArray(countries) ? countries : []).map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag ? `${c.flag} ` : ''}{c.name || c.label || c.code}
          </option>
        ))}
      </select>

      <p id="country-help" className="text-xs text-[var(--c-muted)]">{t('registration.country_help', { defaultValue: 'Country list is loaded from API' })}</p>

      <input name="addressLevel1" value={form.addressLevel1} onChange={(e) => setForm((p) => ({ ...p, addressLevel1: e.target.value }))} placeholder={t('registration.address_line_1', { defaultValue: 'Address line 1' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="addressLevel2" value={form.addressLevel2} onChange={(e) => setForm((p) => ({ ...p, addressLevel2: e.target.value }))} placeholder={t('registration.address_line_2', { defaultValue: 'Address line 2' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="addressLevel3" value={form.addressLevel3} onChange={(e) => setForm((p) => ({ ...p, addressLevel3: e.target.value }))} placeholder={t('registration.address_line_3', { defaultValue: 'Address line 3' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="city" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder={t('registration.city')} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="postalCode" value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder={t('registration.postal_code', { defaultValue: 'Postal code' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />

      <input name="password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" placeholder={t('registration.password')} aria-describedby="password-help password-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <p id="password-help" className="text-xs text-[var(--c-muted)]">
        {t('registration.password_strength', { defaultValue: 'Strength' })}: {passwordStrength}
      </p>
      {errors.password ? <p id="password-error" role="alert" className="text-xs text-red-400">{t('registration.errors.weak_password', { defaultValue: 'Password is too weak' })}</p> : null}

      <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} autoComplete="new-password" placeholder={t('registration.confirm_password')} aria-describedby="confirmPassword-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.confirmPassword ? <p id="confirmPassword-error" role="alert" className="text-xs text-red-400">{t('registration.errors.passwordMismatch', { defaultValue: 'Modpas yo pa menm' })}</p> : null}

      <label className="flex items-center gap-2 text-sm text-[var(--c-text)]">
        <input type="checkbox" name="privacyAccepted" checked={form.privacyAccepted} onChange={(e) => setForm((p) => ({ ...p, privacyAccepted: e.target.checked }))} />
        {t('registration.privacy_accept', { defaultValue: 'I accept the privacy policy' })}
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--c-text)]">
        <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={(e) => setForm((p) => ({ ...p, termsAccepted: e.target.checked }))} />
        {t('registration.terms_accept', { defaultValue: 'I accept the terms' })}
      </label>

      <button
        disabled={loading || registrationMutation.isPending}
        type="submit"
        className={`w-full rounded p-4 font-bold transition ${loading || registrationMutation.isPending ? 'bg-gray-500 text-gray-300' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
      >
        {loading || registrationMutation.isPending ? t('common.processing') : t('common.next')}
      </button>
    </form>
  );
}

Step3_BasicInfo.propTypes = {
  data: PropTypes.object,
  onNext: PropTypes.func,
  onAutoSave: PropTypes.func,
  loading: PropTypes.bool,
  countriesApiBase: PropTypes.string,
  captchaToken: PropTypes.string,
  localeOverride: PropTypes.string,
  theme: PropTypes.object,
  onAnalytics: PropTypes.func,
  queueAdapter: PropTypes.shape({
    enqueue: PropTypes.func,
  }),
  api: PropTypes.shape({
    get: PropTypes.func,
    post: PropTypes.func,
    patch: PropTypes.func,
    delete: PropTypes.func,
  }),
};

export default memo(Step3_BasicInfo);
