import React, {
  useState,
  useEffect,
  useCallback,
  TouchEvent,
  KeyboardEvent,
  memo,
  useRef,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../components/Button.jsx";
import { supabase } from "../lib/supabaseClient";
import posthog from "posthog-js";
import type { Session } from "@supabase/supabase-js"; // tip sekirite [web:967]

// ---- CONFIG & TYPES -------------------------------------------------------

const ONBOARDING_STORAGE_KEY = "jobfast:onboarding:step"; // cache UI sèlman
const ONBOARDING_TIMEOUT_MS = 8000;

type UserType =
  | "worker"
  | "employer"
  | "company"
  | "enterprise"
  | "freelancer"
  | "driver"
  | "delivery";

type SlideId = number;

interface BackendSlide {
  id: string;
  titleKey: string;
  descriptionKey: string;
  imageUrl: string; // ap soti sou CDN, webp/avif-ready
  imageAltKey?: string;
}

type VersionStatus = "ok" | "soft_update" | "force_update" | "maintenance";

interface OnboardingConfig {
  userType: UserType;
  slides: BackendSlide[];
  minAppVersion?: string;
  versionStatus?: VersionStatus; // kapab vini dirèkteman soti nan backend
}

interface SessionInfo {
  exists: boolean;
  supabaseSession: Session | null;
  userId?: string;
  userType?: UserType;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  deviceTrusted?: boolean;
  onboardingCompleted?: boolean;
}

type ThemeMode = "light" | "dark" | "system";

type FetchState =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "timeout"
  | "force_update"
  | "maintenance";

const SWIPE_THRESHOLD_PX = 40;

// ---- ANALYTICS -----------------------------------------------------------

function track(event: string, payload?: Record<string, unknown>) {
  try {
    if (posthog) {
      posthog.capture(event, payload);
    }
  } catch {
    // pa kraze app si analytics tonbe
  }
}

// Screen duration (per screen / route)
function useScreenDuration(screenName: string) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const durationMs = performance.now() - start;
      track("screen_duration", { screen: screenName, durationMs });
    };
  }, [screenName]);
}

// Rage click tracking senp
function useRageClick(threshold = 5, windowMs = 1500) {
  const [clicks, setClicks] = useState<number[]>([]);
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      setClicks((prev) => {
        const next = [...prev.filter((t) => now - t < windowMs), now];
        if (next.length >= threshold) {
          track("rage_click", { count: next.length });
        }
        return next;
      });
    };
    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [threshold, windowMs]);
}

// Crash report via window error / unhandledrejection
function useGlobalErrorTracking() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      track("ui_error", { message: event.message, source: event.filename });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      track("ui_error_unhandled_rejection", {
        reason: String(event.reason),
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
}

// Performance timing (navigation)
function usePerformanceTiming() {
  useEffect(() => {
    const nav = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      track("performance_navigation", {
        domContentLoaded: nav.domContentLoadedEventEnd,
        loadEventEnd: nav.loadEventEnd,
        firstByte: nav.responseStart,
      });
    }
  }, []);
}

// ---- UTILS: SEMVER --------------------------------------------------------

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

// ---- STARTUP PIPELINE UTILS (retry + backoff) -----------------------------

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 300 } = options;
  let attempt = 0;

  while (true) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      if (attempt >= retries) return res;
    } catch {
      if (attempt >= retries) throw;
    }
    attempt++;
    const delay = baseDelayMs * 2 ** (attempt - 1);
    await sleep(delay);
  }
}

// ---- SUPABASE & BACKEND SERVICES -----------------------------------------

