import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import {
  getAllCategoryConfigs,
  isMarketplaceProvider,
} from "../config/marketplaceConfig";

const HERO_VIDEO_SRC_1080 = "/assets/video/hero-jobfast-1080p.mp4";
const HERO_VIDEO_SRC_720  = "/assets/video/hero-jobfast-720p.mp4";
const HERO_VIDEO_SRC_480  = "/assets/video/hero-jobfast-480p.mp4";
const HERO_IMAGE_DEFAULT  = "/assets/hero/default-4k.webp";
const HERO_IMAGE_BLUR     = "/assets/hero/default-blur.jpg";
const SOCKET_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryConfig {
  role: string;
  label: string;
  icon: string;
  heroImage?: string;
  heroBlur?: string;
}

interface CategoryStats {
  rating?: number;
  distance?: string;
  avgPrice?: string;
  listings?: number;
  reviews?: number;
  online?: number;
  openNow?: boolean;
}

interface LiveData {
  workersOnline: number;
  jobsLive: number;
  ordersLive: number;
  taxisAvailable: number;
}

interface StoryItem {
  id: string;
  title: string;
  image: string;
  blur: string;
  liveWorker?: { name: string; distance: string; rating: string | number };
}

interface HeroMetric { label: string; value: number }

// ─── Error boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean }
interface ErrorBoundaryProps { children: React.ReactNode }

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("HomeMarketplace error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-bold">Something went wrong.</p>
            <p className="text-[11px] text-slate-400">Please refresh or try again later.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Progressive image ────────────────────────────────────────────────────────

interface ProgressiveImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
}

const ProgressiveImage = memo(function ProgressiveImage({
  src,
  placeholder,
  alt,
  className,
}: ProgressiveImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const img = new Image();
    img.src = src;
    img.onload = () => { setImageSrc(src); setLoaded(true); };
    img.onerror = () => setFailed(true);
  }, [src]);

  if (failed) return null;

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-70 blur-sm"}`}
    />
  );
});

// ─── Animated counter ─────────────────────────────────────────────────────────

interface AnimatedCounterProps { value: number; prefix?: string; suffix?: string }

