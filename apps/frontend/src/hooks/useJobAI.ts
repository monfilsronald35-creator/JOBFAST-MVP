/**
 * useJobAI — Debounced AI assistant for job posting.
 * Features: category suggestion, salary hint, skill extraction,
 * content moderation — all debounced to avoid API spam.
 * Aborts in-flight requests on unmount.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import API from '../api/axios';
import type { JobSuggestion, SalaryHint, ModerationFlag, SkillSuggestion } from '../types';

const DEBOUNCE_MS = 700;

export interface JobAIContext {
  readonly category?: string;
  readonly experienceLevel?: string;
  readonly location?: string;
}

export interface JobAIReturn {
  readonly salarySuggestion: SalaryHint | null;
  readonly skills: readonly SkillSuggestion[];
  readonly suggestedCategory: string | null;
  readonly moderationFlags: readonly ModerationFlag[];
  readonly requestCategory: (text: string) => void;
  readonly requestSalaryHint: (budget: number) => void;
  readonly requestSkills: (text: string) => void;
  readonly requestModeration: (fields: Record<string, string>) => void;
  readonly isLoading: boolean;
  readonly clearSuggestions: () => void;
}

function useDebounced<T>(fn: (value: T) => void, delay: number): (value: T) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (value: T) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fn(value);
      }, delay);
    },
    [fn, delay],
  );
}

export function useJobAI(context: JobAIContext = {}): JobAIReturn {
  const [salarySuggestion, setSalarySuggestion] = useState<SalaryHint | null>(null);
  const [skills, setSkills] = useState<readonly SkillSuggestion[]>([]);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [moderationFlags, setModerationFlags] = useState<readonly ModerationFlag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllers = useRef<AbortController[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllers.current.forEach((ac) => ac.abort());
    };
  }, []);

  function newAbort(): AbortController {
    const ac = new AbortController();
    abortControllers.current.push(ac);
    return ac;
  }

  // ── Category suggestion ───────────────────────────────────────────────────
  const _requestCategory = useCallback(async (text: string): Promise<void> => {
    if (text.trim().length < 10) return;
    const ac = newAbort();
    try {
      setIsLoading(true);
      const res = await API.post<{ data: { category: string } }>(
        '/ai/jobs/suggest-category',
        { text, ...context },
        { signal: ac.signal },
      );
      if (mountedRef.current) setSuggestedCategory(res.data.data.category);
    } catch (err) {
      if ((err as { name?: string }).name !== 'CanceledError' && (err as { name?: string }).name !== 'AbortError') {
        console.debug('[useJobAI] category suggestion failed', err);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [context]);

  const requestCategory = useDebounced(_requestCategory, DEBOUNCE_MS);

  // ── Salary hint ───────────────────────────────────────────────────────────
  const _requestSalaryHint = useCallback(async (budget: number): Promise<void> => {
    if (!budget || budget <= 0) return;
    const ac = newAbort();
    try {
      setIsLoading(true);
      const res = await API.post<{ data: SalaryHint }>(
        '/ai/jobs/salary-hint',
        { budget, ...context },
        { signal: ac.signal },
      );
      if (mountedRef.current) setSalarySuggestion(res.data.data);
    } catch (err) {
      if ((err as { name?: string }).name !== 'CanceledError' && (err as { name?: string }).name !== 'AbortError') {
        console.debug('[useJobAI] salary hint failed', err);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [context]);

  const requestSalaryHint = useDebounced(_requestSalaryHint, DEBOUNCE_MS);

  // ── Skill extraction ──────────────────────────────────────────────────────
  const _requestSkills = useCallback(async (text: string): Promise<void> => {
    if (text.trim().length < 10) return;
    const ac = newAbort();
    try {
      const res = await API.post<{ data: readonly SkillSuggestion[] }>(
        '/ai/jobs/extract-skills',
        { text, ...context },
        { signal: ac.signal },
      );
      if (mountedRef.current) setSkills(res.data.data);
    } catch (err) {
      if ((err as { name?: string }).name !== 'CanceledError' && (err as { name?: string }).name !== 'AbortError') {
        console.debug('[useJobAI] skills extraction failed', err);
      }
    }
  }, [context]);

  const requestSkills = useDebounced(_requestSkills, DEBOUNCE_MS);

  // ── Content moderation ────────────────────────────────────────────────────
  const _requestModeration = useCallback(async (fields: Record<string, string>): Promise<void> => {
    const hasContent = Object.values(fields).some((v) => v.trim().length > 5);
    if (!hasContent) return;
    const ac = newAbort();
    try {
      const res = await API.post<{ data: readonly ModerationFlag[] }>(
        '/ai/jobs/moderate',
        { fields },
        { signal: ac.signal },
      );
      if (mountedRef.current) setModerationFlags(res.data.data);
    } catch (err) {
      if ((err as { name?: string }).name !== 'CanceledError' && (err as { name?: string }).name !== 'AbortError') {
        console.debug('[useJobAI] moderation failed', err);
      }
    }
  }, []);

  const requestModeration = useDebounced(_requestModeration, DEBOUNCE_MS * 2);

  const clearSuggestions = useCallback((): void => {
    setSalarySuggestion(null);
    setSkills([]);
    setSuggestedCategory(null);
    setModerationFlags([]);
  }, []);

  return {
    salarySuggestion,
    skills,
    suggestedCategory,
    moderationFlags,
    requestCategory,
    requestSalaryHint,
    requestSkills,
    requestModeration,
    isLoading,
    clearSuggestions,
  };
}

export type { JobSuggestion };