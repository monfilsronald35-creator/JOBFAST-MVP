import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const MOCK_WORKERS = [
  {
    id: 1,
    name: "Ronald Monfils",
    trade: "Mason",
    distance: "2.5 km",
    location: "Bávaro",
    rate: "USD 50 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400",
  },
  {
    id: 2,
    name: "Pierre Louis",
    trade: "Mason",
    distance: "2.8 km",
    location: "Verón",
    rate: "USD 45 / jou",
    status: "Okipe",
    dotColor: "bg-amber-500",
    textColor: "text-amber-400",
  },
  {
    id: 3,
    name: "Luc Desir",
    trade: "Mason",
    distance: "3.1 km",
    location: "Friusa",
    rate: "USD 60 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400",
  },
  {
    id: 4,
    name: "Jacques Noel",
    trade: "Mason",
    distance: "3.4 km",
    location: "El Cortecito",
    rate: "USD 55 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400",
  },
];

export default function SearchResultsScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("query") || "";

  const filteredWorkers = MOCK_WORKERS.filter(
    (worker) =>
      worker.trade.toLowerCase().includes(query.toLowerCase()) ||
      worker.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 font-sans text-white pb-24 animate-fade-in">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 pb-3 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl border border-navy-800 bg-navy-800/60 p-2.5 text-slate-400 transition-all hover:text-gold-400 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          <input
            type="text"
            readOnly
            value={query || "Tout pwofesyonèl"}
            aria-label="Rechèch aktyèl"
            className="w-full rounded-xl border border-navy-800 bg-navy-800/40 py-3 pl-11 pr-10 text-xs font-bold text-white focus:outline-none"
          />

          <button
            type="button"
            onClick={() => navigate("/search")}
            aria-label="Klere rechèch la"
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition-colors hover:text-gold-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-2 px-5 py-2 text-[11px] font-bold text-slate-300">
        <button type="button" className="flex items-center gap-1.5 rounded-xl border border-navy-800 bg-navy-800/40 px-3 py-2 transition-all hover:border-slate-700 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10">
          Filtre
          <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button type="button" className="flex items-center gap-1.5 rounded-xl border border-navy-800 bg-navy-800/40 px-3 py-2 transition-all hover:border-slate-700 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10">
          5 km
          <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button type="button" className="ml-auto flex items-center gap-1.5 rounded-xl border border-navy-800 bg-navy-800/40 px-3 py-2 text-slate-400 transition-all hover:border-slate-700 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10">
          Triye pa distans
          <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-md flex-1 flex-col gap-3 overflow-y-auto px-5">
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <button
              key={worker.id}
              type="button"
              onClick={() => navigate(`/worker/${worker.id}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-800/60 bg-navy-800/30 p-4 text-left transition-all hover:border-slate-700 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-navy-800 bg-navy-900 text-xs font-black uppercase text-gold-400 shadow-inner">
                  {worker.name.substring(0, 2)}
                </div>

                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-bold tracking-wide text-white">{worker.name}</h3>
                  <p className="text-[11px] font-semibold text-gold-400/90">{worker.trade}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <span>📍</span>
                    {worker.distance}
                    <span className="text-slate-700">•</span>
                    {worker.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 text-right">
                <span className="text-xs font-black tracking-wide text-gold-400">{worker.rate}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${worker.dotColor} ${worker.status === "Disponib" ? "animate-pulse" : ""}`} />
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${worker.textColor}`}>
                    {worker.status}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center animate-fade-in">
            <div className="mb-3 rounded-full bg-navy-800/50 p-4 text-slate-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200">Pa gen rezilta</h3>
            <p className="mt-1 max-w-[240px] text-xs font-medium leading-relaxed text-slate-400">
              Nou pa jwenn okenn pwofesyonèl pou "{query}". Eseye verifye òtograf la oswa chwazi yon lòt pwofesyon.
            </p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-navy-950/95 px-6 py-2 backdrop-blur-md">
        <button type="button" onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" aria-label="Akey">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button type="button" onClick={() => navigate("/search")} className="flex flex-col items-center gap-1 text-gold-400" aria-label="Rechèch aktif">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button type="button" onClick={() => navigate("/post-job")} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" aria-label="Poste">
          <div className="relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-navy-800 text-gold-400 shadow-lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Poste</span>
        </button>

        <button type="button" onClick={() => navigate("/notifications")} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" aria-label="Notifikasyon">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button type="button" onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" aria-label="Profil">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}
