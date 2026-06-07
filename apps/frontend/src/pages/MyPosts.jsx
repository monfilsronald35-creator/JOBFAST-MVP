import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Building2, 
  Zap, 
  MapPin, 
  Calendar, 
  Trash2, 
  Plus, 
  AlertTriangle,
  Pencil
} from "lucide-react";

const INITIAL_POSTS = [
  {
    id: 1,
    title: "Need Mason in Bavaro",
    type: "construction",
    category: "Mason",
    status: "OPEN",
    location: "Bavaro, Punta Cana",
    createdAt: "2026-05-07",
    timestamp: new Date("2026-05-07").getTime(),
  },
  {
    id: 2,
    title: "Hotel Reception Job",
    type: "business",
    category: "Hotel",
    status: "OPEN",
    location: "Punta Cana",
    createdAt: "2026-05-06",
    timestamp: new Date("2026-05-06").getTime(),
  },
  {
    id: 3,
    title: "Chef Lakay Needed",
    type: "service",
    category: "Chef",
    status: "CLOSED",
    location: "Veron",
    createdAt: "2026-05-05",
    timestamp: new Date("2026-05-05").getTime(),
  },
];

const STATUS_CONFIG = {
  OPEN: { label: "OPEN", classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  CLOSED: { label: "CLOSED", classes: "bg-rose-500/10 border-rose-500/30 text-rose-400" },
  DEFAULT: { label: "UNKNOWN", classes: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
};

const TYPE_ICONS = {
  construction: Briefcase,
  business: Building2,
  service: Zap,
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

const sortPosts = (posts) => [...posts].sort((a, b) => b.timestamp - a.timestamp);

export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [pendingDelete, setPendingDelete] = useState(null);

  const sortedPosts = sortPosts(posts);
  const totalPosts = sortedPosts.length;

  const requestDelete = (id) => setPendingDelete(id);

  const confirmDelete = () => {
    if (pendingDelete == null) return;
    setPosts((prev) => prev.filter((p) => p.id !== pendingDelete));
    setPendingDelete(null);
  };

  const cancelDelete = () => setPendingDelete(null);

  const requestEdit = (post) => {
    // Navigate ak pòs la pou modifye
    navigate(`/edit-post?id=${post.id}`, { state: { post } });
  };

  return (
    <div className="flex min-h-screen w-full flex-col animate-fade-in select-none bg-navy-900 px-6 py-10 font-sans text-white">
      
      <header className="mx-auto mb-8 flex w-full max-w-sm items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Pòs Mwen Yo</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            {totalPosts} pòs pibliye
          </p>
        </div>
        <button
          onClick={() => navigate("/create-post")}
          aria-label="Kreye yon nouvo pòs"
          className="flex h-10 w-10 active:scale-95 items-center justify-center rounded-xl bg-gold-400 text-navy-950 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      </header>

      <main className="mx-auto flex-1 w-full max-w-sm space-y-4">
        {totalPosts === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 bg-navy-800/10 p-6 py-24 text-center rounded-2xl">
            <div className="rounded-2xl border border-navy-800 bg-navy-800/20 p-4 mb-4">
              <Briefcase className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="font-bold text-sm text-white">Pa gen okenn pòs</h3>
            <p className="mt-1 text-xs max-w-[240px] leading-relaxed text-slate-400">
              Pibliye premye pòs ou sou JobFast pou ou ka kòmanse resevwa òf rapid.
            </p>
            <button
              onClick={() => navigate("/create-post")}
              className="mt-5 active:scale-95 rounded-xl bg-gold-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-navy-950 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
            >
              Kreye yon pòs
            </button>
          </div>
        ) : (
          sortedPosts.map((post) => {
            const status = getStatusConfig(post.status);
            const IconComponent = TYPE_ICONS[post.type] || Briefcase;
            
            return (
              <article 
                key={post.id} 
                className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-navy-800/20 p-5 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-navy-800 bg-navy-900 text-gold-400 shadow-inner">
                      <IconComponent className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black tracking-wide text-white">
                        {post.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {post.category}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${status.classes}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-800/40 pt-3 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{post.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Pibliye: {post.createdAt}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => requestEdit(post)}
                    aria-label={`Modifye pòs ${post.title}`}
                    className="flex items-center gap-1.5 active:scale-95 rounded-xl border border-transparent bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Modifye</span>
                  </button>
                  <button
                    onClick={() => requestDelete(post.id)}
                    aria-label={`Efase pòs ${post.title}`}
                    className="flex items-center gap-1.5 active:scale-95 rounded-xl border border-transparent bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 transition-all hover:bg-rose-500/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Efase</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </main>

      {pendingDelete && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-6 backdrop-blur-sm"
          onClick={cancelDelete}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-slate-800 bg-navy-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h3 className="text-center text-base font-black tracking-wide text-white">Efase pòs sa a?</h3>
            <p className="mt-2 text-center text-xs font-medium leading-relaxed text-slate-400">
              Aksyon sa a se pèmanan. Ou p ap kapab rekipere pòs sa a ankò si ou efase li.
            </p>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 active:scale-95 rounded-xl border border-slate-800 bg-navy-800/40 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 transition-all hover:bg-navy-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
              >
                Anile
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 active:scale-95 rounded-xl bg-rose-500 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-rose-600 shadow-md shadow-rose-500/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
              >
                Efase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
