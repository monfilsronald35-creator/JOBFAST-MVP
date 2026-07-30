import React, {
  memo,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';

import { getRoleConfig, getProfessionsByRole } from '../../config/roleConfig';

type LocalizedLabel =
  | string
  | {
      translations?: Record<string, string>;
      displayName?: string;
      label?: string;
      name?: string;
      title?: string;
      id?: string;
    };

interface ProfessionItem {
  id: string;
  name: LocalizedLabel;
  description?: LocalizedLabel;
  code?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  category?: string;
  profession?: string;
}

interface PageResult {
  items: ProfessionItem[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
  etag: string | null;
}

type SelectedProfession = string | { role: string; professionId: string } | null | undefined;
type TFunction = (key: string, opts?: Record<string, unknown>) => string;
interface Analytics { track?: (event: string, data: Record<string, unknown>) => void }
interface Theme {
  primary?: string; surface?: string; text?: string; muted?: string;
  border?: string; borderStrong?: string; skeleton?: string;
}

interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  signal?: AbortSignal;
}

function DefaultIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function getLocalizedLabel(item: LocalizedLabel | undefined, language = 'ht'): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const lang = language?.split('-')[0] ?? 'ht';
  return (
    item.translations?.[lang] ??
    item.translations?.['ht'] ??
    item.translations?.['en'] ??
    item.displayName ??
    item.label ??
    item.name ??
    item.title ??
    item.id ??
    ''
  );
}

function isProfessionSelected(selected: SelectedProfession, role: string, professionId: string): boolean {
  if (!selected) return false;
  if (typeof selected === 'string') return selected === `${role}:${professionId}`;
  return selected.role === role && selected.professionId === professionId;
}

function validateResponse(result: unknown): PageResult {
  const r = result as Record<string, unknown> | null | undefined;
  const rawItems = Array.isArray(r?.['items']) ? (r!['items'] as unknown[]) : [];
  const items = rawItems.filter((x): x is ProfessionItem =>
    Boolean((x as Record<string, unknown>)?.['id']),
  );
  return {
    items,
    nextCursor: (r?.['nextCursor'] as string | null | undefined) ?? null,
    previousCursor: (r?.['previousCursor'] as string | null | undefined) ?? null,
    hasMore: Boolean(r?.['hasMore'] ?? r?.['nextCursor']),
    etag: (r?.['etag'] as string | null | undefined) ?? null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelay = 300, signal }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await sleep(baseDelay * 2 ** attempt);
    }
  }
  throw lastError;
}

function runIdle(cb: () => void): void {
  if (typeof window === 'undefined') { cb(); return; }
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout: 600 });
  } else {
    setTimeout(cb, 0);
  }
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}

function SearchInput({ value, onChange, label, placeholder }: SearchInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor="profession-search" className="mb-2 block text-sm font-medium text-[var(--c-text)]">
        {label}
      </label>
      <input
        id="profession-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0"
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 animate-pulse">
      <div className="mb-3 h-10 w-10 rounded-full bg-[var(--c-skeleton)]" />
      <div className="mb-2 h-4 w-32 rounded bg-[var(--c-skeleton)]" />
      <div className="h-3 w-full rounded bg-[var(--c-skeleton)]/80" />
      <div className="mt-2 h-3 w-5/6 rounded bg-[var(--c-skeleton)]/80" />
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 p-8 text-center">
      <DefaultIcon className="mx-auto mb-3 h-10 w-10 text-[var(--c-muted)]" />
      <p className="text-sm font-semibold text-[var(--c-text)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">{subtitle}</p>
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  subtitle: string;
  onRetry?: () => void;
  retryLabel?: string;
}

function ErrorState({ title, subtitle, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <p className="text-sm font-semibold text-[var(--c-text)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">{subtitle}</p>
      {typeof onRetry === 'function' ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <ErrorState
        title="Something went wrong"
        subtitle="Yon pati nan selector la kraze."
        retryLabel="Reload"
        onRetry={() => { setHasError(false); window.location.reload(); }}
      />
    );
  }
  // React.ErrorBoundary does not exist in React 18 — render children directly
  return <>{children}</>;
}

interface CardProps {
  item: ProfessionItem;
  index: number;
  role: string;
  selected: SelectedProfession;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  onHover: React.MouseEventHandler<HTMLButtonElement>;
  onFocusCard: React.FocusEventHandler<HTMLButtonElement>;
  t: TFunction;
  language?: string;
}

