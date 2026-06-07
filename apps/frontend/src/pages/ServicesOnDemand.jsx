import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_SERVICES = [
  { id: "chef", label: "Chef lakay", desc: "Manje ak kwit nan kay", icon: "🍳" },
  { id: "plumber", label: "Plonbye", desc: "Reparasyon tiyo ak plonbri", icon: "🔧" },
  { id: "doctor", label: "Doktè", desc: "Konsiltasyon ak swen medikal", icon: "🩺" },
  { id: "nurse", label: "Enfimyè", desc: "Swen enfimyè lakay", icon: "👩‍⚕️" },
  { id: "taxi", label: "Taksi", desc: "Transpò prive ak kous", icon: "🚖" },
  { id: "delivery", label: "Livrezon", desc: "Livrezon pakè ak komisyon", icon: "📦" },
  { id: "cleaning", label: "Netwayaj", desc: "Netwayaj kay ak biwo", icon: "🧹" },
  { id: "videographer", label: "Videyast", desc: "Kaptire videyo ak evènman", icon: "🎥" },
  { id: "designer", label: "Disajner", desc: "Grafik ak konsepsyon vizyèl", icon: "🎨" },
];

export default function ServicesOnDemand() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = MOCK_SERVICES.filter((service) =>
    service.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 pb-24 font-sans text-white select-none animate-fade-in">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-4 pt-6">
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

        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Sèvis sou Demann</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="mx-auto mb-5 w-full max-w-md px-5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chache yon sèvis..."
            aria-label="Chache yon sèvis"
            className="w-full rounded-xl border border-navy-800 bg-navy-800/40 py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-slate-500 transition-all focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          />
          <div className="pointer-events-none absolute left-4 flex items-center">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 overflow-y-auto px-5">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => navigate(`/services/${service.id}`)}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-800/60 bg-navy-800/30 p-4 transition-all active:scale-[0.99] hover:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy-800 bg-navy-900 shadow-inner transition-colors group-hover:border-gold-400/30">
                  <span role="img" aria-label={service.label} className="text-lg">
                    {service.icon}
                  </span>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold tracking-wide text-white transition-colors group-hover:text-gold-400">
                    {service.label}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {service.desc}
                  </span>
                </div>
              </div>

              <div className="text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-gold-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pa gen okenn sèvis ki koresponn</h3>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-navy-950/95 px-6 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Akey"
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/search")}
          aria-label="Rechèch"
          className="flex flex-col items-center gap-1 text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/post-job")}
          aria-label="Poste"
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <div className="relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-navy-800 text-gold-400 shadow-lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Poste</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifikasyon"
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Profil"
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}
