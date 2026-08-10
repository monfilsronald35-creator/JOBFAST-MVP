/**
 * CategoryMarketplace — Enterprise Page Wrapper v3.1
 * Route: /marketplace/:categoryId
 */

import React, { useEffect, useCallback, memo, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import MarketplaceCore from "../components/marketplace/MarketplaceCore";
import { getMarketplaceConfig, MarketplaceRoleConfig } from "../config/marketplaceConfig";
import { useQueryClient } from "@tanstack/react-query";
import { MediaQuery } from "react-responsive";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import { useFirebaseMessaging } from "../hooks/useFirebaseMessaging";
import { aiSearchClient } from "../services/aiSearchClient";
import { userContextClient } from "../services/userContextClient";
import { securityClient } from "../services/securityClient";
import { analyticsClient } from "../services/analyticsClient";
import { offlineClient } from "../services/offlineClient";
import { loadPluginManifests } from "../services/pluginRegistry";

// ---- TYPES -----------------------------------------------------------------

interface AIContextMetrics {
  aiRevenue?:      string | number;
  aiForecast?:     string | number;
  orders?:         string | number;
  drivers?:        string | number;
  workersOnline?:  string | number;
  hotels?:         string | number;
  flights?:        string | number;
  restaurants?:    string | number;
  emergency?:      string | number;
  crypto?:         string | number;
  fx?:             string | number;
  liveUsers?:      string | number;
  serverHealth?:   string;
  apiHealth?:      string;
  fraudAlerts?:    number;
  securityAlerts?: number;
}

interface AIContextData {
  metrics?:  AIContextMetrics;
  weather?:  { summary: string };
  traffic?:  { status: string };
  wallet?:   { balance: string | number };
  language?: string;
  currency?: string;
  [key: string]: unknown;
}


interface AnalyticsPayload {
  categoryId?: string;
  listingId?:  string;
  [key: string]: unknown;
}

interface PluginManifest {
  id:   string;
  name: string;
  [key: string]: unknown;
}

interface DashboardTileData {
  icon:  string;
  label: string;
  value: string | number;
}

// ---- FEATURE FLAGS ---------------------------------------------------------

const CATEGORY_FEATURE_FLAGS = Object.freeze({
  SHARE:          false,
  BREADCRUMBS:    true,
  AI_GLOBAL_DASH: true,
});

// ---- PAYMENT PROVIDERS -----------------------------------------------------

const PAYMENT_PROVIDERS: string[] = [
  "visa", "mastercard", "paypal", "apple_pay", "google_pay",
  "stripe", "usdt", "btc", "eth", "moncash", "natcash",
];

// ---- ANALYTICS EVENTS ------------------------------------------------------

const analyticsEvents = {
  listingView:   (payload: AnalyticsPayload) => analyticsClient.trackEvent("listing_view",   payload),
  search:        (payload: AnalyticsPayload) => analyticsClient.trackEvent("search",          payload),
  filter:        (payload: AnalyticsPayload) => analyticsClient.trackEvent("filter",          payload),
  mapOpen:       (payload: AnalyticsPayload) => analyticsClient.trackEvent("map_open",        payload),
  call:          (payload: AnalyticsPayload) => analyticsClient.trackEvent("call",            payload),
  chat:          (payload: AnalyticsPayload) => analyticsClient.trackEvent("chat",            payload),
  booking:       (payload: AnalyticsPayload) => analyticsClient.trackEvent("booking",         payload),
  payment:       (payload: AnalyticsPayload) => analyticsClient.trackEvent("payment",         payload),
  cancel:        (payload: AnalyticsPayload) => analyticsClient.trackEvent("cancel",          payload),
  favorite:      (payload: AnalyticsPayload) => analyticsClient.trackEvent("favorite",        payload),
  review:        (payload: AnalyticsPayload) => analyticsClient.trackEvent("review",          payload),
  conversion:    (payload: AnalyticsPayload) => analyticsClient.trackEvent("conversion",      payload),
  revenue:       (payload: AnalyticsPayload) => analyticsClient.trackEvent("revenue",         payload),
  retention:     (payload: AnalyticsPayload) => analyticsClient.trackEvent("retention",       payload),
  sessionLength: (payload: AnalyticsPayload) => analyticsClient.trackEvent("session_length",  payload),
  heatmap:       (payload: AnalyticsPayload) => analyticsClient.trackEvent("heatmap",         payload),
  aiPrediction:  (payload: AnalyticsPayload) => analyticsClient.trackEvent("ai_prediction",   payload),
};

// ---- UTILITIES -------------------------------------------------------------

function sanitizeCategoryId(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[^a-z0-9_]/gi, "").slice(0, 64);
}

