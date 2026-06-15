import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const MOCK_WORKERS_DATABASE = {
  "1": {
    id: "1",
    name: "Ronald Monfils",
    role: "Boss",
    location: "Bávaro, Punta Cana",
    distance: "2.5 km de ou",
    status: "available", // available | busy | offline
    statusLabel: "Disponib",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    skills: ["Mason", "Beton", "Tiling", "Plonberi"],
    about: "Mwen se yon boss konstriksyon ak 10+ lane eksperyans nan fè bèl travay solid nan zòn Bávaro a.",
    rating: 4.8,
    reviewsCount: 24,
    phone: "+50912345678",
  },
};

export default function JobWorkerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const worker = MOCK_WORKERS_DATABASE?.[id] ?? null;

  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [id]);

  if (!worker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 px-5 text-center text-white">
        <div className="max-w-xs rounded-2xl border border-slate-800 bg-navy-800/40 p-6">
          <h1 className="text-base font-black">Travayè pa jwenn</h1>
          <p className="mt-1 text-xs text-slate-400">Tcheke lyen an oswa retounen.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 w-full rounded-xl bg-gold-500 py-2.5 text-xs font-bold text-black active:scale-95 transition"
          >
            Retounen
          </button>
        </div>
      </div>
    );
  }

  const initials = worker.name ? worker.name.slice(0, 2).toUpperCase() : "TW";
  const rating = typeof worker.rating === "number" ? worker.rating : 0;
  const reviews = typeof worker.reviewsCount === "number" ? worker.reviewsCount : 0;
  const skills = Array.isArray(worker.skills) ? worker.skills : [];

  // 🟢 Koulè dinamik pou badj disponiblite a
  const statusColor = worker.status === "available" 
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
    : worker.status === "busy"
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <div className="flex min-h-screen flex-col bg-navy-900 pb-32 text-white">
      
      {/* TOP BAR */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-xl bg-navy-800 border border-slate-800 text-sm active:scale-95 transition"
        >
          ←
        </button>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Pwofil Detaye</h2>
        <button
          onClick={() => setIsSaved((v) => !v)}
          className={`p-3 rounded-xl bg-navy-800 border border-slate-800 text-sm active:scale-95 transition ${isSaved ? "text-gold-500" : "text-slate-400"}`}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="w-full max-w-md mx-auto mt-6 text-center px-5">
        <div className="relative w-24 h-24 mx-auto">
          <div className="w-full h-full rounded-3xl overflow-hidden bg-navy-800 flex items-center justify-center border-2 border-slate-800 shadow-xl">
            {worker.avatar && !imageError ? (
              <img src={worker.avatar} alt={worker.name} onError={() => setImageError(true)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-gold-500">{initials}</span>
            )}
          </div>
          {/* Ti dot vèt ki flash sou foto a si li disponib */}
          {worker.status === "available" && (
            <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-navy-900"></span>
            </span>
          )}
        </div>

        <h1 className="mt-4 text-xl font-black tracking-tight">{worker.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <p className="text-xs text-gold-500 font-black uppercase tracking-wider">{worker.role}</p>
          <span className="text-slate-700">•</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {worker.statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          📍 {worker.location} <span className="text-slate-600">({worker.distance})</span>
        </p>
      </div>

      {/* SKILLS */}
      <div className="w-full max-w-md mx-auto mt-8 px-5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5">Konpetans</h4>
        <div className="flex flex-wrap gap-2">
          {skills.length ? (
            skills.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-navy-800 border border-slate-800/40 text-xs font-medium text-slate-300">
                {s}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-500">Pa gen konpetans</p>
          )}
        </div>
      </div>

      {/* ABOUT */}
      <div className="w-full max-w-md mx-auto mt-6 px-5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5">A pwopo</h4>
        <div className="bg-navy-800/30 border border-slate-800/40 p-4 rounded-2xl text-xs text-slate-300 leading-relaxed">
          {worker.about || "Pa gen deskripsyon"}
        </div>
      </div>

      {/* RATING */}
      <div className="w-full max-w-md mx-auto mt-6 px-5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5">Evalyasyon kliyan</h4>
        <div className="flex justify-between items-center bg-navy-800/30 border border-slate-800/40 p-4 rounded-2xl">
          <div className="flex items-center gap-1.5 font-black text-gold-500 text-sm">
            ⭐ {rating.toFixed(1)}
          </div>
          <div className="text-xs font-bold text-slate-500">
            {reviews} avi kliyan
          </div>
        </div>
      </div>

      {/* ACTIONS FIXE IN BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-navy-900/95 backdrop-blur-md border-t border-slate-800 flex gap-3 z-50">
        <button
          onClick={() => navigate(`/chat/${worker.id}`)}
          className="flex-1 py-4 rounded-2xl bg-navy-800 border border-slate-700 text-xs font-black uppercase tracking-wider active:scale-95 transition"
        >
          Mesaj
        </button>
        <a
          href={`tel:${worker.phone || ""}`}
          className="flex-1 py-4 rounded-2xl bg-gold-500 text-black text-xs font-black uppercase tracking-wider text-center active:scale-95 transition shadow-lg shadow-gold-500/10"
        >
          Rele Bòs la
        </a>
      </div>

    </div>
  );
}
