// src/pages/UniversalSearch.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
  lazy,
  memo,
  useDeferredValue,
  Component,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import localforage from 'localforage';
import {
  Search,
  Mic,
  ScanSearch,
  X,
  ChevronRight,
  Loader2,
  Globe,
  Star,
  BadgeCheck,
  TrendingUp,
  History,
  Building2,
  Briefcase,
  User,
  ShoppingBag,
  Home,
  Hotel,
  UtensilsCrossed,
  FileText,
  Link as LinkIcon,
  FileAudio2,
  Filter,
  WifiOff,
  MapPin,
  Layers3,
  Landmark,
  CarFront,
  PenTool,
  Video,
  Image as ImageIcon,
  Plane,
  Stethoscope,
  Gavel,
  Wrench,
  School,
  TrainFront,
  BusFront,
  Package,
  Store,
  Banknote,
  Clock3,
  Sparkles,
} from 'lucide-react';
import API from '../../api/axios';

const SearchSkeleton = lazy(() => import('../../components/skeletons/SearchSkeleton'));

const BG = '#050B18';
const CARD = '#111827';
const BORDER = '#1F2937';
const GOLD = '#FACC15';

const ENTITY_META = {
  all: { icon: Globe, labelKey: 'search.tabs.all' },
  jobs: { icon: Briefcase, labelKey: 'search.tabs.jobs' },
  workers: { icon: User, labelKey: 'search.tabs.workers' },
  companies: { icon: Building2, labelKey: 'search.tabs.companies' },
  hotels: { icon: Hotel, labelKey: 'search.tabs.hotels' },
  restaurants: { icon: UtensilsCrossed, labelKey: 'search.tabs.restaurants' },
  products: { icon: ShoppingBag, labelKey: 'search.tabs.products' },
  houses: { icon: Home, labelKey: 'search.tabs.houses' },
  cars: { icon: CarFront, labelKey: 'search.tabs.cars' },
  posts: { icon: Layers3, labelKey: 'search.tabs.posts' },
  files: { icon: FileText, labelKey: 'search.tabs.files' },
  voice: { icon: FileAudio2, labelKey: 'search.tabs.voice' },
  videos: { icon: Video, labelKey: 'search.tabs.videos' },
  images: { icon: ImageIcon, labelKey: 'search.tabs.images' },
  services: { icon: PenTool, labelKey: 'search.tabs.services' },
  travel: { icon: Landmark, labelKey: 'search.tabs.travel' },
  flights: { icon: Plane, labelKey: 'search.tabs.flights' },
  hospitals: { icon: Stethoscope, labelKey: 'search.tabs.hospitals' },
  clinics: { icon: Stethoscope, labelKey: 'search.tabs.clinics' },
  lawyers: { icon: Gavel, labelKey: 'search.tabs.lawyers' },
  mechanics: { icon: Wrench, labelKey: 'search.tabs.mechanics' },
  courses: { icon: School, labelKey: 'search.tabs.courses' },
  buses: { icon: BusFront, labelKey: 'search.tabs.buses' },
  trains: { icon: TrainFront, labelKey: 'search.tabs.trains' },
  deliveries: { icon: Package, labelKey: 'search.tabs.deliveries' },
  marketplaces: { icon: Store, labelKey: 'search.tabs.marketplaces' },
  banks: { icon: Banknote, labelKey: 'search.tabs.banks' },
};

const cls = (...p) => p.filter(Boolean).join(' ');

