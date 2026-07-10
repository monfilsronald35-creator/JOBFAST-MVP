/**
 * AvailabilityStatus.jsx — Enterprise Edition
 *
 * Enterprise-grade availability status manager for JOBFAST.
 * Supports all platform roles with role-aware status options.
 *
 * Architecture:
 *  - Business logic isolated in useAvailabilityUpdate hook
 *  - Sub-components memoized for performance
 *  - Full i18n via existing react-i18next system (ht/fr/en/es)
 *  - Reuses existing API client (JWT auth, retry, 65s timeout)
 *  - Optimistic update with server-confirmed rollback
 *  - Request cancellation via AbortController
 *  - WCAG 2.2 AA accessibility (radiogroup, aria-checked, aria-live)
 *  - WebSocket-ready architecture (slot commented below hook)
 *
 * API contracts (unchanged):
 *  Workers    → PATCH /api/v1/workers/availability
 *  Providers  → PATCH /api/v1/marketplace/availability
 *  Others     → optimistic-only (no server call)
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, WifiOff, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getRoleAvailabilityStates } from '../config/gpsConfig';
import API from '../api/axios';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

/** Roles that hit the marketplace endpoint. Worker hits its own; others are optimistic-only. */
const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism',    'hospital', 'clinic', 'service_provider',
]);

/** Typed feedback categories — avoids magic strings. */
const FT = Object.freeze({
  SUCCESS:  'success',
  ERROR:    'error',
  OFFLINE:  'offline',
  ROLLBACK: 'rollback',
});

// ════════════════════════════════════════════════════════════════════════════
// PURE UTILITIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Returns the PATCH endpoint path (relative, no base URL) for a role,
 * or null if the role is optimistic-only.
 * API base is handled by the axios instance — never duplicate it here.
 */
function getAvailabilityEndpoint(role) {
  if (role === 'worker') return '/workers/availability';
  if (MARKETPLACE_PROVIDER_ROLES.has(role)) return '/marketplace/availability';
  return null;
}

/**
 * Builds the next user object for AuthContext optimistic update.
 * Pure function — no side effects. Safe to call without mutating state.
 */
function buildOptimisticUser(user, role, availability) {
  if (role === 'worker') return { ...user, availability };
  return {
    ...user,
    availability,
    marketplaceData: { ...(user?.marketplaceData ?? {}), availability },
  };
}

/** Returns true only if statusId appears in the options list for the role. */
function isValidStatus(statusId, options) {
  return options.some(o => o.id === statusId);
}

/** Normalises a role key to a display-friendly name. */
function displayRole(role) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS LOGIC HOOK
// ════════════════════════════════════════════════════════════════════════════

/**
 * useAvailabilityUpdate
 *
 * Encapsulates all availability-update business logic.
 * The main component is a thin composition layer over this hook.
 *
 * WebSocket slot: a future real-time channel can replace/supplement
 * the doUpdate function without touching the component tree.
 */