async function pingBackend(): Promise<boolean> {
  try {
    const res = await fetchWithRetry("/api/v1/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function pingSupabase(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("health").select("ok").limit(1);
    if (error) return false;
    return !!data?.length;
  } catch {
    return false;
  }
}

async function getSupabaseSession(): Promise<SessionInfo> {
  const { data, error } = await supabase.auth.getSession(); // [web:940]
  if (error || !data.session) {
    return {
      exists: false,
      supabaseSession: null,
    };
  }

  const session = data.session;
  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, user_type, onboarding_completed, email_verified, phone_verified, device_trusted"
    )
    .eq("id", userId)
    .single();

  if (profileError) {
    return {
      exists: true,
      supabaseSession: session,
      userId,
    };
  }

  const userType = profile.user_type as UserType | undefined;

  return {
    exists: true,
    supabaseSession: session,
    userId,
    userType,
    onboardingCompleted: !!profile.onboarding_completed,
    emailVerified: !!profile.email_verified,
    phoneVerified: !!profile.phone_verified,
    deviceTrusted: !!profile.device_trusted,
  };
}

async function refreshSupabaseToken(): Promise<SessionInfo> {
  return getSupabaseSession();
}

async function loadCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function checkPermissions(userId: string) {
  const { data, error } = await supabase
    .from("permissions_view")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

async function checkNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

async function fetchOnboardingConfig(
  userType: UserType | null
): Promise<OnboardingConfig> {
  const qs = userType ? `?userType=${encodeURIComponent(userType)}` : "";
  const res = await fetchWithRetry(`/api/v1/onboarding${qs}`, undefined, {
    retries: 2,
    baseDelayMs: 400,
  });
  if (!res.ok) {
    throw new Error("Failed to load onboarding config");
  }
  const json = await res.json();
  return json as OnboardingConfig;
}

interface AppVersionResponse {
  version: string;
  status?: VersionStatus; // "ok" | "soft_update" | "force_update" | "maintenance"
  minSupportedVersion?: string;
}

async function checkAppVersion(
  minRequiredVersion?: string
): Promise<{
  ok: boolean;
  currentVersion: string;
  status: VersionStatus;
  minSupportedVersion?: string;
}> {
  const res = await fetchWithRetry("/api/v1/app-version");
  if (!res.ok) {
    return { ok: true, currentVersion: "unknown", status: "ok" };
  }
  const json = (await res.json()) as AppVersionResponse;
  const current = json.version;
  const status = json.status ?? "ok";
  const minSupportedVersion = json.minSupportedVersion ?? minRequiredVersion;

  if (!minSupportedVersion) {
    return { ok: true, currentVersion: current, status };
  }

  const ok = compareSemver(current, minSupportedVersion) >= 0;
  return { ok, currentVersion: current, status, minSupportedVersion };
}

// Startup pipeline ak retry + pa rele tout endpoint si user pa konekte
async function warmupStartupPipeline(userId?: string): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  tasks.push(pingBackend());
  tasks.push(pingSupabase());

  if (userId) {
    tasks.push(loadCurrentProfile(userId));
    tasks.push(checkPermissions(userId));
    tasks.push(checkNotifications(userId));
    tasks.push(fetchWithRetry("/api/v1/remote-config"));
    tasks.push(fetchWithRetry("/api/v1/categories"));
    tasks.push(fetchWithRetry("/api/v1/countries"));
    tasks.push(fetchWithRetry("/api/v1/settings"));
  }

  const results = await Promise.allSettled(tasks);

  // Si bagay enpòtan tonbe, ou ka voye analytics/fallback config
  const hasCriticalFailure = results.some(
    (r) => r.status === "rejected"
  );
  if (hasCriticalFailure) {
    track("startup_pipeline_partial_failure");
  }
}

// ---- LOCAL ONBOARDING CACHE (UI ONLY) -------------------------------------

const onboardingLocalCache = {
  getSavedStep(): SlideId | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) return null;
      const n = Number(stored);
      if (!Number.isFinite(n) || n < 0) return null;
      return n;
    } catch {
      return null;
    }
  },
  saveStep(step: SlideId) {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, String(step));
    } catch {
      // ignore
    }
  },
};

// ---- THEME -----------------------------------------------------------------

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem("jobfast:theme");
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

// ---- FOCUS TRAP HOOK ------------------------------------------------------

function useFocusTrap(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const focusableSelectors =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(el.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (node) => !node.hasAttribute("disabled") && !node.getAttribute("aria-hidden")
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", handleKeyDown as any);
    return () => el.removeEventListener("keydown", handleKeyDown as any);
  }, [enabled]);

  return containerRef;
}

