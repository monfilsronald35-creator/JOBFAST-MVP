import { asyncHandler } from '../utils/asyncHandler.js';
import * as paymentService from '../services/payment.service.js';
import { HTTP_STATUS } from '../config/constants.js';
import { FinancialError } from '../utils/money.js';

// POST /api/v1/payments
export const initiatePayment = asyncHandler(async (req, res) => {
  const { payeeId, jobId, amount, currency, method, metadata } = req.body;

  const { payment, stripeClientSecret } = await paymentService.initiatePayment({
    payerId: req.user.id,
    payeeId,
    jobId: jobId ?? null,
    amount: Number(amount),
    currency: currency ?? 'HTG',
    method,
    idempotencyKey: req.idempotencyKey,
    metadata: metadata ?? {},
  });

  const responseData = { payment };
  if (stripeClientSecret) responseData.stripeClientSecret = stripeClientSecret;

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: responseData,
    message: 'Payment initiated',
  });
});

// GET /api/v1/payments
export const getMyPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await paymentService.getUserPayments(req.user.id, {
    page: Number(page),
    limit: Number(limit),
    status,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

// GET /api/v1/payments/:id
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPayment(req.params.id);

  // Users can only view their own payments
  const userId = String(req.user.id);
  const isParty = String(payment.payerId) === userId || String(payment.payeeId) === userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (!isParty && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Forbidden' });
  }

  return res.status(HTTP_STATUS.OK).json({ success: true, data: { payment } });
});

// POST /api/v1/payments/:id/capture  — admin or system
export const capturePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.capturePayment(req.params.id, req.user.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payment },
    message: 'Payment captured',
  });
});

// POST /api/v1/payments/:id/cancel
export const cancelPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payment = await paymentService.cancelPayment(req.params.id, req.user.id, reason);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payment },
    message: 'Payment cancelled',
  });
});

// POST /api/v1/payments/:id/refund  — admin only
export const refundPayment = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await paymentService.refundPayment(
    req.params.id,
    amount !== undefined ? Number(amount) : undefined,
    req.user.id,
    reason ?? ''
  );
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payment },
    message: 'Payment refunded',
  });
});

// POST /api/v1/payments/webhook  — Stripe webhook (no auth, raw body)
export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Missing Stripe signature' });
  }

  const result = await paymentService.handleStripeWebhook(req.body, sig);
  return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});