import React, { useState, memo } from "react"; // Korije 'Import' -> 'import'
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";

import onboardingWorkers from "../assets/images/onboarding-1.png";

function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Byenveni nan JOBFAST",
      description:
        "Platfòm ki konekte travayè, kliyan, biznis ak sèvis nan zòn ou.",
      image: onboardingWorkers,
    },
    {
      title: "Jwenn Sèvis Pi Vit",
      description:
        "Lokalize travayè kalifye, sèvis konstriksyon ak pwofesyonèl verifye toupre ou gras ak teknoloji GPS an tan reyèl.",
      image: onboardingWorkers,
    },
    {
      title: "Devlope Aktivite Ou",
      description:
        "Jere pwofil ou, resevwa notifikasyon enpòtan, jwenn nouvo opòtinite epi fè biznis ou grandi avèk JOBFAST.",
      image: onboardingWorkers,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate("/register");
    }
  };

  const handleSkip = () => navigate("/register");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050B18] text-white font-sans">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A152D] via-[#050B18] to-[#02060F]" />
      <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-[130px]" />
      <div className="absolute bottom-1/4 right-[-50px] h-60 w-60 rounded-full bg-blue-500/10 blur-[100px]" />

      {/* Decorative stars */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-1.5 w-1.5 rounded-full bg-white" />
        <div className="absolute right-20 top-40 h-1 w-1 rounded-full bg-yellow-400" />
        <div className="absolute left-24 top-72 h-1 w-1 rounded-full bg-white" />
        <div className="absolute right-12 top-1/3 h-1.5 w-1.5 rounded-full bg-white" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-10">

        {/* Back button (Kache bouton an si nou sou premye slide la selon mockup la) */}
        <div className="h-9">
          {currentSlide > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => prev - 1)}
              aria-label="Retounen"
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Content */}
        <div
          key={currentSlide}
          className="mx-auto flex w-full max-w-sm flex-col items-center text-center animate-fade-in"
        >
          <div className="mb-8 flex justify-center">
            <img
              src={slides[currentSlide].image}
              alt="Onboarding JobFast"
              className="max-h-[260px] w-full object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.55)]"
            />
          </div>

          <h2 className="mb-3 px-4 text-xl font-black tracking-tight text-white font-sora">
            {slides[currentSlide].title}
          </h2>

          <p className="mb-8 min-h-[66px] max-w-[290px] px-2 text-sm leading-relaxed text-slate-300 font-poppins">
            {slides[currentSlide].description}
          </p>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "h-1.5 w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    : "h-1.5 w-1.5 bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4">
          <Button
            variant="primary"
            className="w-full py-4 font-sora font-bold tracking-wide text-[#050B18]"
            onClick={handleNext}
          >
            {currentSlide === slides.length - 1 ? "KÒMANSE" : "Suivant"}
          </Button>

          {currentSlide < slides.length - 1 ? (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-slate-400 transition hover:text-white font-poppins"
            >
              Sote
            </button>
          ) : (
            <div className="h-5" />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Onboarding);

