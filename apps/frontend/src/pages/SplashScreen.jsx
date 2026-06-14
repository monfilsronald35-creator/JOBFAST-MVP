// src/pages/SplashScreen.jsx

import React, { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";

import logo from "../assets/icons/logo.svg";

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
          {/* Logo */}
          <div className="mb-5 flex select-none items-center justify-center">
            <img
              src={logo}
              alt="JOBFAST Logo"
              loading="eager"
              draggable={false}
              className="h-28 w-28 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Title */}
          <h1 className="mr-[-0.2em] select-none font-sora text-4xl sm:text-5xl font-black tracking-[0.2em] text-yellow-400">
            JOBFAST
          </h1>

          {/* Slogan */}
          <p className="mt-5 max-w-[260px] px-2 font-poppins text-sm font-medium leading-relaxed text-slate-300">
            Travay. Sèvis. Biznis. Kote w ye.
            <br />
            Tout nan yon sèl app.
          </p>
        </section>

        {/* Bottom Actions */}
        <section className="z-20 mx-auto flex w-full max-w-sm flex-col gap-4">
          <Button
            variant="primary"
            className="w-full py-4 font-sora font-bold tracking-wide text-[#050B18]"
            onClick={() => navigate("/onboarding")}
          >
            KÒMANSE
          </Button>

          <button
            type="button"
            aria-label="Ale sou paj login"
            onClick={() => navigate("/login")}
            className="w-full py-2 font-poppins text-base font-semibold text-white transition-all duration-200 hover:text-yellow-400"
          >
            Login
          </button>

          <button
            type="button"
            aria-label="Kreye yon nouvo kont"
            onClick={() => navigate("/register")}
            className="w-full py-1 font-poppins text-sm font-medium text-slate-400 transition-all duration-200 hover:text-white"
          >
            Kreye Kont
          </button>
        </section>
      </div>
    </main>
  );
}

export default memo(SplashScreen);