/**
 * CategoryMarketplace — Enterprise Page Wrapper v2.0
 *
 * Route: /marketplace/:categoryId  (via AppRoutes → AuthGate → MainLayout)
 *
 * Responsibility: Page-level chrome only.
 *   • Navigation rail: breadcrumb, back button, share (gated)
 *   • Route param sanitization (XSS/injection prevention)
 *   • Dynamic document.title (SEO baseline for SPA)
 *   • Full i18n via react-i18next (marketplace.* namespace)
 *   • WCAG 2.2 AA: semantic HTML, ARIA landmarks, visible focus rings
 *   • Feature flags for all extension points (all gated at MVP)
 *
 * Delegates 100% of browse/search/filter/booking/reviews to MarketplaceCore.
 * No business logic, no API calls, no duplicate hooks or services here.
 *
 * Extension points (flip flag to true when backend is ready):
 *   SHARE            → Web Share API / clipboard share button
 *   CATEGORY_STATS   → live stats strip (total listings, open now, avg rating)
 *   AI_BANNER        → "Recommended for you" personalization banner
 *   SPONSORED        → sponsored/featured section injection above core
 *   SAVE_SEARCH      → save current search for push notification recall
 *   COMPARISON       → multi-listing comparison drawer
 *   RECENTLY_VIEWED  → recently-viewed rail injected before listing grid
 *   SOCIAL_META      → dynamic OG / Twitter meta injection via portal
 *   ABUSE_REPORT     → "Report this category" link for trust & safety
 *   ADMIN_MODERATION → admin moderation action bar (admin role only)
 */

import React, { useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarketplaceCore from '../components/marketplace/MarketplaceCore';
import {
  getMarketplaceConfig,
  MARKETPLACE_PROVIDER_ROLES,
} from '../config/marketplaceConfig';

// ─── Feature flags ──────────────────────────────────────────────────────────
// Single source of truth for all CategoryMarketplace extension points.
// Never enable a flag without a corresponding backend endpoint and test suite.
const CATEGORY_FEATURE_FLAGS = Object.freeze({
  SHARE:            false, // Web Share API / clipboard URL sharing
  BREADCRUMBS:      true,  // breadcrumb nav — pure UI, no backend needed
  CATEGORY_STATS:   false, // live stats strip from /marketplace/stats/:id
  AI_BANNER:        false, // AI recommendation banner from /recommendations
  SPONSORED:        false, // sponsored listings injection from /marketplace/sponsored
  SAVE_SEARCH:      false, // save-search button + push notification recall
  COMPARISON:       false, // multi-listing comparison drawer
  RECENTLY_VIEWED:  false, // recently-viewed rail via localStorage + API
  SOCIAL_META:      false, // dynamic OG/Twitter meta tags via ReactDOM portal
  ABUSE_REPORT:     false, // "Report this category" trust & safety link
  ADMIN_MODERATION: false, // admin moderation bar (admin role only)
});

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Strip any char that isn't alphanumeric or underscore — prevents URL injection. */
function sanitizeCategoryId(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-z0-9_]/gi, '').slice(0, 64);
}

/**
 * Web Share API with clipboard fallback.
 * Only invoked when CATEGORY_FEATURE_FLAGS.SHARE is true.
 * Returns true on success.
 */
async function shareCategoryUrl(categoryId, title) {
  const url = `${window.location.origin}/marketplace/${categoryId}`;
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── CategoryNavBar ───────────────────────────────────────────────────────────
// Sticky navigation rail: back button, breadcrumb, category identity, share.
// Does NOT duplicate any MarketplaceCore header or search UI.

const CategoryNavBar = memo(function CategoryNavBar({ config, categoryId, onBack, onShare, t }) {
  return (
    <header
      className="sticky top-0 z-20 bg-[#0B1528]/97 backdrop-blur-xl border-b border-slate-800/50 shadow-sm shadow-black/40"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 h-14">

        {/* ── Back button ── */}
        <button
          type="button"
          onClick={onBack}
          aria-label={t('marketplace.back')}
          className="
            w-9 h-9 shrink-0 flex items-center justify-center
            rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70
            transition-all duration-150 active:scale-90
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
          "
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* ── Category identity + breadcrumb ── */}
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
              <span
                className="text-[9px] text-amber-400/75 truncate"
                aria-current="page"
              >
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

        {/* ── Share button (gated) ── */}
        {CATEGORY_FEATURE_FLAGS.SHARE && (
          <button
            type="button"
            onClick={onShare}
            aria-label={t('marketplace.share')}
            className="
              w-9 h-9 shrink-0 flex items-center justify-center
              rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70
              transition-all duration-150 active:scale-90
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            "
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/*
          Extension points — uncomment when flags are enabled:
          {CATEGORY_FEATURE_FLAGS.SAVE_SEARCH      && <SaveSearchButton role={categoryId} />}
          {CATEGORY_FEATURE_FLAGS.COMPARISON       && <CompareToggle role={categoryId} />}
          {CATEGORY_FEATURE_FLAGS.ADMIN_MODERATION && user?.role === 'admin' && <AdminBar />}
        */}
      </div>
    </header>
  );
});

// ─── CategoryMarketplace ──────────────────────────────────────────────────────

export default function CategoryMarketplace() {
  const { categoryId } = useParams();
  const navigate        = useNavigate();
  const { t }           = useTranslation();

  // Sanitize route param before any use — prevents XSS / URL injection
  const safeId = sanitizeCategoryId(categoryId);

  // Per-role config; getMarketplaceConfig returns service_provider fallback for unknown roles
  const config = getMarketplaceConfig(safeId);

  // Dynamic document title — SPA SEO baseline; restored on unmount
  useEffect(() => {
    const previous = document.title;
    document.title = `${config.browseTitle} — JOBFAST`;
    return () => { document.title = previous; };
  }, [config.browseTitle]);

  // Stable handlers
  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleShare = useCallback(async () => {
    if (!CATEGORY_FEATURE_FLAGS.SHARE) return;
    await shareCategoryUrl(safeId, config.browseTitle);
    // Global toast / notification hook goes here when notification system is wired
  }, [safeId, config.browseTitle]);

  /*
    Extension points — wire when flags are enabled:

    CATEGORY_FEATURE_FLAGS.SOCIAL_META:
      inject OG/Twitter meta via ReactDOM.createPortal into document.head

    CATEGORY_FEATURE_FLAGS.CATEGORY_STATS:
      const stats = useCategoryStats(safeId)  →  <CategoryStatsStrip stats={stats} />

    CATEGORY_FEATURE_FLAGS.AI_BANNER:
      const recs = useAIRecommendations(safeId, user._id)  →  <AIRecommendationBanner />

    CATEGORY_FEATURE_FLAGS.SPONSORED:
      <SponsoredStrip role={safeId} />  above <MarketplaceCore>

    CATEGORY_FEATURE_FLAGS.RECENTLY_VIEWED:
      track view + <RecentlyViewedRail role={safeId} />  above <MarketplaceCore>

    CATEGORY_FEATURE_FLAGS.ABUSE_REPORT:
      <CategoryReportLink categoryId={safeId} />  in footer below <MarketplaceCore>
  */

  return (
    <div className="min-h-screen bg-[#0B1528] text-white">

      <CategoryNavBar
        config={config}
        categoryId={safeId}
        onBack={handleBack}
        onShare={handleShare}
        t={t}
      />

      {/* Marketplace engine — all browse, search, filter, booking, reviews */}
      <main id="marketplace-content" role="main" aria-label={config.browseTitle}>
        <MarketplaceCore role={safeId} />
      </main>

    </div>
  );
}
