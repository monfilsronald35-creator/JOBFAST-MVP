import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Done simulation ki matche egzakteman ak Imaj MVP a (Non, distans, pri, status)
const MOCK_WORKERS = [
  {
    id: 1,
    name: "Mason",
    distance: "2.5 km",
    location: "Bavaro",
    rate: "USD 50 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400"
  },
  {
    id: 2,
    name: "Mason",
    distance: "2.8 km",
    location: "Veron",
    rate: "USD 45 / jou",
    status: "Okipe",
    dotColor: "bg-amber-500",
    textColor: "text-amber-400"
  },
  {
    id: 3,
    name: "Mason",
    distance: "3.1 km",
    location: "Friusa",
    rate: "USD 60 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400"
  },
  {
    id: 4,
    name: "Mason",
    distance: "3.4 km",
    location: "El Cortecito",
    rate: "USD 55 / jou",
    status: "Disponib",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-400"
  }
];

export default function SearchResultsScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("query") || "Mason";

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col font-sans select-none pb-28">
      
      {/* 🟢 TOP BAR (Search Input solid ak bouton Retou) */}
      <div className="px-5 pt-6 pb-3 max-w-md w-full mx-auto flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-[#162238] border border-slate-800/80 rounded-xl text-slate-400 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            readOnly
            value={query}
            className="w-full pl-11 pr-10 py-3 bg-[#162238] border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none"
          />
          <button 
            onClick={() => navigate("/search")}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 🎛️ FILTÈ KOUTIM (Custom Pills dapre Imaj la) */}
      <div className="px-5 py-2 max-w-md w-full mx-auto flex items-center gap-2 text-[11px] font-bold text-slate-300">
        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#162238] border border-slate-800 rounded-lg active:scale-95">
          Filté
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#162238] border border-slate-800 rounded-lg active:scale-95">
          2 km
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#162238] border border-slate-800 rounded-lg active:scale-95 ml-auto text-slate-400">
          Tri pa dènye
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* 👥 LIS TRAVAYÈ YO */}
      <div className="px-5 mt-3 flex-1 flex flex-col gap-3 max-w-md mx-auto w-full overflow-y-auto">
        {MOCK_WORKERS.map((worker) => (
          <div 
            key={worker.id}
            onClick={() => navigate(`/worker/${worker.id}`)}
            className="w-full p-4 bg-[#162238] border border-slate-800/50 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700/80 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5">
              {/* Avatar Placeholder ak inisyal */}
              <div className="w-12 h-12 bg-[#0B1528] border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black uppercase text-xs shadow-inner">
                {worker.name.substring(0, 2)}
              </div>
              
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-black tracking-wide text-slate-100">{worker.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">📍 {worker.distance} <span className="text-slate-600 mx-1">•</span> {worker.location}</p>
              </div>
            </div>

            {/* Pri ak Ti Dot Status anba li */}
            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-xs font-black text-amber-400 tracking-wide">{worker.rate}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${worker.dotColor} animate-pulse`}></span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${worker.textColor}`}>{worker.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🧭 NAVIGASYON ANBA (Bottom Tab Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-900 px-6 py-2 flex justify-between items-center z-40 max-w-md mx-auto">
        <button type="button" onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button type="button" onClick={() => navigate("/search")} className="flex flex-col items-center gap-1 text-amber-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button type="button" onClick={() => navigate("/post-job")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors">
          <div className="w-8 h-8 bg-[#162238] border border-slate-800 rounded-xl flex items-center justify-center -mt-4 shadow-lg text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Poste</span>
        </button>

        <button type="button" onClick={() => navigate("/notifications")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button type="button" onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </div>

    </div>
  );
}
