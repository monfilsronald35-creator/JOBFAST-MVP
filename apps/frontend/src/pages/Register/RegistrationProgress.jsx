'use client';

import React, {
  memo,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useState,
  forwardRef,
} from 'react';
import PropTypes from 'prop-types';
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { useTranslation } from 'react-i18next';
import COLORS from '@/theme/colors';

const ric =
  typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(cb, 300);

const cic =
  typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function'
    ? window.cancelIdleCallback.bind(window)
    : clearTimeout;

const StepCircle = memo(
  forwardRef(function StepCircle(
    { step, completed, active, label, onClick, reducedMotion },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        tabIndex={0}
        onClick={onClick}
        whileHover={reducedMotion ? undefined : { y: -2, scale: 1.03 }}
        whileTap={reducedMotion ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        aria-label={label}
        aria-current={active ? 'step' : undefined}
        className="group flex min-w-0 flex-1 flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-0"
        disabled={!onClick}
      >
        <motion.div
          animate={completed ? { scale: 1 } : active ? { scale: 1.08 } : { scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border shadow-[0_20px_60px_rgba(0,0,0,.45)] transform-gpu"
          style={{
            background: completed
              ? 'linear-gradient(135deg, var(--c-primary) 0%, #FDE68A 100%)'
              : active
                ? 'linear-gradient(135deg, var(--c-primary) 0%, #F59E0B 100%)'
                : 'var(--c-surface-alt)',
            borderColor: completed || active ? 'rgba(255,255,255,0.18)' : 'var(--c-border)',
            color: completed || active ? '#111827' : 'var(--c-muted)',
            boxShadow: completed || active
              ? '0 0 0 1px rgba(255,255,255,0.08), 0 0 22px var(--c-primary-glow)'
              : 'none',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        >
          {completed ? (
            <motion.svg
              initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <motion.span
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-extrabold"
            >
              {step}
            </motion.span>
          )}

          {active && !reducedMotion ? (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0.28, scale: 1 }}
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.16, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 24px var(--c-primary-glow)' }}
            />
          ) : null}
        </motion.div>

        <motion.span
          className="mt-2 max-w-[8rem] sm:max-w-[10rem] text-center text-[11px] font-medium leading-tight text-balance break-words"
          style={{
            color: completed ? 'var(--c-text)' : active ? 'var(--c-primary)' : 'var(--c-muted)',
          }}
        >
          {label}
        </motion.span>
      </motion.button>
    );
  }),
);

const useThemeTokens = () => useMemo(() => COLORS, []);

function useAnnouncer() {
  const [message, setMessage] = useState('');
  const prevRef = useRef('');

  const announce = useCallback((msg) => {
    if (!msg || prevRef.current === msg) return;
    prevRef.current = msg;
    setMessage(msg);
  }, []);

  return { message, announce };
}

function useAnalyticsQueue(analytics) {
  const queueRef = useRef([]);
  const idleRef = useRef(null);
  const timeoutRef = useRef(null);

  const flush = useCallback(() => {
    const payload = queueRef.current.splice(0, queueRef.current.length);
    if (!payload.length) return;

    if (analytics?.track) {
      analytics.track('registration_batch', { events: payload });
      return;
    }

    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator &&
      typeof navigator.sendBeacon === 'function'
    ) {
      navigator.sendBeacon(
        '/api/analytics/registration',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    }
  }, [analytics]);

  const schedule = useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleRef.current = ric(flush, { timeout: 1200 });
      return;
    }
    timeoutRef.current = setTimeout(flush, 500);
  }, [flush]);

  const track = useCallback(
    (event, data = {}) => {
      queueRef.current.push({ event, data, ts: Date.now() });

      if (queueRef.current.length >= 10) {
        flush();
        return;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (idleRef.current != null) cic(idleRef.current);

      schedule();
    },
    [flush, schedule],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (idleRef.current != null) cic(idleRef.current);
      flush();
    },
    [flush],
  );

  return track;
}

