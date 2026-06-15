import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FEATURED = ["restaurant", "hotel", "hospital", "company"];
const STORAGE_KEY = "businessSearch";

const DEFAULT_BUSINESS_CATEGORIES = [
  { id: "company", label: "Konpayi", icon: "🏢" },
  { id: "restaurant", label: "Restoran", icon: "🍴" },
  { id: "hospital", label: "Lopital", icon: "🏥" },
  { id: "clinic", label: "Klinik", icon: "🩺" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "office", label: "Ofis", icon: "🏢" },
  { id: "lawyer", label: "Avoka", icon: "⚖️" },
  { id: "mechanic", label: "Mekanisyen", icon: "🛠️" },
  { id: "guide", label: "Tour Guide", icon: "👤" },
  { id: "organization", label: "Organization", icon: "👥" },
  { id: "school", label: "Lekòl", icon: "🏫" },
  { id: "university", label: "Inivèsite", icon: "🎓" },
  { id: "pharmacy", label: "Famasi", icon: "💊" },
  { id: "supermarket", label: "Makèt", icon: "🛒" },
  { id: "church", label: "Legliz", icon: "⛪" },
  { id: "bank", label: "Bank", icon: "🏦" },
  { id: "gas_station", label: "Gazolin", icon: "⛽" },
  { id: "real_estate", label: "Imobilye", icon: "🏠" },
  { id: "beauty", label: "Salon", icon: "💇" },
  { id: "gym", label: "Gym", icon: "🏋️" },
];

export default function BusinessDirectory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSearchQuery(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/business/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();

        if (!mounted) return;
        setCategories(Array.isArray(data) && data.length ? data : DEFAULT_BUSINESS_CATEGORIES);
      } catch {
        if (!mounted) return;
        setError("Erè pandan chajman kategori yo");
        setCategories(DEFAULT_BUSINESS_CATEGORIES);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const list = q
      ? sortedCategories.filter((cat) => cat.label.toLowerCase().includes(q))
      : sortedCategories;

    const featured = list.filter((cat) => FEATURED.includes(cat.id));
    const others = list.filter((cat) => !FEATURED.includes(cat.id));

    return [...featured, ...others];
  }, [searchQuery, sortedCategories]);

  const featuredCategories = useMemo(() => {
    return filteredCategories.filter((cat) => FEATURED.includes(cat.id));
  }, [filteredCategories]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1528] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] pb-24 font-sans text-white select-none">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl border border-slate-800/80 bg-[#162238] p-2.5 text-slate-400 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Biznis</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="mx-auto mb-4 w-full max-w-md px-5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biznis..."
            aria-label="Chache biznis"
            className="w-full rounded-xl border border-slate-800 bg-[#162238] py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-slate-500 transition-colors focus:border-amber-400/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
          />
          <div className="pointer-events-none absolute left-4 flex items-center">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">{filteredCategories.length} kategori</p>
          {featuredCategories.length > 0 ? (
            <p className="text-xs text-amber-400">{featuredCategories.length} featured</p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto mb-4 w-full max-w-md px-5">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Kategori</h3>
      </div>

      {error ? (
        <div className="mx-auto mb-4 w-full max-w-md px-5">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex-1 w-full max-w-md overflow-y-auto px-5">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-3 gap-3.5">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/business/category/${cat.id}`)}
                aria-label={cat.label}
                className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-800/60 bg-[#162238]/40 p-4 text-center transition-all active:scale-95 hover:border-amber-400/30 hover:bg-[#162238]/80 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/80 bg-[#1A2B47] shadow-md transition-transform group-hover:bg-[#162238] group-hover:scale-105">
                  <span role="img" aria-label={cat.label} className="text-xl">
                    {cat.icon}
                  </span>
                </div>
                <span className="block w-full truncate text-[11px] font-black tracking-wide text-slate-300 transition-colors group-hover:text-amber-400">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
            Pa gen kategori ki koresponn
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-[#0B1528]/95 px-6 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Akèy"
          className="flex flex-col items-center gap-1 text-slate-500 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <span role="img" aria-label="Akèy" className="text-lg">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Akèy</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/search")}
          aria-label="Rechèch"
          className="flex flex-col items-center gap-1 text-amber-400 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <span role="img" aria-label="Rechèch" className="text-lg">🔍</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Rechèch</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/post-job")}
          aria-label="Poste"
          className="flex flex-col items-center gap-1 text-slate-500 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <span role="img" aria-label="Poste" className="text-lg">➕</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Poste</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifikasyon"
          className="flex flex-col items-center gap-1 text-slate-500 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <span role="img" aria-label="Notifikasyon" className="text-lg">🔔</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Profil"
          className="flex flex-col items-center gap-1 text-slate-500 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20"
        >
          <span role="img" aria-label="Profil" className="text-lg">👤</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}
