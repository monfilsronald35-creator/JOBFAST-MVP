
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Kategori biznis yo ekzakteman jan yo ye nan makèt la
const BUSINESS_CATEGORIES = [
  { id: "company", label: "Konpayi", icon: "🏢" },
  { id: "restaurant", label: "Restoran", icon: "🍴" },
  { id: "hospital", label: "Lopital", icon: "🏥" },
  { id: "clinic", label: "Klinik", icon: "🩺" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "office", label: "Ofis", icon: "🏢" },
  { id: "lawyer", label: "Avoka", icon: "⚖️" },
  { id: "mechanic", label: "Mekanisyen", icon: "🛠️" },
  { id: "guide", label: "Tour Guide", icon: "👤" },
  { id: "organization", label: "Organization", icon: "👥" }
];

const BusinessDirectory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filtre kategori yo si itilizatè a ap chèche yon modil espesifik
  const filteredCategories = BUSINESS_CATEGORIES.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId) => {
    // Navige vè lis konpayi ki anba kategori sa a
    navigate(`/business/category/${categoryId}`);
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
        
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Biznis</h2>
        
        {/* Ti pwen fiks pou balanse aliyman an */}
        <div className="w-9 h-9"></div>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="px-5 mb-6 max-w-md w-full mx-auto">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biznis..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors select-text"
          />
          <div className="absolute left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 🏷️ SEKSYON KATEGORI TITLE */}
      <div className="px-5 mb-4 max-w-md w-full mx-auto">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Kategori</h3>
      </div>

      {/* 🏢 GRID KATEGORI BIZNIS (3-COLUMNS MATCHING THE UI) */}
      <div className="px-5 max-w-md w-full mx-auto flex-1 overflow-y-auto">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-3 gap-3.5">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="p-4 bg-[#162238]/40 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center gap-2.5 hover:bg-[#162238]/80 hover:border-amber-400/30 active:scale-95 transition-all group text-center"
                type="button"
              >
                {/* Veso Icon an */}
                <div className="w-12 h-12 bg-[#1A2B47] border border-slate-800/80 rounded-2xl flex items-center justify-center text-xl shadow-md group-hover:scale-105 group-hover:bg-[#162238] transition-transform">
                  {cat.icon}
                </div>
                
                {/* Non Kategori a */}
                <span className="text-[11px] font-black tracking-wide text-slate-300 group-hover:text-amber-400 transition-colors block truncate w-full">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pa gen kategori ki koresponn
          </div>
        )}
      </div>

      {/* 📱 BOTTOM NAVIGATION TAB BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-900 px-6 py-3 flex items-center justify-between z-40 max-w-md mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-slate-500 active:scale-95 transition-transform">
          <span className="text-lg">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-wider">Akèy</span>
        </button>
        {/* Nou kenbe leta aktif la klere depi se nan rechèch/direktori a itilizatè a ye */}
        <button onClick={() => navigate("/search")} className="flex flex-col items-center gap-1 text-amber-400 active:scale-95 transition-transform">
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

export default BusinessDirectory;
