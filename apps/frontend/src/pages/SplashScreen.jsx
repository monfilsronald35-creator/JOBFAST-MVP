// src/pages/SplashScreen.jsx

import React, { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "JOBFAST"; 
  }, []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050B18] text-white font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F]" />

      {/* Glow Effects */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[180px]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[140px]" />

      {/* Decorative Stars */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-1 w-1 rounded-full bg-white" />
        <div className="absolute right-20 top-40 h-1 w-1 rounded-full bg-yellow-400" />
        <div className="absolute left-24 top-72 h-1 w-1 rounded-full bg-white" />
        <div className="absolute right-12 top-1/3 h-1 w-1 rounded-full bg-white" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-6 py-10">
        {/* Top Spacer */}
        <div />

        {/* Center Section */}
        <section className="flex flex-col items-center text-center">
          {/* Logo (Inline SVG an sekirite pou Vercel ak fòma bèl bòs konstriksyon an) */}
          <div className="mb-5 flex select-none items-center justify-center h-28 w-28 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 p-5 shadow-[0_20px_40px_rgba(230,185,58,0.3)]">
            <svg 
              className="w-full h-full text-[#050B18]" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6m-5 3h4" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="select-none font-sans text-4xl sm:text-5xl font-black tracking-widest text-yellow-400">
            JOB<span className="text-white">FAST</span>
          </h1>

          {/* Slogan */}
          <p className="mt-5 max-w-[260px] px-2 font-sans text-sm font-medium leading-relaxed text-slate-300">
            Travay. Sèvis. Biznis. Kote w ye.
            <br />
            Tout nan yon sèl app.
          </p>
        </section>

        {/* Bottom Actions */}
        <section className="z-20 mx-auto flex w-full max-w-sm flex-col gap-4">
          <Button
            variant="primary"
            className="w-full py-4 font-sans font-bold tracking-wide bg-yellow-400 hover:bg-yellow-500 text-[#050B18] rounded-xl"
            onClick={() => navigate("/onboarding")}
          >
            KÒMANSE
          </Button>

          <button
            type="button"
            aria-label="Ale sou paj login"
            onClick={() => navigate("/login")}
            className="w-full py-2 font-sans text-base font-semibold text-white transition-all duration-200 hover:text-yellow-400"
          >
            Login
          </button>

          <button
            type="button"
            aria-label="Kreye yon nouvo kont"
            onClick={() => navigate("/register")}
            className="w-full py-1 font-sans text-sm font-medium text-slate-400 transition-all duration-200 hover:text-white"
          >
            Kreye Kont
          </button>
        </section>
      </div>
    </main>
  );
}

export default memo(SplashScreen);
