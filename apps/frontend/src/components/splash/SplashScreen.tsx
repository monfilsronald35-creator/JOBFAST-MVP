import React, { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage, STORAGE_KEY } from "../../i18n";
import './splash.css';

// ---- CONFIG / TYPES --------------------------------------------------------

interface Language {
  code: string;
  name: string;
  native: string;
}

const LANGUAGES: Language[] = [
  { code: "ht", name: "Kreyòl Ayisyen", native: "Kreyòl" },
  { code: "fr", name: "Français",       native: "Français" },
  { code: "en", name: "English",        native: "English" },
  { code: "es", name: "Español",        native: "Español" },
];

type Phase = "language" | "checking" | "ready" | "error";

interface ErrorState {
  code: string;
}

// Stubs pou entegre ak vrè services ou yo
async function pingBackend(): Promise<boolean> {
  return true;
}

async function pingSupabase(): Promise<boolean> {
  return true;
}

async function getSupabaseSession(): Promise<{ exists: boolean; role?: string }> {
  // TODO: ranplase sa ak Supabase auth getSession()
  return { exists: false };
}

async function refreshSupabaseToken(): Promise<void> {
  // TODO: ranplase ak supabase.auth.refreshSession()
}

async function loadCurrentProfile(): Promise<{ onboardingCompleted: boolean }> {
  // TODO: ranplase ak /me oswa supabase.rpc(...)
  return { onboardingCompleted: false };
}

async function checkPermissions(): Promise<void> {
  // TODO: role/permissions logic
}

async function checkNotifications(): Promise<void> {
  // TODO: load notifications / permission status
}

function track(event: string, payload?: Record<string, unknown>): void {
  // TODO: ploge analytics SDK (PostHog, Amplitude, Segment, elatriye)
  // console.log("analytics", event, payload);
}

// Safe check if a language has been chosen previously
const hasChosenLanguage = (): boolean => {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
};

// ---- MAIN COMPONENT --------------------------------------------------------

function SplashScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [langPicked, setLangPicked] = useState(hasChosenLanguage);
  const [selecting,  setSelecting]  = useState(false);

  const [phase,    setPhase]    = useState<Phase>(hasChosenLanguage() ? "checking" : "language");
  const [error,    setError]    = useState<ErrorState | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isSlow,   setIsSlow]   = useState(false);

  useEffect(() => {
    document.title = "JOBFAST";
    track("splash_viewed");
  }, []);

  // Online / offline tracking
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online",  updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online",  updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  // Slow loading indicator (> 3s)
  useEffect(() => {
    if (phase === "checking") {
      const id = window.setTimeout(() => setIsSlow(true), 3000);
      return () => window.clearTimeout(id);
    }
    setIsSlow(false);
  }, [phase]);

  const currentLang =
    LANGUAGES.find((l) => l.code === (i18n.language?.split("-")[0])) ?? LANGUAGES[0]!;

  // ---- LANGUAGE HANDLERS ---------------------------------------------------

  const handlePick = async (code: string) => {
    if (selecting || code === currentLang.code) return;

    setSelecting(true);
    track("splash_language_select_clicked", { code });

    try {
      await changeLanguage(code);
      setLangPicked(true);
      setPhase("checking");
      track("splash_language_selected", { code });
    } catch {
      setError({ code: "unknown" });
      setPhase("error");
    } finally {
      setSelecting(false);
    }
  };

  const handleSkipLanguage = () => {
    setLangPicked(true);
    setPhase("checking");
  };

  // ---- SESSION / HEALTH FLOW ----------------------------------------------

  const runSessionFlow = async () => {
    try {
      setPhase("checking");
      setError(null);

      // 1) Internet
      if (!navigator.onLine) {
        setError({ code: "offline" });
        setPhase("error");
        return;
      }

      // 2) Backend health
      const backendOk = await pingBackend();
      if (!backendOk) {
        setError({ code: "backend_offline" });
        setPhase("error");
        return;
      }

      // 3) Supabase health
      const supabaseOk = await pingSupabase();
      if (!supabaseOk) {
        setError({ code: "supabase_offline" });
        setPhase("error");
        return;
      }

      // 4) Supabase session
      const session = await getSupabaseSession();
      if (session.exists === false) {
        // Pa gen sesyon → guest flow
        track("splash_session_missing");
        setPhase("ready");
        return;
      }

      // 5) Refresh token
      try {
        await refreshSupabaseToken();
      } catch {
        setError({ code: "session_expired" });
        setPhase("error");
        return;
      }

      // 6) Profile
      const profile = await loadCurrentProfile();

      // 7) Permissions
      await checkPermissions();

      // 8) Notifications (asynchrone, pa bloke nav)
      void checkNotifications();

      // Decide destination selon session / role / onboarding
      const role = session.role ?? "worker";
      const onboardingCompleted = profile.onboardingCompleted ?? false;

      let destination = "/dashboard";

      if (!session.exists) {
        destination = "/login";
      } else if (!onboardingCompleted) {
        destination = "/onboarding";
      } else {
        if (role === "admin")    destination = "/admin";
        if (role === "employer") destination = "/employer";
        if (role === "worker")   destination = "/dashboard";
      }

      track("splash_navigate", { destination, role, onboardingCompleted });
      navigate(destination, { replace: true });
    } catch {
      setError({ code: "unknown" });
      setPhase("error");
    }
  };

  // Lañse flow la chak fwa nou antre nan "checking"
  useEffect(() => {
    if (phase === "checking") {
      runSessionFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleRetry = () => {
    track("splash_retry_clicked", { errorCode: error?.code });
    runSessionFlow();
  };

  // ---- RENDER SECTIONS -----------------------------------------------------

  // 1) LANGUAGE PICKER
  if (!langPicked || phase === "language") {
    return (
      <main
        className="splash-root relative min-h-[100dvh] w-full bg-[#050B18] text-white overflow-hidden flex flex-col items-center justify-center px-6 py-10 select-none"
        aria-labelledby="splash-language-title"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[120px] z-0" />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
          <div
            className="text-center splash-text-reveal"
            aria-label={t("splash.brand_aria")}
          >
            <h1 className="text-4xl font-black tracking-tight mb-1">
              <span className="text-yellow-400">JOB</span>
              <span className="text-white">FAST</span>
            </h1>
          </div>

          <section
            className="w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl"
            aria-labelledby="splash-language-title"
          >
            <header className="px-5 pt-5 pb-3 text-center border-b border-white/10">
              <p
                id="splash-language-title"
                className="text-white font-bold text-base"
              >
                {t("splash.language.title")}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {t("splash.language.subtitle")}
              </p>
            </header>

            <div
              role="radiogroup"
              aria-label={t("splash.language.aria_group")}
            >
              {LANGUAGES.map((lang) => {
                const isActive = lang.code === currentLang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={t(`languages.${lang.code}.aria_label`, {
                      defaultValue: lang.name,
                    })}
                    onClick={() => handlePick(lang.code)}
                    disabled={selecting}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-all border-b border-white/5 last:border-0
                      ${isActive
                        ? "bg-yellow-400/15 text-yellow-300"
                        : "text-white hover:bg-white/8 active:bg-white/15"
                      }
                      disabled:opacity-60`}
                  >
                    <div className="flex flex-col text-left">
                      <p className="font-bold text-sm">
                        {t(`languages.${lang.code}.native`, {
                          defaultValue: lang.native,
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t(`languages.${lang.code}.name`, {
                          defaultValue: lang.name,
                        })}
                      </p>
                    </div>
                    {isActive && (
                      <span className="ml-auto text-yellow-400 text-lg">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            onClick={handleSkipLanguage}
            disabled={selecting}
            className="text-slate-500 text-sm hover:text-slate-300 transition disabled:opacity-60"
          >
            {selecting ? t("common.loading") : t("splash.language.skip")}
          </button>
        </div>
      </main>
    );
  }

  // 2) ERROR STATE (offline, backend, supabase, session, timeout)
  if (phase === "error" && error) {
    const errorKey = `splash.errors.${error.code}`;
    return (
      <main className="splash-root relative min-h-[100dvh] w-full bg-[#050B18] text-white overflow-hidden flex flex-col items-center justify-center px-6 py-10 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#150b1e] via-[#050B18] to-[#02060F] z-0" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-red-500/15 blur-[120px] z-0" />

        <section className="relative z-10 max-w-sm w-full text-center space-y-4">
          <h1 className="text-2xl font-bold" aria-live="assertive">
            {t(`${errorKey}.title`, { defaultValue: t("splash.errors.fallback_title") })}
          </h1>
          <p className="text-sm text-slate-300">
            {t(`${errorKey}.message`, { defaultValue: t("splash.errors.fallback_message") })}
          </p>

          {error.code === "offline" && (
            <p className="text-xs text-slate-400 mt-1">
              {t("splash.errors.offline_hint")}
            </p>
          )}

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 w-full py-3 rounded-2xl bg-yellow-400 text-[#041126] text-sm font-extrabold shadow-xl hover:bg-yellow-500 active:scale-98 transition"
          >
            {t("splash.retry")}
          </button>
        </section>
      </main>
    );
  }

  // 3) CHECKING / LOADING STATE (session flow)
  if (phase === "checking") {
    return (
      <main className="splash-root relative min-h-[100dvh] w-full bg-[#050B18] text-white overflow-hidden flex flex-col items-center justify-center px-6 py-10 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[120px] z-0" />

        <section className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <img
            src="/brand/logo/jobfast-logo.svg"
            alt={t("splash.logo_alt")}
            className="splash-logo"
            loading="eager"
          />
          <p className="mt-6 text-sm text-slate-300">
            {t("splash.loading_main")}
          </p>

          <div className="mt-6 w-full flex flex-col gap-2">
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-yellow-400 splash-bar-inner" />
            </div>
            {isSlow && (
              <p className="text-xs text-slate-400">
                {t("splash.loading_details")}
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // 4) MAIN SPLASH UI (guest, no auto-redirect yet)
  return (
    <main
      className="splash-root relative min-h-[100dvh] w-full bg-[#050B18] text-white overflow-hidden flex flex-col justify-between items-center px-6 py-10 select-none"
      aria-labelledby="splash-main-title"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#081225] via-[#050B18] to-[#02060F] z-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[100px] z-0" />

      {/* TOP BAR — language switcher */}
      <div className="relative z-20 w-full flex justify-end">
        <nav
          aria-label={t("splash.language.switcher_aria")}
          className="flex items-center gap-1 bg-white/10 rounded-xl p-1 backdrop-blur-sm"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handlePick(lang.code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? "bg-yellow-400 text-[#041126] shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
                aria-label={t(`languages.${lang.code}.aria_label`, {
                  defaultValue: lang.name,
                })}
                aria-pressed={isActive}
              >
                {t(`languages.${lang.code}.short`, {
                  defaultValue: lang.code.toUpperCase(),
                })}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CENTER */}
      <section className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
        <div className="mb-6 flex items-center justify-center">
          <img
            src="/brand/logo/jobfast-logo.svg"
            alt={t("splash.logo_alt")}
            className="splash-logo-hero drop-shadow-[0_15px_35px_rgba(234,179,8,0.40)]"
            loading="eager"
          />
        </div>

        <h1
          id="splash-main-title"
          className="text-6xl md:text-7xl font-black tracking-tight"
        >
          <span className="text-yellow-400">JOB</span>
          <span className="text-white">FAST</span>
        </h1>

        <p className="mt-5 max-w-[280px] text-lg md:text-xl font-medium leading-relaxed text-slate-300 whitespace-pre-line">
          {t("splash.slogan")}
        </p>
      </section>

      {/* BOTTOM ACTIONS */}
      <section className="relative z-10 w-full max-w-sm flex flex-col gap-4 mt-auto">
        <button
          type="button"
          onClick={() => {
            track("splash_start_clicked");
            navigate("/onboarding");
          }}
          className="relative w-full py-4 rounded-2xl bg-yellow-400 text-[#041126] text-lg font-extrabold shadow-xl hover:bg-yellow-500 active:scale-98 transition overflow-hidden"
        >
          <span className="relative z-10">{t("splash.start")}</span>
          <span className="pointer-events-none absolute inset-0 bg-white/20 opacity-0 hover:opacity-40 transition-opacity" />
        </button>

        <button
          type="button"
          onClick={() => {
            track("splash_login_clicked");
            navigate("/login");
          }}
          className="w-full py-2 text-lg font-semibold text-white transition duration-150 hover:text-yellow-400"
        >
          {t("splash.login")}
        </button>

        <button
          type="button"
          onClick={() => {
            track("splash_register_clicked");
            navigate("/register");
          }}
          className="w-full py-1 text-base font-medium text-slate-400 transition duration-150 hover:text-white"
        >
          {t("splash.register")}
        </button>
      </section>
    </main>
  );
}

export default memo(SplashScreen);