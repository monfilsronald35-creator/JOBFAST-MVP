import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx"; // ✅ N ap itilize bèl bouton customized ou a kounye a

const OnboardingIllustration = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 200"
    className="h-full w-full max-h-[220px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
    aria-hidden="true"
  >
    <circle cx="150" cy="110" r="75" fill="#1E293B" className="opacity-15" />
    <path d="M30 160c50-15 90 5 140-10s70-20 100-5v25H30v-10z" fill="#1E293B" opacity="0.75" />
    <rect x="50" y="80" width="20" height="70" fill="#475569" opacity="0.35" />
    <rect x="220" y="70" width="30" height="80" fill="#475569" opacity="0.28" />
    <rect x="85" y="120" width="70" height="30" rx="6" fill="#F5C518" />
    <rect x="120" y="98" width="28" height="24" rx="4" fill="#0F172A" />
    <rect x="124" y="102" width="20" height="14" rx="2" fill="#38BDF8" opacity="0.8" />
    <circle cx="105" cy="152" r="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
    <circle cx="105" cy="152" r="4" fill="#64748B" />
    <circle cx="140" cy="152" r="12" fill="#0F172A" stroke="#334155" strokeWidth="2" />
    <circle cx="140" cy="152" r="4" fill="#64748B" />
    <path d="M155 135h12l12-18h-10z" fill="#475569" />
    <circle cx="185" cy="105" r="9" fill="#FFEDD5" />
    <path d="M172 114c0-6 26-6 26 0v26h-26v-26z" fill="#1E3A8A" />
    <path d="M178 114h14l2 6h-18z" fill="#F5C518" />
    <path d="M176 97c0-6 9-9 18 0z" fill="#F5C518" />
    <path d="M173 97h24v2h-24z" fill="#F5C518" />
    <circle cx="80" cy="50" r="2" fill="#F5C518" opacity="0.45" />
    <circle cx="210" cy="40" r="1.5" fill="#FFFFFF" opacity="0.7" />
  </svg>
);

function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Byenveni nan JOBFAST",
      description:
        "Platfòm entelijan ki konekte kliyan, pwofesyonèl, antrepriz ak sèvis esansyèl nan yon sèl ekosistèm dijital.",
    },
    {
      title: "Jwenn Sèvis Pi Vit",
      description:
        "Lokalize travayè kalifye, sèvis konstriksyon ak pwofesyonèl verifye toupre ou gras ak teknoloji GPS an tan reyèl.",
    },
    {
      title: "Devlope Aktivite Ou",
      description:
        "Jere pwofil ou, resevwa notifikasyon enpòtan, jwenn nouvo opòtinite epi fè biznis ou grandi avèk JOBFAST.",
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
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-navy-900 px-6 py-10 font-sans text-text-inverse">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/4 blur-[110px]" />

      <div className="z-10 flex w-full justify-start">
        <button
          type="button"
          onClick={() => (currentSlide > 0 ? setCurrentSlide((prev) => prev - 1) : navigate("/"))}
          aria-label="Retounen"
          className="rounded-full p-2 text-text-muted transition-colors hover:text-text-inverse focus:outline-none focus:ring-4 focus:ring-gold-100/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="mx-auto my-auto flex w-full max-w-sm flex-col items-center text-center">
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-text-inverse animate-fade-in">
          {slides[currentSlide].title}
        </h2>

        <p className="mb-8 max-w-[280px] text-sm font-medium leading-relaxed text-slate-400">
          {slides[currentSlide].description}
        </p>

        <div className="mb-8 flex w-full justify-center">
          <OnboardingIllustration />
        </div>

        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "scale-110 bg-white" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="z-10 mx-auto flex w-full max-w-sm flex-col items-center gap-3">
        {/* ✅ Isit la nou ranplase vye bouton an ak nouvo konpozan pwofesyonèl ou a */}
        <Button
          variant="primary"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Kòmanse" : "Suivant"}
        </Button>

        {currentSlide < slides.length - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            className="pt-1 text-sm font-medium text-slate-400 transition-colors hover:text-text-inverse"
          >
            Sote
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(Onboarding);
