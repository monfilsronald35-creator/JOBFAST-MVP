import React, { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "JOBFAST";
  }, []);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[#050B18] text-white font-sans flex flex-col justify-between">
      {/* Background Sere ak Koulè Ofisyèl */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />

      {/* Glow Effects ki p ap deplase */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[120px] sm:blur-[180px] z-0" />
      <div className="pointer-events-none absolute bottom-[-10px] left-1/2 h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] sm:blur-[140px] z-0" />

      {/* Zetwal dekoratif */}
      <div className="pointer-events-none absolute inset-0 opacity-20 z-0">
        <div className="absolute left-10 top-20 h-1 w-1 rounded-full bg-white" />
        <div className="absolute right-20 top-40 h-1 w-1 rounded-full bg-yellow-400" />
        <div className="absolute left-24 top-72 h-1 w-1 rounded-full bg-white" />
        <div className="absolute right-12 top-1/3 h-1 w-1 rounded-full bg-white" />
      </div>

      {/* Kontni Prensipal la vlope byen pwòp */}
      <div className="relative z-10 flex flex-col justify-between items-center w-full max-w-md mx-auto min-h-dvh px-6 py-12">
        
        {/* Top Spacer pou pouse kontni an nan sant */}
        <div className="h-4" />

        {/* Center Section: Logo + Tit + Slogan */}
        <section className="flex flex-col items-center text-center w-full">
          {/* Bèl Logo Kas Bòs ak Bilding lan an SVG Kontwole */}
          <div className="mb-6 flex select-none items-center justify-center w-28 h-28 drop-shadow-[0_15px_30px_rgba(234,179,8,0.25)]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-yellow-400"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Kas Bòs Sekirite a */}
              <path d="M50 15C32 15 20 26 20 42C20 43.5 21.5 45 23 45H77C78.5 45 80 43.5 80 42C80 26 68 15 50 15Z" />
              {/* Liy vizyè kas la */}
              <path d="M15 48C15 46.5 16.5 45 18 45H82C83.5 45 85 46.5 85 48V51C85 52.5 83.5 54 82 54H18C16.5 54 15 52.5 15 51V48Z" />
              {/* Koup nivo mitan kas la */}
              <path d="M46 10H54V20H46V10Z" opacity="0.3" />
              {/* Bilding yo ki anba kas la */}
              <path fillRule="evenodd" clipRule="evenodd" d="M30 58H38V85H30V58ZM42 64H50V85H42V64ZM54 52H62V85H54V52ZM66 60H74V85H66V60Z" opacity="0.8" />
              {/* Ti fenèt nan bilding yo */}
              <rect x="33" y="63" width="2" height="3" fill="#050B18" />
              <rect x="33" y="70" width="2" height="3" fill="#050B18" />
              <rect x="45" y="69" width="2" height="3" fill="#050B18" />
              <rect x="45" y="76" width="2" height="3" fill="#050B18" />
              <rect x="57" y="57" width="2" height="3" fill="#050B18" />
              <rect x="57" y="64" width="2" height="3" fill="#050B18" />
              <rect x="57" y="71" width="2" height="3" fill="#050B18" />
              <rect x="69" y="65" width="2" height="3" fill="#050B18" />
              <rect x="69" y="72" width="2" height="3" fill="#050B18" />
              {/* Liy tè a */}
              <rect x="15" y="85" width="70" height="3" rx="1.5" />
            </svg>
          </div>

          {/* Tit Ofisyèl la ak bèl Tracking fise */}
          <h1 className="select-none font-sans text-4xl sm:text-5xl font-black tracking-[0.15em] text-yellow-400">
            JOB<span className="text-white">FAST</span>
          </h1>

          {/* Slogan an ak bèl liy espas */}
          <p className="mt-4 max-w-[260px] mx-auto px-2 font-sans text-sm font-medium leading-relaxed text-slate-300">
            Travay. Sèvis. Biznis. Kote w ye.
            <br />
            Tout nan yon sèl app.
          </p>
        </section>

        {/* Bottom Actions: Bouton aksyon yo k fise nan mitan anba toujou */}
        <section className="w-full max-w-xs flex flex-col gap-3.5 mt-auto">
          <Button
            variant="primary"
            className="w-full py-3.5 font-sans font-bold tracking-wider bg-yellow-400 hover:bg-yellow-500 text-[#050B18] rounded-xl transition-all shadow-md active:scale-95 text-base"
            onClick={() => navigate("/onboarding")}
          >
            KÒMANSE
          </Button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 font-sans text-base font-semibold text-white transition-all duration-200 hover:text-yellow-400 active:opacity-80"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full py-1 font-sans text-sm font-medium text-slate-400 transition-all duration-200 hover:text-white active:opacity-80"
          >
            Kreye Kont
          </button>
        </section>
        
      </div>
    </main>
  );
}

export default memo(SplashScreen);