const Card = memo(
  forwardRef<HTMLButtonElement, CardProps>(function Card(
    { item, index, role, selected, onClick, onKeyDown, onHover, onFocusCard, t, language },
    ref,
  ) {
    const Icon = (item.icon ?? DefaultIcon) as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    const isSelected = isProfessionSelected(selected, role, item.id);

    return (
      <motion.button
        ref={ref}
        id={item.id}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-label={getLocalizedLabel(item.name, language)}
        data-index={index}
        data-id={item.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ scale: isSelected ? 1.03 : 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onMouseEnter={onHover}
        onFocus={onFocusCard}
        className={`rounded-2xl border-2 p-5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0 ${isSelected ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/10' : 'border-[var(--c-border)] bg-[var(--c-surface)]/70 hover:border-[var(--c-border-strong)]'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <React.Suspense fallback={<div className="h-8 w-8 rounded-full bg-[var(--c-skeleton)]" />}>
            <Icon className="h-8 w-8 text-amber-400" aria-hidden="true" />
          </React.Suspense>
          {isSelected ? (
            <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300">
              {t('common.selected', { defaultValue: 'Chwazi' })}
            </span>
          ) : null}
        </div>
        <h3 className="text-sm font-bold text-[var(--c-text)]">{getLocalizedLabel(item.name, language)}</h3>
        {item.description ? (
          <p className="mt-2 text-xs leading-5 text-[var(--c-muted)]">{getLocalizedLabel(item.description, language)}</p>
        ) : null}
        {item.code ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-muted)]">{item.code}</p>
        ) : null}
      </motion.button>
    );
  }),
);

Card.displayName = 'Card';

interface VirtualGridProps {
  items: ProfessionItem[];
  role: string;
  selected: SelectedProfession;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  onHover: React.MouseEventHandler<HTMLButtonElement>;
  onFocusCard: React.FocusEventHandler<HTMLButtonElement>;
  t: TFunction;
  language: string;
  parentRef: React.RefObject<HTMLDivElement | null>;
  itemRefs: React.MutableRefObject<(HTMLElement | null)[]>;
}

function VirtualGrid({
  items,
  role,
  selected,
  onClick,
  onKeyDown,
  onHover,
  onFocusCard,
  t,
  language,
  parentRef,
  itemRefs,
}: VirtualGridProps) {
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
    overscan: 8,
  });

  return (
    <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
      {rowVirtualizer.getVirtualItems().map((row) => {
        const item = items[row.index];
        if (!item) return null;
        return (
          <div
            key={item.id}
            ref={(node) => {
              itemRefs.current[row.index] = node;
              if (node) rowVirtualizer.measureElement(node);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${row.start}px)`,
            }}
          >
            <Card
              item={item}
              index={row.index}
              role={role}
              selected={selected}
              onClick={onClick}
              onKeyDown={onKeyDown}
              onHover={onHover}
              onFocusCard={onFocusCard}
              t={t}
              language={language}
            />
          </div>
        );
      })}
    </div>
  );
}

interface Step2Props {
  role?: string;
  selected?: SelectedProfession;
  onSelect?: (payload: { role: string; professionId: string; category: string }) => void;
  loading?: boolean;
  searchLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  errorTitle: string;
  errorSubtitle: string;
  analytics?: Analytics;
  theme?: Theme;
  pageSize?: number;
}

type CSSVars = React.CSSProperties & Record<`--c-${string}`, string>;

const getProfessionsByRoleFn = getProfessionsByRole as unknown as (
  role: string,
  opts: { search: string; cursor: string | null; limit: number; signal?: AbortSignal },
) => Promise<unknown>;

