import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Simulation baz de done sèvis yo ekzakteman jan yo ye nan makèt MVP a
const MOCK_SERVICES = [
  { id: "chef", label: "Chef lakay", desc: "Manje nan kay", icon: "🍳" },
  { id: "plumber", label: "Plonbye", desc: "Reparasyon plonbri", icon: "🔧" },
  { id: "doctor", label: "Doktè", desc: "Swen medikal", icon: "🩺" },
  { id: "nurse", label: "Nurse", desc: "Swen lakay", icon: "👩‍⚕️" },
  { id: "taxi", label: "Taxi", desc: "Transport", icon: "🚖" },
  { id: "delivery", label: "Livrezon", desc: "Livrezon pakè", icon: "📦" },
  { id: "cleaning", label: "Netwayaj", desc: "Netwayaj kay", icon: "🧹" },
  { id: "videographer", label: "Videographer", desc: "Videyo / Evenman", icon: "🎥" },
  { id: "designer", label: "Designer", desc: "Grafik / Design", icon: "🎨" }
];

const ServicesOnDemand = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filtre sèvis yo dinamikman selon sa itilizatè a ap tape
  const filteredServices = MOCK_SERVICES.filter((service) =>
    service.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServiceClick = (serviceId) => {
    // Navige vè lis travayè oswa fòm demand pou sèvis espesifik sa a
    navigate(`/services/${serviceId}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col font-sans select-none pb-24">
      
      {/* 🟢 TOP NAVIGATION BAR */}
      <div className="px-5 pt-6 pb-4 max-w-md w-full mx-auto flex items-center justify-between z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-[#162238] border border-slate-800/80 rounded-xl text-slate-400 active:scale-95 transition-transform"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Sèvis Disponib</h2>
        
        {/* Ti pwen fiks pou balanse dizay la */}
        <div className="w-9 h-9"></div>
      </div>

      {/* 🔍 SEARCH BAR SEKSYON */}
      <div className="px-5 mb-5 max-w-md w-full mx-auto">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chache yon sèvis..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          <div className="absolute left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 🧑‍🔧 LIS SÈVIS YO (VERTICAL LIST - ULTRA PRO FLOW) */}
      <div className="px-5 max-w-md w-full mx-auto flex flex-col gap-3 flex-1 overflow-y-auto">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className="w-full p-4 bg-[#162238]/60 border border-slate-800/60 rounded-2xl flex items-center justify-between hover:bg-[#162238] active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="w-11 h-11 bg-[#1a2b47] border border-slate-800 rounded-xl flex items-center justify-center text-lg shadow-inner">
                  {service.icon}
                </div>
                
                {/* Tèks Detay */}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black tracking-wide text-white group-hover:text-amber-400 transition-colors">
                    {service.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">
                    {service.desc}
                  </span>
                </div>
              </div>

              {/* Ti Flèch Bò Dwat (Chevron) */}
              <div className="text-slate-500 group-hover:text-amber-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pa gen oken sèvis ki koresponn
          </div>
        )}
      </div>

      {/* 📱 BOTTOM NAVIGATION TAB BAR (Baze sou Makèt la) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1528]/90 backdrop-blur-lg border-t border-slate-900/80 px-6 py-3 flex items-center justify-between z-40 max-w-md mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Akèy</span>
        </button>
        <button onClick={() => navigate("/search")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">🔍</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Rechèch</span>
        </button>
        <button onClick={() => navigate("/post-job")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">➕</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Poste</span>
        </button>
        <button onClick={() => navigate("/notifications")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">🔔</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Notifikasyon</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">👤</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Profil</span>
        </button>
      </div>

    </div>
  );
};

export default ServicesOnDemand;
