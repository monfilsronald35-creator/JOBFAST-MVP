import { asyncHandler } from '../utils/asyncHandler.js';
import * as payoutService from '../services/payout.service.js';
import { HTTP_STATUS } from '../config/constants.js';

// POST /api/v1/payouts  — admin initiates a payout
export const initiatePayout = asyncHandler(async (req, res) => {
  const { recipientId, amount, currency, method, escrowId, metadata } = req.body;

  const payout = await payoutService.initiate({
    recipientId,
    amount:      Number(amount),
    currency:    currency ?? 'HTG',
    method,
    escrowId:    escrowId ?? null,
    initiatedBy: req.user.id,
    metadata:    metadata ?? {},
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { payout },
    message: 'Payout initiated',
  });
});

// GET /api/v1/payouts  — my payouts
export const getMyPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await payoutService.getUserPayouts(req.user.id, {
    page: Number(page),
    limit: Number(limit),
    status,
  });
  return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

// GET /api/v1/payouts/:id
export const getPayout = asyncHandler(async (req, res) => {
  const payout = await payoutService.getPayout(req.params.id);

  const userId  = String(req.user.id);
  const isOwner = String(payout.recipientId) === userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Forbidden' });
  }

  return res.status(HTTP_STATUS.OK).json({ success: true, data: { payout } });
});

// POST /api/v1/payouts/:id/complete  — admin only
export const completePayout = asyncHandler(async (req, res) => {
  const { externalRef } = req.body;
  const payout = await payoutService.complete(req.params.id, externalRef ?? null, req.user.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payout },
    message: 'Payout completed',
  });
});

// POST /api/v1/payouts/:id/fail  — admin only
export const failPayout = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payout = await payoutService.fail(req.params.id, reason ?? '', req.user.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payout },
    message: 'Payout marked as failed',
  });
});

// POST /api/v1/payouts/:id/cancel
export const cancelPayout = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const payout = await payoutService.cancel(req.params.id, req.user.id, note ?? '');
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payout },
    message: 'Payout cancelled',
  });
});

// POST /api/v1/payouts/:id/hold  — admin only
export const holdPayout = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const payout = await payoutService.placeOnHold(req.params.id, req.user.id, note ?? '');
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { payout },
    message: 'Payout placed on hold',
  });
});