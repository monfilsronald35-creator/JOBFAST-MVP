import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as VirtualList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import {
  getSearchConfig,
  DEFAULT_FILTERS,
  FILTER_DEFS,
} from "../config/searchConfig";
import useGPS, { GPS_STATES } from "../hooks/useGPS";

const CDN_BASE_URL = (import.meta.env.VITE_CDN_BASE_URL as string | undefined) ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileMetadata {
  profilePhotoUrl?: string;
  profilePhotoPath?: string;
  phone?: string;
}

interface SearchResult {
  id?: string;
  _id?: string;
  name?: string;
  profession?: string;
  distanceKm?: number;
  stats?: { rating?: number };
  rating?: number;
  trust_score?: number;
  availability?: string;
  verified?: boolean;
  experience?: number;
  language?: string;
  aiMatchScore?: number;
  matchScore?: number;
  responseTimeMinutes?: number;
  completedJobs?: number;
  jobsDone?: number;
  aiScore?: number;
  sponsored?: boolean;
  photo?: string;
  phone?: string;
  profileMetadata?: ProfileMetadata;
  location?: { city?: string; state?: string };
  query?: string;
  label?: string;
}

interface FilterState {
  availableOnly: boolean;
  verifiedOnly: boolean;
  maxDistance: number;
  minRating: number;
  minTrust: number;
  minExperience: number;
  language: string;
  country: string;
  serviceZone: string;
  [key: string]: unknown;
}

interface CacheEntry {
  items: SearchResult[];
  hasMore: boolean;
  ts: number;
  cursor: string | null;
}

// Typed wrappers for JS-sourced FILTER_DEFS
interface ToggleFilterDef  { type: 'toggle';  key: string; emoji: string; label: string }
interface StepsFilterDef   { type: 'steps';   key: string; steps: (string | number)[]; unit: string; zero: string | number }
interface OptionsFilterDef { type: 'options'; key: string; options: string[]; zero: string }
type FilterDef = ToggleFilterDef | StepsFilterDef | OptionsFilterDef;

// ─── Field renderers ──────────────────────────────────────────────────────────

