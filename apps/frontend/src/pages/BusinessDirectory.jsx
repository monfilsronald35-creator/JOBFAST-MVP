import React, {
  useState, useMemo, useEffect, useCallback, useRef, memo,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, RefreshCcw, WifiOff, AlertCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — preserved exactly from original
// ═══════════════════════════════════════════════════════════════════════════

const FEATURED    = Object.freeze(["restaurant", "hotel", "hospital", "company"]);
const STORAGE_KEY = "businessSearch";
const NAV_BASE    = "/marketplace"; // was /business/category — route never existed

const DEFAULT_BUSINESS_CATEGORIES = Object.freeze([
  { id: "company",      label: "Konpayi",    icon: "🏢" },
  { id: "restaurant",   label: "Restoran",   icon: "🍴" },
  { id: "hospital",     label: "Lopital",    icon: "🏥" },
  { id: "clinic",       label: "Klinik",     icon: "🩺" },
  { id: "hotel",        label: "Hotel",      icon: "🏨" },
  { id: "office",       label: "Ofis",       icon: "🏢" },
  { id: "lawyer",       label: "Avoka",      icon: "⚖️"  },
  { id: "mechanic",     label: "Mekanisyen", icon: "🛠️" },
  { id: "guide",        label: "Tour Guide", icon: "👤" },
  { id: "organization", label: "Organization",icon: "👥" },
  { id: "school",       label: "Lekòl",      icon: "🏫" },
  { id: "university",   label: "Inivèsite",  icon: "🎓" },
  { id: "pharmacy",     label: "Famasi",     icon: "💊" },
  { id: "supermarket",  label: "Makèt",      icon: "🛒" },
  { id: "church",       label: "Legliz",     icon: "⛪" },
  { id: "bank",         label: "Bank",       icon: "🏦" },
  { id: "gas_station",  label: "Gazolin",    icon: "⛽" },
  { id: "real_estate",  label: "Imobilye",   icon: "🏠" },
  { id: "beauty",       label: "Salon",      icon: "💇" },
  { id: "gym",          label: "Gym",        icon: "🏋️" },
]);

const FEATURED_SET = new Set(FEATURED);

// ═══════════════════════════════════════════════════════════════════════════
// PURE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/** Removes diacritics, lowercases and trims — enables accent-insensitive search. */
function normalizeStr(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Locale-aware sort + accent-insensitive search.
 * Returns: featured (in FEATURED order) first, then remaining alphabetically.
 * Preserves original filteredCategories + featuredCategories ordering logic.
 */
function filterAndOrder(cats, query, locale) {
  const sorted = [...cats].sort((a, b) =>
    (a.label ?? "").localeCompare(b.label ?? "", locale, { sensitivity: "base" })
  );

  const q      = normalizeStr(query);
  const matched = q
    ? sorted.filter(c => normalizeStr(c.label).includes(q))
    : sorted;

  const featured = FEATURED
    .map(id => matched.find(c => c.id === id))
    .filter(Boolean);
  const others   = matched.filter(c => !FEATURED_SET.has(c.id));

  return [...featured, ...others];
}

/** Validates a category object from the API response. */
function isValidCat(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.id    === "string" && obj.id.length > 0 &&
    typeof obj.label === "string" && obj.label.length > 0
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCE HOOK — no new dependency
// ═══════════════════════════════════════════════════════════════════════════

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════════════

function useBusinessDirectory() {
  const { i18n } = useTranslation();
  const locale   = i18n.language || "ht";

  // ── Persistent search (original localStorage key preserved) ─────────────
  const [rawQuery, setRawQuery] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
  });
  const searchQuery = useDebounce(rawQuery, 250);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, rawQuery); } catch {}
  }, [rawQuery]);

  // ── Category data ────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const loadCategories = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res  = await API.get("/business/categories", { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      const data = Array.isArray(res?.data) ? res.data.filter(isValidCat) : [];
      setCategories(data.length ? data : [...DEFAULT_BUSINESS_CATEGORIES]);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError({
        offline: !navigator.onLine || err?.code === "NETWORK_ERROR",
        message: err?.response?.data?.message ?? null,
      });
      setCategories([...DEFAULT_BUSINESS_CATEGORIES]);
    } finally {
      if (mountedRef.current) setLoading(false);
      abortRef.current = null;
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories, retryCount]);

  const handleRetry = useCallback(() => setRetryCount(c => c + 1), []);

  // ── Derived list (memoized) ──────────────────────────────────────────────
  const filteredCategories = useMemo(
    () => filterAndOrder(categories, searchQuery, locale),
    [categories, searchQuery, locale],
  );

  const featuredCount = useMemo(
    () => filteredCategories.filter(c => FEATURED_SET.has(c.id)).length,
    [filteredCategories],
  );

  return { rawQuery, setRawQuery, loading, error, handleRetry, filteredCategories, featuredCount };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const CategorySkeleton = memo(function CategorySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3.5" aria-busy="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-800/40 bg-[#162238]/30 p-4 animate-pulse"
          style={{ height: 100 }}
        >
          <div className="h-12 w-12 rounded-2xl bg-slate-700/50" />
          <div className="h-2.5 w-14 rounded-full bg-slate-700/40" />
        </div>
      ))}
    </div>
  );
});

