import { Router }                    from 'express';
import { optionalAuth, requireAuth as authenticate } from '../../../core/middleware/auth.middleware.js';
import { SearchController }          from '../controllers/SearchController.js';
import { AutocompleteController }    from '../controllers/AutocompleteController.js';
import { RecommendationController }  from '../controllers/RecommendationController.js';
import { SearchAnalyticsController } from '../controllers/SearchAnalyticsController.js';

const router = Router();

// ── Main Search ───────────────────────────────────────────────────────────────
router.get('/',            optionalAuth, SearchController.search);
router.get('/multi',       optionalAuth, SearchController.multiSource);

// ── Autocomplete ──────────────────────────────────────────────────────────────
router.get('/autocomplete', AutocompleteController.suggest);
router.get('/trending',     AutocompleteController.trending);

// ── Recommendations ───────────────────────────────────────────────────────────
router.get('/recommendations',                  authenticate, RecommendationController.forUser);
router.get('/recommendations/popular',          optionalAuth, RecommendationController.popular);
router.get('/recommendations/nearby',           optionalAuth, RecommendationController.nearby);
router.get('/recommendations/:source/:sourceId', optionalAuth, RecommendationController.similar);

// ── Analytics (admin) ─────────────────────────────────────────────────────────
router.get('/analytics/most-searched', authenticate, SearchAnalyticsController.mostSearched);
router.get('/analytics/zero-results',  authenticate, SearchAnalyticsController.zeroResults);
router.get('/analytics/trending',      authenticate, SearchAnalyticsController.trending);
router.get('/analytics/performance',   authenticate, SearchAnalyticsController.performance);

export default router;