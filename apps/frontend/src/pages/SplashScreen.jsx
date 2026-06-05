import React, { memo } from "react";
import { useNavigate } from "react-router-dom";

// ======================================================
// 📦 LOGO SVG PWOFESYONÈL (Chapo Travayè + Bilding - 100% Repare ak Valide)
// ======================================================
const LogoIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    fill="currentColor" 
    className="w-24 h-24 text-gold-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.3)]"
  >
    {/* Silwèt Chapo Sekirite (Hard Hat) */}
    <path d="M50 15C32 15 20 28 18 42h64C80 28 68 15 50 15z" />
    
    {/* Rebò Chapo a (Sentaks repare) */}
    <path d="M12 44h76v4H12z" />
    <path d="M50 11c-2 0-3 2-3 4h6c0-2-1-4-3-4z" />
    
    {/* Liy Estrikti Bilding nan background nan (Nivo Ultra Pro) */}
    <path d="M64 44V28h6v16h-6z M74 44V34h5v10h-5z M56 44V22h5v22h-5z" fill="currentColor" opacity="0.5" />
    
    {/* Ti detay vizyè devan chapo a */}
    <path d="M46 25h8v8h-8z" opacity="0.2" fill="#000" />
  </svg>
);

// ======================================================
// 🚀 MAIN SPLASH SCREEN COMPONENT
// ======================================================
function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-navy-900 text-text-inverse flex flex-col justify-between items-center px-6 py-12 relative overflow-hidden font-sans select-none">
      
      {/* 🌌 Efè Limyè background (Glow) pou nivo Premium */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold-400/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* PATI SOU CHÈF (Espace pou balanse) */}
      <div className="h-4"></div>

      {/* 🟡 MITAN: LOGO, TIT AK RECHÈCH ESLOGAN */}
      <div className="flex flex-col items-center text-center max-w-sm animate-fade-in">
        {/* Kontenè Logo a san background solid */}
        <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
          <LogoIcon />
        </div>

        {/* Branding Tit la - Tou jòn nèt tankou sou makèt la */}
        <h1 className="text-4xl font-black tracking-wider text-gold-400 mb-4">
          JOBFAST
        </h1>

        {/* Creòl Slogan jan li ye sou MVP a */}
        <p className="text-sm font-medium text-text-muted leading-relaxed max-w-[280px]">
          Travay. Sèvis. Biznis. Kote w ye. Tout nan yon sèl app.
        </p>
      </div>

      {/* 🔵 ANBA: BOUTON AKSYON YO */}
      <div className="w-full max-w-sm flex flex-col gap-4 z-10">
        
        {/* Bouton Prensipal: KÒMANSE */}
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="w-full py-3.5 bg-gold-400 hover:bg-gold-300 active:scale-[0.98] text-navy-900 font-extrabold text-sm rounded-xl shadow-[0_4px_20px_rgba(250,204,21,0.25)] transition-all duration-200 uppercase tracking-widest"
        >
          Kòmanse
        </button>

        {/* Segman Segondè pou itilizatè ki gen kont deja */}
        <div className="flex flex-col items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-text-inverse hover:text-gold-400 active:scale-95 transition-all"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-sm font-bold text-text-inverse hover:text-gold-400 active:scale-95 transition-all"
          >
            Kreyé Kont
          </button>
        </div>

      </div>

    </div>
  );
}

export default memo(SplashScreen);
