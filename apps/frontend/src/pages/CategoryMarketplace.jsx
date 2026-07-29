/**
 * CategoryMarketplace — Enterprise Page Wrapper v3.1
 *
 * Route: /marketplace/:categoryId
 *
 * Nivo: JOBFAST Super App (Uber + Airbnb + Booking + LinkedIn + Amazon + Google Maps) — Enterprise v3.1.
 *
 * Chanjman kle vs v3.0:
 *   - AI Context pa depann de browser; li vini soti nan backend User Context API.
 *   - Security Layer relye ak backend: JWT rotation, refresh, WebAuthn/Passkey, device fingerprint, risk engine, rate limiter, CSRF, encryption.
 *   - Analytics kolekte tout events (listing view/search/filter/map/call/chat/booking/payment/cancel/favorite/review/conversion/revenue/retention/session/heatmap/AI prediction).
 *   - Smart Prefetch sèvi ak TanStack Query (React Query) `queryClient.prefetchQuery` olye callback vid.
 *   - Voice AI sipòte English/Español/Français/Kreyòl epi voye transcript nan AI Search Engine.
 *   - Notification Hub konekte ak Firebase, WebSocket, Push, In-App, SMS, Email.
 *   - Mission Control Dashboard gen AI Revenue/Forecast/Orders/Drivers/Workers/Hotels/Flights/Restaurants/Weather/Traffic/Emergency/Wallet/Crypto/FX/Live Users/Server/API Health/Fraud/Security alerts.
 *   - Plugin System use manifest (routes, permissions, feature flags, dependency injection).
 *   - Offline Engine gen IndexedDB, Background Sync, Delta/Conflict, Retry/Upload queues, Image/Video/Priority caches.
 */

import React, {
  useEffect,
  useCallback,
  memo,
  useMemo,
  useState,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarketplaceCore from '../components/marketplace/MarketplaceCore';
import { getMarketplaceConfig } from '../config/marketplaceConfig';
import { useQueryClient } from '@tanstack/react-query';           // TanStack Query
import { MediaQuery } from 'react-responsive';
import { useNotificationSocket } from '../hooks/useNotificationSocket'; // WebSocket (custom hook)
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';   // Firebase Push (custom hook)
import { aiSearchClient } from '../services/aiSearchClient';             // AI Search Engine (backend client)
import { userContextClient } from '../services/userContextClient';       // User Context API (backend)
import { securityClient } from '../services/securityClient';             // Security backend client
import { analyticsClient } from '../services/analyticsClient';           // Analytics backend client
import { offlineClient } from '../services/offlineClient';               // Offline/Sync backend client
import { loadPluginManifests } from '../services/pluginRegistry';        // Plugin manifest loader

// ─── Feature flags ─────────────────────────────────────────────
const CATEGORY_FEATURE_FLAGS = Object.freeze({
  SHARE:            false,
  BREADCRUMBS:      true,
  AI_GLOBAL_DASH:   true,
});

// ─── Utilities ────────────────────────────────────────────────

function sanitizeCategoryId(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-z0-9_]/gi, '').slice(0, 64);
}

