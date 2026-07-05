import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  getSearchConfig,
  DEFAULT_FILTERS,
  FILTER_DEFS,
  RANKING_WEIGHTS,
} from '../config/searchConfig';

// ── GPS hook — 3-level graceful fallback ──────────────────────
// Level 1: high accuracy (enableHighAccuracy: true, timeout 8s)
// Level 2: low accuracy on level-1 error (timeout 5s)
// Level 3: mark unavailable/denied — search continues without distance
function useGPS() {
  const [coords, setCoords] = useState(null);
  // 'acquiring' | 'ready' | 'denied' | 'unavailable'
  const [gpsState, setGpsState] = useState('acquiring');

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState('unavailable');
      return;
    }

    let settled = false;

    const safetyTimer = setTimeout(() => {
      if (!settled) { settled = true; setGpsState('unavailable'); }
    }, 15000);

    const onSuccess = (pos) => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setGpsState('ready');
    };

    const tryLow = () => {
      if (settled) return;
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => {
          if (!settled) { settled = true; clearTimeout(safetyTimer); setGpsState('denied'); }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      );
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      tryLow,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );

    return () => clearTimeout(safetyTimer);
  }, []);

  return { coords, gpsState };
}

// ── Weighted ranking ──────────────────────────────────────────
function computeScore(item, weights, coords) {
  const distFactor = (coords && item.distanceKm != null)
    ? 1 / (item.distanceKm + 0.5)
    : 0;

  return (
    ((item.trust_score ?? 50) / 100) * weights.trust_score
    + ((item.stats?.rating ?? item.rating ?? 3) / 5) * weights.rating
    + distFactor * weights.distance_inverse
    + (item.verified ? 1 : 0) * weights.verified
    + (item.recentActivity ?? 0.5) * weights.recent_activity
    + (item.availability === 'available' ? 1 : 0) * weights.availability
    + Math.min((item.experience ?? 0) / 20, 1) * weights.experience
    + ((item.profileCompleteness ?? 0) / 100) * weights.profile_completeness
    + ((item.moderationRisk ?? 0) / 100) * weights.moderation_risk
  );
}

function rankResults(items, weights, coords) {
  return [...items].sort(
    (a, b) => computeScore(b, weights, coords) - computeScore(a, weights, coords),
  );
}

// ── Client-side filter pass ───────────────────────────────────
// Secondary safety net; backend already filters, this keeps UI consistent
// when filters change before the next API response arrives.
function applyClientFilters(items, filters, coords) {
  return items.filter((item) => {
    if (filters.availableOnly && item.availability !== 'available') return false;
    if (filters.verifiedOnly && !item.verified) return false;
    if (filters.maxDistance > 0 && coords && item.distanceKm != null) {
      if (item.distanceKm > filters.maxDistance) return false;
    }
    if (filters.minRating > 0) {
      const r = item.stats?.rating ?? item.rating ?? 0;
      if (r < filters.minRating) return false;
    }
    if (filters.minTrust > 0 && (item.trust_score ?? 0) < filters.minTrust) return false;
    if (filters.minExperience > 0 && (item.experience ?? 0) < filters.minExperience) return false;
    if (filters.language && item.language !== filters.language) return false;
    if (filters.country && item.location?.country !== filters.country) return false;
    if (filters.serviceZone && item.serviceZone !== filters.serviceZone) return false;
    return true;
  });
}

// ── Field renderers — drives data-driven result card ─────────
const FIELD_RENDERERS = {
  profession:   (item) => item.profession ? `💼 ${item.profession}` : null,
  distance:     (item) => item.distanceKm != null ? `📍 ${item.distanceKm} km` : null,
  rating: (item) => {
    const r = item.stats?.rating ?? item.rating;
    return r != null ? `⭐ ${Number(r).toFixed(1)}` : null;
  },
  trust_score:  (item) => item.trust_score != null ? `🛡️ ${item.trust_score}` : null,
  availability: (item) => item.availability === 'available' ? '🟢 Disponib' : '🟡 Okipe',
  verified:     (item) => item.verified ? '✅ Verifye' : null,
  experience:   (item) => item.experience != null ? `🎓 ${item.experience} ans` : null,
  language:     (item) => item.language ? `🌐 ${item.language}` : null,
};

