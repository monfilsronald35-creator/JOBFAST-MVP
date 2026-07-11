import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  verifyUser,
  banUser,
  suspendUser,
  activateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController.js';
import { followUserHandler, unfollowUserHandler } from '../controllers/follow.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ── Current user ──────────────────────────────────────────────────────────────
router.get('/me',  getProfile);
router.put('/me',  updateProfile);

// ── Admin: user listing + stats ───────────────────────────────────────────────
router.get(
  '/',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getUsers
);

router.get(
  '/stats',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  getUserStats
);

// ── Follow / unfollow ─────────────────────────────────────────────────────────
router.post('/:id/follow',    followUserHandler);
router.delete('/:id/follow',  unfollowUserHandler);

// ── Public (auth'd) profile lookup ───────────────────────────────────────────
router.get('/:id', getUserById);

// ── Admin: user lifecycle ────────────────────────────────────────────────────
router.patch(
  '/:id/verify',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  verifyUser
);

router.patch(
  '/:id/ban',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  banUser
);

router.patch(
  '/:id/suspend',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  suspendUser
);

router.patch(
  '/:id/activate',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  activateUser
);

router.delete(
  '/:id',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  deleteUser
);

export default router;