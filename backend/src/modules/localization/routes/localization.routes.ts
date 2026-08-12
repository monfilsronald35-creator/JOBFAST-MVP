import { Router }                      from 'express';
import { requireAuth, requireRole }   from '../../../core/middleware/auth.middleware.js';
import { LocalizationController }     from '../controllers/LocalizationController.js';
import { LocalizationController004 }  from '../controllers/LocalizationController004.js';

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

// ─── Migration 004: Timezones, DST, Working Days, Business Hours, Holidays, Measurement ───
const D = LocalizationController004;

// Timezones (public)
localizationRouter.get('/timezones',              D.listTimezones);
localizationRouter.get('/timezones/:id/dst',      D.getDstRules);     // must be before /:id
localizationRouter.get('/timezones/:id',          D.getTimezone);

// Working Days (read: public, write: admin)
localizationRouter.get('/working-days',           D.listWorkingDays);
localizationRouter.put('/working-days',           R, A, D.upsertWorkingDays);

// Business Hours (read: public, write: admin)
localizationRouter.get('/business-hours',         D.listBusinessHours);
localizationRouter.get('/business-hours/open',    D.checkIsOpen);
localizationRouter.put('/business-hours',         R, A, D.upsertBusinessHours);

// Holidays (public)
localizationRouter.get('/holidays',               D.listHolidays);
localizationRouter.get('/holidays/check',         D.isHoliday);
localizationRouter.get('/holidays/search',        D.searchHolidays);

// Measurement (public)
localizationRouter.get('/measurement-systems',                    D.listMeasurementSystems);
localizationRouter.get('/measurement-units',                      D.listMeasurementUnits);
localizationRouter.get('/measurement-units/:id',                  D.getMeasurementUnit);
localizationRouter.get('/measurement-preferences/:countryId',     D.getCountryMeasurementPreferences);
localizationRouter.post('/measurement-units/convert',             D.convertUnit);