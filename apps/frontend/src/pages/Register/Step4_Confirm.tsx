import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

function formatPhone(phone: unknown, defaultCountry: string = 'US'): string {
  const raw = String(phone || '').trim();
  if (!raw) return '—';

  const parsed = parsePhoneNumberFromString(raw, defaultCountry as 'US');
  if (parsed?.formatInternational) {
    return parsed.formatInternational();
  }

  return raw;
}

interface AvatarUser {
  avatarUrl?: string;
  fullName?: string;
  username?: string;
}

function Avatar({ user }: { user: AvatarUser }) {
  const src = user?.avatarUrl;
  const fallback = (user?.username ?? user?.fullName ?? '?').trim().charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={user?.fullName ?? user?.username ?? 'Avatar'}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-20 w-20 rounded-full object-cover ring-2 ring-yellow-400/40"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400/15 text-3xl font-black text-yellow-300 ring-2 ring-yellow-400/40">
      {fallback}
    </div>
  );
}

function StatusRow({ label, value, status }: { label: string; value?: string; status?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-700 py-3 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">{value ?? '—'}</p>
        {status ? <p className="text-[11px] text-slate-500">{status}</p> : null}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-yellow-400 transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface ApiError extends Error {
  status?: number;
  data?: { message?: string; error?: string };
}

interface ApiClientShape {
  post?: (path: string, body: unknown, opts?: Record<string, unknown>) => Promise<unknown>;
}

interface VerificationData {
  email?: string;
  phone?: string;
  identity?: string;
}

interface ConsentsData {
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  cookiesConsent?: boolean;
  marketingConsent?: boolean;
}

interface FormDataProp {
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  countryName?: string;
  country?: string;
  city?: string;
  professionLabel?: string;
  profession?: string;
  role?: string;
  accountType?: string;
  language?: string;
  locale?: string;
  registrationId?: string;
  draftId?: string;
  idempotencyKey?: string;
  verification?: VerificationData;
  consents?: ConsentsData;
}

interface Step4ConfirmProps {
  formData?: FormDataProp;
  onSubmit?: (data: unknown) => void;
  onBack?: () => void;
  apiClient?: ApiClientShape;
  tKeyPrefix?: string;
}

export default function Step4_Confirm({
  formData,
  onSubmit,
  onBack,
  apiClient,
  tKeyPrefix = 'registration',
}: Step4ConfirmProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user: FormDataProp = formData ?? {};
  const submittingRef = useRef<boolean>(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [serverError, setServerError] = useState('');

  const registrationId = user.registrationId ?? user.draftId ?? null;

  const displayName = user.displayName ?? user.fullName ?? user.username ?? t(`${tKeyPrefix}.unnamed_user`, { defaultValue: 'User' });
  const accountType = user.accountType ?? user.role ?? 'Worker';
  const countryName = user.countryName ?? user.country ?? '';
  const city = user.city ?? '';
  const profession = user.professionLabel ?? user.profession ?? user.role ?? '';
  const language = user.language ?? user.locale ?? 'English';
  const verification: VerificationData = user.verification ?? {};
  const consents: ConsentsData = user.consents ?? {};

  const invalidateKeys = useMemo(
    () => ['me', 'profile', 'wallet', 'notifications', 'settings', 'dashboard', 'permissions', 'session'],
    [],
  );

  useEffect(() => () => {
    controllerRef.current?.abort?.();
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
  }, []);

  const mutation = useMutation<unknown, ApiError, { signal: AbortSignal }, void>({
    mutationFn: async ({ signal }) => {
      if (!registrationId) {
        throw Object.assign(
          new Error(t(`${tKeyPrefix}.missing_registration_id`, { defaultValue: 'Missing registration ID' })),
          { status: 400 },
        );
      }

      if (!apiClient?.post) {
        return { ok: true, registrationId, confirmation: true };
      }

      return apiClient.post(
        '/api/v1/auth/register/complete',
        { registrationId, confirmation: true },
        {
          signal,
          timeout: 30000,
          headers: {
            'Idempotency-Key': user.idempotencyKey ?? `${registrationId}:confirm`,
          },
        },
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['registration-complete', registrationId], data);
      invalidateKeys.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [key] });
      });
      onSubmit?.(data);
    },
    onError: (error) => {
      const message =
        error?.data?.message ??
        error?.message ??
        t(`${tKeyPrefix}.submit_failed`, { defaultValue: 'Could not create your account.' });
      setServerError(message);
    },
    retry: false,
    networkMode: 'offlineFirst',
    meta: { feature: 'registration_confirm' },
  });

  const handleCreate = useCallback((): void => {
    if (submittingRef.current || mutation.isPending) return;

    submittingRef.current = true;
    setServerError('');
    controllerRef.current?.abort?.();
    controllerRef.current = new AbortController();

    mutation.mutate(
      { signal: controllerRef.current.signal },
      {
        onSettled: () => {
          submittingRef.current = false;
        },
      },
    );
  }, [mutation]);

  const consentRow = (label: string, ok: boolean): React.ReactNode => (
    <p className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? '✅' : '❌'}</span>
    </p>
  );

  const verificationRows = [
    { label: t(`${tKeyPrefix}.email`, { defaultValue: 'Email' }), value: verification.email ?? 'Pending' },
    { label: t(`${tKeyPrefix}.phone`, { defaultValue: 'Phone' }), value: verification.phone ?? 'Pending' },
    { label: t(`${tKeyPrefix}.identity`, { defaultValue: 'Identity' }), value: verification.identity ?? 'Pending' },
  ];

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400/40 bg-yellow-400/15" aria-hidden="true">
          {mutation.isSuccess ? (
            <span className="animate-pulse text-4xl">✅</span>
          ) : mutation.isPending ? (
            <span className="animate-spin text-3xl">⏳</span>
          ) : (
            <span className="text-4xl text-yellow-300">✅</span>
          )}
        </div>

        <Avatar user={user} />

        <div>
          <h2 className="text-2xl font-black">{displayName}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {profession || t(`${tKeyPrefix}.account_ready`, { defaultValue: 'Ready to create account' })}
          </p>
        </div>

        {(city || countryName) ? (
          <p className="text-sm text-slate-300">
            {city ? `📍 ${city}` : null}
            {city && countryName ? ' · ' : null}
            {countryName}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-4" aria-live="polite" role="status">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          {mutation.isPending ? (
            <>
              <ProgressBar value={50} />
              <p className="mt-3 text-center text-sm text-slate-300">
                {t(`${tKeyPrefix}.processing`, { defaultValue: 'Processing...' })}
              </p>
            </>
          ) : null}

          {mutation.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
              {serverError}
              <button type="button" onClick={() => { setServerError(''); mutation.reset(); }} className="ml-3 underline">
                {t(`${tKeyPrefix}.retry`, { defaultValue: 'Retry' })}
              </button>
            </div>
          ) : null}

          {mutation.isSuccess ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status" aria-live="polite">
              {t(`${tKeyPrefix}.create_account_success`, { defaultValue: 'Account created' })}
            </div>
          ) : null}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <StatusRow label={t(`${tKeyPrefix}.username`, { defaultValue: 'Username' })} value={user.username} />
          <StatusRow label={t(`${tKeyPrefix}.full_name`, { defaultValue: 'Full Name' })} value={user.fullName} />
          <StatusRow label={t(`${tKeyPrefix}.email`, { defaultValue: 'Email' })} value={user.email} />
          <StatusRow label={t(`${tKeyPrefix}.phone`, { defaultValue: 'Phone' })} value={formatPhone(user.phone, user.countryCode)} />
          <StatusRow label={t(`${tKeyPrefix}.country`, { defaultValue: 'Country' })} value={countryName} />
          <StatusRow label={t(`${tKeyPrefix}.city`, { defaultValue: 'City' })} value={city} />
          <StatusRow label={t(`${tKeyPrefix}.profession`, { defaultValue: 'Profession' })} value={profession} />
          <StatusRow label={t(`${tKeyPrefix}.language`, { defaultValue: 'Language' })} value={language} />
          <StatusRow label={t(`${tKeyPrefix}.account_type`, { defaultValue: 'Account Type' })} value={accountType} />
          {verificationRows.map((row) => (
            <StatusRow key={row.label} label={row.label} value={row.value} />
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="mb-3 text-sm font-semibold text-white">{t(`${tKeyPrefix}.accepted`, { defaultValue: 'Accepted' })}</p>
          <div className="space-y-2 text-sm text-slate-300">
            {consents.privacyAccepted ? consentRow(t(`${tKeyPrefix}.privacy_policy`, { defaultValue: 'Privacy Policy' }), true) : null}
            {consents.termsAccepted ? consentRow(t(`${tKeyPrefix}.terms`, { defaultValue: 'Terms' }), true) : null}
            {consents.cookiesConsent ? consentRow(t(`${tKeyPrefix}.cookies`, { defaultValue: 'Cookies' }), true) : null}
            {typeof consents.marketingConsent === 'boolean' ? consentRow(t(`${tKeyPrefix}.marketing`, { defaultValue: 'Marketing' }), consents.marketingConsent) : null}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200"
            disabled={mutation.isPending}
          >
            {t('common.back', { defaultValue: 'Back' })}
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={mutation.isPending || !registrationId}
            className={`flex-[2] rounded-2xl px-4 py-3 text-sm font-black transition ${mutation.isPending ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-slate-950 hover:opacity-95'}`}
            aria-describedby="create-account-help"
          >
            {mutation.isPending ? t(`${tKeyPrefix}.processing`, { defaultValue: 'Processing...' }) : t(`${tKeyPrefix}.create_account`, { defaultValue: 'Create Account' })}
          </button>
        </div>

        <p id="create-account-help" className="text-center text-xs text-slate-500">
          {mutation.isPending ? t(`${tKeyPrefix}.please_wait`, { defaultValue: 'Please wait while we finish setup.' }) : ''}
        </p>
      </div>
    </div>
  );
}