const CategoryCard = memo(function CategoryCard({ cat, isFeatured, label, featuredLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center",
        "transition-all duration-200 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1528]",
        isFeatured
          ? "border-amber-500/25 bg-[#162238]/70 hover:border-amber-400/50 hover:bg-[#162238]"
          : "border-slate-800/60 bg-[#162238]/40 hover:border-slate-700/70 hover:bg-[#162238]/70",
      ].join(" ")}
    >
      {isFeatured && (
        <span
          aria-label={featuredLabel}
          className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-black leading-none shadow-md shadow-amber-500/30"
        >
          ★
        </span>
      )}

      <div
        className={[
          "flex h-12 w-12 items-center justify-center rounded-2xl border shadow-md",
          "transition-transform duration-200 group-hover:scale-110",
          isFeatured
            ? "border-amber-500/20 bg-[#1f2f4a]"
            : "border-slate-800/80 bg-[#1A2B47] group-hover:bg-[#162238]",
        ].join(" ")}
      >
        <span role="img" aria-hidden="true" className="text-xl">{cat.icon}</span>
      </div>

      <span
        className={[
          "block w-full truncate text-[11px] font-black tracking-wide transition-colors",
          isFeatured
            ? "text-amber-300 group-hover:text-amber-200"
            : "text-slate-300 group-hover:text-amber-400",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
});

const ErrorBanner = memo(function ErrorBanner({ error, onRetry, t }) {
  const Icon = error?.offline ? WifiOff : AlertCircle;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3 mb-4",
        error?.offline
          ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
          : "bg-red-500/10 border-red-500/20 text-red-300",
      ].join(" ")}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {error?.message || t("business.errorLoad")}
        </p>
        <p className="text-xs opacity-70 mt-0.5">{t("business.usingFallback")}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        aria-label={t("business.retryLabel")}
        className="shrink-0 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest opacity-80 hover:opacity-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <RefreshCcw className="w-3 h-3" aria-hidden="true" />
        {t("business.retryLabel")}
      </button>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ query, t }) {
  return (
    <div role="status" aria-live="polite" className="py-16 flex flex-col items-center gap-3 text-center">
      <span className="text-4xl" aria-hidden="true">🔍</span>
      <p className="text-sm font-bold text-slate-400">{t("business.emptyTitle")}</p>
      {query ? (
        <p className="text-xs text-slate-600">{t("business.emptySubtitle")}</p>
      ) : null}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BusinessDirectory() {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const {
    rawQuery, setRawQuery,
    loading, error, handleRetry,
    filteredCategories, featuredCount,
  } = useBusinessDirectory();

  const handleCategoryClick = useCallback(
    (catId) => navigate(`${NAV_BASE}/${catId}`),
    [navigate],
  );

  const handleClearSearch = useCallback(() => setRawQuery(""), [setRawQuery]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] pb-8 font-sans text-white select-none">

      {/* Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t("business.backLabel")}
          className="rounded-xl border border-slate-800/80 bg-[#162238] p-2.5 text-slate-400 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">
          {t("business.title")}
        </h1>

        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      {/* Search */}
      <div className="mx-auto mb-4 w-full max-w-md px-5">
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={rawQuery}
            onChange={e => setRawQuery(e.target.value)}
            placeholder={t("business.searchPlaceholder")}
            aria-label={t("business.searchPlaceholder")}
            autoComplete="off"
            className="w-full rounded-xl border border-slate-800 bg-[#162238] py-3.5 pl-11 pr-10 text-sm font-semibold text-white placeholder-slate-500 transition-colors focus:border-amber-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
          />
          {rawQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Efase rechèch"
              className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {!loading ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {t("business.resultCount", { count: filteredCategories.length })}
            </p>
            {featuredCount > 0 ? (
              <p className="text-xs text-amber-400">
                {featuredCount} {t("business.featuredLabel")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Section label */}
      <div className="mx-auto mb-4 w-full max-w-md px-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {t("business.sectionTitle")}
        </h2>
      </div>

      {/* Error banner — non-blocking, fallback displayed below */}
      {error ? (
        <div className="mx-auto w-full max-w-md px-5">
          <ErrorBanner error={error} onRetry={handleRetry} t={t} />
        </div>
      ) : null}

      {/* Category grid */}
      <main
        className="mx-auto flex-1 w-full max-w-md px-5"
        aria-label={t("business.sectionTitle")}
      >
        {loading ? (
          <CategorySkeleton />
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-3 gap-3.5">
            {filteredCategories.map(cat => {
              const isFeatured = FEATURED_SET.has(cat.id);
              const label      = t(`business.cat.${cat.id}`, cat.label);
              return (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  isFeatured={isFeatured}
                  label={label}
                  featuredLabel={t("business.featuredLabel")}
                  onClick={() => handleCategoryClick(cat.id)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState query={rawQuery} t={t} />
        )}
      </main>
    </div>
  );
}
