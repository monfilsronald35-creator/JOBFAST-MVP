import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ======================================================
// 📊 LISTE DES STATUTS DISPONIBLES (Nivo Pro International)
// ======================================================
const STATUS_OPTIONS = [
  {
    id: "available",
    title: "Disponib pou travay",
    description: "Ou dapròb epi vizib sou kat la pou nenpòt nouvo opòtinite imedyat.",
    colorClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "on_site",
    title: "Sou Chantye / Nan Travay",
    description: "Ou okipe nan yon misyon kounye a. Sistèm nan ap limite nouvo alèt yo.",
    colorClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "busy",
    title: "Okipe (Kout Pòz)",
    description: "Ou pap disponib pou kèk èdtan. Pwofil ou ap kache tanporèman.",
    colorClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "offline",
    title: "Deploge (Inaktif)",
    description: "Ou offline nèt. Pa gen okenn notifikasyon oswa tracking GPS k ap fèt.",
    colorClass: "bg-slate-500",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-700",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  }
];

// ======================================================
// 🚀 AVAILABILITY STATUS COMPONENT
// ======================================================
export default function AvailabilityStatus() {
  const navigate = useNavigate();
  
  // Nou simulate ke li te deja "available" pa defo
  const [selectedStatus, setSelectedStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveStatus = () => {
    setIsSaving(true);
    
    // Ti simulation tande pou simulate yon repons API pwofesyonèl
    setTimeout(() => {
      setIsSaving(false);
      navigate("/dashboard"); // Retounen sou dashboard la apre chanjman an
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-navy-900 text-text-inverse flex flex-col font-sans select-none justify-between pb-8">
      
      {/* 🟢 TÈT PAJ LA (HEADER WITH BACK BUTTON) */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-navy-800/60 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-navy-800 rounded-xl text-slate-400 hover:text-gold-400 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-extrabold tracking-wide uppercase text-slate-200">Estati Disponibilite</h1>
        <div className="w-9 h-9"></div> {/* Balans vizyèl */}
      </div>

      {/* 📊 SEKSYON KÒ / OPSYON YO */}
      <div className="px-5 flex-1 py-6 flex flex-col gap-5 max-w-md mx-auto w-full animate-fade-in">
        <div className="mb-2">
          <p className="text-xs font-semibold text-text-muted leading-relaxed">
            Chwazi estati ou an tan reyèl pou sistèm AI JobFast la ka distribye travay yo ba ou ak presizyon epi jere pozisyon GPS ou kòrèk.
          </p>
        </div>

        {/* Kat Opsyon yo */}
        <div className="flex flex-col gap-3.5">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedStatus(option.id)}
                className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 relative ${
                  isSelected 
                    ? "bg-navy-800 border-gold-400/60 shadow-glow" 
                    : "bg-navy-800/40 border-navy-800 hover:border-slate-800"
                }`}
              >
                {/* Endikatè Koulè / Ikòn */}
                <div className={`p-2.5 rounded-xl border ${option.badgeClass} flex items-center justify-center relative mt-0.5 shadow-inner`}>
                  {option.icon}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-400 rounded-full ring-2 ring-navy-800"></span>
                  )}
                </div>

                {/* Tèks Deskriptif */}
                <div className="flex-1 pr-4">
                  <h3 className={`text-sm font-bold transition-colors ${isSelected ? "text-gold-400" : "text-text-inverse"}`}>
                    {option.title}
                  </h3>
                  <p className="text-[11px] text-text-muted font-medium mt-1 leading-snug">
                    {option.description}
                  </p>
                </div>

                {/* Custom Radio Circle nan kwen an */}
                <div className="absolute top-4 right-4 flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? "border-gold-400" : "border-slate-700"
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-gold-400 rounded-full"></div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🧭 BOUTON ANBA (CONFIRMATION ACTION) */}
      <div className="px-5 max-w-md mx-auto w-full mt-auto">
        <button
          onClick={handleSaveStatus}
          disabled={isSaving}
          className="w-full py-4 bg-premium-gradient text-navy-950 font-black tracking-wider uppercase text-xs rounded-xl border border-gold-400/20 active:scale-95 shadow-card hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-navy-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Ap mete ajou...</span>
            </>
          ) : (
            <span>Mete estati a ajou</span>
          )}
        </button>
      </div>

    </div>
  );
}