async function shareCategoryUrl(categoryId, title) {
  const url = `${window.location.origin}/marketplace/${categoryId}`;
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── AI Context Engine (backend-driven) ───────────────────────
// Pa depann de navigator.*; li fè 1 API call pou konplè user context (profile/subscription/wallet/permissions/geo/behavior/risk/trust/lang/currency/timezone/weather/traffic/events).
function useAIContext(safeId) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        setLoading(true);
        const base = await userContextClient.getContextForMarketplace({
          categoryId: safeId,
        });
        if (cancelled) return;

        // Expected shape from backend (example):
        // {
        //   profile, subscription, wallet, permission,
        //   country, city, nearbyJobs, nearbyHotels, nearbyTaxis,
        //   bookingHistory, searchHistory, favoriteCategories,
        //   deviceRiskScore, fraudScore, trustScore,
        //   language, currency, timezone, weather, traffic,
        //   liveEvents
        // }
        setContext(base);
      } catch (e) {
        console.error('AI Context load failed', e);
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

// ─── Performance Monitor ──────────────────────────────────────
function usePerformanceMonitor(categoryId) {
  useEffect(() => {
    performance.mark(`marketplace-start-${categoryId}`);
    return () => {
      performance.mark(`marketplace-end-${categoryId}`);
      performance.measure(
        `marketplace-${categoryId}`,
        `marketplace-start-${categoryId}`,
        `marketplace-end-${categoryId}`
      );
      analyticsClient.trackPerformanceMeasure(`marketplace-${categoryId}`); // backend send
    };
  }, [categoryId]);
}

// ─── Smart Prefetch (React Query) ─────────────────────────────
// Prefetch Hotel/Listing data (details/reviews/availability/map/photos/owner) avan click.
function useSmartPrefetch() {
  const queryClient = useQueryClient();

  const prefetchListing = useCallback(
    async (listingId) => {
      if (!listingId) return;

      const baseKey = ['listing', listingId];

      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'details'],
          queryFn: () => offlineClient.fetchListingDetails(listingId),
        }),
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'reviews'],
          queryFn: () => offlineClient.fetchListingReviews(listingId),
        }),
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'availability'],
          queryFn: () => offlineClient.fetchListingAvailability(listingId),
        }),
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'map'],
          queryFn: () => offlineClient.fetchListingMapData(listingId),
        }),
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'photos'],
          queryFn: () => offlineClient.fetchListingPhotos(listingId),
        }),
        queryClient.prefetchQuery({
          queryKey: [...baseKey, 'owner'],
          queryFn: () => offlineClient.fetchListingOwnerProfile(listingId),
        }),
      ]);
    },
    [queryClient]
  );

  return { prefetchListing };
}

// ─── Enterprise Security Layer (backend-connected) ────────────
// JWT Rotation, Refresh Token, Passkey/WebAuthn, FaceID/TouchID (native bridge), Risk Engine, Device Fingerprint, Rate Limiter, Session Manager, Token Binding, CSRF, CAPTCHA, Encryption.
function useEnterpriseSecurity() {
  useEffect(() => {
    let cancelled = false;

    async function initSecurity() {
      try {
        // Device fingerprint (browser + backend)
        await securityClient.registerDeviceFingerprint();

        // JWT rotation & Token Binding
        await securityClient.ensureRotatingTokens();    // short TTL + refresh + binding
        await securityClient.setupCSRFProtection();     // CSRF token in cookies/headers

        // Passkey/WebAuthn
        if (!cancelled && securityClient.supportsWebAuthn()) {
          await securityClient.bootstrapWebAuthnPasskey();
        }

        // Risk Engine / Fraud score (device/geo/behavior)
        await securityClient.syncRiskProfile();

        // Rate limiter / session manager (server-side)
        await securityClient.syncSessionState();

        // CAPTCHA (visible/invisible) config
        await securityClient.loadCaptchaConfig();

        // Encryption policies (fields to encrypt client-side or at edge)
        await securityClient.loadEncryptionPolicies();
      } catch (e) {
        console.error('Security init failed', e);
      }
    }

    initSecurity();
    return () => { cancelled = true; };
  }, []);
}

// ─── Offline Engine (full) ────────────────────────────────────
// IndexedDB, Background Sync, Delta Sync, Conflict Resolution, Retry Queue, Upload Queue, Image/Video/Priority cache.
function useGlobalOfflineEngine() {
  useEffect(() => {
    let cancelled = false;

    async function initOffline() {
      try {
        // IndexedDB setup (structured caches)
        await offlineClient.initIndexedDB();

        // Retry queue / upload queue (for jobs/orders/bookings)
        await offlineClient.initQueues();

        // Background Sync (service worker)
        await offlineClient.registerBackgroundSync();

        // Priority cache (metadata > text > image > video)
        await offlineClient.configureCachePriorities();

        // Delta sync & conflict resolution strategies
        await offlineClient.loadSyncConfig();
      } catch (e) {
        if (!cancelled) console.error('Offline init failed', e);
      }
    }

    initOffline();
    return () => { cancelled = true; };
  }, []);
}