const FIELD_RENDERERS: Record<string, (item: SearchResult) => string | null> = {
  profession:      (item) => item.profession ? `💼 ${item.profession}` : null,
  distance:        (item) => item.distanceKm != null ? `📍 ${item.distanceKm.toFixed(1)} km` : null,
  rating:          (item) => { const r = item.stats?.rating ?? item.rating; return r != null ? `⭐ ${Number(r).toFixed(1)}` : null; },
  trust_score:     (item) => item.trust_score != null ? `🛡️ ${item.trust_score}` : null,
  availability:    (item) => { if (item.availability === "available") return "🟢 Online"; if (item.availability === "busy") return "🟡 Busy"; return "🔴 Offline"; },
  verified:        (item) => item.verified ? "✅ Verifye" : null,
  experience:      (item) => item.experience != null ? `🎓 ${item.experience} ans` : null,
  language:        (item) => item.language ? `🌐 ${item.language}` : null,
  ai_match:        (item) => { const m = item.aiMatchScore ?? item.matchScore; return m != null ? `🤖 ${m}% Match` : null; },
  response_time:   (item) => item.responseTimeMinutes != null ? `⚡ ${item.responseTimeMinutes}m` : null,
  completed_jobs:  (item) => { const j = item.completedJobs ?? item.jobsDone; return j != null ? `📌 ${j} jobs` : null; },
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-[#162238] rounded-xl border border-[#1e2d45] overflow-hidden animate-pulse">
    <div className="p-4 flex gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-2 bg-slate-800 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-2 bg-slate-800 rounded w-1/4" />
          <div className="h-2 bg-slate-800 rounded w-1/4" />
          <div className="h-2 bg-slate-800 rounded w-1/4" />
        </div>
      </div>
    </div>
    <div className="h-9 bg-slate-800/60" />
  </div>
);

// ─── Result card ──────────────────────────────────────────────────────────────

interface ResultCardProps {
  item: SearchResult;
  cardFields: string[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

const ResultCard = memo(function ResultCard({ item, cardFields, isFavorite, onToggleFavorite }: ResultCardProps) {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const city = item.location?.city || item.location?.state || "";

  const statusBadge =
    item.availability === "available" ? "🟢 Online"
    : item.availability === "busy"   ? "🟡 Busy"
    : "🔴 Offline";

  let avatarSrc = item.photo || item.profileMetadata?.profilePhotoUrl || "";
  if (!avatarSrc && item.profileMetadata?.profilePhotoPath) {
    avatarSrc = `${CDN_BASE_URL}${item.profileMetadata.profilePhotoPath}`;
  }

  const aiMatch = item.aiMatchScore ?? item.matchScore;
  const phone   = item.phone || item.profileMetadata?.phone;
  const hasPhone = Boolean(phone);
  const id = item.id || item._id;
  const fav = id ? isFavorite(id) : false;

  const onProfile = () => { navigate(`/u/${id}`, { state: { profile: item } }); };
  const onCall    = () => { if (!hasPhone) return; window.location.href = `tel:${phone}`; };
  const onChat    = () => { navigate(`/chat/${id}`); };
  const onBook    = () => { navigate(`/u/${id}`, { state: { profile: item } }); };
  const onRate    = () => { navigate(`/u/${id}`, { state: { profile: item } }); };

  return (
    <div className="bg-[#162238] rounded-xl border border-[#1e2d45] overflow-hidden">
      <button type="button" onClick={onProfile} className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/5 active:bg-white/10 transition">
        <div className="relative">
          {avatarSrc ? (
            <img
              loading="lazy"
              decoding="async"
              src={avatarSrc}
              alt={item.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-700 border border-slate-700 shrink-0 flex items-center justify-center text-[10px] text-slate-300">
              {item.name?.[0] ?? "U"}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (id) onToggleFavorite(id); }}
            className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-xs"
          >
            {fav ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
              {item.verified && <span className="text-emerald-400 text-[10px]">✓</span>}
            </div>
            {aiMatch != null && (
              <span className="text-[10px] text-amber-300 font-semibold shrink-0">{aiMatch}% Match</span>
            )}
          </div>

          {city && <p className="text-[10px] text-slate-400 mt-0.5">{city}</p>}

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <span className="text-[10px] text-slate-300">{statusBadge}</span>
            {cardFields.map((field) => {
              const renderer = FIELD_RENDERERS[field];
              const text = renderer ? renderer(item) : null;
              if (!text) return null;
              return <span key={field} className="text-[10px] text-slate-300">{text}</span>;
            })}
          </div>

          {typeof item.aiScore === "number" && (
            <p className="mt-1 text-[10px] text-emerald-300">AI Score: {item.aiScore.toFixed(1)}</p>
          )}
          {item.sponsored && <p className="mt-0.5 text-[10px] text-amber-400">Sponsored</p>}
        </div>
      </button>

      <div className="flex border-t border-[#1e2d45]">
        <button onClick={onCall} disabled={!hasPhone} className="flex-1 py-2.5 text-[11px] font-bold text-green-400 flex items-center justify-center gap-1 hover:bg-green-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition">
          📞 {t("search.call")}
        </button>
        <button onClick={onChat} className="flex-1 py-2.5 text-[11px] font-bold text-blue-400 flex items-center justify-center gap-1 hover:bg-blue-500/10 transition border-l border-[#1e2d45]">
          💬 {t("search.chat")}
        </button>
        <button onClick={onRate} className="flex-1 py-2.5 text-[11px] font-bold text-amber-400 flex items-center justify-center gap-1 hover:bg-amber-500/10 transition border-l border-[#1e2d45]">
          ⭐ {t("search.rate")}
        </button>
        <button onClick={onBook} className="flex-1 py-2.5 text-[11px] font-bold text-violet-400 flex items-center justify-center gap-1 hover:bg-violet-500/10 transition border-l border-[#1e2d45]">
          📋 {t("search.book")}
        </button>
      </div>
    </div>
  );
});

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  activeFilterKeys: string[];
  filterState: FilterState;
  onChange: (key: string, value: unknown) => void;
  hasGPS: boolean;
}

const FilterBar = memo(function FilterBar({ activeFilterKeys, filterState, onChange, hasGPS }: FilterBarProps) {
  const filterDefs = FILTER_DEFS as Record<string, FilterDef>;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {activeFilterKeys.map((key) => {
        const def = filterDefs[key];
        if (!def) return null;
        if (key === "distance" && !hasGPS) return null;

        if (def.type === "toggle") {
          const active = Boolean(filterState[def.key]);
          return (
            <button
              key={key}
              onClick={() => onChange(def.key, !active)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? "bg-emerald-500 text-black" : "bg-[#1e2d45] text-slate-300"}`}
            >
              {def.emoji} {def.label}
            </button>
          );
        }

        if (def.type === "steps") {
          const current = filterState[def.key];
          return (
            <div key={key} className="flex gap-1 shrink-0">
              {def.steps.map((step) => (
                <button
                  key={String(step)}
                  onClick={() => onChange(def.key, current === step ? def.zero : step)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${current === step ? "bg-amber-500 text-black" : "bg-[#1e2d45] text-slate-300"}`}
                >
                  {step}{def.unit}
                </button>
              ))}
            </div>
          );
        }

        if (def.type === "options") {
          const current = filterState[def.key];
          return (
            <div key={key} className="flex gap-1 shrink-0">
              {def.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onChange(def.key, current === opt ? def.zero : opt)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${current === opt ? "bg-blue-500 text-white" : "bg-[#1e2d45] text-slate-300"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
});

// ─── Recent searches ──────────────────────────────────────────────────────────

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem("jobfast_recent_searches");
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as string[]).slice(0, 10) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(q: string): void {
  if (!q) return;
  try {
    const existing = loadRecentSearches().filter((x) => x !== q);
    const next = [q, ...existing].slice(0, 10);
    localStorage.setItem("jobfast_recent_searches", JSON.stringify(next));
  } catch {
    // ignore
  }
}

const POPULAR_SEARCHES = ["Electrician", "Plumber", "Painter", "Maid", "Gardener", "Driver"];

// ─── AI suggestions cache ─────────────────────────────────────────────────────

interface SuggestionCacheEntry { data: string[]; ts: number }
const suggestionCache = new Map<string, SuggestionCacheEntry>();
const SUGGESTION_TTL_MS   = 1000 * 60 * 30;
const SUGGESTION_MAX_ENTRIES = 200;

async function fetchAISuggestionsAPI(q: string, signal: AbortSignal): Promise<string[]> {
  const cached = suggestionCache.get(q);
  const now    = Date.now();
  if (cached && now - cached.ts < SUGGESTION_TTL_MS) return cached.data;

  const res = await API.get("/search/suggestions", { params: { q }, signal });
  const suggestions: string[] = (res.data?.data?.suggestions as string[] | undefined) ?? [];
  suggestionCache.set(q, { data: suggestions, ts: now });

  if (suggestionCache.size > SUGGESTION_MAX_ENTRIES) {
    const entries = Array.from(suggestionCache.entries()).sort((a, b) => a[1].ts - b[1].ts);
    const removeCount = suggestionCache.size - SUGGESTION_MAX_ENTRIES;
    for (let i = 0; i < removeCount; i += 1) suggestionCache.delete(entries[i]![0]);
  }

  return suggestions;
}

// ─── Analytics queue ──────────────────────────────────────────────────────────

interface AnalyticsEvent { type: string; ts: string; [key: string]: unknown }

const analyticsQueue: AnalyticsEvent[] = [];
let analyticsFlushTimer: ReturnType<typeof setTimeout> | null = null;
const ANALYTICS_MAX_BATCH = 50;
const ANALYTICS_FLUSH_MS  = 30000;

function flushAnalytics(useBeacon = false): void {
  if (analyticsQueue.length === 0) return;
  const batch = analyticsQueue.splice(0, analyticsQueue.length);
  if (analyticsFlushTimer) { clearTimeout(analyticsFlushTimer); analyticsFlushTimer = null; }

  const url  = "/analytics/search/batch";
  const body = JSON.stringify({ events: batch });

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }
  API.post(url, { events: batch }).catch(() => {});
}

function pushAnalyticsEvent(evt: AnalyticsEvent): void {
  analyticsQueue.push(evt);
  if (analyticsQueue.length >= ANALYTICS_MAX_BATCH) {
    flushAnalytics(false);
  } else if (!analyticsFlushTimer) {
    analyticsFlushTimer = setTimeout(() => { flushAnalytics(false); }, ANALYTICS_FLUSH_MS);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAnalytics(true);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const u = user as Record<string, unknown> | null;
  const { coords, gpsState, acquire } = useGPS() as {
    coords: { lat: number; lng: number } | null;
    gpsState: string;
    acquire: () => void;
  };
  const { t } = useTranslation();

  useEffect(() => { acquire(); }, [acquire]);

  const role         = (u?.['role'] as string | undefined) ?? "worker";
  const searchConfig = useMemo(() => getSearchConfig(role) as {
    heading: string;
    placeholder: string;
    cardFields: string[];
    activeFilters: string[];
  }, [role]);

  const [query,           setQuery]           = useState("");
  const [filters,         setFilters]         = useState<FilterState>(() => ({ ...(DEFAULT_FILTERS as FilterState) }));
  const [results,         setResults]         = useState<SearchResult[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [hasMore,         setHasMore]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [showPullHint,    setShowPullHint]    = useState(false);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [recentSearches,  setRecentSearches]  = useState<string[]>(() => loadRecentSearches());
  const [aiSuggestions,   setAISuggestions]   = useState<string[]>([]);
  const [personalized,    setPersonalized]    = useState<SearchResult[]>([]);
  const [didYouMean,      setDidYouMean]      = useState<string | null>(null);
  const [region,          setRegion]          = useState("global");

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("jobfast_favorites");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
  });

  const cacheRef        = useRef(new Map<string, CacheEntry>());
  const abortSearchRef  = useRef<AbortController | null>(null);
  const abortSuggestRef = useRef<AbortController | null>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef     = useRef<HTMLDivElement | null>(null);
  const cursorRef       = useRef<string | null>(null);
  const loadingRef      = useRef(false);
  const coordsRef       = useRef(coords);
  const filtersRef      = useRef(filters);

  const OFFLINE_TTL_MS   = 1000 * 60 * 60 * 24;
  const CACHE_TTL_MS     = 1000 * 60 * 5;
  const CACHE_MAX_ENTRIES = 100;

  useEffect(() => { coordsRef.current = coords;  }, [coords]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const hasGPS = coords !== null;

  useEffect(() => {
    if (u?.['region']) setRegion(u['region'] as string);
    else setRegion("global");
  }, [u]);

  const makeCacheKey = useCallback(
    (cursor: string | null) =>
      JSON.stringify({
        q: query.trim(),
        filters: filtersRef.current,
        cursor,
        coords: coordsRef.current ? { lat: coordsRef.current.lat, lng: coordsRef.current.lng } : null,
        region,
      }),
    [query, region]
  );

  const pruneCacheIfNeeded = () => {
    const map = cacheRef.current;
    const now = Date.now();
    for (const [key, value] of map.entries()) {
      if (now - value.ts > CACHE_TTL_MS) map.delete(key);
    }
    if (map.size <= CACHE_MAX_ENTRIES) return;
    const entries = Array.from(map.entries()).sort((a, b) => a[1].ts - b[1].ts);
    const removeCount = map.size - CACHE_MAX_ENTRIES;
    for (let i = 0; i < removeCount; i += 1) map.delete(entries[i]![0]);
  };

  const persistOfflineResults = useCallback((items: SearchResult[]) => {
    try { localStorage.setItem("jobfast_last_results", JSON.stringify({ ts: Date.now(), items })); }
    catch { /* ignore */ }
  }, []);

  const loadOfflineResults = useCallback((): SearchResult[] | null => {
    try {
      const raw = localStorage.getItem("jobfast_last_results");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { items?: SearchResult[]; ts?: number };
      if (!parsed.items || !parsed.ts) return null;
      if (Date.now() - parsed.ts > OFFLINE_TTL_MS) return null;
      return parsed.items;
    } catch { return null; }
  }, [OFFLINE_TTL_MS]);

  const loadPersonalized = useCallback(async () => {
    if (!u) return;
    try {
      const res = await API.get("/search/recommendations", { params: { userId: u['id'] } });
      setPersonalized((res.data?.data?.items as SearchResult[] | undefined) ?? []);
    } catch { /* ignore */ }
  }, [u]);

  useEffect(() => { loadPersonalized(); }, [loadPersonalized]);

  const isFavorite   = useCallback((id: string) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem("jobfast_favorites", JSON.stringify(next)); } catch { /* ignore */ }
      pushAnalyticsEvent({ type: exists ? "unfavorite" : "favorite", itemId: id, ts: new Date().toISOString() });
      return next;
    });
  }, []);

  const fetchPage = useCallback(
    async (
      cursor: string | null,
      append: boolean,
      { allowOfflineFallback = true, fromPrefetch = false }: { allowOfflineFallback?: boolean; fromPrefetch?: boolean } = {}
    ) => {
      const cacheKey = makeCacheKey(cursor);
      const cached   = cacheRef.current.get(cacheKey);
      const now      = Date.now();

      if (cached && now - cached.ts < CACHE_TTL_MS && !append && !fromPrefetch) {
        setResults(cached.items);
        setHasMore(cached.hasMore);
        cursorRef.current = cached.cursor ?? null;
        setError(null);
        void (async () => {
          try { await fetchPage(cursor, false, { allowOfflineFallback: false, fromPrefetch: true }); }
          catch { /* ignore */ }
        })();
        return;
      }

      if (!navigator.onLine && allowOfflineFallback && !fromPrefetch) {
        const offline = loadOfflineResults();
        if (offline) {
          setResults(offline);
          setHasMore(false);
          setError("Ou offline kounya. Nou montre dènye rezilta ou te gen yo (offline).");
          return;
        }
      }

      if (abortSearchRef.current && !fromPrefetch) abortSearchRef.current.abort();
      const ctrl = new AbortController();
      if (!fromPrefetch) abortSearchRef.current = ctrl;

      if (!fromPrefetch) { setLoading(true); setError(null); setDidYouMean(null); }

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const currentCoords  = coordsRef.current;
          const currentFilters = filtersRef.current;

          const params: Record<string, unknown> = { q: query.trim(), limit: 20, region };
          if (cursor) params['cursor'] = cursor;
          if (currentCoords) { params['lat'] = currentCoords.lat; params['lng'] = currentCoords.lng; }
          if (currentFilters.availableOnly) params['availableOnly'] = "true";
          if (currentFilters.verifiedOnly)  params['verifiedOnly']  = "true";
          if ((currentFilters.maxDistance as number) > 0 && currentCoords) params['radius'] = currentFilters.maxDistance;
          if ((currentFilters.minRating as number) > 0)    params['minRating']    = currentFilters.minRating;
          if ((currentFilters.minTrust as number) > 0)     params['minTrust']     = currentFilters.minTrust;
          if ((currentFilters.minExperience as number) > 0) params['minExperience'] = currentFilters.minExperience;
          if (currentFilters.language)    params['language']    = currentFilters.language;
          if (currentFilters.country)     params['country']     = currentFilters.country;
          if (currentFilters.serviceZone) params['serviceZone'] = currentFilters.serviceZone;
          if (u?.['id']) params['userId'] = u['id'];

          const res = await API.get("/search", { params, signal: ctrl.signal });
          const {
            items = [],
            hasMore: more = false,
            nextCursor = null,
            didYouMean: suggestion = null,
          } = (res.data?.data as { items?: SearchResult[]; hasMore?: boolean; nextCursor?: string | null; didYouMean?: string | null } | undefined) ?? {};

          if (suggestion && suggestion !== query.trim() && !fromPrefetch) setDidYouMean(suggestion);

          if (!fromPrefetch) {
            setResults((prev) => append ? [...prev, ...items] : items);
            setHasMore(!!more);
          }
          cursorRef.current = nextCursor ?? null;

          const merged = append && !fromPrefetch ? [...results, ...items] : items;
          cacheRef.current.set(cacheKey, { items: merged, hasMore: !!more, ts: now, cursor: nextCursor ?? null });
          pruneCacheIfNeeded();

          if (!append && !fromPrefetch) persistOfflineResults(items);
          if (!fromPrefetch) setLoading(false);
          return;
        } catch (err: unknown) {
          const e = err as { code?: string; name?: string };
          if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError") {
            if (!fromPrefetch) setLoading(false);
            return;
          }
          attempts += 1;
          if (attempts >= maxAttempts && !fromPrefetch) {
            if (allowOfflineFallback) {
              const offline = loadOfflineResults();
              if (offline) { setResults(offline); setHasMore(false); setError("Pa gen entènèt. Nou montre dènye rezilta ou te gen yo (offline)."); setLoading(false); return; }
            }
            setError("Erè rezo. Verifye koneksyon ou.");
          }
        }
      }
      if (!fromPrefetch) setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [makeCacheKey, query, loadOfflineResults, persistOfflineResults, results, region, u]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cursorRef.current = null;
    debounceRef.current = setTimeout(() => { void fetchPage(null, false); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filters, coords, fetchPage]);

  // AI suggestions
  useEffect(() => {
    if (abortSuggestRef.current) abortSuggestRef.current.abort();
    const ctrl = new AbortController();
    abortSuggestRef.current = ctrl;

    if (!query.trim()) { setAISuggestions([]); return; }

    const timer = setTimeout(async () => {
      try {
        const s = await fetchAISuggestionsAPI(query.trim(), ctrl.signal);
        setAISuggestions(s);
      } catch (err: unknown) {
        const e = err as { code?: string; name?: string };
        if (e?.code === "ERR_CANCELED" || e?.name === "AbortError" || e?.name === "CanceledError") return;
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Infinite scroll + prefetch
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) return;
        if (!loadingRef.current) void fetchPage(cursorRef.current, true);
        if (entry.intersectionRatio >= 0.7 && cursorRef.current) {
          void fetchPage(cursorRef.current, true, { allowOfflineFallback: false, fromPrefetch: true });
        }
      },
      { rootMargin: "150px", threshold: [0.2, 0.7] }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage]);

  // Pull to refresh
  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    let startY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startY = el.scrollTop === 0 ? (e.touches[0]?.clientY ?? null) : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY == null) return;
      const diff = (e.touches[0]?.clientY ?? startY) - startY;
      setShowPullHint(diff > 40);
    };
    const onTouchEnd = () => {
      if (showPullHint) {
        setIsRefreshing(true);
        if (!navigator.onLine) {
          const offline = loadOfflineResults();
          if (offline) { setResults(offline); setHasMore(false); setError("Ou offline kounya. Nou montre dènye rezilta ou te gen yo (offline)."); }
          setIsRefreshing(false); setShowPullHint(false); return;
        }
        void fetchPage(null, false).finally(() => { setIsRefreshing(false); setShowPullHint(false); });
      } else {
        setShowPullHint(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [fetchPage, showPullHint, loadOfflineResults]);

  const trackSearchInteraction = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      pushAnalyticsEvent({ query: query.trim(), type, ...payload, ts: new Date().toISOString(), userId: (u?.['id'] as string | undefined) ?? null });
    },
    [query, u]
  );

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSelectSearchChip = useCallback((q: string) => {
    setQuery(q);
    saveRecentSearch(q);
    setRecentSearches(loadRecentSearches());
    trackSearchInteraction("chip_click", { chip: q });
  }, [trackSearchInteraction]);

  const onQueryChange = useCallback((value: string) => { setQuery(value); }, []);

  const ITEM_HEIGHT = 152;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = results[index];
    if (!item) return null;
    return (
      <div style={{ ...style, paddingBottom: 8 }}>
        <ResultCard item={item} cardFields={searchConfig.cardFields} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col pb-28">
      <div className="px-5 pt-6 pb-3 max-w-md mx-auto w-full">
        <h1 className="text-sm font-bold text-yellow-400 mb-3">{searchConfig.heading}</h1>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#162238] text-slate-200 text-lg"
            onClick={() => { trackSearchInteraction("voice_start", {}); }}
          >
            🎤
          </button>

          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#162238] rounded-xl text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-yellow-400/40"
            placeholder={searchConfig.placeholder}
          />
          {isRefreshing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-sky-300">↻</div>
          )}
        </div>

        {didYouMean && (
          <button type="button" className="mt-1 text-[11px] text-sky-300 underline" onClick={() => setQuery(didYouMean)}>
            Did you mean: {didYouMean} ?
          </button>
        )}

        {showPullHint && (
          <p className="text-[10px] text-slate-400 mt-1.5">Lache pou rafrechi (Pull to refresh)</p>
        )}

        {(gpsState === GPS_STATES.acquiring || gpsState === GPS_STATES.idle) && (
          <p className="text-[10px] text-slate-400 mt-1.5">📡 Ap jwenn lokasyon ou...</p>
        )}
        {(gpsState === GPS_STATES.denied || gpsState === GPS_STATES.unavailable || gpsState === GPS_STATES.disabled || gpsState === GPS_STATES.blocked) && (
          <p className="text-[10px] text-amber-400 mt-1.5">📍 GPS pa disponib — chèche san distans</p>
        )}
      </div>

      <div className="px-5 max-w-md mx-auto w-full space-y-2 mb-1">
        {query.trim().length === 0 && (
          <>
            {personalized.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                <span className="text-slate-400 mr-1">Recommended for {(u?.['firstName'] as string | undefined) ?? "you"}:</span>
                {personalized.slice(0, 6).map((item) => {
                  const itemKey = (item.id as string | undefined) ?? (item._id as string | undefined) ?? item.query ?? item.label;
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => handleSelectSearchChip(item.query ?? item.name ?? item.label ?? "")}
                      className="px-2.5 py-1 rounded-full bg-[#162238] border border-slate-700"
                    >
                      {item.label ?? item.query ?? item.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
              <span className="text-slate-400 mr-1">Trending today:</span>
              {POPULAR_SEARCHES.map((p) => (
                <button key={p} type="button" onClick={() => handleSelectSearchChip(p)} className="px-2.5 py-1 rounded-full bg-[#162238] border border-slate-700">{p}</button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
                <span className="text-slate-400 mr-1">Recently searched:</span>
                {recentSearches.map((r) => (
                  <button key={r} type="button" onClick={() => handleSelectSearchChip(r)} className="px-2.5 py-1 rounded-full bg-[#162238] border border-slate-700">{r}</button>
                ))}
              </div>
            )}
          </>
        )}

        {query.trim().length > 0 && aiSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-300">
            <span className="text-slate-400 mr-1">AI Autocomplete:</span>
            {aiSuggestions.map((s) => (
              <button key={s} type="button" onClick={() => handleSelectSearchChip(s)} className="px-2.5 py-1 rounded-full bg-[#162238] border border-slate-700">{s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 max-w-md mx-auto w-full mb-2">
        <FilterBar activeFilterKeys={searchConfig.activeFilters} filterState={filters} onChange={handleFilterChange} hasGPS={hasGPS} />
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
        {error && <p className="text-center text-red-400 text-xs mt-2">{error}</p>}

        {loading && results.length === 0 && (
          <div className="mt-4 space-y-2">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-sm">Pa gen rezilta 😕</p>
            <p className="text-xs mt-1">Eseye chanje filtè yo oswa chèche yon lòt mo.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex-1">
            <AutoSizer>
              {({ height, width }: { height: number; width: number }) => (
                <VirtualList height={height} itemCount={results.length} itemSize={ITEM_HEIGHT} width={width}>
                  {Row}
                </VirtualList>
              )}
            </AutoSizer>
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="py-4 text-center">
            {loading && <p className="text-slate-400 text-xs animate-pulse">Chaje plis...</p>}
          </div>
        )}
      </div>
    </div>
  );
}