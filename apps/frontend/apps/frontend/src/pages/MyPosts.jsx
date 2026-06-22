
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Zap,
  MapPin,
  Plus,
  AlertTriangle,
  Search,
  RefreshCcw,
} from "lucide-react";

// ================= DATA =================
const INITIAL_POSTS = [
  {
    id: 1,
    title: "Bezwen Mason nan Bávaro",
    type: "construction",
    category: "Mason",
    status: "OPEN",
    location: "Bávaro, Punta Cana",
    createdAt: "2026-06-10",
    timestamp: new Date("2026-06-10").getTime(),
  },
  {
    id: 2,
    title: "Resepsyonis pou Hotel",
    type: "business",
    category: "Hotel",
    status: "OPEN",
    location: "Punta Cana Centro",
    createdAt: "2026-06-09",
    timestamp: new Date("2026-06-09").getTime(),
  },
  {
    id: 3,
    title: "Chef Lakay solid Bezwen",
    type: "service",
    category: "Chef",
    status: "CLOSED",
    location: "Verón",
    createdAt: "2026-06-05",
    timestamp: new Date("2026-06-05").getTime(),
  },
];

// ================= CONFIG =================
const STATUS = {
  OPEN: {
    label: "LOUVRI",
    className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  CLOSED: {
    label: "FÈMEN",
    className: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
};

const ICONS = {
  construction: Briefcase,
  business: Building2,
  service: Zap,
};

// ================= HELPERS =================
const sortNewest = (arr = []) =>
  [...arr].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));

// ================= COMPONENT =================
export default function MyPosts() {
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ================= FILTER (OPTIMIZED) =================
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = sortNewest(posts);

    if (!q) return list;

    return list.filter((p) => {
      const title = p?.title?.toLowerCase() || "";
      const category = p?.category?.toLowerCase() || "";
      return title.includes(q) || category.includes(q);
    });
  }, [posts, search]);

  // ================= REFRESH =================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError("");

    abortRef.current?.abort?.();
    abortRef.current = new AbortController();

    try {
      await new Promise((r) => setTimeout(r, 300));
      setPosts((prev) => [...prev]);
    } catch {
      setError("Erè pandan refresh");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ================= DELETE =================
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return;

    setDeleting(true);
    setError("");

    const id = pendingDelete;

    try {
      await new Promise((r) => setTimeout(r, 200));
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setPendingDelete(null);
    } catch {
      setError("Echèk efasman");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, deleting]);

  // ================= EDIT =================
  const requestEdit = useCallback(
    (post) => {
      navigate(`/post-job?edit=${post.id}`, {
        state: { post },
      });
    },
    [navigate]
  );

  // ================= ESC CLOSE =================
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !deleting) {
        setPendingDelete(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting]);

  // ================= CLEANUP =================
  useEffect(() => {
    return () => abortRef.current?.abort?.();
  }, []);

  return (
    <div className="min-h-screen w-full bg-navy-900 px-6 py-10 text-white pb-28 select-none font-sans">

      {/* HEADER */}
      <header className="mx-auto max-w-sm mb-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pòs Mwen Yo</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              {filteredPosts.length} pòs pibliye
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              aria-label="Refresh paj la"
              className="h-11 w-11 bg-navy-800 border border-slate-800/60 rounded-2xl flex items-center justify-center active:scale-95 transition"
            >
              <RefreshCcw className={`w-4 h-4 text-slate-400 ${refreshing ? "animate-spin text-gold-500" : ""}`} />
            </button>

            <button
              onClick={() => navigate("/post-job")}
              aria-label="Kreye nouvo pòs"
              className="h-11 w-11 bg-gold-500 text-black rounded-2xl flex items-center justify-center active:scale-95 transition shadow-lg shadow-gold-500/10"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-4 flex items-center gap-2 bg-navy-800/60 border border-slate-800/40 p-3 rounded-2xl focus-within:border-slate-700 transition">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chèche nan pòs ou yo..."
            className="bg-transparent outline-none text-sm w-full placeholder-slate-500 text-slate-200"
          />
        </div>

        {error && (
          <div className="mt-3 text-xs font-semibold text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl text-center animate-fade-in">
            ⚠️ {error}
          </div>
        )}
      </header>

      {/* LIST */}
      <main className="mx-auto max-w-sm space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 border border-dashed border-slate-800/60 rounded-2xl bg-navy-800/10 p-6 flex flex-col items-center animate-fade-in">
            <Briefcase className="w-8 h-8 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-400">Pa gen okenn pòs</h3>
            <p className="text-[11px] text-slate-500 max-w-[220px] mt-1 leading-relaxed">
              Pa gen anyen ki koresponn ak rechèch ou a, oswa ou poko kreye okenn piblikasyon.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const status = STATUS[post.status] || STATUS.OPEN;
            const Icon = ICONS[post.type] || Briefcase;

            return (
              <article
                key={post.id}
                className="bg-navy-800/20 p-5 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-10 h-10 bg-navy-900 border border-slate-800/80 shrink-0 rounded-xl flex items-center justify-center text-gold-500 shadow-inner">
                      <Icon className="w-4 h-4" strokeWidth={2.5} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white truncate tracking-wide">{post.title}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{post.category}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-800/40 pt-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate text-slate-300">{post.location || "N/A"}</span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-800/20 pt-3">
                  <button
                    onClick={() => requestEdit(post)}
                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    Modifye
                  </button>

                  <button
                    onClick={() => setPendingDelete(post.id)}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    Efase
                  </button>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* MODAL */}
      {pendingDelete && (
        <div
          onClick={() => !deleting && setPendingDelete(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center px-6 z-50 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-navy-900 p-6 rounded-2xl w-full max-w-xs border border-slate-800 shadow-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-center font-black tracking-wide text-white">Efase pòs sa?</h3>
            <p className="mt-2 text-center text-xs font-medium leading-relaxed text-slate-400 px-1">
              Aksyon sa a se pèmanan. Ou p ap kapab rekipere pòs sa a ankò si ou konfime.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="flex-1 bg-navy-800 border border-slate-800 text-slate-300 py-3 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
              >
                Anile
              </button>

              <button
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50 shadow-md shadow-rose-500/10"
              >
                {deleting ? "Efasman..." : "Efase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
