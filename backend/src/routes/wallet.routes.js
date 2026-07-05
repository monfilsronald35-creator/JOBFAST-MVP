import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  getMyWallet,
  ensureWallet,
  getWalletByUser,
  freezeWallet,
  unfreezeWallet,
} from '../controllers/wallet.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// All wallet routes require authentication
router.use(authMiddleware);

// ── User routes ───────────────────────────────────────────────────────────────
router.get('/',   getMyWallet);     // GET  /api/v1/wallet
router.post('/',  ensureWallet);    // POST /api/v1/wallet

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(
  '/user/:userId',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getWalletByUser
);

router.post(
  '/:walletId/freeze',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  freezeWallet
);

router.post(
  '/:walletId/unfreeze',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  unfreezeWallet
);

export default router;