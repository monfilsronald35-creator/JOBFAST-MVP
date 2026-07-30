import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../config/routes";

// ── Constants ──────────────────────────────────────────────────────────────
const GOLD = "#FACC15";
const BG   = "#050B18";
const SWIPE_THRESHOLD_PX    = 50;
const ONBOARDING_TIMEOUT_MS = 8000;

interface Slide {
  id: number;
  emoji: string;
  color: string;
  title: string;
  body: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    emoji: "⚡",
    color: GOLD,
    title: "JOBFAST — Travay Rapid",
    body: "Jwenn travay epi sèvis nan kèk minit. Platfòm #1 Ayiti pou konekte ak travayè pwofesyonèl.",
  },
  {
    id: 2,
    emoji: "🤝",
    color: "#10b981",
    title: "Kliyan + Travayè Konekte",
    body: "Kliyan jwenn sèvis. Travayè jwenn travay. Tout de bò benefisye nan yon sèl platfòm solid.",
  },
  {
    id: 3,
    emoji: "🏨",
    color: "#3b82f6",
    title: "Super App Ayiti",
    body: "Hotel, Restoran, Lopital, Transpò, Touris — rezève ak jwenn sèvis toupatou ann Ayiti.",
  },
  {
    id: 4,
    emoji: "🌍",
    color: "#a78bfa",
    title: "Pare pou Mondyal",
    body: "JOBFAST ap grandi. Bientôt disponib nan tout Karayib la ak pi lwen. Ou fè pati premye yo.",
  },
];

interface OnboardingConfig {
  slides: Slide[];
  versionStatus: string;
}

// ── Analytics (no-op stub — swap for real impl later) ─────────────────────
const track = (event: string, props?: Record<string, unknown>) => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[track]", event, props);
  }
};

// ── Local step cache ───────────────────────────────────────────────────────
const CACHE_KEY = "jf_onboarding_step";
const onboardingLocalCache = {
  getSavedStep(): number | null {
    try {
      const v = localStorage.getItem(CACHE_KEY);
      return v !== null ? parseInt(v, 10) : null;
    } catch { return null; }
  },
  saveStep(step: number): void {
    try { localStorage.setItem(CACHE_KEY, String(step)); } catch {}
  },
  clear(): void {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
  },
};

// ── OnboardingSlide sub-component ──────────────────────────────────────────
interface OnboardingSlidePropsFull {
  slide: Slide;
  index?: number;
  total?: number;
  isActive?: boolean;
  onNext?: () => void;
  onSkip?: () => void;
  prefersReducedMotion?: boolean;
}

function OnboardingSlide({ slide }: OnboardingSlidePropsFull) {
  return (
    <div className="w-full flex flex-col items-center text-center px-4">
      <div
        className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl"
        style={{
          background:  `${slide.color}18`,
          border:      `2px solid ${slide.color}40`,
          transition:  "background 0.5s, border-color 0.5s",
        }}
      >
        <span style={{ fontSize: 44 }}>{slide.emoji}</span>
      </div>

      <h1
        className="text-2xl font-black text-white mb-4 leading-tight"
        style={{ maxWidth: "18rem", textWrap: "balance" } as React.CSSProperties}
      >
        {slide.title}
      </h1>

      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8", maxWidth: "20rem" }}>
        {slide.body}
      </p>
    </div>
  );
}

// ── Fetch state type ───────────────────────────────────────────────────────
type FetchState = "idle" | "loading" | "ready" | "error" | "timeout" | "maintenance" | "force_update";