function Step2_ProfessionSelect({
  role,
  selected,
  onSelect,
  loading = false,
  searchLabel,
  searchPlaceholder,
  emptyTitle,
  emptySubtitle,
  errorTitle,
  errorSubtitle,
  analytics,
  theme = {},
  pageSize = 50,
}: Step2Props) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const roleConfig = useMemo(
    () => (role ? getRoleConfig(role) as Record<string, unknown> | null : null),
    [role],
  );
  const roleLabel = getLocalizedLabel(roleConfig as LocalizedLabel | undefined, i18n.language) || role || '';

  const themeVars = useMemo(
    (): CSSVars => ({
      '--c-primary': theme.primary ?? '#F59E0B',
      '--c-surface': theme.surface ?? '#111827',
      '--c-text': theme.text ?? '#F9FAFB',
      '--c-muted': theme.muted ?? '#9CA3AF',
      '--c-border': theme.border ?? 'rgba(156,163,175,0.25)',
      '--c-border-strong': theme.borderStrong ?? 'rgba(245,158,11,0.65)',
      '--c-skeleton': theme.skeleton ?? 'rgba(156,163,175,0.16)',
    } as CSSVars),
    [theme],
  );

  useEffect(() => {
    setActiveIndex(0);
    itemRefs.current = [];
  }, [role, debouncedQuery]);

  const queryResult = useInfiniteQuery<PageResult, Error>({
    queryKey: ['professions', role, debouncedQuery, pageSize],
    enabled: Boolean(role) && (debouncedQuery.length === 0 || debouncedQuery.length >= 2),
    initialPageParam: null,
    queryFn: async ({ pageParam, signal }) => {
      const res = await retryWithBackoff(
        () => getProfessionsByRoleFn(role!, {
          search: debouncedQuery,
          cursor: (pageParam as string | null) ?? null,
          limit: pageSize,
          signal,
        }),
        { retries: 3, baseDelay: 300, signal },
      );
      return validateResponse(res);
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const professions = useMemo(
    () => queryResult.data?.pages.flatMap((p) => p.items) ?? [],
    [queryResult.data],
  );

  const professionsMap = useMemo(() => {
    const map = new Map<string, ProfessionItem>();
    professions.forEach((p) => map.set(p.id, p));
    return map;
  }, [professions]);

  const handleSelect = useCallback(
    (profession: ProfessionItem | undefined): void => {
      if (loading || !profession?.id) return;
      const payload = {
        role: role!,
        professionId: profession.id,
        category: (profession.category ?? profession.profession ?? 'general'),
      };
      queryClient.setQueryData(['selected-profession', role], payload);
      onSelect?.(payload);
      runIdle(() => analytics?.track?.('profession_selected', { role: role!, profession: profession.id }));
    },
    [analytics, loading, onSelect, queryClient, role],
  );

  const focusItem = useCallback((index: number): void => {
    const node = itemRefs.current[index];
    if (node instanceof HTMLElement) node.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>): void => {
      const max = professions.length - 1;
      const index = Number((e.currentTarget as HTMLElement).dataset['index'] ?? 0);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = index >= max ? 0 : index + 1;
        setActiveIndex(next);
        focusItem(next);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = index <= 0 ? max : index - 1;
        setActiveIndex(prev);
        focusItem(prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
        focusItem(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(max);
        focusItem(max);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        const next = Math.min(index + 10, max);
        setActiveIndex(next);
        focusItem(next);
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        const prev = Math.max(index - 10, 0);
        setActiveIndex(prev);
        focusItem(prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        (scrollRef.current as HTMLElement | null)?.blur?.();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const item = professions[index];
        if (item) handleSelect(item);
      }
    },
    [focusItem, handleSelect, professions],
  );

  const handleHover = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      runIdle(() =>
        analytics?.track?.('profession_hover', {
          role: role!,
          profession: e.currentTarget.dataset['id'],
        }),
      );
    },
    [analytics, role],
  );

  const handleFocusCard = useCallback((e: React.FocusEvent<HTMLButtonElement>): void => {
    setActiveIndex(Number(e.currentTarget.dataset['index'] ?? 0));
  }, []);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !queryResult.hasNextPage || queryResult.isFetchingNextPage) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            void queryResult.fetchNextPage();
          }
        },
        { root: scrollRef.current, rootMargin: '300px', threshold: 0.1 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [queryResult],
  ) as React.RefCallback<HTMLDivElement>;

  if (!role) {
    return (
      <ErrorState
        title={t('registration.no_role', { defaultValue: 'Role manke' })}
        subtitle={t('registration.no_role_desc', { defaultValue: 'Tanpri chwazi yon role avan.' })}
        onRetry={() => window.history.back()}
        retryLabel={t('common.back', { defaultValue: 'Retounen' })}
      />
    );
  }

  if (queryResult.error) {
    return (
      <ErrorState
        title={errorTitle}
        subtitle={errorSubtitle}
        onRetry={() => void queryResult.refetch()}
        retryLabel={t('common.retry', { defaultValue: 'Eseye ankò' })}
      />
    );
  }

  if (queryResult.isLoading && !professions.length) {
    return (
      <div style={themeVars} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full" data-testid="profession-selector" style={themeVars}>
        <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
          {t('registration.choose_profession', { role: roleLabel })}
        </p>

        <SearchInput
          value={query}
          onChange={setQuery}
          label={searchLabel}
          placeholder={searchPlaceholder}
        />

        <div
          ref={scrollRef}
          className="max-h-[70vh] overflow-auto rounded-2xl"
          role="listbox"
          aria-label={t('registration.profession_list')}
          aria-activedescendant={professions[activeIndex]?.id}
          tabIndex={0}
          onKeyDown={handleKeyDown as React.KeyboardEventHandler<HTMLDivElement>}
        >
          {professions.length ? (
            <VirtualGrid
              items={professions}
              role={role}
              selected={selected}
              onClick={(e) => {
                const item = professionsMap.get(e.currentTarget.dataset['id'] ?? '');
                if (item) handleSelect(item);
              }}
              onKeyDown={handleKeyDown as React.KeyboardEventHandler<HTMLButtonElement>}
              onHover={handleHover}
              onFocusCard={handleFocusCard}
              t={t}
              language={i18n.language}
              parentRef={scrollRef}
              itemRefs={itemRefs}
            />
          ) : (
            <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
          )}

          <div ref={loadMoreRef} className="h-4 w-full" />
        </div>

        {queryResult.isFetchingNextPage ? (
          <p className="mt-3 text-center text-[11px] text-[var(--c-muted)]">
            {t('common.loading_more', { defaultValue: 'Loading more...' })}
          </p>
        ) : null}

        {!queryResult.hasNextPage ? (
          <p className="mt-3 text-center text-[11px] text-[var(--c-muted)]">
            {t('common.end_of_list', { defaultValue: 'Ou rive nan fen lis la.' })}
          </p>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Step2_ProfessionSelect);