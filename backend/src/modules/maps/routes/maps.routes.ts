import { Router }                   from 'express';
import { requireAuth }              from '../../../core/middleware/auth.middleware.js';
import { MapsController }           from '../controllers/MapsController.js';

export const mapsRouter = Router();
const R = requireAuth;
const C = MapsController;

// ── Geocoding (public) ────────────────────────────────────────────────────────
mapsRouter.get ('/geocode',          C.geocode);
mapsRouter.get ('/reverse',          C.reverseGeocode);
mapsRouter.get ('/route',            C.getRoute);

// ── Live tracking ─────────────────────────────────────────────────────────────
mapsRouter.post('/tracking',         R, C.updatePosition);
mapsRouter.get ('/tracking/:entityId', R, C.getPosition);

// ── Nearby workers ────────────────────────────────────────────────────────────
mapsRouter.get ('/nearby',           R, C.findNearbyWorkers);

// ── Service areas ─────────────────────────────────────────────────────────────
mapsRouter.post('/service-areas',    R, C.setServiceArea);
mapsRouter.get ('/service-areas',    R, C.getServiceAreas);