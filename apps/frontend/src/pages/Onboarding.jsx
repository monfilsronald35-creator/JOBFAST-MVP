import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";

// ======================================================
// 🎨 DESEN SVG PWOFESYONÈL (Kamyon, Travayè ak Bilding - Style MVP)
// ======================================================
const OnboardingIllustration = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 300 200" 
    className="w-full h-full max-h-[220px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
  >
    {/* Background Efè lannwit */}
    <circle cx="150" cy="110" r="75" fill="#1e293b" className="opacity-20" />
    
    {/* Ti mòn ak tèks anba */}
    <path d="M30 160c50-15 90 5 140-10s70-20 100-5v25H30v-10z" fill="#1e293b" opacity="0.8" />

    {/* Bilding nan background */}
    <rect x="50" y="80" width="20" height="70" fill="#475569" opacity="0.4" />
    <rect x="220" y="70" width="30" height="80" fill="#475569" opacity="0.3" />

    {/* Kamyon / Traktè Jòn */}
    <rect x="85" y="120" width="70" height="30" rx="6" fill="#facc15" />
    <rect x="120" y="98" width="28" height="24" rx="4" fill="#0f172a" />
    <rect x="124" y="102" width="20" height="14" rx="2" fill="#38bdf8" opacity="0.8" />
    
    {/* Wou Kamyon yo */}
    <circle cx="105" cy="152" r="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
    <circle cx="105" cy="152" r="4" fill="#64748b" />
    <circle cx="140" cy="152" r="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
    <circle cx="140" cy="152" r="4" fill="#64748b" />

    {/* Pèl Traktè a */}
    <path d="M155 135h12l12-18h-10z" fill="#475569" />

    {/* Travayè a nan mitan an (Hard Hat style) */}
    <circle cx="185" cy="105" r="9" fill="#ffedd5" />
    <path d="M172 114c0-6 26-6 26 0v26h-26v-26z" fill="#1e3a8a" />
    <path d="M178 114h14l2 6h-18z" fill="#facc15" />
    <path d="M176 97c0-6 9-9 18 0z" fill="#facc15" />
    <path d="M173 97h24v2h-24z" fill="#facc15" />

    {/* Pwen limyè dekoratif */}
    <circle cx="80" cy="50" r="2" fill="#facc15" opacity="0.6" />
    <circle cx="210" cy="40" r="1.5" fill="#fff" opacity="0.8" />
  </svg>
);

// ======================================================
// 🚀 MAIN ONBOARDING SCREEN COMPONENT
// ======================================================
function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1); // Kòmanse nan 1 pou repwodwi dezyèm pwen an nèt sou imaj la

  const slides = [
  {
    title: "Byenveni nan JOBFAST",
    description:
      "Platfòm entelijan ki konekte kliyan, pwofesyonèl, antrepriz ak sèvis esansyèl nan yon sèl ekosistèm dijital."
  },
  {
    title: "Jwenn Sèvis Pi Vit",
    description:
      "Lokalize travayè kalifye, sèvis konstriksyon ak pwofesyonèl verifye toupre ou gras ak teknoloji GPS an tan reyèl."
  },
  {
    title: "Devlope Aktivite Ou",
    description:
      "Jere pwofil ou, resevwa notifikasyon enpòtan, jwenn nouvo opòtinite epi fè biznis ou grandi avèk JOBFAST."
  }
];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate("/register");
    }
  };

  const handleSkip = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen w-full bg-navy-900 text-text-inverse flex flex-col justify-between items-center px-6 py-12 relative overflow-hidden font-sans select-none">
      
      {/* Efè Limyè background (Glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🔙 Bouton Retounen nan kwen an */}
      <div className="w-full flex justify-start z-10">
        <button 
          type="button"
          onClick={() => currentSlide > 0 ? setCurrentSlide(prev => prev - 1) : navigate("/")}
          className="p-2 text-text-muted hover:text-text-inverse transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* 🟡 MITAN: TIT ➡️ DESKRIPSYON ➡️ DESEN ➡️ DOTS */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        
        {/* Tit la ekri egzak */}
        <h2 className="text-2xl font-bold tracking-tight text-text-inverse mb-4 animate-fade-in">
          {slides[currentSlide].title}
        </h2>
        
        {/* Deskripsyon an */}
        <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[280px] mb-8">
          {slides[currentSlide].description}
        </p>

        {/* Ilistrasyon Kamyon ak Travayè */}
        <div className="w-full flex justify-center items-center mb-8">
          <OnboardingIllustration />
        </div>

        {/* 🔘 TI PWEN NAVIGASYON PWÒP (Dots wonn egzak) */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white scale-110" : "bg-slate-600"
              }`}
            />
          ))}
        </div>

      </div>

      {/* 🔵 ANBA: BOUTON AKSYON YO */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 z-10">
        
        {/* Bouton Suivant - Style egzak ak fòm kòrèk */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 bg-gold-400 hover:bg-gold-300 active:scale-[0.99] text-navy-900 font-bold text-sm rounded-xl shadow-[0_4px_15px_rgba(250,204,21,0.2)] transition-all"
        >
          {currentSlide === slides.length - 1 ? "Fini" : "Suivant"}
        </button>

        {/* Bouton Sote kòm tèks senp anba bouton jòn nan */}
        {currentSlide < slides.length - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-slate-400 hover:text-text-inverse transition-all pt-1"
          >
            Sote
          </button>
        )}

      </div>

    </div>
  );
}

export default memo(Onboarding);
