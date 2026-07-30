import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_COUNTRY = 'US';
const REGISTRATION_VERSION = '5.0.2';

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function normalizeText(v: unknown): string {
  return String(v || '').trim();
}

function normalizeEmail(email: unknown): string {
  return normalizeText(email).toLowerCase();
}

function isStrongPassword(password: unknown, blacklist: unknown[] = []): boolean {
  const p = String(password || '');
  if (p.length < 12) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/\d/.test(p)) return false;
  if (!/[^\w\s]/.test(p)) return false;
  if (blacklist.some((x) => x && p.toLowerCase().includes(String(x).toLowerCase()))) return false;
  return true;
}

function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e || !e.includes('@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function getPasswordStrength(password: unknown): string {
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

interface ApiRequestOpts {
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export const apiClient = {
  async request(method: string, path: string, body: unknown, opts: ApiRequestOpts = {}): Promise<unknown> {
    const timeoutMs = opts.timeout ?? 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = opts.signal ?? controller.signal;

    try {
      const res = await fetch(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(opts.headers ?? {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw Object.assign(new Error((json?.['message'] as string) || `${method} ${path} failed`), {
          status: res.status,
          data: json,
        });
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  get(path: string, opts?: ApiRequestOpts): Promise<unknown> {
    return this.request('GET', path, null, opts);
  },
  post(path: string, body: unknown, opts?: ApiRequestOpts): Promise<unknown> {
    return this.request('POST', path, body, opts);
  },
  patch(path: string, body: unknown, opts?: ApiRequestOpts): Promise<unknown> {
    return this.request('PATCH', path, body, opts);
  },
  delete(path: string, body: unknown, opts?: ApiRequestOpts): Promise<unknown> {
    return this.request('DELETE', path, body, opts);
  },
};

type ApiClientShape = typeof apiClient;

interface QueueAdapter {
  enqueue?: (payload: unknown) => void;
}

function useOfflineQueue(queueAdapter?: QueueAdapter): (payload: unknown) => void {
  return useCallback((payload: unknown): void => {
    if (!queueAdapter?.enqueue) return;
    queueAdapter.enqueue({
      ...(payload as Record<string, unknown>),
      security: {
        ...((payload as Record<string, unknown>)['security'] as Record<string, unknown> | undefined),
        password: undefined,
      },
    });
  }, [queueAdapter]);
}

interface Country {
  code: string;
  name?: string;
  label?: string;
  flag?: string;
  dialCode?: string;
  currency?: string;
}

interface FormState {
  username: string;
  displayName: string;
  slug: string;
  referralCode: string;
  inviteCode: string;
  campaign: string;
  affiliate: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  addressLevel1: string;
  addressLevel2: string;
  addressLevel3: string;
  city: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  marketingConsent: boolean;
  cookiesConsent: boolean;
}

interface FormErrors {
  username?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  confirmPassword?: string;
  privacyAccepted?: string;
  termsAccepted?: string;
  captcha?: string;
}

interface DataProp {
  username?: string;
  displayName?: string;
  fullName?: string;
  slug?: string;
  referralCode?: string;
  inviteCode?: string;
  campaign?: string;
  affiliate?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  addressLevel1?: string;
  addressLevel2?: string;
  addressLevel3?: string;
  city?: string;
  postalCode?: string;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  cookiesConsent?: boolean;
  deviceFingerprint?: string | null;
  kycStatus?: string;
  identityStatus?: string;
  termsVersion?: string;
  privacyVersion?: string;
}

interface Step3Props {
  data?: DataProp;
  onNext?: (result: unknown) => void;
  onAutoSave?: (data: unknown) => void;
  loading?: boolean;
  countriesApiBase?: string;
  captchaToken?: string;
  captchaProvider?: string;
  localeOverride?: string;
  theme?: {
    primary?: string;
    surface?: string;
    text?: string;
    muted?: string;
    border?: string;
  };
  onAnalytics?: (name: string, payload: Record<string, unknown>) => void;
  queueAdapter?: QueueAdapter;
  api?: ApiClientShape;
}

type CSSVars = React.CSSProperties & Record<`--c-${string}`, string>;

type MutationContext = { previous: unknown };

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
}: Step3Props) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const locale = localeOverride ?? i18n.language ?? 'en';
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitAbortRef = useRef<AbortController | null>(null);
  const lastAnalyticsRef = useRef<number>(0);

  const [form, setForm] = useState<FormState>({
    username: data.username ?? '',
    displayName: data.displayName ?? data.fullName ?? '',
    slug: data.slug ?? '',
    referralCode: data.referralCode ?? '',
    inviteCode: data.inviteCode ?? '',
    campaign: data.campaign ?? '',
    affiliate: data.affiliate ?? '',
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    countryCode: data.countryCode ?? DEFAULT_COUNTRY,
    addressLevel1: data.addressLevel1 ?? '',
    addressLevel2: data.addressLevel2 ?? '',
    addressLevel3: data.addressLevel3 ?? '',
    city: data.city ?? '',
    postalCode: data.postalCode ?? '',
    password: '',
    confirmPassword: '',
    privacyAccepted: Boolean(data.privacyAccepted),
    termsAccepted: Boolean(data.termsAccepted),
    marketingConsent: Boolean(data.marketingConsent),
    cookiesConsent: Boolean(data.cookiesConsent),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const debouncedForm = useDebouncedValue(form, 800);

  const themeVars = useMemo(
    (): CSSVars => ({
      '--c-primary': theme.primary ?? '#F59E0B',
      '--c-surface': theme.surface ?? '#0F172A',
      '--c-text': theme.text ?? '#F8FAFC',
      '--c-muted': theme.muted ?? '#94A3B8',
      '--c-border': theme.border ?? 'rgba(148,163,184,0.22)',
    } as CSSVars),
    [theme],
  );

  const analyticsEvent = useCallback(
    (name: string, payload: Record<string, unknown> = {}): void => {
      const now = Date.now();
      if (now - lastAnalyticsRef.current < 250) return;
      lastAnalyticsRef.current = now;
      try {
        onAnalytics?.(name, payload);
      } catch { }
    },
    [onAnalytics],
  );

  useEffect(() => {
    analyticsEvent('registration_started', { step: 3 });
  }, [analyticsEvent]);

  useEffect(() => {
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onAutoSave?.({
        ...debouncedForm,
        security: { password: undefined },
      });
    }, 1200);
    return () => {
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    };
  }, [debouncedForm, onAutoSave]);

  const { data: countriesPayload } = useQuery<unknown>({
    queryKey: ['countries', locale],
    queryFn: ({ signal }) =>
      api.get(
        `${countriesApiBase}?locale=${encodeURIComponent(locale)}&fields=code,name,flag,dialCode,subdivisions,timezones,currencies,locale,phoneMasks,taxIds`,
        { signal, timeout: 15000 },
      ),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
  });

  const countries = useMemo<Country[]>(() => {
    const payload = countriesPayload as Record<string, unknown> | unknown[] | null | undefined;
    const list = (payload as Record<string, unknown>)?.['countries'] ?? payload ?? [];
    return Array.isArray(list) ? (list as Country[]) : [];
  }, [countriesPayload]);

  const selectedCountry = useMemo<Country | null>(
    () => countries.find((c) => c.code === form.countryCode) ?? countries[0] ?? null,
    [countries, form.countryCode],
  );

  const validate = useCallback((): { ok: boolean; parsedPhone: ReturnType<typeof parsePhoneNumberFromString> } => {
    const e: FormErrors = {};
    const email = normalizeEmail(form.email);
    const phoneRaw = normalizeText(form.phone);
    const phoneInput = phoneRaw.startsWith('+')
      ? phoneRaw
      : `+${selectedCountry?.dialCode ?? ''}${phoneRaw}`;
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

  const buildPayload = useCallback(
    (parsedPhone: ReturnType<typeof parsePhoneNumberFromString>): Record<string, unknown> => ({
      profile: {
        username: normalizeText(form.username),
        displayName: normalizeText(form.displayName),
        slug: normalizeText(form.slug) || normalizeText(form.username).toLowerCase().replace(/\s+/g, '-'),
        fullName: normalizeText(form.fullName),
      },
      contact: {
        email: normalizeEmail(form.email),
        phone: parsedPhone?.number ?? normalizeText(form.phone),
        emailVerified: false,
        phoneVerified: false,
      },
      location: {
        countryCode: selectedCountry?.code ?? form.countryCode,
        countryName: selectedCountry?.name ?? '',
        subdivisions: {
          level1: normalizeText(form.addressLevel1),
          level2: normalizeText(form.addressLevel2),
          level3: normalizeText(form.addressLevel3),
        },
        city: normalizeText(form.city),
        postalCode: normalizeText(form.postalCode),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: selectedCountry?.currency ?? '',
        language: locale,
      },
      security: {
        captchaProvider,
        captchaToken,
        deviceFingerprint: data.deviceFingerprint ?? null,
        browser: navigator?.userAgent ?? '',
        platform: navigator?.platform ?? '',
        os: (navigator as Record<string, unknown>)?.['userAgentData'] ? ((navigator as Record<string, unknown>)['userAgentData'] as Record<string, unknown>)?.['platform'] ?? '' : '',
      },
      verification: {
        kycStatus: data.kycStatus ?? 'pending',
        identityStatus: data.identityStatus ?? 'unverified',
        emailVerified: false,
        phoneVerified: false,
      },
      consents: {
        privacyAccepted: form.privacyAccepted,
        termsAccepted: form.termsAccepted,
        marketingConsent: form.marketingConsent,
        cookiesConsent: form.cookiesConsent,
        termsVersion: data.termsVersion ?? REGISTRATION_VERSION,
        privacyVersion: data.privacyVersion ?? REGISTRATION_VERSION,
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
    }),
    [captchaProvider, captchaToken, data, form, locale, selectedCountry],
  );

  const queuePayload = useOfflineQueue(queueAdapter);

  const registrationMutation = useMutation<
    unknown,
    Error,
    { payload: unknown; signal: AbortSignal },
    MutationContext
  >({
    mutationFn: async ({ payload, signal }) =>
      api.post('/api/v1/auth/register/basic-info', payload, { signal, timeout: 20000 }),
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: ['registration-step3'] });
      const previous = queryClient.getQueryData(['registration-step3']);
      queryClient.setQueryData(['registration-step3'], payload);
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) queryClient.setQueryData(['registration-step3'], context.previous);
      queuePayload(variables?.payload);
      analyticsEvent('submit_failed', { message: error?.message ?? 'unknown' });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['registration-step3-result'], result);
      analyticsEvent('submit_success', {});
      onNext?.(result);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['registration-step3'] });
    },
    retry: (failureCount) => failureCount < 3,
    networkMode: 'offlineFirst',
    meta: { feature: 'registration_step3' },
  });

  const submit = useCallback((): void => {
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

  const handleInput = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
      },
    [],
  );

  const handleCheck = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        setForm((p) => ({ ...p, [field]: e.target.checked }));
      },
    [],
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      aria-busy={loading || registrationMutation.isPending}
      className="w-full space-y-4"
      style={themeVars}
    >
      <input name="username" value={form.username} onChange={handleInput('username')} autoComplete="username" placeholder={t('registration.username', { defaultValue: 'Username' })} aria-describedby="username-help username-error" aria-errormessage="username-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <p id="username-help" className="text-xs text-[var(--c-muted)]">{t('registration.username_help', { defaultValue: 'Use a unique username' })}</p>
      {errors.username ? <p id="username-error" role="alert" className="text-xs text-red-400">{t(`registration.errors.${errors.username}`, { defaultValue: t('errors.required') })}</p> : null}

      <input name="displayName" value={form.displayName} onChange={handleInput('displayName')} autoComplete="name" placeholder={t('registration.display_name', { defaultValue: 'Display name' })} aria-describedby="displayName-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.displayName ? <p id="displayName-error" role="alert" className="text-xs text-red-400">{t('errors.required')}</p> : null}

      <input name="fullName" value={form.fullName} onChange={handleInput('fullName')} autoComplete="name" placeholder={t('registration.full_name')} aria-describedby="fullName-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.fullName ? <p id="fullName-error" role="alert" className="text-xs text-red-400">{t('errors.required')}</p> : null}

      <input name="email" type="email" value={form.email} onChange={handleInput('email')} autoComplete="email" placeholder={t('registration.email')} aria-describedby="email-error" spellCheck={false} inputMode="email" enterKeyHint="next" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.email ? <p id="email-error" role="alert" className="text-xs text-red-400">{t('errors.email_invalid')}</p> : null}

      <input name="phone" type="tel" value={form.phone} onChange={handleInput('phone')} autoComplete="tel" placeholder={t('registration.phone')} aria-describedby="phone-error" inputMode="tel" enterKeyHint="next" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.phone ? <p id="phone-error" role="alert" className="text-xs text-red-400">{t('errors.phone_invalid', { defaultValue: 'Invalid phone number' })}</p> : null}

      <select name="countryCode" value={form.countryCode} onChange={(e) => { setForm((p) => ({ ...p, countryCode: e.target.value })); analyticsEvent('country_selected', { countryCode: e.target.value }); }} aria-describedby="country-help" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none">
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag ? `${c.flag} ` : ''}{c.name ?? c.label ?? c.code}
          </option>
        ))}
      </select>

      <p id="country-help" className="text-xs text-[var(--c-muted)]">{t('registration.country_help', { defaultValue: 'Country list is loaded from API' })}</p>

      <input name="addressLevel1" value={form.addressLevel1} onChange={handleInput('addressLevel1')} placeholder={t('registration.address_line_1', { defaultValue: 'Address line 1' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="addressLevel2" value={form.addressLevel2} onChange={handleInput('addressLevel2')} placeholder={t('registration.address_line_2', { defaultValue: 'Address line 2' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="addressLevel3" value={form.addressLevel3} onChange={handleInput('addressLevel3')} placeholder={t('registration.address_line_3', { defaultValue: 'Address line 3' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="city" value={form.city} onChange={handleInput('city')} placeholder={t('registration.city')} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <input name="postalCode" value={form.postalCode} onChange={handleInput('postalCode')} placeholder={t('registration.postal_code', { defaultValue: 'Postal code' })} className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />

      <input name="password" type="password" value={form.password} onChange={handleInput('password')} autoComplete="new-password" placeholder={t('registration.password')} aria-describedby="password-help password-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      <p id="password-help" className="text-xs text-[var(--c-muted)]">
        {t('registration.password_strength', { defaultValue: 'Strength' })}: {passwordStrength}
      </p>
      {errors.password ? <p id="password-error" role="alert" className="text-xs text-red-400">{t('registration.errors.weak_password', { defaultValue: 'Password is too weak' })}</p> : null}

      <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleInput('confirmPassword')} autoComplete="new-password" placeholder={t('registration.confirm_password')} aria-describedby="confirmPassword-error" className="w-full rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-3 text-[var(--c-text)] outline-none" />
      {errors.confirmPassword ? <p id="confirmPassword-error" role="alert" className="text-xs text-red-400">{t('registration.errors.passwordMismatch', { defaultValue: 'Modpas yo pa menm' })}</p> : null}

      <label className="flex items-center gap-2 text-sm text-[var(--c-text)]">
        <input type="checkbox" name="privacyAccepted" checked={form.privacyAccepted} onChange={handleCheck('privacyAccepted')} />
        {t('registration.privacy_accept', { defaultValue: 'I accept the privacy policy' })}
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--c-text)]">
        <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={handleCheck('termsAccepted')} />
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

export default memo(Step3_BasicInfo);