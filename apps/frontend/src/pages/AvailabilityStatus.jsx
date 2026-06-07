import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  {
    id: "available",
    title: "Disponib pou travay",
    description: "Ou dapròb epi vizib sou kat la pou nenpòt nouvo opòtinite imedyat.",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "on_site",
    title: "Sou Chantye / Nan Travay",
    description: "Ou okipe nan yon misyon kounye a. Sistèm nan ap limite nouvo alèt yo.",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "busy",
    title: "Okipe (Kout Pòz)",
    description: "Ou pap disponib pou kèk èdtan. Pwofil ou ap kache tanporèman.",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "offline",
    title: "Deploge (Inaktif)",
    description: "Ou offline nèt. Pa gen okenn notifikasyon oswa tracking GPS k ap fèt.",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-700",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export default function AvailabilityStatus() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveStatus = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-navy-900 px-0 pb-8 font-sans text-text-inverse select-none">
      <div className="z-10 flex items-center justify-between border-b border-navy-800/60 px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl bg-navy-800 p-2 text-slate-400 transition-all active:scale-95 hover:text-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-100/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-base font-extrabold uppercase tracking-wide text-slate-200">
          Estati Disponibilite
        </h1>

        <div className="h-9 w-9" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6 animate-fade-in">
        <p className="text-xs font-semibold leading-relaxed text-text-muted">
          Chwazi estati ou an tan reyèl pou sistèm JobFast la ka jere disponiblite w epi voye bon opòtinite yo.
        </p>

        <div role="radiogroup" aria-label="Estati disponiblite" className="flex flex-col gap-3.5">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedStatus(option.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gold-100/10 ${
                  isSelected
                    ? "border-gold-400/60 bg-navy-800 shadow-glow"
                    : "border-navy-800 bg-navy-800/40 hover:border-slate-700"
                }`}
              >
                <div className={`mt-0.5 flex items-center justify-center rounded-xl border p-2.5 ${option.badgeClass}`}>
                  {option.icon}
                  {isSelected && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-navy-800" />
                  )}
                </div>

                <div className="flex-1 pr-4">
                  <h3 className={`text-sm font-bold ${isSelected ? "text-gold-400" : "text-text-inverse"}`}>
                    {option.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-text-muted">
                    {option.description}
                  </p>
                </div>

                <div className="absolute right-4 top-4 flex items-center justify-center">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? "border-gold-400" : "border-slate-700"}`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-gold-400" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-auto w-full max-w-md px-5">
        <button
          type="button"
          onClick={handleSaveStatus}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-400/20 bg-premium-gradient py-4 text-xs font-black uppercase tracking-wider text-navy-950 transition-all active:scale-95 hover:opacity-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin text-navy-950" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
