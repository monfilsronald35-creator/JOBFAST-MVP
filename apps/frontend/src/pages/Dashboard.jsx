import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";

// ======================================================
// 🗺️ KAT JEYOGRAFIK SVG (Style Dark Vector Map pou MVP a)
// ======================================================
const VectorMapBackground = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 320 140" 
    className="w-full h-full object-cover opacity-30"
  >
    {/* Gril / Liy kowòdone latitid ak lonjitid */}
    <path d="M0 20h320M0 50h320M0 80h320M0 110h320M40 0v140M100 0v140M160 0v140M220 0v140M280 0v140" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.3" />
    
    {/* Ti wout simulated vectorials */}
    <path d="M10 20c40 10 80-5 120 15s70 40 110 30h80M50 140V0M240 140V0" stroke="#475569" strokeWidth="1.5" fill="none" opacity="0.4" />
    <path d="M0 90h320" stroke="#facc15" strokeWidth="0.8" fill="none" opacity="0.2" strokeDasharray="4 4" />

    {/* Pwen GPS Travayè simulated toupre a */}
    <circle cx="90" cy="40" r="4" fill="#64748b" opacity="0.7" />
    <circle cx="210" cy="85" r="5" fill="#facc15" className="animate-pulse" />
    <circle cx="210" cy="85" r="10" stroke="#facc15" strokeWidth="1" fill="none" opacity="0.4" />
    <circle cx="270" cy="30" r="4" fill="#64748b" opacity="0.7" />
  </svg>
);

// ======================================================
// 🚀 MAIN DASHBOARD COMPONENT
// ======================================================
function Dashboard() {
  const navigate = useNavigate();
  
  // Eta pou jere chanjman estati disponibilite a
  const [isAvailable, setIsAvailable] = useState(true);

  // Done pou kategori yo jan yo ye nan makèt la
  const categories = [
    { 
      id: "construction", 
      name: "Construction", 
      icon: (
        <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: "services", 
      name: "Services", 
      icon: (
        <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
    { 
      id: "businesses", 
      name: "Businesses", 
      icon: (
        <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "jobs", 
      name: "Jobs", 
      icon: (
        <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  // Done pou lis travay toupre yo
  const nearbyJobs = [
    {
      id: 1,
      title: "Mason",
      location: "Bavaro",
      distance: "2.5 km",
      rate: "USD 50 / jou"
    },
    {
      id: 2,
      title: "Plomberie",
      location: "Veron",
      distance: "1.8 km",
      rate: "USD 40 / jou"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-navy-900 text-text-inverse flex flex-col font-sans select-none pb-24">
      
      {/* 🟢 BLÒK TÈT: LOGO, LOKALIZASYON AK NOTIFIKASYON */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center z-10">
        <div>
          <div className="flex items-center gap-1.5">
            <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <h1 className="text-xl font-black tracking-wider text-gold-400">JOBFAST</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            Bavaro, Punta Cana
          </p>
        </div>

        {/* Klòch Notifikasyon */}
        <button 
          onClick={() => navigate("/notifications")}
          className="p-2.5 bg-navy-800 rounded-xl text-slate-300 hover:text-gold-400 relative active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* 🗺️ PANEL KAT JEYOGRAFIK AK STATUS DISPONIBILITE */}
      <div className="mx-5 bg-navy-800/60 border border-slate-800 rounded-2xl overflow-hidden relative min-h-[140px] flex flex-col justify-between mb-6">
        <div className="absolute inset-0 z-0">
          <VectorMapBackground />
        </div>

        {/* Banner Estati a anwo kat la */}
        <div className="p-4 flex items-center justify-between z-10 w-full bg-gradient-to-b from-navy-900/90 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAvailable ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-inverse">Disponib pou travay</h3>
              <p className="text-[10px] text-slate-400">Ou dapròb pou nouvo travay.</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => navigate("/availability")}
            className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-gold-400 font-bold text-[11px] rounded-lg border border-slate-700 active:scale-95 transition-all"
          >
            Chanje Status
          </button>
        </div>
      </div>

      {/* 🗂️ SEKSYON KATEGORI YO */}
      <div className="px-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Kategori</h2>
          <button onClick={() => navigate("/categories")} className="text-xs font-bold text-gold-400 hover:underline">Voir tout</button>
        </div>

        {/* Kadriyaj Kat Kategori yo */}
        <div className="grid grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => navigate(`/search-results?cat=${cat.id}`)}
              className="flex flex-col items-center p-3 bg-navy-800/40 border border-slate-800/60 rounded-xl hover:border-gold-400/40 transition-all active:scale-95"
            >
              <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center mb-2 shadow-inner">
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-300 text-center truncate w-full">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🛠️ SEKSYON TRAVAY KI PRE W */}
      <div className="px-5 flex-1">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Travay ki pre w</h2>
        
        <div className="flex flex-col gap-3">
          {nearbyJobs.map((job) => (
            <div 
              key={job.id}
              className="p-4 bg-navy-800/40 border border-slate-800/80 rounded-xl flex justify-between items-center hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-gold-400/10 rounded-xl flex items-center justify-center text-gold-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-inverse">{job.title}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {job.location}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-gold-400 block">{job.rate}</span>
                <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">{job.distance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🧭 NAVIGASYON ANBA (Bottom Tab Bar - Nivo Ultra Pro) */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-950/95 backdrop-blur-md border-t border-slate-900 px-6 py-2 flex justify-between items-center z-40 max-w-md mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-gold-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button onClick={() => navigate("/search")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-gold-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button onClick={() => navigate("/post-job")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-gold-400 transition-colors">
          <div className="w-8 h-8 bg-navy-800 border border-slate-800 rounded-xl flex items-center justify-center -mt-4 shadow-lg text-gold-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Poste</span>
        </button>

        <button onClick={() => navigate("/notifications")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-gold-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-slate-500 hover:text-gold-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </div>

    </div>
  );
}

export default memo(Dashboard);
