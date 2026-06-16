// src/pages/SplashScreen.jsx

import React, { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
// Enpòte logo a dirèkteman depi nan assets ou yo
import logoJobfast from "../assets/logo.png"; 

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "JOBFAST";
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-[#050B18] text-white overflow-hidden flex flex-col justify-between items-center px-6 py-10 select-none">
      {/* Background nwa ak ble fonse */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />

      {/* Luminefè (Glow Effects) nan fon an */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] z-0" />

      {/* Top Spacer pou estrikti Layout la */}
      <div className="h-4 z-10" />

      {/* Sant Ekran an: Logo + Tit + Slogan */}
      <section className="relative z-10 flex flex-col items-center text-center max-w-sm w-full my-auto">
        {/* Kontenè Logo a ak gwosè fise nèt */}
        <div className="mb-6 flex items-center justify-center w-28 h-28 filter drop-shadow-[0_10px_20px_rgba(234,179,8,0.2)]">
          <img 
            src={logoJobfast} 
            alt="JOBFAST Logo" 
            className="w-full h-full object-contain"
            style={{ width: '112px', height: '112px' }}
          />
        </div>

        {/* Tit JOBFAST */}
        <h1 className="font-sans text-4xl sm:text-5xl font-black tracking-[0.15em] text-yellow-400">
          JOB<span className="text-white">FAST</span>
        </h1>

        {/* Slogan */}
        <p className="mt-4 max-w-[260px] font-sans text-sm font-medium leading-relaxed text-slate-300">
          Travay. Sèvis. Biznis. Kote w ye.
          <br />
          Tout nan yon sèl app.
        </p>
      </section>

      {/* Pati Anba: Bouton aksyon yo */}
      <section className="relative z-10 w-full max-w-xs flex flex-col gap-3.5 mt-auto">
        <Button
          variant="primary"
          className="w-full py-3.5 font-sans font-bold tracking-wide bg-yellow-400 hover:bg-yellow-500 text-[#050B18] rounded-xl transition-all shadow-lg active:scale-98 text-base"
          onClick={() => navigate("/onboarding")}
        >
          KÒMANSE
        </Button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full py-2 font-sans text-base font-semibold text-white transition-all duration-150 hover:text-yellow-400"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full py-1 font-sans text-sm font-medium text-slate-400 transition-all duration-150 hover:text-white"
        >
          Kreye Kont
        </button>
      </section>
    </main>
  );
}

export default memo(SplashScreen);