function useAvailabilityUpdate({ user, role, options, login, navigate, t }) {
  const userId = user?._id || user?.id;

  // Derive canonical current availability once — avoids re-deriving on every render.
  const currentAvailability = useMemo(() => (
    user?.availability
    ?? user?.marketplaceData?.availability
    ?? options[0]?.id
    ?? 'available'
  ), [user, options]);

  const [selected,  setSelected]  = useState(currentAvailability);
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState(null);   // { type: FT.*, message: string }
  const [retryId,   setRetryId]   = useState(null);   // last failed statusId for retry

  const mountedRef  = useRef(true);
  const abortRef    = useRef(null);
  const snapshotRef = useRef(user); // rollback target — always last confirmed server state

  // Track mount/unmount; capture initial snapshot.
  useEffect(() => {
    mountedRef.current = true;
    snapshotRef.current = user;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** True only when a valid, different status is selected and not currently saving. */
  const canSave = useMemo(() => (
    isValidStatus(selected, options) && !saving
  ), [selected, options, saving]);

  // ── Core update function ────────────────────────────────────────────────
  const doUpdate = useCallback(async (statusId) => {
    // Guard: reject unknown status IDs before touching any state.
    if (!isValidStatus(statusId, options)) {
      setFeedback({ type: FT.ERROR, message: t('availability.errorValidation') });
      return;
    }

    // Offline: apply optimistic update, set offline feedback, schedule retry.
    if (!navigator.onLine) {
      login(buildOptimisticUser(snapshotRef.current, role, statusId));
      setFeedback({ type: FT.OFFLINE, message: t('availability.errorOffline') });
      setRetryId(statusId);
      return;
    }

    setSaving(true);
    setFeedback(null);
    setRetryId(null);

    // Capture snapshot BEFORE optimistic update for rollback.
    const rollbackTarget = snapshotRef.current;

    // Optimistic update — applied immediately so UI is never blocked.
    login(buildOptimisticUser(rollbackTarget, role, statusId));

    const endpoint = getAvailabilityEndpoint(role);

    if (!endpoint) {
      // Optimistic-only role — no server call needed.
      snapshotRef.current = buildOptimisticUser(rollbackTarget, role, statusId);
      if (mountedRef.current) {
        setSaving(false);
        setFeedback({ type: FT.SUCCESS, message: t('availability.successMsg') });
        setTimeout(() => { if (mountedRef.current) navigate(-1); }, 900);
      }
      return;
    }

    // Cancel any in-flight request before starting a new one.
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      await API.patch(
        endpoint,
        { userId, availability: statusId },
        { signal: abortRef.current.signal },
      );

      if (!mountedRef.current) return;

      // Commit: advance snapshot to new confirmed state.
      snapshotRef.current = buildOptimisticUser(rollbackTarget, role, statusId);
      setFeedback({ type: FT.SUCCESS, message: t('availability.successMsg') });
      setTimeout(() => { if (mountedRef.current) navigate(-1); }, 900);

    } catch (err) {
      if (!mountedRef.current) return;
      // Ignore intentional cancellation.
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;

      // Rollback optimistic update to last confirmed state.
      login(rollbackTarget);

      const status = err?.response?.status;
      let feedbackPayload;

      if (!navigator.onLine || err?.code === 'NETWORK_ERROR') {
        feedbackPayload = { type: FT.OFFLINE,  message: t('availability.errorNetwork') };
      } else if (status === 401 || status === 403) {
        feedbackPayload = { type: FT.ERROR,    message: t('availability.errorUnauthorized') };
      } else if (status >= 500) {
        feedbackPayload = { type: FT.ROLLBACK, message: t('availability.errorRollback') };
      } else {
        const serverMsg = err?.response?.data?.message;
        feedbackPayload = {
          type:    FT.ERROR,
          message: serverMsg || t('errors.general'),
        };
      }

      setFeedback(feedbackPayload);
      setRetryId(statusId);

    } finally {
      if (mountedRef.current) setSaving(false);
      abortRef.current = null;
    }
  }, [options, role, userId, login, navigate, t]);

  // ── Public handlers ─────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // No-op navigation when nothing changed and no pending retry.
    if (selected === currentAvailability && !retryId) {
      navigate(-1);
      return;
    }
    doUpdate(selected);
  }, [selected, currentAvailability, retryId, doUpdate, navigate]);

  const handleRetry = useCallback(() => {
    if (retryId) doUpdate(retryId);
  }, [retryId, doUpdate]);

  // ── WebSocket slot ──────────────────────────────────────────────────────
  // Future: connect to real-time channel here.
  // useEffect(() => {
  //   const unsub = socket.on('availability:changed', payload => {
  //     if (payload.userId === userId) {
  //       snapshotRef.current = buildOptimisticUser(snapshotRef.current, role, payload.availability);
  //       login(snapshotRef.current);
  //     }
  //   });
  //   return unsub;
  // }, [socket, userId, role, login]);

  return {
    selected, setSelected,
    saving, feedback,
    handleSave, handleRetry,
    canSave, retryId,
    currentAvailability,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * StatusOption — a single radio-style availability button.
 * Memoized: re-renders only when isSelected, isCurrent, or disabled change.
 */
const StatusOption = memo(function StatusOption({
  option, isSelected, isCurrent, onChange, disabled,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${option.label} — ${option.desc}`}
      disabled={disabled}
      onClick={() => onChange(option.id)}
      className={[
        'flex gap-4 w-full p-4 rounded-2xl border text-left',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1528]',
        'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected
          ? 'border-amber-400/60 bg-amber-400/8 shadow-lg shadow-amber-500/10'
          : 'border-slate-800/60 hover:border-slate-600/70 hover:bg-slate-800/20',
      ].join(' ')}
    >
      {/* Emoji indicator */}
      <span className="text-2xl shrink-0 leading-none pt-0.5" aria-hidden="true">
        {option.emoji}
      </span>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-white">{option.label}</span>
          {isCurrent && !isSelected && (
            <span
              aria-label="estati aktyèl"
              className="text-[8px] font-black uppercase tracking-widest text-amber-400/70
                         bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full leading-none"
            >
              ●
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{option.desc}</p>
      </div>

      {/* Radio checkmark */}
      <div
        aria-hidden="true"
        className={[
          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
          'transition-all duration-200',
          isSelected
            ? 'bg-amber-400 border-amber-400 shadow-md shadow-amber-400/40'
            : 'border-slate-600',
        ].join(' ')}
      >
        {isSelected && (
          <svg
            className="w-2.5 h-2.5 text-black"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={3.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
});

/**
 * FeedbackBanner — accessible live region for success / error / offline feedback.
 * Memoized: only re-renders when feedback or retryId changes.
 */
const FeedbackBanner = memo(function FeedbackBanner({ feedback, onRetry, retryId, t }) {
  if (!feedback) return null;

  const isSuccess = feedback.type === FT.SUCCESS;
  const isOffline = feedback.type === FT.OFFLINE;
  const isNeg     = feedback.type === FT.ERROR || feedback.type === FT.ROLLBACK;

  const colorCls = isSuccess
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : isOffline
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      : 'bg-red-500/10 border-red-500/30 text-red-400';

  const Icon = isSuccess ? CheckCircle2 : isOffline ? WifiOff : AlertCircle;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`flex items-start gap-3 p-3.5 rounded-xl border mt-4 ${colorCls}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-relaxed">{feedback.message}</p>
        {(isNeg || isOffline) && retryId && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 text-[10px] font-black uppercase tracking-widest underline underline-offset-2 hover:no-underline transition"
          >
            {t('availability.retry')}
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * StatusPreview — compact footer summary of the currently selected option.
 * Memoized: re-renders only when the selected option changes.
 */
const StatusPreview = memo(function StatusPreview({ option, t }) {
  if (!option) return null;
  return (
    <div
      aria-label={`${t('availability.currentSelection')}: ${option.label}`}
      className="flex items-center gap-3 mb-3 px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl"
    >
      <span className="text-base leading-none" aria-hidden="true">{option.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 leading-none mb-0.5">
          {t('availability.currentSelection')}
        </p>
        <p className="text-xs font-bold text-white truncate">{option.label}</p>
      </div>
    </div>
  );
});

/** LoadingSkeleton — shown while a save is in flight. */
function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Chajman..."
    >
      {[68, 68, 68, 68].map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className="rounded-2xl bg-slate-800/40 animate-pulse"
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — thin composition layer
// ════════════════════════════════════════════════════════════════════════════

export default function AvailabilityStatus() {
  const navigate        = useNavigate();
  const { t }           = useTranslation();
  const { user, login } = useAuth();

  const role    = user?.role ?? 'user';
  const options = useMemo(() => getRoleAvailabilityStates(role), [role]);

  const {
    selected, setSelected,
    saving, feedback,
    handleSave, handleRetry,
    canSave, retryId,
    currentAvailability,
  } = useAvailabilityUpdate({ user, role, options, login, navigate, t });

  const selectedOption = useMemo(
    () => options.find(o => o.id === selected) ?? options[0],
    [options, selected],
  );

  const roleLabel = useMemo(() => displayRole(role), [role]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] text-white pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-sm w-full items-center justify-between px-5 pt-6 pb-4 border-b border-slate-800/50">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('availability.backLabel')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400
                     hover:text-white hover:bg-slate-800/60 transition-all
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-widest select-none">
          {t('availability.pageTitle')}
        </h1>

        {/* Balancing spacer — keeps title centred without a second interactive element */}
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* ── Role context ───────────────────────────────────────────── */}
      <section className="max-w-sm mx-auto w-full px-5 pt-5 pb-1" aria-label="Role context">
        <p className="text-[10px] text-slate-500 mb-1">
          {t('availability.roleContext')}:{' '}
          <span className="text-slate-300 font-semibold">{roleLabel}</span>
        </p>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          {t('availability.subtitle')}
        </p>
      </section>

      {/* ── Status options — radiogroup ─────────────────────────────── */}
      <main
        className="flex-1 max-w-sm mx-auto w-full px-5"
        role="radiogroup"
        aria-label={t('availability.pageTitle')}
        aria-busy={saving}
      >
        {saving ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col gap-3">
            {options.map(opt => (
              <StatusOption
                key={opt.id}
                option={opt}
                isSelected={selected === opt.id}
                isCurrent={currentAvailability === opt.id}
                onChange={setSelected}
                disabled={saving}
              />
            ))}
          </div>
        )}

        <FeedbackBanner
          feedback={feedback}
          onRetry={handleRetry}
          retryId={retryId}
          t={t}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="max-w-sm mx-auto w-full px-5 mt-6">
        <StatusPreview option={selectedOption} t={t} />

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          aria-disabled={!canSave}
          aria-label={saving ? t('availability.saving') : t('availability.save')}
          className={[
            'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1528]',
            canSave
              ? 'bg-amber-400 text-black hover:bg-amber-300 active:scale-[0.98] shadow-lg shadow-amber-500/20'
              : 'bg-amber-400/35 text-black/50 cursor-not-allowed',
          ].join(' ')}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {t('availability.saving')}
            </>
          ) : (
            t('availability.save')
          )}
        </button>
      </footer>
    </div>
  );
}