const RegistrationProgress = memo(
  function RegistrationProgress({
    current = 1,
    total = 4,
    className = '',
    title,
    stepLabels,
    stepTextFormatter,
    onStepChange,
    analytics,
  }) {
    const { t, i18n } = useTranslation();
    const reducedMotion = useReducedMotion();
    const colors = useThemeTokens();
    const { message, announce } = useAnnouncer();
    const track = useAnalyticsQueue(analytics);

    const rootRef = useRef(null);
    const stepRefs = useRef([]);
    const lastAnnouncedRef = useRef('');

    const localeDir =
      i18n?.dir?.() ||
      (['ar', 'he', 'fa', 'ur'].includes(i18n?.language?.split('-')?.[0]) ? 'rtl' : 'ltr');

    const safeTotal = Math.max(Number(total) || 1, 1);
    const safeCurrent = Math.min(Math.max(Number(current) || 1, 1), safeTotal);

    const resolvedTitle = title ?? t('registration.progress', { defaultValue: 'Pwogresyon Enskripsyon' });

    const defaultSteps = useMemo(
      () => [
        t('registration.ui.stepCategory', { defaultValue: 'Kategori' }),
        t('registration.ui.stepSubcategory', { defaultValue: 'Sou-kategori' }),
        t('registration.ui.stepProfession', { defaultValue: 'Pwofesyon' }),
        t('registration.ui.stepBasicInfo', { defaultValue: 'Enfòmasyon' }),
        t('registration.ui.stepProfessional', { defaultValue: 'Detay' }),
      ],
      [t],
    );

    const resolvedLabels = stepLabels || defaultSteps;

    const resolvedFormatter =
      stepTextFormatter ??
      ((cur, tot) =>
        t('registration.stepOf', {
          cur,
          tot,
          defaultValue: `Etap ${cur} sou ${tot}`,
        }));

    const progressPct = useMemo(() => {
      if (safeTotal <= 1) return 100;
      return Math.min(((safeCurrent - 1) / (safeTotal - 1)) * 100, 100);
    }, [safeCurrent, safeTotal]);

    const formattedStep = resolvedFormatter(safeCurrent, safeTotal);
    const isCompleted = safeCurrent >= safeTotal;

    useEffect(() => {
      if (lastAnnouncedRef.current !== formattedStep) {
        lastAnnouncedRef.current = formattedStep;
        announce(formattedStep);
      }
    }, [formattedStep, announce]);

    useEffect(() => {
      track('registration_step_viewed', { current: safeCurrent, total: safeTotal });
    }, [safeCurrent, safeTotal, track]);

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          onStepChange?.(Math.min(safeCurrent + 1, safeTotal));
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          onStepChange?.(Math.max(safeCurrent - 1, 1));
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          onStepChange?.(1);
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          onStepChange?.(safeTotal);
        }
      },
      [onStepChange, safeCurrent, safeTotal],
    );

    const handleStepClick = useCallback(
      (step) => {
        onStepChange?.(step);
        track(
          step === safeCurrent
            ? 'registration_step_viewed'
            : step < safeCurrent
              ? 'registration_step_completed'
              : 'registration_step_started',
          { from: safeCurrent, to: step, step },
        );
      },
      [onStepChange, track, safeCurrent],
    );

    const stepHandlers = useMemo(
      () => Array.from({ length: safeTotal }, (_, i) => () => handleStepClick(i + 1)),
      [safeTotal, handleStepClick],
    );

    const setStepRef = useCallback(
      (index) => (node) => {
        stepRefs.current[index] = node;
      },
      [],
    );

    useEffect(() => {
      const node = stepRefs.current[safeCurrent - 1];
      if (node instanceof HTMLElement) {
        node.focus({ preventScroll: true });
      }
    }, [safeCurrent]);

    const rootStyle = useMemo(
      () => ({
        '--c-primary': colors.primary,
        '--c-primary-glow': colors.primaryGlow,
        '--c-surface': colors.surface,
        '--c-surface-alt': colors.surfaceAlt,
        '--c-border': colors.border,
        '--c-text': colors.text,
        '--c-muted': colors.mutedText,
        colorScheme: 'light dark',
      }),
      [colors],
    );

    const progressStyle = useMemo(
      () => ({
        originX: 0,
        scaleX: progressPct / 100,
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }),
      [progressPct],
    );

    return (
      <LazyMotion features={domAnimation}>
        <section
          ref={rootRef}
          dir={localeDir}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className={`w-full max-w-3xl mx-auto px-4 py-3 sm:px-5 sm:py-4 ${className}`}
          style={rootStyle}
          aria-labelledby="registration-progress-title"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 id="registration-progress-title" className="text-sm font-semibold tracking-wide text-slate-50 sm:text-base">
                {resolvedTitle}
              </h2>
              <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                {formattedStep}
              </p>
            </div>

            <div
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-xl"
              style={{
                borderColor: colors.border,
                background: 'rgba(255,255,255,0.05)',
                color: colors.primary,
              }}
            >
              {isCompleted ? t('registration.complete', { defaultValue: 'Konplete' }) : formattedStep}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 overflow-hidden rounded-full border backdrop-blur-md"
              style={{
                borderColor: colors.border,
                background:
                  'linear-gradient(90deg, rgba(15,23,42,.85) 0%, rgba(255,255,255,.05) 20%, rgba(15,23,42,.85) 100%)',
                backgroundColor: 'rgba(148,163,184,0.12)',
              }}
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
                initial={false}
                animate={progressStyle}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'linear-gradient(90deg, var(--c-primary) 0%, #FDE68A 35%, #22C55E 100%)',
                  boxShadow: `0 0 18px ${colors.primaryGlow}`,
                }}
              />
            </div>

            <div className="relative flex justify-between gap-2">
              {Array.from({ length: safeTotal }).map((_, index) => {
                const step = index + 1;
                const completed = step < safeCurrent;
                const active = step === safeCurrent;
                const label = resolvedLabels[index] || defaultSteps[index] || `Etap ${step}`;

                return (
                  <StepCircle
                    key={step}
                    ref={setStepRef(index)}
                    step={step}
                    completed={completed}
                    active={active}
                    label={label}
                    reducedMotion={!!reducedMotion}
                    onClick={stepHandlers[index]}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] sm:text-xs">
              {t('registration.accessibilityHint', {
                defaultValue: 'Sèvi ak flèch yo pou navige ant etap yo.',
              })}
            </p>

            <AnimatePresence>
              {message ? (
                <motion.span
                  key={message}
                  role="status"
                  aria-live="polite"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-full border px-3 py-1 text-[11px] font-medium"
                  style={{
                    borderColor: colors.border,
                    background: 'rgba(255,255,255,0.05)',
                    color: colors.primary,
                  }}
                >
                  {message}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        </section>
      </LazyMotion>
    );
  },
  (prev, next) =>
    prev.current === next.current &&
    prev.total === next.total &&
    prev.title === next.title &&
    prev.className === next.className &&
    prev.stepLabels === next.stepLabels &&
    prev.stepTextFormatter === next.stepTextFormatter &&
    prev.onStepChange === next.onStepChange &&
    prev.analytics === next.analytics,
);

RegistrationProgress.propTypes = {
  current: PropTypes.number,
  total: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
  stepLabels: PropTypes.arrayOf(PropTypes.string),
  stepTextFormatter: PropTypes.func,
  onStepChange: PropTypes.func,
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
};

RegistrationProgress.displayName = 'RegistrationProgress';

export default RegistrationProgress;
