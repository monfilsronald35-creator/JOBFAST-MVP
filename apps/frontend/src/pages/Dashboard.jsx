import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx"; // ✨ Nou remete l kòm Button.jsx ak gwo B!

const LogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="currentColor"
    className="h-20 w-20 text-gold-400 drop-shadow-[0_0_22px_rgba(245,197,24,0.22)] sm:h-24 sm:w-24"
    aria-hidden="true"
  >
    <path d="M50 15C32 15 20 28 18 42h64C80 28 68 15 50 15z" />
    <path d="M12 44h76v4H12z" />
    <path d="M50 11c-2 0-3 2-3 4h6c0-2-1-4-3-4z" />
    <path d="M64 44V28h6v16h-6z M74 44V34h5v10h-5z M56 44V22h5v22h-5z" opacity="0.5" />
    <path d="M46 25h8v8h-8z" opacity="0.2" fill="#000" />
  </svg>
);

export default function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-navy-900 px-6 py-12 font-sans text-text-inverse select-none">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/8 blur-[120px]" />

      <div className="h-4" />

      <div className="z-10 flex max-w-sm flex-col items-center text-center animate-fade-in">
        <div className="mb-5 transition-transform duration-300 hover:scale-105">
          <LogoIcon />
        </div>

        <h1 className="mb-4 text-4xl font-black tracking-[0.14em] text-gold-400">
          JOBFAST
        </h1>

        <p className="max-w-[280px] text-sm font-medium leading-relaxed text-text-muted">
          Travay. Sèvis. Biznis. Kote w ye. Tout nan yon sèl app.
        </p>
      </div>

      <div className="z-10 flex w-full max-w-sm flex-col gap-4">
        <Button variant="primary" onClick={() => navigate("/onboarding")} className="w-full">
          Kòmanse
        </Button>

        <div className="mt-2 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-text-inverse transition-colors hover:text-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-100/20"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-sm font-semibold text-text-inverse transition-colors hover:text-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-100/20"
          >
            Kreye Kont
          </button>
        </div>
      </div>
    </div>
  );
}
