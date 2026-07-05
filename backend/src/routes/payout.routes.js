import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  initiatePayout,
  getMyPayouts,
  getPayout,
  completePayout,
  failPayout,
  cancelPayout,
  holdPayout,
} from '../controllers/payout.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ── User routes ───────────────────────────────────────────────────────────────
router.get('/',    getMyPayouts);   // GET  /api/v1/payouts
router.get('/:id', getPayout);      // GET  /api/v1/payouts/:id

// Users can cancel their own PENDING payouts
router.post('/:id/cancel', cancelPayout);

// ── Admin-only actions ────────────────────────────────────────────────────────
router.post(
  '/',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  initiatePayout
);

router.post(
  '/:id/complete',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  completePayout
);

router.post(
  '/:id/fail',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  failPayout
);

router.post(
  '/:id/hold',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  holdPayout
);

export default router;