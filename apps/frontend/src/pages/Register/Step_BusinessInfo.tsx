import React, {
  memo,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';

// ---------- types ----------

type TFunction = (key: string, opts?: Record<string, unknown>) => string;

interface Theme {
  primary?: string; surface?: string; text?: string; muted?: string;
  border?: string; borderStrong?: string; skeleton?: string;
}

interface Analytics { track?: (event: string, data: Record<string, unknown>) => void }

interface OfflineCacheEntry {
  items: ProviderItem[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
  version?: number;
  expiresAt?: number;
  etag?: string | null;
  staleWhileRevalidate?: boolean;
  ts?: number;
  [key: string]: unknown;
}

interface OfflineCache {
  get?: (key: string) => OfflineCacheEntry | null;
  set?: (key: string, value: OfflineCacheEntry) => void;
}

interface Localization { language?: string }

interface ProviderItem {
  id: string;
  name: string;
  description?: string;
  code?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface ProviderOpts {
  type: string;
  query: string;
  cursor: string | null;
  limit: number;
  locale?: string;
  signal?: AbortSignal;
}

interface ProviderResult {
  items?: unknown[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasMore?: boolean;
  etag?: string | null;
}

type Provider = (opts: ProviderOpts) => Promise<ProviderResult | unknown>;

interface RetryOptions { retries?: number; baseDelay?: number; signal?: AbortSignal }

// ---------- helpers ----------

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

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
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

function mergeById(prev: ProviderItem[] = [], next: ProviderItem[] = []): ProviderItem[] {
  const map = new Map<string, ProviderItem>();
  prev.forEach((item) => { if (item?.id) map.set(item.id, item); });
  next.forEach((item) => { if (item?.id) map.set(item.id, item); });
  return Array.from(map.values());
}

function validateProviderResponse(result: unknown): {
  items: ProviderItem[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasMore: boolean;
  etag: string | null;
} {
  const r = result as ProviderResult | null | undefined;
  const rawItems = Array.isArray(r?.items) ? r!.items : [];
  const items = rawItems.filter((x): x is ProviderItem => {
    const item = x as Record<string, unknown>;
    return Boolean(item && item['id'] && item['name']);
  });
  return {
    items,
    nextCursor: r?.nextCursor ?? null,
    previousCursor: r?.previousCursor ?? null,
    hasMore: Boolean(r?.hasMore ?? r?.nextCursor),
    etag: r?.etag ?? null,
  };
}

// Dead code — preserved from original
function CacheStore({
  get: _get = (key: string): unknown => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown> | null;
      if (!parsed || !parsed['expiresAt'] || Date.now() > (parsed['expiresAt'] as number)) return null;
      return parsed;
    } catch {
      return null;
    }
  },
  set: _set = (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { }
  },
}: {
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => void;
} = {}): null {
  void _get;
  void _set;
  return null;
}
void CacheStore;

// ---------- sub-components ----------

function ErrorState({ title, subtitle, actionLabel, onAction }: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 p-8 text-center">
      <DefaultIcon className="mx-auto mb-3 h-10 w-10 text-[var(--c-muted)]" />
      <p className="text-sm font-semibold text-[var(--c-text)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">{subtitle}</p>
      {typeof onAction === 'function' ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ title, subtitle, actionLabel, onAction }: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 p-8 text-center">
      <DefaultIcon className="mx-auto mb-3 h-10 w-10 text-[var(--c-muted)]" />
      <p className="text-sm font-semibold text-[var(--c-text)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">{subtitle}</p>
      {typeof onAction === 'function' ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)]"
        >
          {actionLabel}
        </button>
      ) : null}
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

function SearchField({ value, onChange, label, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor="universal-search" className="mb-2 block text-sm font-medium text-[var(--c-text)]">
        {label}
      </label>
      <input
        id="universal-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0"
      />
    </div>
  );
}

interface CardProps {
  item: ProviderItem;
  index: number;
  selected?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  onHover: React.MouseEventHandler<HTMLButtonElement>;
  onFocusCard: React.FocusEventHandler<HTMLButtonElement>;
  t: TFunction;
}

const Card = memo(
  forwardRef<HTMLButtonElement, CardProps>(function Card(
    { item, index, selected, onClick, onKeyDown, onHover, onFocusCard, t },
    ref,
  ) {
    const Icon = (item.icon ?? DefaultIcon) as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    const isSelected = selected === item.id;

    return (
      <motion.button
        ref={ref}
        id={item.id}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-label={item.name}
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
        className={`
          rounded-2xl border-2 p-5 text-left outline-none transition
          focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0
          ${isSelected
            ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/10'
            : 'border-[var(--c-border)] bg-[var(--c-surface)]/70 hover:border-[var(--c-border-strong)]'}
        `}
      >
        <div className="mb-3 flex items-center justify-between">
          <Icon className="h-8 w-8 text-amber-400" aria-hidden="true" />
          {isSelected ? (
            <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300">
              {t('common.selected', { defaultValue: 'Chwazi' })}
            </span>
          ) : null}
        </div>
        <h3 className="text-sm font-bold text-[var(--c-text)]">{item.name}</h3>
        {item.description ? <p className="mt-2 text-xs leading-5 text-[var(--c-muted)]">{item.description}</p> : null}
        {item.code ? <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-muted)]">{item.code}</p> : null}
      </motion.button>
    );
  }),
);

