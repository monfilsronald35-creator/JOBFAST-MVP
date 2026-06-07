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
  AlertTriangle 
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
                className="relative overflow-hidden rounded-2xl border border-sl
