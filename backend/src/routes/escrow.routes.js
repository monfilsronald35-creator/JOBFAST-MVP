import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  getEscrow,
  getMyEscrows,
  releaseEscrow,
  refundEscrow,
  disputeEscrow,
  resolveDispute,
} from '../controllers/escrow.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ── User routes ───────────────────────────────────────────────────────────────
router.get('/',    getMyEscrows);   // GET  /api/v1/escrow
router.get('/:id', getEscrow);      // GET  /api/v1/escrow/:id

// Either party can open a dispute
router.post('/:id/dispute', disputeEscrow);

// ── Admin-only actions ────────────────────────────────────────────────────────
router.post(
  '/:id/release',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  releaseEscrow
);

router.post(
  '/:id/refund',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  refundEscrow
);

router.post(
  '/:id/resolve',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  resolveDispute
);

export default router;