function AnimatedCounter({ value, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const themeProfiles: Record<string, string> = {
  auto:     "bg-[#020617]",
  dark:     "bg-[#020617]",
  light:    "bg-slate-50",
  material: "bg-gradient-to-br from-sky-900 via-slate-900 to-black",
  glass:    "bg-[#020617]/80 backdrop-blur-3xl",
  luxury:   "bg-gradient-to-br from-amber-900 via-slate-900 to-black",
};

function useAutoTheme(userPreference: string | undefined): string {
  const [theme, setTheme] = useState("auto");
  useEffect(() => {
    if (userPreference && userPreference !== "auto") { setTheme(userPreference); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [userPreference]);
  return themeProfiles[theme] ?? themeProfiles['dark']!;
}

// ─── Security + finance hooks (skeleton) ─────────────────────────────────────

function useSecurityHardening(): void {
  useEffect(() => {
    // Fingerprint/passkey/session rotation/jailbreak detection — needs native/SDK integration.
  }, []);
}

interface MarketplaceFinanceFlags {
  auctionEnabled: boolean; biddingEnabled: boolean; escrowEnabled: boolean;
  insuranceEnabled: boolean; refundEnabled: boolean; subscriptionEnabled: boolean;
  couponsEnabled: boolean; promoEnabled: boolean; loyaltyEnabled: boolean; membershipEnabled: boolean;
}

function useMarketplaceFinance(): MarketplaceFinanceFlags {
  return {
    auctionEnabled: true, biddingEnabled: true, escrowEnabled: true,
    insuranceEnabled: true, refundEnabled: true, subscriptionEnabled: true,
    couponsEnabled: true, promoEnabled: true, loyaltyEnabled: true, membershipEnabled: true,
  };
}

// ─── Category card ────────────────────────────────────────────────────────────

interface CategoryCardProps { config: CategoryConfig; stats: CategoryStats | null; onClick: () => void }

const categoryThemeColors: Record<string, string> = {
  hotel: "from-blue-500/40", restaurant: "from-orange-500/40", taxi: "from-yellow-500/40",
  hospital: "from-green-500/40", construction: "from-amber-700/40", default: "from-sky-500/40",
};

const CategoryCard = memo(function CategoryCard({ config, stats, onClick }: CategoryCardProps) {
  const hasImage = Boolean(config.heroImage);
  const imageSrc = config.heroImage ?? `/assets/categories/${config.role}-4k.webp`;
  const blurSrc  = config.heroBlur  ?? `/assets/categories/${config.role}-blur.jpg`;
  const glow = categoryThemeColors[config.role] ?? categoryThemeColors['default']!;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      aria-label={config.label}
    >
      <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${glow}`} />
      <div className="relative h-28">
        {hasImage ? (
          <ProgressiveImage src={imageSrc} placeholder={blurSrc} alt={config.label} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-5xl drop-shadow-lg" aria-hidden="true">{config.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
        {stats?.rating != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] text-yellow-300">
            ★ {stats.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{config.icon}</span>
            <div>
              <h3 className="font-bold text-sm text-white">{config.label}</h3>
              <p className="text-[10px] text-slate-400">{stats?.distance ?? ""}</p>
            </div>
          </div>
          {stats?.avgPrice != null && (
            <span className="text-[10px] text-amber-300">From {stats.avgPrice}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-[9px] text-slate-300 mt-1">
          {stats?.listings != null && <span>{stats.listings} Listings</span>}
          {stats?.reviews  != null && <span>{stats.reviews} Reviews</span>}
          {stats?.online   != null && <span>{stats.online} Online</span>}
          {stats?.openNow && <span className="text-emerald-300">OPEN NOW</span>}
        </div>
      </div>
    </motion.button>
  );
});

// ─── Live ticker ──────────────────────────────────────────────────────────────

interface LiveTickerProps { items: string[] }

const LiveTicker = memo(function LiveTicker({ items }: LiveTickerProps) {
  return (
    <motion.div
      className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-black/40"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      aria-live="polite"
    >
      <motion.div
        className="flex whitespace-nowrap text-[10px] text-slate-200 px-3 py-2"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      >
        {items.concat(items).map((item, i) => (
          <span key={i} className="mr-6 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {item}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
});

// ─── Bottom nav ───────────────────────────────────────────────────────────────

interface BottomNavProps { active: string; onChange?: (id: string) => void }

const BottomNav = memo(function BottomNav({ active, onChange }: BottomNavProps) {
  const items = [
    { id: "home",          icon: "🏠", label: "Home"     },
    { id: "search",        icon: "🔎", label: "Search"   },
    { id: "favorites",     icon: "❤️", label: "Favorites"},
    { id: "chat",          icon: "💬", label: "Chat"     },
    { id: "notifications", icon: "🔔", label: "Alerts"   },
    { id: "profile",       icon: "👤", label: "Profile"  },
  ];

  return (
    <motion.nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-5xl rounded-t-3xl bg-[#020617] border-t border-slate-800 shadow-[0_-10px_30px_rgba(15,23,42,0.9)] backdrop-blur-xl"
      initial={{ y: 40 }}
      animate={{ y: 0 }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-0.5 text-[10px]"
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <motion.span
                className={`text-base ${isActive ? "text-amber-400" : "text-slate-400"}`}
                animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.25 }}
              >
                {item.icon}
              </motion.span>
              <span className={isActive ? "text-amber-300" : "text-slate-500"}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
});

// ─── AI assistant ─────────────────────────────────────────────────────────────

const AIAssistant = memo(function AIAssistant({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 right-5 z-40 h-10 w-10 rounded-full bg-slate-900/90 border border-emerald-400/60 flex items-center justify-center text-lg text-emerald-300 shadow-[0_12px_30px_rgba(15,23,42,0.9)]"
      aria-label="Open AI Concierge"
    >
      🤖
    </motion.button>
  );
});

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  user: Record<string, unknown> | null;
  onRunQuery: (q: string) => void;
}

function AIAssistantPanel({ open, onClose, user, onRunQuery }: AIAssistantPanelProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onRunQuery(prompt.trim());
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl bg-[#020617] border border-slate-800 p-4"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal={true}
            aria-label="AI Concierge"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-300">
                AI Concierge – {t("marketplace.ai.hello", { name: (user?.['name'] as string | undefined) ?? "Guest" })}
              </p>
              <button type="button" onClick={onClose} className="text-[11px] text-slate-400" aria-label="Close AI Concierge">✕</button>
            </div>
            <p className="text-[11px] text-slate-200 mb-2">Egzanp: "Mwen bezwen yon hotel bò plaj".</p>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-xl bg-[#0F172A] border border-slate-700 px-3 py-2 text-[11px] text-slate-100 outline-none"
              placeholder="Di AI Concierge sa w bezwen..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={handleSubmit} className="px-3 py-2 rounded-xl bg-emerald-500 text-[11px] font-bold text-slate-950">
                Rechèch
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Premium hero ─────────────────────────────────────────────────────────────

interface PremiumHeroProps { roleLabel: string; metrics: HeroMetric[]; persona?: string | undefined }

function PremiumHero({ roleLabel, persona }: PremiumHeroProps) {
  const { t } = useTranslation();
  const [videoError, setVideoError] = useState(false);
  const [videoSrc, setVideoSrc] = useState(HERO_VIDEO_SRC_1080);

  useEffect(() => {
    const width = window.innerWidth;
    const img = new Image();
    img.src = "/assets/network-test.jpg";
    const start = performance.now();
    img.onload = () => {
      const duration = performance.now() - start;
      if (duration > 1500)    setVideoSrc(HERO_VIDEO_SRC_480);
      else if (width <= 768)  setVideoSrc(HERO_VIDEO_SRC_720);
      else                    setVideoSrc(HERO_VIDEO_SRC_1080);
    };
    img.onerror = () => setVideoError(true);
  }, []);

  const cards = [
    { icon: "🏨", label: "Hotels" }, { icon: "🍽", label: "Restaurants" },
    { icon: "🚕", label: "Taxi" },   { icon: "🏥", label: "Hospital" },
    { icon: "✈️", label: "Airport" },{ icon: "🛍️", label: "Shopping" },
  ];

  const heroThemeBg =
    roleLabel === "hotel"        ? "bg-gradient-to-br from-blue-900 via-slate-900 to-black"
    : roleLabel === "restaurant" ? "bg-gradient-to-br from-orange-900 via-slate-900 to-black"
    : roleLabel === "taxi"       ? "bg-gradient-to-br from-yellow-700 via-slate-900 to-black"
    : roleLabel === "hospital"   ? "bg-gradient-to-br from-green-900 via-slate-900 to-black"
    : roleLabel === "construction" ? "bg-gradient-to-br from-amber-900 via-slate-900 to-black"
    : "bg-[#020617]";

  return (
    <motion.header
      className={`relative overflow-hidden rounded-3xl border border-slate-800 ${heroThemeBg} px-5 pt-6 pb-6 mb-6`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 24 }}
    >
      <div className="pointer-events-none absolute inset-0">
        {!videoError ? (
          <video className="h-full w-full object-cover opacity-60" src={videoSrc} autoPlay muted loop playsInline onError={() => setVideoError(true)} />
        ) : (
          <ProgressiveImage src={HERO_IMAGE_DEFAULT} placeholder={HERO_IMAGE_BLUR} alt="JOBFAST hero" className="h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.5),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.4),_transparent_55%)] mix-blend-soft-light" />
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -top-10 left-10 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" animate={{ x: [0, 20, -10, 0], y: [0, -10, 20, 0] }} transition={{ duration: 14, repeat: Infinity }} />
        <motion.div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" animate={{ x: [0, -15, 10, 0], y: [0, 15, -20, 0] }} transition={{ duration: 18, repeat: Infinity }} />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1">
              <span aria-hidden="true">👋</span>
              {t("marketplace.hero.greeting", { name: "Guest" })}
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-white">{t("marketplace.hero.title")}</h1>
            <p className="mt-1 max-w-xs text-[11px] text-slate-400">
              {persona === "construction"
                ? t("marketplace.hero.subtitleConstruction")
                : persona === "tourist"
                ? t("marketplace.hero.subtitleTourist")
                : t("marketplace.hero.subtitle")}
            </p>
          </div>
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-fuchsia-500 to-sky-500 text-3xl shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
            🌀
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          {["+ Create Job", "+ Create Service", "+ Sell", "+ Rent", "+ Book", "+ Taxi", "+ Delivery", "+ Event"].map((label) => (
            <motion.button key={label} type="button" whileTap={{ scale: 0.95 }} className="rounded-xl bg-black/40 px-3 py-1.5 text-slate-200 border border-slate-700/60 hover:border-amber-400/60 hover:text-amber-300">
              {label}
            </motion.button>
          ))}
        </div>

        <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          {[
            { label: "Revenue",        value: 2300000, prefix: "$" },
            { label: "Workers Online", value: 450,     suffix: ""  },
            { label: "Countries",      value: 18,      suffix: ""  },
            { label: "Reviews",        value: 128000,  suffix: ""  },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-black/45 px-3 py-2 border border-slate-800/70 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">
                  <AnimatedCounter value={item.value} prefix={item.prefix ?? ""} suffix={item.suffix ?? ""} />
                </div>
                <p className="text-[9px] text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              className="flex-shrink-0 w-24 h-28 rounded-2xl bg-slate-900/80 border border-slate-700/70 shadow-[0_12px_32px_rgba(15,23,42,0.95)] flex flex-col items-center justify-center text-[11px] text-slate-200 backdrop-blur-3xl"
              animate={{ y: [0, i % 2 === 0 ? -6 : 6, 0] }}
              transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-xl mb-1" aria-hidden="true">{card.icon}</span>
              <span>{card.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.header>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

interface SearchChangeEvent { query: string }

interface MarketplaceSearchBarProps {
  value: string;
  onChange?: (e: SearchChangeEvent) => void;
  onVoice?: () => void;
  onAISearch?: () => void;
  onImageSearch?: () => void;
  onQRSearch?: () => void;
}

function MarketplaceSearchBar({ value, onChange, onVoice, onAISearch, onImageSearch, onQRSearch }: MarketplaceSearchBarProps) {
  const { t } = useTranslation();
  const [localQuery, setLocalQuery] = useState(value || "");

  useEffect(() => { setLocalQuery(value || ""); }, [value]);

  useEffect(() => {
    const id = setTimeout(() => { onChange?.({ query: localQuery }); }, 300);
    return () => clearTimeout(id);
  }, [localQuery, onChange]);

  return (
    <motion.div
      className="mb-4 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-3 shadow-[0_20px_50px_rgba(15,23,42,0.95)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      role="search"
      aria-label="Marketplace search"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mb-2">
        <button className="flex items-center gap-1 rounded-2xl bg-[#111827] px-3 py-2 text-slate-200"><span aria-hidden="true">🔍</span> {t("marketplace.search.search")}</button>
        <button className="flex items-center gap-1 rounded-2xl bg-[#111827] px-3 py-2 text-slate-200"><span aria-hidden="true">📍</span> {t("marketplace.search.where")}</button>
        <button className="flex items-center gap-1 rounded-2xl bg-[#111827] px-3 py-2 text-slate-200"><span aria-hidden="true">📅</span> {t("marketplace.search.date")}</button>
        <button className="flex items-center gap-1 rounded-2xl bg-[#111827] px-3 py-2 text-slate-200"><span aria-hidden="true">👥</span> {t("marketplace.search.people")}</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={t("marketplace.search.placeholder")}
          className="flex-1 rounded-2xl bg-[#020617] border border-slate-700 px-3 py-2 text-[11px] text-slate-100 outline-none focus:border-amber-400"
          aria-label="Search marketplace"
        />
        <button type="button" aria-label={t("marketplace.search.budget")} className="rounded-2xl bg-[#111827] px-3 py-2 text-[11px] text-slate-200">💰</button>
        <button type="button" aria-label={t("marketplace.search.rating")} className="rounded-2xl bg-[#111827] px-3 py-2 text-[11px] text-slate-200">⭐</button>
        <button type="button" aria-label={t("marketplace.search.voice")} onClick={onVoice} className="rounded-2xl bg-[#111827] px-3 py-2 text-[11px] text-slate-200">🎙</button>
        <button type="button" aria-label="Image search" onClick={onImageSearch} className="rounded-2xl bg-[#111827] px-3 py-2 text-[11px] text-slate-200">📷</button>
        <button type="button" aria-label="QR search" onClick={onQRSearch} className="rounded-2xl bg-[#111827] px-3 py-2 text-[11px] text-slate-200">🔳</button>
        <button type="button" aria-label={t("marketplace.search.ai")} onClick={onAISearch} className="rounded-2xl bg-amber-500 px-3 py-2 text-[11px] font-bold text-slate-950">🤖 AI</button>
      </div>
    </motion.div>
  );
}

// ─── Map preview ──────────────────────────────────────────────────────────────

function MapPreview() {
  return (
    <motion.div
      className="mt-4 h-56 rounded-2xl border border-slate-800 bg-[#0F172A] overflow-hidden relative"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Map preview"
    >
      <div id="jobfast-map-container" className="w-full h-full" />
      <p className="absolute top-2 left-3 text-[10px] font-bold text-slate-300">Google Maps (live tracking, traffic, ETA)</p>
      <p className="absolute bottom-2 left-3 text-[9px] text-slate-400">Street View, cluster markers, heatmap, offline tiles, navigation, etc.</p>
    </motion.div>
  );
}

// ─── Featured banner ──────────────────────────────────────────────────────────

function FeaturedBanner() {
  return (
    <motion.div
      className="mt-5 rounded-3xl border border-amber-500/50 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#020617] p-4 shadow-[0_22px_60px_rgba(15,23,42,0.95)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl overflow-hidden border border-amber-400/60">
          <ProgressiveImage src="/assets/featured/hotel-puntacana-4k.webp" placeholder="/assets/featured/hotel-puntacana-blur.jpg" alt="Best Hotel in Punta Cana" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-yellow-300">★★★★★</p>
          <p className="text-[11px] font-bold text-white">Best Hotel in Punta Cana</p>
          <p className="text-[9px] text-slate-400">Book Now</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Live marketplace strip ───────────────────────────────────────────────────

function LiveMarketplaceStrip({ live }: { live: LiveData }) {
  const { t } = useTranslation();
  const items = [
    { label: t("marketplace.live.workers"), value: live.workersOnline },
    { label: t("marketplace.live.jobs"),    value: live.jobsLive      },
    { label: t("marketplace.live.orders"),  value: live.ordersLive    },
    { label: t("marketplace.live.taxis"),   value: live.taxisAvailable},
  ];

  return (
    <motion.div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-900/20 px-4 py-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold text-emerald-300">LIVE MARKETPLACE</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-200">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-1.5">
            <span>{item.label}</span>
            <span className="text-emerald-300 font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Story strip ──────────────────────────────────────────────────────────────

const StoryStrip = memo(function StoryStrip({ stories }: { stories: StoryItem[] }) {
  if (!stories.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Stories</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stories.map((story) => (
          <motion.button
            key={story.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-24 h-32 rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden text-left"
          >
            <ProgressiveImage src={story.image} placeholder={story.blur} alt={story.title} className="h-3/5 w-full object-cover" />
            <div className="px-2 py-1">
              <p className="text-[9px] font-bold text-white truncate">{story.title}</p>
              {story.liveWorker && (
                <p className="text-[8px] text-slate-300 mt-0.5">
                  👷 {story.liveWorker.name} – {story.liveWorker.distance} · {story.liveWorker.rating}★
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_LIVE: LiveData = { workersOnline: 1247, jobsLive: 894, ordersLive: 312, taxisAvailable: 67 };

const DEMO_STORIES: StoryItem[] = [
  { id: "s1", title: "Plombier disponib",  image: "/assets/stories/plombier.webp",  blur: "/assets/stories/plombier-blur.jpg"  },
  { id: "s2", title: "Chef kwizin",        image: "/assets/stories/chef.webp",      blur: "/assets/stories/chef-blur.jpg"      },
  { id: "s3", title: "Sekretè bilingèl",   image: "/assets/stories/secretary.webp", blur: "/assets/stories/secretary-blur.jpg" },
];

const DEMO_METRICS: HeroMetric[] = [
  { label: "Workers online", value: 1247 },
  { label: "Jobs live",      value: 894  },
  { label: "Countries",      value: 12   },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomeMarketplace() {
  const { user } = useAuth();
  const { t }    = useTranslation();
  const navigate  = useNavigate();
  const u = user as Record<string, unknown> | null;

  const theme = useAutoTheme(u?.['themePreference'] as string | undefined);
  useSecurityHardening();
  useMarketplaceFinance();

  const [activeTab,    setActiveTab]    = useState("home");
  const [live,         setLive]         = useState<LiveData>(DEMO_LIVE);
  const [stories]                       = useState<StoryItem[]>(DEMO_STORIES);
  const [aiOpen,       setAiOpen]       = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const categories = useMemo(() => getAllCategoryConfigs() as CategoryConfig[], []);
  const isProvider = useMemo(
    () => isMarketplaceProvider((u?.['role'] as string) ?? ''),
    [u]
  );

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"], reconnection: true });
    socket.on("marketplace:live", (data: Record<string, unknown>) => {
      setLive(prev => ({ ...prev, ...(data as Partial<LiveData>) }));
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleCategoryPress = useCallback(
    (config: CategoryConfig) => navigate(`/marketplace/${config.role}`),
    [navigate]
  );

  const handleSearchChange = useCallback(
    (e: SearchChangeEvent) => setSearchQuery(e.query),
    []
  );

  const roleLabel = u?.['role']
    ? t(`roles.${u['role'] as string}`, u['role'] as string)
    : t("roles.guest", "Guest");

  return (
    <AppErrorBoundary>
    <div className={`min-h-screen pb-24 ${theme}`} style={{ color: "#fff" }}>
      <PremiumHero roleLabel={roleLabel} metrics={DEMO_METRICS} persona={u?.['persona'] as string | undefined} />

      <div className="px-4 max-w-2xl mx-auto">
        <MarketplaceSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onVoice={() => {}}
          onAISearch={() => setAiOpen(true)}
          onImageSearch={() => {}}
          onQRSearch={() => {}}
        />

        <LiveMarketplaceStrip live={live} />
        <StoryStrip stories={stories} />

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((config) => (
            <CategoryCard key={config.role} config={config} stats={null} onClick={() => handleCategoryPress(config)} />
          ))}
        </div>

        <MapPreview />
        <FeaturedBanner />

        {isProvider && (
          <LiveTicker items={[
            `${t("finance.auction", "Auction")}: Active`,
            `${t("finance.escrow", "Escrow")}: Enabled`,
            `${t("finance.loyalty", "Loyalty")}: 12pts`,
          ]} />
        )}
      </div>

      <AIAssistant onOpen={() => setAiOpen(true)} />
      <AIAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        user={u}
        onRunQuery={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
      />

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
    </AppErrorBoundary>
  );
}