// ── Result card ───────────────────────────────────────────────
const ResultCard = memo(function ResultCard({ item, cardFields, onCall, onChat, onRate, onBook, onMap }) {
  const city = item.location?.city || item.location?.state || '';

  return (
    <div className="p-4 bg-[#162238] rounded-xl flex justify-between gap-3 border border-[#1e2d45]">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
        {city && <p className="text-[10px] text-slate-400 mt-0.5">{city}</p>}

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {cardFields.map((field) => {
            const text = FIELD_RENDERERS[field]?.(item);
            if (!text) return null;
            return (
              <span key={field} className="text-[10px] text-slate-300">{text}</span>
            );
          })}
        </div>

        {item.location?.coordinates && (
          <button
            onClick={() => onMap(item)}
            className="text-blue-400 text-[10px] mt-2"
          >
            🗺 Map
          </button>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <button
          onClick={() => onCall(item)}
          className="px-2.5 py-1 text-[10px] rounded-lg bg-green-500 text-black font-bold"
        >
          📞 Rele
        </button>
        <button onClick={() => onChat(item)} className="text-blue-400 text-[10px]">
          💬 Chat
        </button>
        <button onClick={() => onRate(item)} className="text-yellow-400 text-[10px]">
          ⭐ Note
        </button>
        <button onClick={() => onBook(item)} className="text-purple-400 text-[10px]">
          💳 Rezève
        </button>
      </div>
    </div>
  );
});

// ── Filter chip bar ───────────────────────────────────────────
const FilterBar = memo(function FilterBar({ activeFilterKeys, filterState, onChange, hasGPS }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {activeFilterKeys.map((key) => {
        const def = FILTER_DEFS[key];
        if (!def) return null;
        // Hide distance chip when GPS not available — filter would have no effect
        if (key === 'distance' && !hasGPS) return null;

        if (def.type === 'toggle') {
          const active = filterState[def.key];
          return (
            <button
              key={key}
              onClick={() => onChange(def.key, !active)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#1e2d45] text-slate-300'
              }`}
            >
              {def.emoji} {def.label}
            </button>
          );
        }

        if (def.type === 'steps') {
          const current = filterState[def.key];
          return (
            <div key={key} className="flex gap-1 shrink-0">
              {def.steps.map((step) => (
                <button
                  key={step}
                  onClick={() => onChange(def.key, current === step ? def.zero : step)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    current === step
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#1e2d45] text-slate-300'
                  }`}
                >
                  {step}{def.unit}
                </button>
              ))}
            </div>
          );
        }

        if (def.type === 'options') {
          const current = filterState[def.key];
          return (
            <div key={key} className="flex gap-1 shrink-0">
              {def.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onChange(def.key, current === opt ? def.zero : opt)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    current === opt
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1e2d45] text-slate-300'
                  }`}
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

// ── Main component ────────────────────────────────────────────
export default function SearchScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords, gpsState } = useGPS();

  const role = user?.role || 'worker';
  const searchConfig = useMemo(() => getSearchConfig(role), [role]);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Refs that stay current without recreating callbacks
  const abortRef    = useRef(null);
  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);
  const pageRef     = useRef(1);
  const loadingRef  = useRef(false);
  const coordsRef   = useRef(coords);
  const filtersRef  = useRef(filters);

  useEffect(() => { coordsRef.current = coords; },  [coords]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // fetchPage is recreated only when `query` changes; filters/coords are read via refs
  const fetchPage = useCallback(async (pageNum, append) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const currentCoords  = coordsRef.current;
      const currentFilters = filtersRef.current;

      const params = { q: query.trim(), page: pageNum, limit: 20 };
      if (currentCoords) {
        params.lat = currentCoords.lat;
        params.lng = currentCoords.lng;
      }
      if (currentFilters.availableOnly)                     params.availableOnly = 'true';
      if (currentFilters.verifiedOnly)                      params.verifiedOnly  = 'true';
      if (currentFilters.maxDistance > 0 && currentCoords)  params.maxDistance   = currentFilters.maxDistance;
      if (currentFilters.minRating    > 0)                  params.minRating     = currentFilters.minRating;
      if (currentFilters.minTrust     > 0)                  params.minTrust      = currentFilters.minTrust;
      if (currentFilters.minExperience > 0)                 params.minExperience = currentFilters.minExperience;
      if (currentFilters.language)                          params.language      = currentFilters.language;
      if (currentFilters.country)                           params.country       = currentFilters.country;
      if (currentFilters.serviceZone)                       params.serviceZone   = currentFilters.serviceZone;

      const res = await API.get('/search', { params, signal: ctrl.signal });
      const { items = [], hasMore: more = false } = res.data?.data || {};

      const filtered = applyClientFilters(items, currentFilters, currentCoords);
      const ranked   = rankResults(filtered, RANKING_WEIGHTS, currentCoords);

      setResults((prev) => (append ? [...prev, ...ranked] : ranked));
      setHasMore(!!more);
      pageRef.current = pageNum;
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      setError('Erè rezo. Verifye koneksyon ou.');
    } finally {
      setLoading(false);
    }
  }, [query]); // filters/coords are accessed via refs — intentionally not in deps

  // Debounced re-fetch whenever query, filters, coords, or fetchPage change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    pageRef.current = 1;
    debounceRef.current = setTimeout(() => fetchPage(1, false), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, filters, coords, fetchPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchPage(pageRef.current + 1, true);
        }
      },
      { rootMargin: '150px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCall = useCallback((item) => {
    const phone = item.phone || item.profileMetadata?.phone;
    if (phone) window.location.href = `tel:${phone}`;
  }, []);

  const handleChat  = useCallback((item) => navigate(`/chat/${item.id || item._id}`),    [navigate]);
  const handleRate  = useCallback((item) => navigate(`/rating/${item.id || item._id}`),  [navigate]);
  const handleBook  = useCallback((item) => navigate(`/booking/${item.id || item._id}`), [navigate]);
  const handleMap   = useCallback((item) => {
    const lat = item.location?.coordinates?.latitude  ?? item.lat;
    const lng = item.location?.coordinates?.longitude ?? item.lng;
    if (lat != null && lng != null) navigate(`/map?lat=${lat}&lng=${lng}`);
  }, [navigate]);

  const hasGPS = gpsState === 'ready';

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col pb-28">

      {/* Header + search bar */}
      <div className="px-5 pt-6 pb-3 max-w-md mx-auto w-full">
        <h1 className="text-sm font-bold text-yellow-400 mb-3">{searchConfig.heading}</h1>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 bg-[#162238] rounded-xl text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-yellow-400/40"
          placeholder={searchConfig.placeholder}
        />

        {gpsState === 'acquiring' && (
          <p className="text-[10px] text-slate-400 mt-1.5">📡 Ap jwenn lokasyon ou...</p>
        )}
        {(gpsState === 'denied' || gpsState === 'unavailable') && (
          <p className="text-[10px] text-amber-400 mt-1.5">📍 GPS pa disponib — chèche san distans</p>
        )}
      </div>

      {/* Role-aware filter bar */}
      <div className="px-5 max-w-md mx-auto w-full mb-2">
        <FilterBar
          activeFilterKeys={searchConfig.activeFilters}
          filterState={filters}
          onChange={handleFilterChange}
          hasGPS={hasGPS}
        />
      </div>

      {/* Results list */}
      <div className="px-5 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">

        {error && (
          <p className="text-center text-red-400 text-xs mt-4">{error}</p>
        )}

        {loading && results.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-sm animate-pulse">Ap chèche...</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-sm">Pa gen rezilta 😕</p>
            <p className="text-xs mt-1">Eseye chanje filtè yo oswa chèche yon lòt mo.</p>
          </div>
        )}

        {results.map((item) => (
          <ResultCard
            key={item.id || item._id}
            item={item}
            cardFields={searchConfig.cardFields}
            onCall={handleCall}
            onChat={handleChat}
            onRate={handleRate}
            onBook={handleBook}
            onMap={handleMap}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="py-6 text-center">
            {loading && (
              <p className="text-slate-400 text-xs animate-pulse">Chaje plis...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}