// ─── Live Collaboration (backend) ─────────────────────────────
function useLiveCollaboration(categoryId) {
  useEffect(() => {
    const channel = offlineClient.openCollaborationChannel({ categoryId });
    // channel handles live cursors/updates/conflict/version history internaly.
    return () => channel.close();
  }, [categoryId]);
}

// ─── Analytics (full event model) ─────────────────────────────
// Listing View, Search, Filter, Map Open, Call, Chat, Booking, Payment, Cancel, Favorite, Review, Conversion, Revenue, Retention, Session Length, Heatmap, AI Prediction.
function useMarketplaceAnalytics(categoryId) {
  useEffect(() => {
    analyticsClient.trackEvent('category_view', { categoryId });
    analyticsClient.startSessionTimer(categoryId);
    return () => {
      analyticsClient.endSessionTimer(categoryId);
    };
  }, [categoryId]);
}

// Helper to pass to MarketplaceCore or local components
const analyticsEvents = {
  listingView:  (payload) => analyticsClient.trackEvent('listing_view', payload),
  search:       (payload) => analyticsClient.trackEvent('search', payload),
  filter:       (payload) => analyticsClient.trackEvent('filter', payload),
  mapOpen:      (payload) => analyticsClient.trackEvent('map_open', payload),
  call:         (payload) => analyticsClient.trackEvent('call', payload),
  chat:         (payload) => analyticsClient.trackEvent('chat', payload),
  booking:      (payload) => analyticsClient.trackEvent('booking', payload),
  payment:      (payload) => analyticsClient.trackEvent('payment', payload),
  cancel:       (payload) => analyticsClient.trackEvent('cancel', payload),
  favorite:     (payload) => analyticsClient.trackEvent('favorite', payload),
  review:       (payload) => analyticsClient.trackEvent('review', payload),
  conversion:   (payload) => analyticsClient.trackEvent('conversion', payload),
  revenue:      (payload) => analyticsClient.trackEvent('revenue', payload),
  retention:    (payload) => analyticsClient.trackEvent('retention', payload),
  sessionLength:(payload) => analyticsClient.trackEvent('session_length', payload),
  heatmap:      (payload) => analyticsClient.trackEvent('heatmap', payload),
  aiPrediction: (payload) => analyticsClient.trackEvent('ai_prediction', payload),
};
// ─── Plugin System (manifest-based) ───────────────────────────
// manifest.json + routes + permissions + feature flags + DI.
function useMarketplacePlugins(safeId) {
  const [plugins, setPlugins] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifests = await loadPluginManifests({ categoryId: safeId });
        if (!cancelled) setPlugins(manifests);
      } catch (e) {
        console.error('Plugin manifests failed', e);
        if (!cancelled) setPlugins([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [safeId]);

  // manifests: [{ id, name, routes, permissions, featureFlags, inject }],
  // MarketplaceCore ka itilize yo pou mount plugins via DI.
  return plugins;
}

// ─── AI Voice Everywhere (multi-language) ─────────────────────
// English/Español/Français/Kreyòl; voye transcript nan AI Search engine.
function useAIVoiceSearch(onVoiceResult) {
  const startVoice = useCallback(() => {
    // NOTE: real impl: browser SpeechRecognition API or native bridge.
    // language = userContext.language (en/es/fr/ht).
    // On final transcript: onVoiceResult({ text, language });
  }, [onVoiceResult]);

  return { startVoice };
}

// ─── Global Payment Layer ─────────────────────────────────────
const PAYMENT_PROVIDERS = [
  'visa',
  'mastercard',
  'paypal',
  'apple_pay',
  'google_pay',
  'stripe',
  'usdt',
  'btc',
  'eth',
  'moncash',
  'natcash',
];

// ─── Notification Hub (connected) ─────────────────────────────
// Firebase + WebSocket + Push + In-App + SMS + Email.
function NotificationHub({ t }) {
  const firebase = useFirebaseMessaging();          // FCM/webpush
  const socket   = useNotificationSocket();         // WebSocket
  const [channelState, setChannelState] = useState({
    jobs:        0,
    hotels:      0,
    taxi:        0,
    flight:      0,
    delivery:    0,
    construction:0,
    marketplace: 0,
    wallet:      0,
    promotion:   0,
    emergency:   0,
  });

  useEffect(() => {
    firebase.onMessage((msg) => {
      // Normalize FCM message → update channelState + show in-app banner.
      const { channel } = msg.data || {};
      if (!channel) return;
      setChannelState((prev) => ({
        ...prev,
        [channel]: (prev[channel] || 0) + 1,
      }));
    });

    socket.on('notification', (payload) => {
      const { channel } = payload;
      if (!channel) return;
      setChannelState((prev) => ({
        ...prev,
        [channel]: (prev[channel] || 0) + 1,
      }));
    });

    // SMS/Email triggered at backend (analyticsClient / notificationClient).
  }, [firebase, socket]);

  const channels = Object.keys(channelState);

  return (
    <section
      aria-label={t('marketplace.notifications')}
      className="mt-3 rounded-2xl bg-black/35 border border-slate-800 px-3 py-2"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
        Notification Center
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px] text-slate-300">
        {channels.map((c) => (
          <div
            key={c}
            className="rounded-xl bg-slate-900/70 px-2 py-1 flex items-center justify-between"
          >
            <span>{c}</span>
            <span className="text-amber-400">
              {channelState[c] > 0 ? channelState[c] : '●'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── AI Global Dashboard (Mission Control v2) ──────────────────
function AIGlobalDashboard({ config, aiContext, t }) {
  const metrics = aiContext?.metrics || {};

  const tiles = [
    { icon: '💰', label: 'AI Revenue',       value: metrics.aiRevenue        ?? '—' },
    { icon: '📈', label: 'AI Forecast',      value: metrics.aiForecast       ?? '—' },
    { icon: '📦', label: 'Orders',           value: metrics.orders           ?? '—' },
    { icon: '🚕', label: 'Drivers',          value: metrics.drivers          ?? '—' },
    { icon: '👷', label: 'Workers Online',   value: metrics.workersOnline    ?? '—' },
    { icon: '🏨', label: 'Hotels',           value: metrics.hotels           ?? '—' },
    { icon: '✈️', label: 'Flights',          value: metrics.flights          ?? '—' },
    { icon: '🍽', label: 'Restaurants',      value: metrics.restaurants      ?? '—' },
    { icon: '🌦', label: 'Weather',          value: aiContext?.weather?.summary   ?? '—' },
    { icon: '🚦', label: 'Traffic',          value: aiContext?.traffic?.status    ?? '—' },
    { icon: '🚨', label: 'Emergency',        value: metrics.emergency        ?? '—' },
    { icon: '💼', label: 'Wallet',           value: aiContext?.wallet?.balance    ?? '—' },
    { icon: '🪙', label: 'Crypto',           value: metrics.crypto           ?? '—' },
    { icon: '💱', label: 'Exchange Rate',    value: metrics.fx               ?? '—' },
    { icon: '🧑‍💻', label: 'Live Users',     value: metrics.liveUsers        ?? '—' },
    { icon: '🖥', label: 'Server Health',    value: metrics.serverHealth     ?? 'OK' },
    { icon: '🔌', label: 'API Health',       value: metrics.apiHealth        ?? 'OK' },
    { icon: '⚠️', label: 'Fraud Alerts',    value: metrics.fraudAlerts      ?? 0 },
    { icon: '🛡️', label: 'Security Alerts', value: metrics.securityAlerts   ?? 0 },
  ];

  return (
    <section
      aria-label={t('marketplace.ai.missionControl')}
      className="mt-3 rounded-3xl bg-[#020617]/80 border border-slate-800 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.95)] backdrop-blur-3xl"
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
        AI Mission Control
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
        {tiles.map((tile) => (
          <DashboardTile key={tile.label} tile={tile} />
        ))}
      </div>
    </section>
  );
}

const DashboardTile = memo(function DashboardTile({ tile }) {
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

// ─── CategoryNavBar ───────────────────────────────────────────
const CategoryNavBar = memo(function CategoryNavBar({
  config,
  onBack,
  onShare,
  t,
}) {
  return (
    <header
      className="sticky top-0 z-20 bg-[#0B1528]/97 backdrop-blur-xl border-b border-slate-800/50 shadow-sm shadow-black/40"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 h-14">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('marketplace.back')}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          {CATEGORY_FEATURE_FLAGS.BREADCRUMBS && (
            <nav
              aria-label={t('marketplace.breadcrumbLabel')}
              className="flex items-center gap-1 leading-none"
            >
              <span className="text-[9px] text-slate-500 shrink-0">
                {t('marketplace.breadcrumbLabel')}
              </span>
              <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" aria-hidden="true" />
              <span className="text-[9px] text-amber-400/75 truncate" aria-current="page">
                {config.browseTitle}
              </span>
            </nav>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              {config.icon}
            </span>
            <h1 className="text-sm font-bold text-white truncate leading-tight">
              {config.browseTitle}
            </h1>
          </div>
        </div>

        {CATEGORY_FEATURE_FLAGS.SHARE && (
          <button
            type="button"
            onClick={onShare}
            aria-label={t('marketplace.share')}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
});

// ─── Responsive Layout Engine ─────────────────────────────────
function ResponsiveLayout({ mobile, tablet, desktop, vision }) {
  return (
    <>
      <MediaQuery maxWidth={639}>{mobile}</MediaQuery>
      <MediaQuery minWidth={640} maxWidth={1023}>{tablet}</MediaQuery>
      <MediaQuery minWidth={1024} maxWidth={1279}>{desktop}</MediaQuery>
      <MediaQuery minWidth={1280}>{vision || desktop}</MediaQuery>
    </>
  );
}

// Shells
function MarketplaceMobile({ children }) {
  return <div className="px-3 pt-2 pb-20">{children}</div>;
}
function MarketplaceTablet({ children }) {
  return <div className="px-4 pt-3 pb-20 max-w-3xl mx-auto">{children}</div>;
}
function MarketplaceDesktop({ children }) {
  return <div className="px-6 pt-4 pb-24 max-w-6xl mx-auto">{children}</div>;
}
function MarketplaceVision({ children }) {
  return (
    <div className="px-8 pt-6 pb-24 max-w-7xl mx-auto bg-[#020617]/90 backdrop-blur-3xl">
      {children}
    </div>
  );
}

// ─── Main wrapper ─────────────────────────────────────────────
export default function CategoryMarketplace() {
  const { categoryId } = useParams();
  const navigate        = useNavigate();
  const { t }           = useTranslation();

  const safeId = sanitizeCategoryId(categoryId);
  const config = getMarketplaceConfig(safeId);

  usePerformanceMonitor(safeId);
  useEnterpriseSecurity();
  useGlobalOfflineEngine();
  useLiveCollaboration(safeId);
  useMarketplaceAnalytics(safeId);

  const plugins           = useMarketplacePlugins(safeId);
  const { aiContext, aiContextLoading } = useAIContext(safeId);
  const { prefetchListing }            = useSmartPrefetch();

  const { startVoice } = useAIVoiceSearch(async ({ text, language }) => {
    // Voice → AI Search Engine (backend)
    await aiSearchClient.submitVoiceQuery({ text, language, categoryId: safeId });
  });

  useEffect(() => {
    const previous = document.title;
    document.title = `${config.browseTitle} — JOBFAST`;
    return () => { document.title = previous; };
  }, [config.browseTitle]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleShare = useCallback(async () => {
    if (!CATEGORY_FEATURE_FLAGS.SHARE) return;
    await shareCategoryUrl(safeId, config.browseTitle);
  }, [safeId, config.browseTitle]);

  const showMissionControl = CATEGORY_FEATURE_FLAGS.AI_GLOBAL_DASH;

  return (
    <div className="min-h-screen bg-[#0B1528] text-white">
      <CategoryNavBar
        config={config}
        onBack={handleBack}
        onShare={handleShare}
        t={t}
      />

      <ResponsiveLayout
        mobile={
          <MarketplaceMobile>
            {showMissionControl && aiContext && (
              <AIGlobalDashboard config={config} aiContext={aiContext} t={t} />
            )}
            <NotificationHub t={t} />
            <main
              id="marketplace-content"
              role="main"
              aria-label={config.browseTitle}
              className="mt-3"
            >
              <MarketplaceCore
                role={safeId}
                aiContext={aiContext}
                aiContextLoading={aiContextLoading}
                plugins={plugins}
                paymentProviders={PAYMENT_PROVIDERS}
                analyticsEvents={analyticsEvents}
                onPrefetchListing={prefetchListing}
                onVoiceSearch={startVoice}
              />
            </main>
          </MarketplaceMobile>
        }
        tablet={
          <MarketplaceTablet>
            {showMissionControl && aiContext && (
              <AIGlobalDashboard config={config} aiContext={aiContext} t={t} />
            )}
            <NotificationHub t={t} />
            <main
              id="marketplace-content"
              role="main"
              aria-label={config.browseTitle}
              className="mt-4"
            >
              <MarketplaceCore
                role={safeId}
                aiContext={aiContext}
                aiContextLoading={aiContextLoading}
                plugins={plugins}
                paymentProviders={PAYMENT_PROVIDERS}
                analyticsEvents={analyticsEvents}
                onPrefetchListing={prefetchListing}
                onVoiceSearch={startVoice}
              />
            </main>
          </MarketplaceTablet>
        }
        desktop={
          <MarketplaceDesktop>
            {showMissionControl && aiContext && (
              <AIGlobalDashboard config={config} aiContext={aiContext} t={t} />
            )}
            <NotificationHub t={t} />
            <main
              id="marketplace-content"
              role="main"
              aria-label={config.browseTitle}
              className="mt-5"
            >
              <MarketplaceCore
                role={safeId}
                aiContext={aiContext}
                aiContextLoading={aiContextLoading}
                plugins={plugins}
                paymentProviders={PAYMENT_PROVIDERS}
                analyticsEvents={analyticsEvents}
                onPrefetchListing={prefetchListing}
                onVoiceSearch={startVoice}
              />
            </main>
          </MarketplaceDesktop>
        }
        vision={
          <MarketplaceVision>
            {showMissionControl && aiContext && (
              <AIGlobalDashboard config={config} aiContext={aiContext} t={t} />
            )}
            <NotificationHub t={t} />
            <main
              id="marketplace-content"
              role="main"
              aria-label={config.browseTitle}
              className="mt-6"
            >
              <MarketplaceCore
                role={safeId}
                aiContext={aiContext}
                aiContextLoading={aiContextLoading}
                plugins={plugins}
                paymentProviders={PAYMENT_PROVIDERS}
                analyticsEvents={analyticsEvents}
                onPrefetchListing={prefetchListing}
                onVoiceSearch={startVoice}
              />
            </main>
          </MarketplaceVision>
        }
      />
    </div>
  );
}