function useDebouncedValue(value, delay = 240) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function useOfflineCache() {
  const HISTORY_KEY = 'jobfast-search-history-v5';
  const LAST_KEY = 'jobfast-last-results-v5';
  const [history, setHistory] = useState([]);
  const [lastResults, setLastResults] = useState(null);

  useEffect(() => {
    (async () => {
      setHistory((await localforage.getItem(HISTORY_KEY)) || []);
      setLastResults((await localforage.getItem(LAST_KEY)) || null);
    })();
  }, []);

  const pushHistory = useCallback(async (q) => {
    if (!q?.trim()) return;
    setHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 12);
      localforage.setItem(HISTORY_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await localforage.removeItem(HISTORY_KEY).catch(() => {});
  }, []);

  const saveLastResults = useCallback(async (payload) => {
    setLastResults(payload);
    await localforage.setItem(LAST_KEY, payload).catch(() => {});
  }, []);

  return { history, pushHistory, clearHistory, lastResults, saveLastResults };
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function useAbortablePost() {
  const ref = useRef(null);
  const run = useCallback(async (url, data = {}, config = {}) => {
    ref.current?.abort?.();
    const controller = new AbortController();
    ref.current = controller;
    const res = await API.post(url, data, { ...config, signal: controller.signal, timeout: 15000 });
    return res.data;
  }, []);
  useEffect(() => () => ref.current?.abort?.(), []);
  return run;
}

function useGeolocation() {
  const [position, setPosition] = useState(null);

  const getLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setPosition(null);
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(next);
          resolve(next);
        },
        () => {
          setPosition(null);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, []);

  return { position, getLocation };
}

function useVoiceSearch(onQuery, lang) {
  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const txt = Array.from(e.results).map((r) => r[0]?.transcript || '').join(' ').trim();
      if (txt) onQuery(txt);
    };
    rec.start();
  }, [supported, onQuery, lang]);
  return { start, supported };
}

function SmartImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimized = useMemo(() => {
    if (!src || error) return null;
    const base = src.trim();
    if (/cloudinary\.com/.test(base)) return base.replace('/upload/', '/upload/f_auto,q_auto,w_128,dpr_2.0,c_fill,g_auto/');
    if (/imagekit\.io/.test(base)) return `${base}${base.includes('?') ? '&' : '?'}tr=w-128,dpr-2,f-auto,q-80`;
    return base;
  }, [src, error]);

  if (!optimized) {
    return (
      <div className={cls('bg-white/5 flex items-center justify-center', className)}>
        <ImageIcon className="h-5 w-5 text-slate-500" />
      </div>
    );
  }

  return (
    <div className={cls('relative overflow-hidden', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      <img
        src={optimized}
        alt={alt || ''}
        loading="lazy"
        decoding="async"
        className={cls('w-full h-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

const ResultCard = memo(function ResultCard({ item, onClick, onHover }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onClick(item)}
      onMouseEnter={() => onHover?.(item)}
      onFocus={() => onHover?.(item)}
      className="w-full rounded-[20px] border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
      style={{ background: CARD, borderColor: BORDER }}
      aria-label={item.title}
      role="listitem"
    >
      <div className="p-4 flex gap-3 items-center">
        <SmartImage src={item.image || item.avatar || item.thumbnail} alt={item.title} className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-extrabold text-white truncate">{item.title}</p>
            {item.verified && <BadgeCheck className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden />}
            {item.premium && <Star className="h-4 w-4 text-amber-400 shrink-0" aria-hidden />}
          </div>
          <p className="text-xs text-slate-400 truncate">{item.sub || ''}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 truncate">
            {item.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
            {typeof item.distanceKm === 'number' && <span>{item.distanceKm} km</span>}
            {typeof item.etaMin === 'number' && <span>{item.etaMin} min ETA</span>}
            {item.freshness && <span>{item.freshness}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
      </div>
    </motion.button>
  );
});

function SearchHeader({ query, setQuery, onVoice, onQr, onClear, inputRef, voiceSupported, offline }) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(5,11,24,0.9)', backdropFilter: 'blur(20px)', borderColor: BORDER }}>
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ background: CARD, borderColor: BORDER }} role="search">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500"
            autoComplete="off"
            spellCheck="false"
            aria-label={t('search.placeholder')}
          />
          {offline && <WifiOff className="h-4 w-4 text-amber-400" />}
          {query && (
            <button onClick={onClear} aria-label={t('search.clear')}>
              <X className="h-4 w-4 text-slate-500" />
            </button>
          )}
          <button onClick={onVoice} disabled={!voiceSupported} aria-label={t('search.voice')}>
            <Mic className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={onQr} aria-label={t('search.qr')}>
            <ScanSearch className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}

function VirtualList({ items, onClick, onHover }) {
  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-[70vh] overflow-auto rounded-[24px] border" style={{ borderColor: BORDER }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vRow) => {
          const item = items[vRow.index];
          if (!item) return null;
          return (
            <div
              key={item.id}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 top-0 w-full p-4"
              style={{ transform: `translateY(${vRow.start}px)` }}
            >
              <ResultCard item={item} onClick={onClick} onHover={onHover} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchErrorState({ error, retry, offline }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border p-6 text-center" style={{ background: CARD, borderColor: BORDER }} role="alert">
      <p className="text-lg font-bold">{t('search.errors.unavailable')}</p>
      <p className="text-sm text-slate-400 mt-2">
        {offline ? t('search.offlineBanner') : error?.message || t('search.errors.network')}
      </p>
      {!offline && (
        <button onClick={retry} className="mt-4 px-5 py-2.5 rounded-full font-semibold" style={{ background: GOLD, color: '#050B18' }}>
          {t('search.retry')}
        </button>
      )}
    </div>
  );
}

export default function UniversalSearch() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { history, pushHistory, clearHistory, lastResults, saveLastResults } = useOfflineCache();
  const { position, getLocation } = useGeolocation();

  const [query, setQuery] = useState(params.get('q') || '');
  const [scope, setScope] = useState(params.get('type') || 'all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    premiumOnly: false,
    openNow: false,
    priceMin: '',
    priceMax: '',
    distanceKm: '',
    country: '',
    city: '',
    category: '',
    ratingMin: '',
    language: '',
    availability: '',
    dateFrom: '',
    dateTo: '',
    salaryMin: '',
    salaryMax: '',
    contractType: '',
    delivery: false,
  });
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const inputRef = useRef(null);
  const debouncedQuery = useDebouncedValue(query, 240);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const searchApi = useAbortablePost();
  const voice = useVoiceSearch((txt) => setQuery(txt), i18n.language || 'en-US');

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedQuery) next.set('q', debouncedQuery);
    else next.delete('q');
    if (scope && scope !== 'all') next.set('type', scope);
    else next.delete('type');
    setParams(next, { replace: true });
  }, [debouncedQuery, scope, params, setParams]);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  const searchQuery = useInfiniteQuery({
    queryKey: ['global-search', deferredQuery, scope, JSON.stringify(filters), JSON.stringify(position)],
    enabled: !!deferredQuery.trim() && !offline,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await searchApi('/api/search/universal', {
        query: deferredQuery,
        types: scope === 'all' ? Object.keys(ENTITY_META).filter((k) => k !== 'all') : [scope],
        page: pageParam,
        limit: 20,
        location: position ? { lat: position.lat, lng: position.lng, radiusKm: Number(filters.distanceKm) || 25 } : undefined,
        language: i18n.language || 'en',
        currency: filters.currency || 'USD',
        filters,
      });
      if (pageParam === 1) await saveLastResults({ q: deferredQuery, scope, data, ts: Date.now() });
      return data;
    },
    getNextPageParam: (last) => last?.nextPage ?? undefined,
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });

  const suggestionsQuery = useQuery({
    queryKey: ['search-suggest', deferredQuery, scope, i18n.language, JSON.stringify(position)],
    enabled: !!deferredQuery.trim() && !offline,
    queryFn: async () =>
      (await API.post('/api/search/suggestions', {
        query: deferredQuery,
        scope,
        language: i18n.language || 'en',
        location: position ? { lat: position.lat, lng: position.lng } : undefined,
      })).data,
    staleTime: 5 * 60_000,
  });

  const items = useMemo(() => {
    const raw = (searchQuery.data?.pages || []).flatMap((p) => p.items || []);
    const source = raw.length ? raw : offline && lastResults?.q === deferredQuery ? (lastResults?.data?.items || []) : [];
    return source.slice().sort((a, b) => (b.rankingScore ?? b.score ?? 0) - (a.rankingScore ?? a.score ?? 0));
  }, [searchQuery.data, offline, lastResults, deferredQuery]);

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const item of items) {
      const type = item.type || 'all';
      c[type] = (c[type] || 0) + 1;
    }
    return c;
  }, [items]);

  const grouped = useMemo(() => {
    const map = {};
    for (const item of items) {
      const key = item.type || 'all';
      (map[key] ||= []).push(item);
    }
    return map;
  }, [items]);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });
  useEffect(() => {
    if (inView && searchQuery.hasNextPage && !searchQuery.isFetchingNextPage && !offline) {
      searchQuery.fetchNextPage();
    }
  }, [inView, searchQuery, offline]);

  useEffect(() => {
    if (!deferredQuery.trim()) return;
    pushHistory(deferredQuery);
  }, [deferredQuery, pushHistory]);

  const trackEvent = useCallback((event, payload = {}) => {
    const base = {
      event,
      query: deferredQuery,
      scope,
      country: filters.country || '',
      language: i18n.language || 'en',
      device: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      responseTime: payload.responseTime || null,
      resultCount: payload.resultCount || items.length,
      timestamp: Date.now(),
      ...payload,
    };
    API.post('/api/analytics/events', base).catch(() => {});
  }, [deferredQuery, scope, filters.country, i18n.language, items.length]);

  useEffect(() => {
    if (!deferredQuery.trim()) return;
    trackEvent('search_query', { resultCount: items.length });
  }, [deferredQuery, trackEvent, items.length]);

  const prefetchDetail = useCallback((item) => {
    if (!item?.href || offline) return;
    queryClient.prefetchQuery({
      queryKey: ['detail', item.id],
      queryFn: async () => (await API.get(item.href)).data,
      staleTime: 5 * 60_000,
    });
  }, [queryClient, offline]);

  const onClick = useCallback((item) => {
    trackEvent('search_click', { id: item.id, type: item.type });
    navigate(item.href || `/detail/${item.id}`);
  }, [navigate, trackEvent]);

  const onHover = useCallback((item) => {
    prefetchDetail(item);
  }, [prefetchDetail]);

  const canRender = !!deferredQuery.trim();
  const showEmpty = canRender && !searchQuery.isLoading && items.length === 0;

  return (
    <ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 px-4">{t('search.crash')}</div>}>
      <div className="min-h-screen text-white" style={{ background: BG }}>
        <SearchHeader
          query={query}
          setQuery={setQuery}
          onVoice={() => {
            if (voice.supported) return voice.start();
            API.post('/api/search/voice', { query }).catch(() => {});
          }}
          onQr={() => navigate('/scan')}
          onClear={() => setQuery('')}
          inputRef={inputRef}
          voiceSupported={voice.supported}
          offline={offline}
        />

        <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {!canRender && (
            <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[28px] border p-5" style={{ background: CARD, borderColor: BORDER }}>
                <h2 className="text-lg font-black flex items-center gap-2"><TrendingUp className="h-5 w-5 text-amber-400" />{t('search.trending')}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['electrician', 'cheap hotel near beach', 'driver punta cana'].map((term) => (
                    <button key={term} onClick={() => setQuery(term)} className="px-3 py-2 rounded-full text-sm border" style={{ background: '#0b1220', borderColor: BORDER }}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border p-5" style={{ background: CARD, borderColor: BORDER }}>
                <h2 className="text-lg font-black flex items-center gap-2"><History className="h-5 w-5 text-slate-400" />{t('search.recent')}</h2>
                <div className="mt-4 space-y-2">
                  {history.length ? history.map((h) => (
                    <button key={h} onClick={() => setQuery(h)} className="w-full flex items-center justify-between rounded-2xl px-3 py-3 border text-left" style={{ borderColor: BORDER }}>
                      <span className="truncate text-sm">{h}</span>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </button>
                  )) : <p className="text-sm text-slate-500">{t('search.noRecent')}</p>}
                </div>
                {history.length > 0 && <button onClick={clearHistory} className="mt-4 text-xs text-slate-500">{t('search.clearHistory')}</button>}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(ENTITY_META).map(([key, meta]) => {
              const Icon = meta.icon;
              const active = scope === key;
              return (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={cls('flex items-center gap-2 px-4 py-2 rounded-full border text-sm')}
                  style={{ background: active ? GOLD : CARD, color: active ? '#050B18' : '#94a3b8', borderColor: active ? GOLD : BORDER }}
                >
                  <Icon className="h-4 w-4" />
                  {t(meta.labelKey)}
                  <span className="text-xs opacity-80">({counts[key] || 0})</span>
                </button>
              );
            })}
            <button onClick={() => setFiltersOpen((v) => !v)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full border text-sm" style={{ background: CARD, borderColor: BORDER }}>
              <Filter className="h-4 w-4" />
              {t('search.filters')}
            </button>
          </div>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-[24px] border p-4" style={{ background: CARD, borderColor: BORDER }}>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 text-sm">
                  {[
                    ['verifiedOnly', 'Verified only'],
                    ['premiumOnly', 'Premium only'],
                    ['openNow', 'Open now'],
                    ['delivery', 'Delivery'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!filters[key]} onChange={() => setFilters((p) => ({ ...p, [key]: !p[key] }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                  <input placeholder="Min price" value={filters.priceMin} onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Max price" value={filters.priceMax} onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Distance km" value={filters.distanceKm} onChange={(e) => setFilters((p) => ({ ...p, distanceKm: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Country" value={filters.country} onChange={(e) => setFilters((p) => ({ ...p, country: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="City" value={filters.city} onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Language" value={filters.language} onChange={(e) => setFilters((p) => ({ ...p, language: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Category" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Rating min" value={filters.ratingMin} onChange={(e) => setFilters((p) => ({ ...p, ratingMin: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Date from" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Date to" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Salary min" value={filters.salaryMin} onChange={(e) => setFilters((p) => ({ ...p, salaryMin: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Salary max" value={filters.salaryMax} onChange={(e) => setFilters((p) => ({ ...p, salaryMax: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                  <input placeholder="Contract type" value={filters.contractType} onChange={(e) => setFilters((p) => ({ ...p, contractType: e.target.value }))} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2" />
                </div>
                <div className="mt-4">
                  <button onClick={getLocation} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: BORDER }}>
                    <MapPin className="h-4 w-4" />
                    Use my location
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {searchQuery.isLoading && !offline && (
            <Suspense fallback={<div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: CARD }} />)}</div>}>
              <SearchSkeleton />
            </Suspense>
          )}

          {searchQuery.isError && !offline && <SearchErrorState error={searchQuery.error} retry={() => searchQuery.refetch()} offline={offline} />}

          {offline && (
            <div className="rounded-2xl border px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(250,204,21,0.08)', borderColor: GOLD }}>
              <WifiOff className="h-4 w-4" />
              {t('search.offlineBanner')}
            </div>
          )}

          {!!suggestionsQuery.data?.items?.length && canRender && (
            <section className="rounded-[24px] border p-4" style={{ background: CARD, borderColor: BORDER }}>
              <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">{t('search.suggestions')}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestionsQuery.data.items.map((s) => (
                  <button key={s} onClick={() => setQuery(s)} className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          {canRender && items.length > 0 ? (
            <section className="space-y-6">
              {scope === 'all'
                ? Object.entries(grouped).map(([type, arr]) => (
                    <div key={type} className="space-y-3">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black">
                        {t(ENTITY_META[type]?.labelKey || type)} ({arr.length})
                      </h3>
                      <VirtualList items={arr} onClick={onClick} onHover={onHover} />
                    </div>
                  ))
                : <VirtualList items={grouped[scope] || []} onClick={onClick} onHover={onHover} />
              }
              <div ref={sentinelRef} className="h-10" />
              {searchQuery.isFetchingNextPage && (
                <div className="flex justify-center py-4 text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('search.loadingMore')}
                </div>
              )}
            </section>
          ) : showEmpty ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-lg font-bold">{t('search.noResults')}</p>
              <p className="text-sm mt-2">{t('search.tryAnother')}</p>
            </div>
          ) : null}
        </main>
      </div>
    </ErrorBoundary>
  );
}
