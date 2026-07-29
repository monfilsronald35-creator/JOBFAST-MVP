/**
 * useRetryEngine — Enterprise retry hook with exponential backoff.
 * Supports: configurable delays, custom shouldRetry predicate, cancellation,
 * attempt tracking, and jitter to prevent thundering herd.
 */
import { useCallback, useRef, useState } from 'react';

export interface RetryConfig {
  readonly maxAttempts?: number;
  readonly delays?: readonly number[];
  readonly jitterMs?: number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  readonly onAttempt?: (attempt: number, error: unknown) => void;
}

export interface RetryEngineReturn {
  readonly runWithRetry: <T>(fn: () => Promise<T>, config?: RetryConfig) => Promise<T>;
  readonly isRetrying: boolean;
  readonly currentAttempt: number;
  readonly cancel: () => void;
}

const DEFAULT_DELAYS: readonly number[] = [2_000, 5_000, 10_000, 30_000] as const;
const DEFAULT_MAX = 4;

function isRetryableError(error: unknown): boolean {
  if (error == null) return false;
  const status =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object' &&
    (error as { response: { status?: unknown } }).response?.status;
  if (typeof status === 'number') {
    return status >= 500 || status === 0 || status === 408 || status === 429;
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes('network')) return true;
  return false;
}

function withJitter(delayMs: number, jitterMs: number): number {
  return delayMs + Math.round(Math.random() * jitterMs);
}

export function useRetryEngine(): RetryEngineReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRetrying(false);
    setCurrentAttempt(0);
  }, []);

  const runWithRetry = useCallback(
    async <T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> => {
      const {
        maxAttempts = DEFAULT_MAX,
        delays = DEFAULT_DELAYS,
        jitterMs = 500,
        shouldRetry = isRetryableError,
        onAttempt,
      } = config;

      cancelledRef.current = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelledRef.current) {
          throw new DOMException('RetryEngine cancelled', 'AbortError');
        }

        setCurrentAttempt(attempt);
        onAttempt?.(attempt, null);

        try {
          setIsRetrying(attempt > 1);
          const result = await fn();
          setIsRetrying(false);
          setCurrentAttempt(0);
          return result;
        } catch (error: unknown) {
          onAttempt?.(attempt, error);
          const isLast = attempt >= maxAttempts;
          if (isLast || !shouldRetry(error, attempt)) {
            setIsRetrying(false);
            setCurrentAttempt(0);
            throw error;
          }

          const baseDelay = delays[Math.min(attempt - 1, delays.length - 1)] ?? (delays[delays.length - 1] ?? 5_000);
          const delay = withJitter(baseDelay, jitterMs);

          await new Promise<void>((resolve, reject) => {
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              if (cancelledRef.current) {
                reject(new DOMException('RetryEngine cancelled', 'AbortError'));
              } else {
                resolve();
              }
            }, delay);
          });
        }
      }

      throw new Error('RetryEngine: exhausted all attempts');
    },
    [],
  );

  return { runWithRetry, isRetrying, currentAttempt, cancel };
}