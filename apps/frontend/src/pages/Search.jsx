import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { key: "all", label: "Tout" },
  { key: "construction", label: "Construction" },
  { key: "business", label: "Business" },
  { key: "service", label: "Service" },
];

const STATUS_CONFIG = {
  AVAILABLE: { color: "#22c55e", label: "AVAILABLE" },
  OPEN: { color: "#22c55e", label: "OPEN" },
  BUSY: { color: "#ef4444", label: "BUSY" },
  OFFLINE: { color: "#64748b", label: "OFFLINE" },
  DEFAULT: { color: "#f59e0b", label: "UNKNOWN" },
};

const ResultCard = memo(function ResultCard({ item, onClick }) {
  const status = STATUS_CONFIG[item?.status] || STATUS_CONFIG.DEFAULT;

  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.cardButton}
      aria-label={`Open details for ${item?.name || "result"}`}
    >
      <article style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.avatarWrap}>
            {item?.avatar ? (
              <img
                src={item.avatar}
                alt={item?.name || "Profile"}
                style={styles.avatar}
              />
            ) : (
              <div style={styles.avatarFallback}>
                {(item?.name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div style={styles.cardHeader}>
            <h3 style={styles.name}>{item?.name || "Unknown"}</h3>
            <span
              style={{
                ...styles.status,
                background: status.color,
              }}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div style={styles.cardBody}>
          <p style={styles.text}>
            <strong>Role:</strong> {item?.role || "-"}
          </p>
          <p style={styles.text}>
            <strong>Type:</strong> {item?.type || "-"}
          </p>
          <p style={styles.text}>
            📍 {item?.location || "-"} • {item?.distance || "-"}
          </p>
          <p style={styles.text}>
            {item?.rating ? `Rating: ${item.rating}/5 • ` : ""}
            {item?.reviews ? `${item.reviews} reviews • ` : ""}
            {item?.verified ? "Verified" : "Unverified"}
          </p>
          <p style={styles.text}>
            {item?.lastSeen
              ? `Last seen: ${item.lastSeen}`
              : "Status updated live when available"}
          </p>
        </div>
      </article>
    </button>
  );
});

function Search() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [coords, setCoords] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const coordsReadyRef = useRef(false);
  const currentParamsRef = useRef({ q: "", category: "all", coords: null });

  const isEmptyQuery = query.trim() === "";

  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  const retrySearch = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setPage((p) => p + 1);
    }
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    setResults([]);
    setHasMore(false);
    setPage(1);
  }, [activeCategory, query]);

  useEffect(() => {
    let mounted = true;

    if (!navigator.geolocation) {
      coordsReadyRef.current = true;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        coordsReadyRef.current = true;
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        if (!mounted) return;
        coordsReadyRef.current = true;
        setCoords(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
  }, [coords]);

  const fetchPage = useCallback(
    async ({ nextPage, append }) => {
      if (!coords && navigator.geolocation) return;

      const currentId = ++requestIdRef.current;
      const controller = new AbortController();

      const run = async () => {
        try {
          if (append) setLoadingMore(true);
          else setLoading(true);

          setError("");

          const searchParams = new URLSearchParams({
            q: query.trim(),
            category: activeCategory,
            page: String(nextPage),
            limit: String(limit),
            lat: coords?.lat ? String(coords.lat) : "",
            lng: coords?.lng ? String(coords.lng) : "",
          });

          currentParamsRef.current = {
            q: query.trim(),
            category: activeCategory,
            coords,
          };

          const response = await fetch(`/api/search?${searchParams.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) throw new Error("Request failed");
          const data = await response.json();

          if (currentId !== requestIdRef.current) return;

          const nextResults = Array.isArray(data?.results) ? data.results : [];

          setResults((prev) => {
            const merged = append ? [...prev, ...nextResults] : nextResults;
            return Array.from(
              new Map(merged.map((item) => [item.id, item])).values()
            );
          });

          setHasMore(Boolean(data?.hasMore) || nextResults.length === limit);
        } catch (err) {
          if (err?.name === "AbortError") return;
          if (currentId !== requestIdRef.current) return;
          setError("Pa ka chaje done yo");
          if (!append) setResults([]);
          setHasMore(false);
        } finally {
          if (currentId !== requestIdRef.current) return;
          setLoading(false);
          setLoadingMore(false);
        }
      };

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(run, 500);

      return () => controller.abort();
    },
    [activeCategory, coords, limit, query]
  );

  useEffect(() => {
    if (!coordsReadyRef.current && navigator.geolocation) return;
    if (!coords && navigator.geolocation) return;

    const cleanup = fetchPage({ nextPage: 1, append: false });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [fetchPage, reloadKey, coords, activeCategory, query]);

  useEffect(() => {
    if (page === 1) return;
    const cleanup = fetchPage({ nextPage: page, append: true });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [page, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((p) => p + 1);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(node);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const resultsCount = useMemo(() => results.length, [results.length]);

  return (
    <main style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>Search Nearby</h1>
        <p style={styles.subtitle}>
          Construction • Businesses • Services On Demand
        </p>
      </header>

      <div style={styles.searchWrapper}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search workers, businesses, services..."
          autoComplete="off"
          aria-label="Search workers, businesses, services"
          style={styles.input}
        />
      </div>

      <div style={styles.chipsRow} role="tablist" aria-label="Filter categories">
        {CATEGORIES.map((category) => {
          const active = activeCategory === category.key;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => handleCategoryChange(category.key)}
              style={{
                ...styles.chip,
                ...(active ? styles.chipActive : {}),
              }}
              aria-pressed={active}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {loading && page === 1 ? (
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Ap chaje done yo...</p>
        </div>
      ) : error ? (
        <div style={styles.emptyCard}>
          <p style={styles.empty}>{error}</p>
          <button type="button" onClick={retrySearch} style={styles.retryButton}>
            Reesaye
          </button>
        </div>
      ) : (
        <>
          <p style={styles.resultsText}>
            {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
          </p>

          <section style={styles.list}>
            {resultsCount === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.empty}>No results found</p>
                <button type="button" onClick={retrySearch} style={styles.retryButton}>
                  Reesaye
                </button>
              </div>
            ) : (
              results.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/professionals/${item.id}`)}
                />
              ))
            )}
          </section>

          {loadingMore ? (
            <div style={styles.loadMoreWrap}>
              <div style={styles.inlineLoading}>
                <div style={styles.spinnerSmall} />
                <span style={styles.loadingText}>Ap chaje plis...</span>
              </div>
            </div>
          ) : null}

          <div ref={sentinelRef} style={styles.sentinel} />
        </>
      )}
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "24px",
    background: "linear-gradient(to bottom, #020617, #0f172a)",
    color: "#ffffff",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: { marginBottom: "24px" },
  title: { margin: 0, fontSize: "32px", fontWeight: "800" },
  subtitle: {
    marginTop: "8px",
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  searchWrapper: { marginBottom: "12px" },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    outline: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  chipsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  chip: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  chipActive: {
    background: "#eab308",
    color: "#020617",
    border: "1px solid #eab308",
  },
  resultsText: {
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "16px",
  },
  list: { display: "grid", gap: "14px" },
  cardButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },
  card: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "transform 0.25s ease",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  avatarFallback: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    background: "#1e293b",
    color: "#e2e8f0",
    fontWeight: "800",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    width: "100%",
  },
  cardBody: { display: "grid", gap: "4px" },
  name: { margin: 0, fontSize: "18px", fontWeight: "700" },
  text: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  status: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  emptyCard: {
    padding: "30px",
    borderRadius: "18px",
    textAlign: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "grid",
    justifyItems: "center",
    gap: "12px",
  },
  empty: { margin: 0, color: "#94a3b8", fontSize: "14px" },
  retryButton: {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#eab308",
    color: "#020617",
    fontWeight: "800",
    cursor: "pointer",
  },
  loadingCard: {
    padding: "30px",
    borderRadius: "18px",
    textAlign: "center",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "grid",
    justifyItems: "center",
    gap: "12px",
  },
  spinner: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "4px solid rgba(255,255,255,0.15)",
    borderTop: "4px solid #eab308",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    border: "3px solid rgba(255,255,255,0.15)",
    borderTop: "3px solid #eab308",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "14px",
  },
  loadMoreWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "18px 0 0",
  },
  inlineLoading: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },
  sentinel: {
    height: "1px",
  },
};

export default memo(Search);