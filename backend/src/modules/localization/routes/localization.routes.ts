import { Router }                    from 'express';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';
import { LocalizationController }   from '../controllers/LocalizationController.js';

export const localizationRouter = Router();
const R  = requireAuth;
const A  = requireRole('admin', 'superadmin');
const C  = LocalizationController;

// ── Public: country catalog ───────────────────────────────────────────────────
localizationRouter.get ('/countries',              C.listCountries);
localizationRouter.get ('/countries/:code',        C.getCountry);
localizationRouter.get ('/countries/:code/format', C.getFormatExamples);

// ── Public: detect country from request signals ───────────────────────────────
localizationRouter.post('/detect',                 C.detectCountry);

// ── Authenticated: user context ───────────────────────────────────────────────
localizationRouter.get ('/context',                R, C.getMyContext);
localizationRouter.post('/context/confirm',        R, C.confirmContext);
localizationRouter.patch('/context',               R, C.updateContext);

// ── Authenticated: cross-border ───────────────────────────────────────────────
localizationRouter.post('/cross-border/confirm',   R, C.confirmCrossBorder);
localizationRouter.post('/cross-border/dismiss',   R, C.dismissCrossBorder);
localizationRouter.get ('/cross-border/history',   R, C.getCrossBorderHistory);

// ── Admin: country features ───────────────────────────────────────────────────
localizationRouter.patch('/countries/:code/features', R, A, C.updateCountryFeatures);

// ── Admin: analytics ─────────────────────────────────────────────────────────
localizationRouter.get ('/analytics',              R, A, C.getAnalytics);
localizationRouter.get ('/analytics/:code/trend',  R, A, C.getCountryTrend);