// ---- SUB COMPONENT: SLIDE --------------------------------------------------

interface OnboardingSlideProps {
  slide: BackendSlide;
  index: number;
  total: number;
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  prefersReducedMotion: boolean;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  index,
  total,
  isActive,
  onNext,
  onSkip,
  prefersReducedMotion,
}) => {
  const { t } = useTranslation();
  const progressPercent = Math.round(((index + 1) / total) * 100);

  const animationClass = prefersReducedMotion
    ? ""
    : "transition-transform duration-500 will-change-transform";

  return (
    <section
      key={slide.id}
      className={`mx-auto flex w-full max-w-sm flex-col items-center text-center ${
        isActive ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      } ${animationClass}`}
      aria-roledescription="slide"
      aria-label={t(slide.titleKey)}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="mb-8 flex justify-center">
        <picture>
          <source
            srcSet={slide.imageUrl.replace(".webp", ".avif")}
            type="image/avif"
          />
          <source srcSet={slide.imageUrl} type="image/webp" />
          <img
            src={slide.imageUrl}
            alt={slide.imageAltKey ? t(slide.imageAltKey) : t(slide.titleKey)}
            className="max-h-[260px] w-full object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.55)]"
            loading={index === 0 ? "eager" : "lazy"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/assets/onboarding-fallback.webp";
            }}
          />
        </picture>
      </div>

      <h2 className="mb-3 px-4 text-xl font-black tracking-tight text-white font-sora">
        {t(slide.titleKey)}
      </h2>

      <p className="mb-4 min-h-[66px] max-w-[290px] px-2 text-sm leading-relaxed text-slate-300 font-poppins">
        {t(slide.descriptionKey)}
      </p>

      <div className="mb-6 w-full max-w-xs flex flex-col items-center gap-2">
        <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
          <span>
            {t("onboarding.stepLabel", { current: index + 1, total })}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-2 mt-1" aria-hidden="true">
          {Array.from({ length: total }).map((_, dotIndex) => (
            <div
              key={dotIndex}
              className={`rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? "h-1.5 w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  : "h-1.5 w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {t("onboarding.progressLabel", {
          current: index + 1,
          total,
          percent: progressPercent,
        })}
      </p>

      <div className="mt-4 mx-auto flex w-full max-w-sm flex-col items-center gap-4">
        <Button
          variant="primary"
          className="w-full py-4 font-sora font-bold tracking-wide text-[#050B18] relative overflow-hidden"
          onClick={onNext}
          aria-label={
            index === total - 1
              ? t("onboarding.startButtonLabel")
              : t("onboarding.nextButtonLabel")
          }
        >
          <span className="relative z-10">
            {index === total - 1 ? t("common.start") : t("common.next")}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-white/20 opacity-0 hover:opacity-40 transition-opacity" />
        </Button>

        {index < total - 1 ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-slate-400 transition hover:text-white font-poppins"
            aria-label={t("onboarding.skipButtonLabel")}
          >
            {t("common.skip")}
          </button>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </section>
  );
};

// ---- MAIN COMPONENT --------------------------------------------------------

function Onboarding() {
  const { t, i18n } = useTranslation();

  const [theme] = useState<ThemeMode>(() => getPreferredTheme());
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentSlide, setCurrentSlide] = useState<SlideId>(0);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const prefersReducedMotion = (() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  })();

  const focusTrapRef = useFocusTrap(true);

  useScreenDuration("onboarding");
  useRageClick();
  useGlobalErrorTracking();
  usePerformanceTiming();

  // --- Auth state listener (session management) -----------------------------

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
      // ou ka rafrechi UI/ctx si w vle
      track("auth_state_change");
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // --- Offline tracking -----------------------------------------------------

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- Session + config load with timeout + version status -----------------

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

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

        const sessionInfo = await getSupabaseSession();
        if (cancelled) return;

        if (!sessionInfo.exists) {
          // User anonim → ka wè onboarding, men pa gen onboarding_completed sou Supabase
        } else if (sessionInfo.onboardingCompleted) {
          // Backend toujou tcheke JWT + role; frontend la se UX
          // W ap route l pita nan app router ou, pa isit.
          setFetchState("ready");
          track("onboarding_already_completed");
          return;
        }

        const userType: UserType | null = (sessionInfo.userType as UserType) ?? null;

        const [backendConfig, versionInfo] = await Promise.all([
          fetchOnboardingConfig(userType),
          checkAppVersion(),
        ]);

        if (cancelled) return;

        // Merge backend versionStatus si genyen
        const effectiveStatus: VersionStatus =
          backendConfig.versionStatus || versionInfo.status || "ok";

        if (effectiveStatus === "maintenance") {
          setFetchState("maintenance");
          track("onboarding_maintenance_mode", {
            current: versionInfo.currentVersion,
          });
          return;
        }

        if (effectiveStatus === "force_update") {
          setFetchState("force_update");
          track("onboarding_force_update_required", {
            current: versionInfo.currentVersion,
            minSupported: versionInfo.minSupportedVersion,
          });
          return;
        }

        if (!versionInfo.ok && backendConfig.minAppVersion) {
          track("onboarding_soft_update_available", {
            minRequired: backendConfig.minAppVersion,
            current: versionInfo.currentVersion,
          });
          // Soft update: w ap montre yon bann pi ba
        }

        setConfig({
          ...backendConfig,
          versionStatus: effectiveStatus,
        });
        setFetchState("ready");

        const saved = onboardingLocalCache.getSavedStep();
        if (saved !== null && saved < backendConfig.slides.length) {
          setCurrentSlide(saved);
        } else {
          setCurrentSlide(0);
        }

        track("onboarding_viewed", {
          userType: backendConfig.userType,
          locale: i18n.language,
        });
      } catch (e) {
        if (!cancelled) {
          setFetchState("error");
          setFetchError("onboarding.fetch_failed");
        }
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [i18n.language]);

  // --- Auto-save + analytics slide view ------------------------------------

  useEffect(() => {
    if (!config) return;
    onboardingLocalCache.saveStep(currentSlide);
    track("onboarding_slide_viewed", {
      step: currentSlide,
      total: config.slides.length,
    });
  }, [currentSlide, config]);

  // --- Startup pipeline apre onboarding ------------------------------------

  const goToAppAfterOnboarding = useCallback(async () => {
    const sessionInfo = await refreshSupabaseToken();
    if (!sessionInfo.exists) {
      // w ap redireksyonnen sou /login nan router prensipal la
      track("onboarding_finish_no_session");
      return;
    }

    await warmupStartupPipeline(sessionInfo.userId);

    const profile = await loadCurrentProfile(sessionInfo.userId!);
    if (!profile) {
      track("onboarding_missing_profile");
      return;
    }
    if (!profile.email_verified || !profile.phone_verified) {
      track("onboarding_unverified_contact");
      return;
    }

    track("onboarding_go_to_dashboard");
  }, []);

  const handleFinish = useCallback(async () => {
    const sessionInfo = await refreshSupabaseToken();
    if (sessionInfo.exists && sessionInfo.userId) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", sessionInfo.userId);
    }
    track("onboarding_completed");
    await goToAppAfterOnboarding();
  }, [goToAppAfterOnboarding]);

  const handleNext = useCallback(() => {
    if (!config) return;
    const lastIndex = config.slides.length - 1;
    if (currentSlide < lastIndex) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      track("onboarding_next_clicked", { step: next });
    } else {
      void handleFinish();
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
    void handleFinish();
  }, [currentSlide, handleFinish]);

  // --- Swipe + keyboard handlers -------------------------------------------

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    setTouchStartX(e.changedTouches[0].clientX);
    setTouchEndX(null);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    setTouchEndX(e.changedTouches[0].clientX);
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

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleBack();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleSkip();
    }
  };

  const showOfflineBanner = isOffline;

  const themeClass =
    theme === "light"
      ? "bg-slate-50 text-slate-900"
      : "bg-[#050B18] text-white";

  // ---- SPECIAL RENDER STATES: FORCE UPDATE / MAINTENANCE ------------------

  if (fetchState === "force_update") {
    return (
      <div
        className={`relative min-h-screen overflow-hidden font-sans ${themeClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A152D] via-[#050B18] to-[#02060F]" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center text-white gap-4">
          <h1 className="text-xl font-bold">
            {t("onboarding.forceUpdateTitle")}
          </h1>
          <p className="text-sm text-slate-300">
            {t("onboarding.forceUpdateMessage")}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              track("onboarding_force_update_clicked");
              window.location.reload();
            }}
          >
            {t("onboarding.forceUpdateButton")}
          </Button>
        </div>
      </div>
    );
  }

  if (fetchState === "maintenance") {
    return (
      <div
        className={`relative min-h-screen overflow-hidden font-sans ${themeClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A152D] via-[#050B18] to-[#02060F]" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center text-white gap-4">
          <h1 className="text-xl font-bold">
            {t("onboarding.maintenanceTitle")}
          </h1>
          <p className="text-sm text-slate-300">
            {t("onboarding.maintenanceMessage")}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER STATES: ERROR / TIMEOUT --------------------------------------

  if (fetchState === "error" || fetchState === "timeout") {
    return (
      <div
        className={`relative min-h-screen overflow-hidden font-sans ${themeClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A152D] via-[#050B18] to-[#02060F]" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center text-white gap-4">
          <h1 className="text-xl font-bold">
            {t("onboarding.errorTitle")}
          </h1>
          <p className="text-sm text-slate-300">
            {t(fetchError || "onboarding.errorMessage")}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              aria-label={t("onboarding.retryButtonLabel")}
            >
              {t("common.retry")}
            </Button>
            <button
              type="button"
              className="text-xs text-slate-400 underline underline-offset-2"
              onClick={() => {
                track("onboarding_continue_offline_clicked");
              }}
              aria-label={t("onboarding.continueOfflineLabel")}
            >
              {t("common.continueOffline")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER STATE: LOADING (skeleton + animated logo) --------------------

  if (fetchState === "loading" || !config) {
    return (
      <div
        className={`relative min-h-screen overflow-hidden font-sans ${themeClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A152D] via-[#050B18] to-[#02060F]" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center text-white gap-6">
          <div className="animate-bounce">
            <div className="h-14 w-14 rounded-2xl bg-yellow-400 shadow-lg" />
          </div>
          <div className="w-full max-w-xs space-y-2">
            <div className="h-3 w-4/5 rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-3/4 rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded-full bg-white/10 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400">
            {t("onboarding.loading.almostReady")}
          </p>
        </div>
      </div>
    );
  }

  const slides = config.slides;
  const totalSlides = slides.length;
  const activeSlide = slides[currentSlide];

  return (
    <div
      ref={focusTrapRef}
      className={`relative min-h-screen overflow-hidden font-sans ${themeClass}`}
      aria-label={t("onboarding.screenLabel")}
      dir={i18n.dir()} // RTL support
    >
      {/* Background + glow */}
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

      {/* Soft update banner si genyen */}
      {config.versionStatus === "soft_update" && (
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-1 text-xs text-yellow-200 border border-yellow-500/40">
            <span>{t("onboarding.updateAvailable")}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-10">
        {/* Top row: back + offline banner */}
        <div className="flex items-center justify-between h-9">
          <div>
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label={t("onboarding.back")}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
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

          {showOfflineBanner && (
            <div
              className="rounded-full bg-red-500/20 px-3 py-1 text-[11px] font-medium text-red-200"
              role="status"
              aria-live="polite"
            >
              {t("onboarding.offline")}
            </div>
          )}
        </div>

        {/* Swipeable content area */}
        <div
          className="flex-1 flex items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={t("onboarding.carouselLabel")}
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
      </div>
    </div>
  );
}

export default memo(Onboarding);
