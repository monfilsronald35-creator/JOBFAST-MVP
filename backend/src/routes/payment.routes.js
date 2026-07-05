import { Router } from 'express';
import express from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { requireIdempotencyKey } from '../middlewares/idempotency.js';
import {
  initiatePayment,
  getMyPayments,
  getPayment,
  capturePayment,
  cancelPayment,
  refundPayment,
  stripeWebhook,
} from '../controllers/payment.controller.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// ── Stripe webhook — raw body required, no JWT auth ───────────────────────────
// Must be registered BEFORE express.json() runs on this router.
// In app.js the global JSON parser is already applied; Stripe requires the raw
// buffer for signature verification. Mount the webhook route first.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ── All other payment routes require authentication ───────────────────────────
router.use(authMiddleware);

// POST /api/v1/payments  — initiate a payment
router.post('/', requireIdempotencyKey, initiatePayment);

// GET  /api/v1/payments  — list my payments
router.get('/', getMyPayments);

// GET  /api/v1/payments/:id
router.get('/:id', getPayment);

// POST /api/v1/payments/:id/cancel  — payer can cancel PENDING payments
router.post('/:id/cancel', cancelPayment);

// ── Admin-only payment actions ────────────────────────────────────────────────
router.post(
  '/:id/capture',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  capturePayment
);

router.post(
  '/:id/refund',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  refundPayment
);

export default router;