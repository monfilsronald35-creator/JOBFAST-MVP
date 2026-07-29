import { useState, useCallback } from 'react';

const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000;
const CAPTCHA_AFTER = 3;
const STORAGE_KEY   = 'jf_login_rl';

interface RateLimitState { count: number; lockedUntil: number; }

function loadState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw) as RateLimitState;
  } catch { return { count: 0, lockedUntil: 0 }; }
}

function saveState(state: RateLimitState): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function useLoginRateLimit() {
  const [state, setState] = useState<RateLimitState>(loadState);

  const isLocked             = Date.now() < state.lockedUntil;
  const remainingLockSeconds = isLocked ? Math.ceil((state.lockedUntil - Date.now()) / 1000) : 0;

  const registerFailure = useCallback(() => {
    setState((prev) => {
      const count        = prev.count + 1;
      const lockedUntil  = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : prev.lockedUntil;
      const next         = { count, lockedUntil };
      saveState(next);
      return next;
    });
  }, []);

  const resetFailures = useCallback(() => {
    const next = { count: 0, lockedUntil: 0 };
    saveState(next);
    setState(next);
  }, []);

  return {
    canAttempt:           !isLocked,
    isLocked,
    remainingLockSeconds,
    requiresCaptcha:      state.count >= CAPTCHA_AFTER && !isLocked,
    registerFailure,
    resetFailures,
  };
}