async function shareCategoryUrl(categoryId: string, title: string): Promise<boolean> {
  const url = `${window.location.origin}/marketplace/${categoryId}`;
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    return true;
  } catch {
    return false;
  }
}

// ---- HOOKS -----------------------------------------------------------------

function useAIContext(safeId: string): { aiContext: AIContextData | null; aiContextLoading: boolean } {
  const [context, setContext] = useState<AIContextData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadContext() {
      try {
        setLoading(true);
        const base = await (userContextClient.getContextForMarketplace as (p: { categoryId: string }) => Promise<AIContextData>)({ categoryId: safeId });
        if (!cancelled) setContext(base);
      } catch (e) {
        console.error("AI Context load failed", e);
        if (!cancelled) setContext(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadContext();
    return () => { cancelled = true; };
  }, [safeId]);

  return { aiContext: context, aiContextLoading: loading };
}

function usePerformanceMonitor(categoryId: string): void {
  useEffect(() => {
    performance.mark(`marketplace-start-${categoryId}`);
    return () => {
      performance.mark(`marketplace-end-${categoryId}`);
      performance.measure(
        `marketplace-${categoryId}`,
        `marketplace-start-${categoryId}`,
        `marketplace-end-${categoryId}`,
      );
      (analyticsClient.trackPerformanceMeasure as (key: string) => void)(`marketplace-${categoryId}`);
    };
  }, [categoryId]);
}

function useSmartPrefetch(): { prefetchListing: (listingId: string) => Promise<void> } {
  const queryClient = useQueryClient();

  const prefetchListing = useCallback(async (listingId: string) => {
    if (!listingId) return;
    const baseKey = ["listing", listingId];
    const oc = offlineClient as Record<string, (id: string) => Promise<unknown>>;
    await Promise.all([
      queryClient.prefetchQuery({ queryKey: [...baseKey, "details"],      queryFn: () => oc["fetchListingDetails"]!(listingId) }),
      queryClient.prefetchQuery({ queryKey: [...baseKey, "reviews"],      queryFn: () => oc["fetchListingReviews"]!(listingId) }),
      queryClient.prefetchQuery({ queryKey: [...baseKey, "availability"], queryFn: () => oc["fetchListingAvailability"]!(listingId) }),
      queryClient.prefetchQuery({ queryKey: [...baseKey, "map"],          queryFn: () => oc["fetchListingMapData"]!(listingId) }),
      queryClient.prefetchQuery({ queryKey: [...baseKey, "photos"],       queryFn: () => oc["fetchListingPhotos"]!(listingId) }),
      queryClient.prefetchQuery({ queryKey: [...baseKey, "owner"],        queryFn: () => oc["fetchListingOwnerProfile"]!(listingId) }),
    ]);
  }, [queryClient]);

  return { prefetchListing };
}

function useEnterpriseSecurity(): void {
  useEffect(() => {
    let cancelled = false;
    async function initSecurity() {
      try {
        const sc = securityClient as Record<string, () => Promise<void> | boolean | void>;
        await (sc["registerDeviceFingerprint"]! as () => Promise<void>)();
        await (sc["ensureRotatingTokens"]!     as () => Promise<void>)();
        await (sc["setupCSRFProtection"]!      as () => Promise<void>)();
        if (!cancelled && (sc["supportsWebAuthn"]! as () => boolean)()) {
          await (sc["bootstrapWebAuthnPasskey"]! as () => Promise<void>)();
        }
        await (sc["syncRiskProfile"]!   as () => Promise<void>)();
        await (sc["syncSessionState"]!  as () => Promise<void>)();
        await (sc["loadCaptchaConfig"]! as () => Promise<void>)();
        await (sc["loadEncryptionPolicies"]! as () => Promise<void>)();
      } catch (e) {
        console.error("Security init failed", e);
      }
    }
    initSecurity();
    return () => { cancelled = true; };
  }, []);
}

function useGlobalOfflineEngine(): void {
  useEffect(() => {
    let cancelled = false;
    async function initOffline() {
      try {
        const oc = offlineClient as Record<string, () => Promise<void>>;
        await oc["initIndexedDB"]!();
        await oc["initQueues"]!();
        await oc["registerBackgroundSync"]!();
        await oc["configureCachePriorities"]!();
        await oc["loadSyncConfig"]!();
      } catch (e) {
        if (!cancelled) console.error("Offline init failed", e);
      }
    }
    initOffline();
    return () => { cancelled = true; };
  }, []);
}

function useLiveCollaboration(categoryId: string): void {
  useEffect(() => {
    const channel = (offlineClient as { openCollaborationChannel: (p: { categoryId: string }) => { close: () => void } })
      .openCollaborationChannel({ categoryId });
    return () => channel.close();
  }, [categoryId]);
}

function useMarketplaceAnalytics(categoryId: string): void {
  useEffect(() => {
    (analyticsClient.trackEvent as (e: string, p: AnalyticsPayload) => void)("category_view", { categoryId });
    (analyticsClient as unknown as { startSessionTimer: (id: string) => void }).startSessionTimer(categoryId);
    return () => {
      (analyticsClient as unknown as { endSessionTimer: (id: string) => void }).endSessionTimer(categoryId);
    };
  }, [categoryId]);
}

function useMarketplacePlugins(safeId: string): PluginManifest[] {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const manifests = await (loadPluginManifests as (p: { categoryId: string }) => Promise<PluginManifest[]>)({ categoryId: safeId });
        if (!cancelled) setPlugins(manifests);
      } catch (e) {
        console.error("Plugin manifests failed", e);
        if (!cancelled) setPlugins([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [safeId]);
  return plugins;
}

interface VoiceResult { text: string; language: string }

function useAIVoiceSearch(onVoiceResult: (r: VoiceResult) => void): { startVoice: () => void } {
  const startVoice = useCallback(() => {
    // NOTE: real impl: browser SpeechRecognition API or native bridge.
    // language = userContext.language (en/es/fr/ht).
    // On final transcript: onVoiceResult({ text, language });
  }, [onVoiceResult]);
  return { startVoice };
}

// ---- NOTIFICATION HUB ------------------------------------------------------

interface NotificationHubProps {
  t: ReturnType<typeof useTranslation>["t"];
}

type ChannelState = Record<string, number>;

function NotificationHub({ t }: NotificationHubProps) {
  const firebase = useFirebaseMessaging() as {
    onMessage: (cb: (msg: { data?: { channel?: string } }) => void) => void;
  };
  const socket = useNotificationSocket() as {
    on: (event: string, cb: (payload: { channel?: string }) => void) => void;
  };

  const [channelState, setChannelState] = useState<ChannelState>({
    jobs: 0, hotels: 0, taxi: 0, flight: 0, delivery: 0,
    construction: 0, marketplace: 0, wallet: 0, promotion: 0, emergency: 0,
  });

  useEffect(() => {
    firebase.onMessage((msg) => {
      const channel = msg.data?.channel;
      if (!channel) return;
      setChannelState((prev) => ({ ...prev, [channel]: (prev[channel] ?? 0) + 1 }));
    });
    socket.on("notification", (payload) => {
      const channel = payload.channel;
      if (!channel) return;
      setChannelState((prev) => ({ ...prev, [channel]: (prev[channel] ?? 0) + 1 }));
    });
  }, [firebase, socket]);

  const channels = Object.keys(channelState);

  return (
    <section
      aria-label={t("marketplace.notifications")}
      className="mt-3 rounded-2xl bg-black/35 border border-slate-800 px-3 py-2"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Notification Center</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px] text-slate-300">
        {channels.map((c) => (
          <div key={c} className="rounded-xl bg-slate-900/70 px-2 py-1 flex items-center justify-between">
            <span>{c}</span>
            <span className="text-amber-400">
              {(channelState[c] ?? 0) > 0 ? channelState[c] : "●"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- AI GLOBAL DASHBOARD ---------------------------------------------------

interface AIGlobalDashboardProps {
  config:    MarketplaceRoleConfig;
  aiContext: AIContextData;
  t:         ReturnType<typeof useTranslation>["t"];
}

function AIGlobalDashboard({ config, aiContext, t }: AIGlobalDashboardProps) {
  const metrics = aiContext.metrics ?? {};

  const tiles: DashboardTileData[] = [
    { icon: "💰", label: "AI Revenue",       value: metrics.aiRevenue        ?? "—" },
    { icon: "📈", label: "AI Forecast",      value: metrics.aiForecast       ?? "—" },
    { icon: "📦", label: "Orders",           value: metrics.orders           ?? "—" },
    { icon: "🚕", label: "Drivers",          value: metrics.drivers          ?? "—" },
    { icon: "👷", label: "Workers Online",   value: metrics.workersOnline    ?? "—" },
    { icon: "🏨", label: "Hotels",           value: metrics.hotels           ?? "—" },
    { icon: "✈️", label: "Flights",          value: metrics.flights          ?? "—" },
    { icon: "🍽", label: "Restaurants",      value: metrics.restaurants      ?? "—" },
    { icon: "🌦", label: "Weather",          value: aiContext.weather?.summary  ?? "—" },
    { icon: "🚦", label: "Traffic",          value: aiContext.traffic?.status   ?? "—" },
    { icon: "🚨", label: "Emergency",        value: metrics.emergency        ?? "—" },
    { icon: "💼", label: "Wallet",           value: aiContext.wallet?.balance   ?? "—" },
    { icon: "🪙", label: "Crypto",           value: metrics.crypto           ?? "—" },
    { icon: "💱", label: "Exchange Rate",    value: metrics.fx               ?? "—" },
    { icon: "🧑‍💻", label: "Live Users",    value: metrics.liveUsers        ?? "—" },
    { icon: "🖥", label: "Server Health",    value: metrics.serverHealth     ?? "OK" },
    { icon: "🔌", label: "API Health",       value: metrics.apiHealth        ?? "OK" },
    { icon: "⚠️", label: "Fraud Alerts",    value: metrics.fraudAlerts      ?? 0 },
    { icon: "🛡️", label: "Security Alerts", value: metrics.securityAlerts   ?? 0 },
  ];

  return (
    <section
      aria-label={t("marketplace.ai.missionControl")}
      className="mt-3 rounded-3xl bg-[#020617]/80 border border-slate-800 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.95)] backdrop-blur-3xl"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">AI Mission Control</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
        {tiles.map((tile) => (
          <DashboardTile key={tile.label} tile={tile} />
        ))}
      </div>
    </section>
  );
}

interface DashboardTileProps { tile: DashboardTileData }

const DashboardTile = memo(function DashboardTile({ tile }: DashboardTileProps) {
  return (
    <div className="rounded-2xl bg-black/45 border border-slate-700/70 px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-400 flex items-center gap-1">
          <span aria-hidden="true">{tile.icon}</span> {tile.label}
        </span>
        <span className="text-[9px] text-slate-500">LIVE</span>
      </div>
      <p className="mt-1 text-[9px] text-slate-200">{tile.value}</p>
    </div>
  );
});

// ---- CATEGORY NAV BAR ------------------------------------------------------

interface CategoryNavBarProps {
  config:   MarketplaceRoleConfig;
  onBack:   () => void;
  onShare:  () => void;
  t:        ReturnType<typeof useTranslation>["t"];
}

const CategoryNavBar = memo(function CategoryNavBar({ config, onBack, onShare, t }: CategoryNavBarProps) {
  return (
    <header
      className="sticky top-0 z-20 bg-[#0B1528]/97 backdrop-blur-xl border-b border-slate-800/50 shadow-sm shadow-black/40"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 h-14">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("marketplace.back")}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          {CATEGORY_FEATURE_FLAGS.BREADCRUMBS && (
            <nav aria-label={t("marketplace.breadcrumbLabel")} className="flex items-center gap-1 leading-none">
              <span className="text-[9px] text-slate-500 shrink-0">{t("marketplace.breadcrumbLabel")}</span>
              <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" aria-hidden="true" />
              <span className="text-[9px] text-amber-400/75 truncate" aria-current="page">{t(config.browseTitleKey)}</span>
            </nav>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none shrink-0" aria-hidden="true">{config.icon}</span>
            <h1 className="text-sm font-bold text-white truncate leading-tight">{t(config.browseTitleKey)}</h1>
          </div>
        </div>

        {CATEGORY_FEATURE_FLAGS.SHARE && (
          <button
            type="button"
            onClick={onShare}
            aria-label={t("marketplace.share")}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
});

// ---- RESPONSIVE LAYOUT ENGINE ----------------------------------------------

interface ResponsiveLayoutProps {
  mobile:   React.ReactNode;
  tablet:   React.ReactNode;
  desktop:  React.ReactNode;
  vision?:  React.ReactNode;
}

function ResponsiveLayout({ mobile, tablet, desktop, vision }: ResponsiveLayoutProps) {
  return (
    <>
      <MediaQuery maxWidth={639}>{mobile}</MediaQuery>
      <MediaQuery minWidth={640} maxWidth={1023}>{tablet}</MediaQuery>
      <MediaQuery minWidth={1024} maxWidth={1279}>{desktop}</MediaQuery>
      <MediaQuery minWidth={1280}>{vision ?? desktop}</MediaQuery>
    </>
  );
}

interface ShellProps { children: React.ReactNode }
function MarketplaceMobile({ children }: ShellProps)  { return <div className="px-3 pt-2 pb-20">{children}</div>; }
function MarketplaceTablet({ children }: ShellProps)  { return <div className="px-4 pt-3 pb-20 max-w-3xl mx-auto">{children}</div>; }
function MarketplaceDesktop({ children }: ShellProps) { return <div className="px-6 pt-4 pb-24 max-w-6xl mx-auto">{children}</div>; }
function MarketplaceVision({ children }: ShellProps)  { return <div className="px-8 pt-6 pb-24 max-w-7xl mx-auto bg-[#020617]/90 backdrop-blur-3xl">{children}</div>; }

// ---- MAIN COMPONENT --------------------------------------------------------

export default function CategoryMarketplace() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate        = useNavigate();
  const { t }           = useTranslation();

  const safeId = sanitizeCategoryId(categoryId);
  const config: MarketplaceRoleConfig = getMarketplaceConfig(safeId);

  usePerformanceMonitor(safeId);
  useEnterpriseSecurity();
  useGlobalOfflineEngine();
  useLiveCollaboration(safeId);
  useMarketplaceAnalytics(safeId);

  const plugins                              = useMarketplacePlugins(safeId);
  const { aiContext, aiContextLoading }      = useAIContext(safeId);
  const { prefetchListing }                  = useSmartPrefetch();

  const { startVoice } = useAIVoiceSearch(async ({ text, language }) => {
    await (aiSearchClient.submitVoiceQuery as (p: { text: string; language: string; categoryId: string }) => Promise<void>)({
      text, language, categoryId: safeId,
    });
  });

  useEffect(() => {
    const previous = document.title;
    document.title = `${t(config.browseTitleKey)} — JOBFAST`;
    return () => { document.title = previous; };
  }, [config.browseTitleKey, t]);

  const handleBack  = useCallback(() => navigate(-1), [navigate]);
  const handleShare = useCallback(async () => {
    if (!CATEGORY_FEATURE_FLAGS.SHARE) return;
    await shareCategoryUrl(safeId, t(config.browseTitleKey));
  }, [safeId, config.browseTitleKey, t]);

  const showMissionControl = CATEGORY_FEATURE_FLAGS.AI_GLOBAL_DASH;

  const coreProps = {
    role:              safeId,
    aiContext,
    aiContextLoading,
    plugins,
    paymentProviders:  PAYMENT_PROVIDERS,
    analyticsEvents,
    onPrefetchListing: prefetchListing,
    onVoiceSearch:     startVoice,
  };

  const missionControl = showMissionControl && aiContext
    ? <AIGlobalDashboard config={config} aiContext={aiContext} t={t} />
    : null;

  return (
    <div className="min-h-screen bg-[#0B1528] text-white">
      <CategoryNavBar config={config} onBack={handleBack} onShare={handleShare} t={t} />

      <ResponsiveLayout
        mobile={
          <MarketplaceMobile>
            {missionControl}
            <NotificationHub t={t} />
            <main id="marketplace-content" role="main" aria-label={t(config.browseTitleKey)} className="mt-3">
              <MarketplaceCore {...coreProps} />
            </main>
          </MarketplaceMobile>
        }
        tablet={
          <MarketplaceTablet>
            {missionControl}
            <NotificationHub t={t} />
            <main id="marketplace-content" role="main" aria-label={t(config.browseTitleKey)} className="mt-4">
              <MarketplaceCore {...coreProps} />
            </main>
          </MarketplaceTablet>
        }
        desktop={
          <MarketplaceDesktop>
            {missionControl}
            <NotificationHub t={t} />
            <main id="marketplace-content" role="main" aria-label={t(config.browseTitleKey)} className="mt-5">
              <MarketplaceCore {...coreProps} />
            </main>
          </MarketplaceDesktop>
        }
        vision={
          <MarketplaceVision>
            {missionControl}
            <NotificationHub t={t} />
            <main id="marketplace-content" role="main" aria-label={t(config.browseTitleKey)} className="mt-6">
              <MarketplaceCore {...coreProps} />
            </main>
          </MarketplaceVision>
        }
      />
    </div>
  );
}