// ── Main Onboarding component ──────────────────────────────────────────────
function Onboarding() {
  const navigate     = useNavigate();
  const { i18n }     = useTranslation();
  const focusTrapRef = useRef<HTMLDivElement | null>(null);

  const [fetchState,   setFetchState]   = useState<FetchState>("loading");
  const [fetchError,   setFetchError]   = useState<string | null>(null);
  const [config,       setConfig]       = useState<OnboardingConfig | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOffline,    setIsOffline]    = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX,   setTouchEndX]   = useState<number | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Online / offline ─────────────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Config load with timeout ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

    async function init() {
      try {
        setFetchState("loading");
        setFetchError(null);

        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setFetchState("timeout");
            setFetchError("onboarding.timeout");
          }
        }, ONBOARDING_TIMEOUT_MS);

        // Static config for now; replace body with real API call when ready
        const backendConfig: OnboardingConfig = {
          slides:        DEFAULT_SLIDES,
          versionStatus: "ok",
        };

        if (cancelled) return;
        window.clearTimeout(timeoutId);

        setConfig(backendConfig);
        setFetchState("ready");

        const saved = onboardingLocalCache.getSavedStep();
        if (saved !== null && saved < backendConfig.slides.length) {
          setCurrentSlide(saved);
        }

        track("onboarding_viewed", { locale: i18n.language });
      } catch {
        if (!cancelled) {
          if (timeoutId) window.clearTimeout(timeoutId);
          setFetchState("error");
          setFetchError("onboarding.fetch_failed");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [i18n.language]);

  // ── Auto-save slide progress ─────────────────────────────────────────────
  useEffect(() => {
    if (!config) return;
    onboardingLocalCache.saveStep(currentSlide);
    track("onboarding_slide_viewed", { step: currentSlide, total: config.slides.length });
  }, [currentSlide, config]);

  // ── Navigation callbacks ─────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    onboardingLocalCache.clear();
    track("onboarding_completed");
    navigate(ROUTES.auth.register);
  }, [navigate]);

  const handleNext = useCallback(() => {
    if (!config) return;
    const lastIndex = config.slides.length - 1;
    if (currentSlide < lastIndex) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      track("onboarding_next_clicked", { step: next });
    } else {
      handleFinish();
    }
  }, [config, currentSlide, handleFinish]);

  const handleBack = useCallback(() => {
    if (currentSlide === 0) return;
    const prev = currentSlide - 1;
    setCurrentSlide(prev);
    track("onboarding_back_clicked", { step: prev });
  }, [currentSlide]);

  const handleSkip = useCallback(() => {
    track("onboarding_skip_clicked", { step: currentSlide });
    handleFinish();
  }, [currentSlide, handleFinish]);

  // ── Touch / swipe handlers ───────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (prefersReducedMotion) return;
    setTouchStartX(e.changedTouches[0]?.clientX ?? null);
    setTouchEndX(null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (prefersReducedMotion) return;
    setTouchEndX(e.changedTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (prefersReducedMotion) return;
    if (touchStartX === null || touchEndX === null) return;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      setTouchStartX(null);
      setTouchEndX(null);
      return;
    }
    if (delta < 0) {
      handleNext();
      track("onboarding_swipe", { direction: "left", step: currentSlide });
    } else if (currentSlide > 0) {
      const prev = currentSlide - 1;
      setCurrentSlide(prev);
      track("onboarding_swipe", { direction: "right", step: prev });
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight")                   { e.preventDefault(); handleNext(); }
    else if (e.key === "ArrowLeft")               { e.preventDefault(); handleBack(); }
    else if (e.key === "Enter" || e.key === " ")  { e.preventDefault(); handleNext(); }
    else if (e.key === "Escape")                  { e.preventDefault(); handleSkip(); }
  };

  // ── Special render states ────────────────────────────────────────────────
  if (fetchState === "force_update") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-4" style={{ background: BG }}>
        <span style={{ fontSize: 52 }}>🔄</span>
        <h1 className="text-xl font-bold text-white">Mete app la ajou</h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Ou bezwen yon vèsyon pli nouvo pou kontinye itilize JOBFAST.
        </p>
        <button
          onClick={() => { track("onboarding_force_update_clicked"); window.location.reload(); }}
          className="px-6 py-3 rounded-2xl font-bold text-sm"
          style={{ background: GOLD, color: "#020617" }}
        >
          Mete ajou kounyea
        </button>
      </div>
    );
  }

  if (fetchState === "maintenance") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-4" style={{ background: BG }}>
        <span style={{ fontSize: 52 }}>🔧</span>
        <h1 className="text-xl font-bold text-white">Antrètyen an Kou</h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          JOBFAST ap amelyore. Retounen nan kèk minit.
        </p>
      </div>
    );
  }

  if (fetchState === "error" || fetchState === "timeout") {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-4" style={{ background: BG }}>
        <span style={{ fontSize: 52 }}>⚠️</span>
        <h1 className="text-xl font-bold text-white">
          {fetchState === "timeout" ? "Koneksyon twò lan" : "Erè de koneksyon"}
        </h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          {fetchState === "timeout"
            ? "Rechaj paj la pou eseye ankò."
            : "Yon erè te rive pandan chajman an."}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button
            onClick={() => window.location.reload()}
            className="py-3 rounded-2xl font-bold text-sm"
            style={{ background: GOLD, color: "#020617" }}
          >
            Eseye Ankò
          </button>
          <button
            onClick={() => {
              track("onboarding_continue_offline_clicked");
              setConfig({ slides: DEFAULT_SLIDES, versionStatus: "ok" });
              setFetchState("ready");
            }}
            className="py-2 text-xs"
            style={{ color: "#475569" }}
          >
            Kontinye san entènèt
          </button>
        </div>
      </div>
    );
  }

  if (fetchState === "loading" || !config) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-6" style={{ background: BG }}>
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center animate-bounce"
          style={{ background: `${GOLD}20`, border: `2px solid ${GOLD}50` }}
        >
          <span style={{ fontSize: 28 }}>⚡</span>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <div className="h-3 w-4/5 rounded-full animate-pulse mx-auto" style={{ background: "rgba(255,255,255,.08)" }} />
          <div className="h-3 w-3/4 rounded-full animate-pulse mx-auto" style={{ background: "rgba(255,255,255,.06)" }} />
          <div className="h-3 w-2/3 rounded-full animate-pulse mx-auto" style={{ background: "rgba(255,255,255,.04)" }} />
        </div>
        <p className="text-xs" style={{ color: "#475569" }}>Ap chaje...</p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  const slides      = config.slides;
  const totalSlides = slides.length;
  const activeSlide = slides[currentSlide]!;
  const isLast      = currentSlide === totalSlides - 1;

  return (
    <div
      ref={focusTrapRef}
      className="relative min-h-screen flex flex-col font-sans"
      style={{ background: BG }}
      aria-label="Onboarding JOBFAST"
    >
      {/* Ambient glow — transitions with slide color */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: activeSlide.color, transition: "background 0.7s ease" }}
        />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: "#3b82f6" }} />
      </div>

      {/* Soft-update notice */}
      {config.versionStatus === "soft_update" && (
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs border"
            style={{ background: `${GOLD}12`, color: "#fef08a", borderColor: `${GOLD}40` }}
          >
            Vèsyon nouvo disponib
          </div>
        </div>
      )}

      {/* Top bar: back + offline indicator + skip */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 h-14">
        <div>
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Retounen"
              className="rounded-full p-2 transition-colors"
              style={{ color: "#64748b" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isOffline && (
            <span
              className="text-[11px] font-medium px-2 py-1 rounded-full"
              role="status"
              aria-live="polite"
              style={{ background: "rgba(239,68,68,.1)", color: "#f87171" }}
            >
              Offline
            </span>
          )}
          {!isLast && (
            <button type="button" onClick={handleSkip} className="text-sm font-medium" style={{ color: "#64748b" }}>
              Pase
            </button>
          )}
        </div>
      </div>

      {/* Swipeable slide area */}
      <div
        className="relative z-10 flex-1 flex items-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Slides onboarding"
        onKeyDown={onKeyDown}
      >
        <OnboardingSlide
          slide={activeSlide}
          index={currentSlide}
          total={totalSlides}
          isActive
          onNext={handleNext}
          onSkip={handleSkip}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-12 pt-4 flex flex-col items-center gap-6">
        {/* Progress dots */}
        <div className="flex gap-2" role="tablist" aria-label="Slide indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentSlide}
              onClick={() => setCurrentSlide(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === currentSlide ? 24 : 8,
                height:     8,
                background: i === currentSlide ? GOLD : "rgba(255,255,255,.2)",
              }}
            />
          ))}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-2xl text-sm font-black transition-all active:scale-[.97]"
          style={{ background: GOLD, color: "#020617" }}
        >
          {isLast ? "Kòmanse Gratis ⚡" : "Kontinye →"}
        </button>

        {/* Login link on first slide */}
        {currentSlide === 0 && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.auth.login)}
            className="text-xs"
            style={{ color: "#475569" }}
          >
            Mwen deja gen yon kont
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(Onboarding);