Card.displayName = 'Card';

function useBackgroundRefresh(enabled: boolean, refreshInterval: number, fn: () => void): void {
  useEffect(() => {
    if (!enabled || !refreshInterval) return undefined;
    const onVisible = () => !document.hidden && fn();
    const onFocus = () => fn();
    const onOnline = () => fn();
    const id = setInterval(fn, refreshInterval);

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, refreshInterval, fn]);
}

// ---------- main component ----------

interface UniversalSelectionEngineProps {
  type: string;
  provider?: Provider;
  selected?: string;
  onSelect: (item: ProviderItem) => void;
  onBack?: () => void;
  t: TFunction;
  theme?: Theme;
  analytics?: Analytics;
  offlineCache?: OfflineCache;
  localization?: Localization;
  pageSize?: number;
  infiniteScroll?: boolean;
  virtualized?: boolean;
  aiSuggestions?: boolean;
  searchLabel: string;
  searchPlaceholder: string;
  errorTitle: string;
  errorSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  enableBackgroundRefresh?: boolean;
  refreshInterval?: number;
}

type CSSVars = React.CSSProperties & Record<`--c-${string}`, string>;

function UniversalSelectionEngine({
  type,
  provider,
  selected,
  onSelect,
  onBack,
  t,
  theme = {},
  analytics,
  offlineCache,
  localization,
  pageSize = 40,
  infiniteScroll = true,
  virtualized = true,
  aiSuggestions = true,
  searchLabel,
  searchPlaceholder,
  errorTitle,
  errorSubtitle,
  emptyTitle,
  emptySubtitle,
  enableBackgroundRefresh = true,
  refreshInterval = 0,
}: UniversalSelectionEngineProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const online = useOnlineStatus();

  const [items, setItems] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [, setPreviousCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiResults, setAiResults] = useState<ProviderItem[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isFetchingRef = useRef<boolean>(false);
  const dedupeRef = useRef<Set<string>>(new Set());
  const reqRef = useRef<number>(0);

  const cssVars = useMemo(
    (): CSSVars => ({
      '--c-primary': theme.primary ?? '#F59E0B',
      '--c-surface': theme.surface ?? '#0F172A',
      '--c-text': theme.text ?? '#F8FAFC',
      '--c-muted': theme.muted ?? '#94A3B8',
      '--c-border': theme.border ?? 'rgba(148,163,184,0.22)',
      '--c-border-strong': theme.borderStrong ?? 'rgba(148,163,184,0.42)',
      '--c-skeleton': theme.skeleton ?? 'rgba(148,163,184,0.14)',
    } as CSSVars),
    [theme],
  );

  useEffect(() => {
    dedupeRef.current = new Set();
    setActiveIndex(0);
  }, [debouncedQuery]);

  const loadPage = useCallback(
    async ({ cursor = null, append = false, silent = false }: { cursor?: string | null; append?: boolean; silent?: boolean } = {}): Promise<void> => {
      if (!provider || isFetchingRef.current) return;
      isFetchingRef.current = true;
      reqRef.current += 1;
      const currentReq = reqRef.current;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      silent ? setBackgroundLoading(true) : setLoading(true);
      setError(null);

      try {
        const result = await retryWithBackoff(
          () =>
            provider({
              type,
              query: debouncedQuery,
              cursor,
              limit: pageSize,
              locale: localization?.language,
              signal: controller.signal,
            }) as Promise<ProviderResult>,
          { retries: 3, baseDelay: 300, signal: controller.signal },
        );

        if (controller.signal.aborted || currentReq !== reqRef.current) return;

        const normalized = validateProviderResponse(result);
        const incoming = normalized.items.filter((item) => {
          if (dedupeRef.current.has(item.id)) return false;
          dedupeRef.current.add(item.id);
          return true;
        });

        setItems((prev) => (append ? mergeById(prev, incoming) : mergeById([], incoming)));
        setNextCursor(normalized.nextCursor);
        setPreviousCursor(normalized.previousCursor);
        setHasMore(normalized.hasMore);

        const cacheKey = JSON.stringify({ type, q: debouncedQuery });
        offlineCache?.set?.(cacheKey, {
          items: incoming,
          nextCursor: normalized.nextCursor,
          previousCursor: normalized.previousCursor,
          hasMore: normalized.hasMore,
          version: 1,
          expiresAt: Date.now() + 5 * 60 * 1000,
          etag: normalized.etag,
          staleWhileRevalidate: true,
          ts: Date.now(),
        });

        analytics?.track?.('universal_selection_viewed', {
          type,
          query: debouncedQuery,
          count: incoming.length,
        });
      } catch (err) {
        setError(err);
        analytics?.track?.('universal_selection_error', {
          type,
          query: debouncedQuery,
          message: (err as Error)?.message ?? 'unknown',
        });
      } finally {
        if (currentReq === reqRef.current) {
          silent ? setBackgroundLoading(false) : setLoading(false);
          isFetchingRef.current = false;
        }
      }
    },
    [analytics, debouncedQuery, localization?.language, offlineCache, pageSize, provider, type],
  );

  useEffect(() => {
    const cacheKey = JSON.stringify({ type, q: debouncedQuery });
    const cached = offlineCache?.get?.(cacheKey);
    if (cached?.items?.length) {
      setItems(cached.items);
      setNextCursor(cached.nextCursor ?? null);
      setPreviousCursor(cached.previousCursor ?? null);
      setHasMore(Boolean(cached.hasMore));
      dedupeRef.current = new Set(cached.items.map((x) => x.id));
    }
    void loadPage({ cursor: null, append: false, silent: Boolean(cached?.items?.length) });
  }, [debouncedQuery, loadPage, offlineCache, type]);

  useBackgroundRefresh(enableBackgroundRefresh, refreshInterval, () => {
    void loadPage({ cursor: null, append: false, silent: true });
  });

  useEffect(() => {
    if (!infiniteScroll || !hasMore || !nextCursor) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingRef.current) {
          void loadPage({ cursor: nextCursor, append: true, silent: true });
        }
      },
      { root: null, rootMargin: '400px', threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, infiniteScroll, loadPage, nextCursor]);

  useEffect(() => {
    if (!aiSuggestions) { setAiResults([]); return; }
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) { setAiResults([]); return; }
    setAiResults(
      items
        .filter((item) =>
          `${item.name} ${item.description ?? ''} ${item.code ?? ''}`.toLowerCase().includes(q),
        )
        .slice(0, 5),
    );
  }, [aiSuggestions, debouncedQuery, items]);

  const focusItem = useCallback((index: number): void => {
    const node = itemRefs.current[index];
    if (node instanceof HTMLElement) node.focus({ preventScroll: true });
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      const id = e.currentTarget.dataset['id'];
      const item = items.find((x) => x.id === id);
      if (!item) return;
      onSelect(item);
    },
    [items, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      const index = Number(e.currentTarget.dataset['index'] ?? 0);
      const max = items.length - 1;
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
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = e.currentTarget.dataset['id'];
        const item = items.find((x) => x.id === id);
        if (item) onSelect(item);
      }
    },
    [focusItem, items, onSelect],
  );

  const handleHover = useCallback((): void => {}, []);
  const handleFocusCard = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>): void => setActiveIndex(Number(e.currentTarget.dataset['index'] ?? 0)),
    [],
  );

  if (!provider) {
    return (
      <ErrorState
        title={t('common.missing_provider', { defaultValue: 'Provider manke' })}
        subtitle={t('common.missing_provider_desc', { defaultValue: 'Tanpri pase yon provider.' })}
        actionLabel={t('common.back', { defaultValue: 'Retounen' })}
        onAction={onBack}
      />
    );
  }

  if (!online && !offlineCache) {
    return (
      <ErrorState
        title={t('common.offline', { defaultValue: 'Ou offline' })}
        subtitle={t('common.offline_desc', { defaultValue: 'Pa gen cache lokal ki disponib.' })}
        actionLabel={t('common.back', { defaultValue: 'Retounen' })}
        onAction={onBack}
      />
    );
  }

  const renderCards = (list: ProviderItem[]): React.ReactNode[] =>
    list.map((item, index) => (
      <Card
        key={item.id}
        ref={(node: HTMLButtonElement | null) => { itemRefs.current[index] = node; }}
        item={item}
        index={index}
        selected={selected}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onHover={handleHover}
        onFocusCard={handleFocusCard}
        t={t}
      />
    ));

  return (
    <div className="w-full" style={cssVars}>
      <SearchField
        value={query}
        onChange={setQuery}
        label={searchLabel}
        placeholder={searchPlaceholder}
      />

      {aiResults.length ? (
        <div className="mb-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-muted)]">
            {t('common.ai_suggestions', { defaultValue: 'AI Suggestions' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {aiResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setQuery(s.name)}
                className="rounded-full border border-[var(--c-border)] px-3 py-1 text-xs text-[var(--c-text)]"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading && !items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState
          title={errorTitle}
          subtitle={errorSubtitle}
          actionLabel={t('common.retry', { defaultValue: 'Eseye ankò' })}
          onAction={() => { void loadPage({ cursor: null, append: false }); }}
        />
      ) : items.length ? (
        <>
          <div
            role="listbox"
            aria-activedescendant={items[activeIndex]?.id}
            aria-label={type}
            tabIndex={0}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {virtualized ? renderCards(items) : renderCards(items)}
          </div>

          <div ref={sentinelRef} className="h-1 w-full" />

          {backgroundLoading ? (
            <p className="mt-3 text-center text-[11px] text-[var(--c-muted)]">
              {t('common.refreshing', { defaultValue: 'Refreshing in background...' })}
            </p>
          ) : null}

          {!hasMore ? (
            <p className="mt-3 text-center text-[11px] text-[var(--c-muted)]">
              {t('common.end_of_list', { defaultValue: 'Ou rive nan fen lis la.' })}
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={emptyTitle}
          subtitle={emptySubtitle}
          actionLabel={t('common.back', { defaultValue: 'Retounen' })}
          onAction={onBack}
        />
      )}
    </div>
  );
}

export default memo(UniversalSelectionEngine);