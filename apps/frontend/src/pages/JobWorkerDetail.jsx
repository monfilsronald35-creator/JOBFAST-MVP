import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const MOCK_WORKERS_DATABASE = {
  "1": {
    id: "1",
    name: "Ronald Monfils",
    role: "Boss",
    location: "Bávaro, Punta Cana",
    distance: "2.5 km de ou",
    status: "available",
    statusLabel: "Disponib",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-500",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    skills: ["Mason", "Beton", "Tiling", "Plonberi"],
    about: "Mwen se yon boss konstriksyon ak 10+ lane eksperyans nan fè bèl travay solid ak fini pafè.",
    rating: 4.8,
    reviewsCount: 24,
    phone: "+50912345678",
  },
  "2": {
    id: "2",
    name: "Jean Jacques",
    role: "Mason / Chapantye",
    location: "Verón, Punta Cana",
    distance: "3.8 km de ou",
    status: "working",
    statusLabel: "Okipe",
    statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-500",
    avatar: "",
    skills: ["Chapant", "Daal", "Finition"],
    about: "Espesyalize nan kofraj ak chapant depi plizyè lanne nan zòn Punta Cana.",
    rating: 4.5,
    reviewsCount: 12,
    phone: "+50987654321",
  },
};

export default function JobWorkerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const worker = MOCK_WORKERS_DATABASE[id];
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [id]);

  if (!worker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 px-5 text-center text-white select-none animate-fade-in">
        <div className="max-w-xs rounded-2xl border border-navy-800 bg-navy-800/40 p-6 shadow-xl">
          <h1 className="text-base font-black text-slate-200">Travayè a pa jwenn</h1>
          <p className="mt-1 text-xs text-slate-400">Tcheke lyen an oswa tounen nan lis la.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 w-full rounded-xl border border-navy-700 bg-navy-800 py-2.5 text-xs font-bold text-gold-400 transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          >
            Retounen
          </button>
        </div>
      </div>
    );
  }

  const currentRating = worker.rating || 0;
  const currentReviews = worker.reviewsCount || 0;
  const initials = worker.name ? worker.name.substring(0, 2) : "TW";

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 pb-32 font-sans text-white select-none animate-fade-in">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-3 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl border border-navy-800 bg-navy-800/60 p-2.5 text-slate-400 transition-all active:scale-95 hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Pwofil Travayè</h2>

        <button
          type="button"
          onClick={() => setIsSaved((v) => !v)}
          aria-label={isSaved ? "Retire nan lis sove" : "Sove pwofil sa"}
          className="rounded-xl border border-navy-800 bg-navy-800/60 p-2.5 transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg
            className={`h-4 w-4 transition-colors ${isSaved ? "fill-gold-400 text-gold-400" : "text-slate-400 hover:text-gold-400"}`}
            fill={isSaved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-md flex-col items-center px-5 text-center">
        <div className="relative mb-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-navy-700 bg-navy-800 shadow-2xl">
            {worker.avatar && !imageError ? (
              <img
                src={worker.avatar}
                alt={worker.name}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xl font-black uppercase tracking-wider text-gold-400">{initials}</span>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-wide text-white">{worker.name}</h1>
        <p className="mt-0.5 text-xs font-black uppercase tracking-widest text-gold-400">{worker.role}</p>
        <p className="mt-1 text-xs font-semibold text-slate-400">{worker.location}</p>

        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
          {worker.distance}
        </div>

        <div className={`mt-4 flex items-center gap-2 rounded-full border px-4 py-1.5 ${worker.statusColor || "border-navy-700 bg-navy-800/40 text-slate-300"}`}>
          <span className={`h-2 w-2 rounded-full ${worker.dotColor || "bg-slate-400"} ${worker.status === "available" ? "animate-pulse" : ""}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{worker.statusLabel}</span>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-md flex-1 flex-col gap-6 px-5">
        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Konpetans</h4>
          <div className="flex flex-wrap gap-2">
            {worker.skills?.map((skill, index) => (
              <span
                key={index}
                className="rounded-xl border border-navy-700 bg-navy-800/40 px-3.5 py-1.5 text-xs font-bold text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">A pwopo</h4>
          <div className="rounded-2xl border border-slate-800/60 bg-navy-800/30 p-4">
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              {worker.about || "Pa gen deskripsyon ki disponib."}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Evalyasyon</h4>
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-navy-800/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-gold-400">{currentRating.toFixed(1)}</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(currentRating) ? "text-gold-400 fill-gold-400" : "text-slate-700"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">({currentReviews} evalyasyon)</span>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center gap-3 border-t border-slate-900/80 bg-navy-950/90 px-5 pb-8 pt-4 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => navigate(`/chat/${worker.id}`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-navy-700 bg-navy-800 py-3.5 text-xs font-black text-white transition-all hover:bg-navy-700 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Mesaj
        </button>

        <a
          href={`tel:${worker.phone || ""}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-500 py-3.5 text-xs font-black text-navy-900 transition-all hover:bg-gold-400 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
        >
          <svg className="h-4 w-4 text-navy-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Rele
        </a>
      </div>
    </div>
  );
}
