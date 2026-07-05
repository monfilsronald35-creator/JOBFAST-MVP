import { asyncHandler } from '../utils/asyncHandler.js';
import * as escrowService from '../services/escrow.service.js';
import { HTTP_STATUS } from '../config/constants.js';

// GET /api/v1/escrow/:id
export const getEscrow = asyncHandler(async (req, res) => {
  const escrow = await escrowService.getEscrow(req.params.id);

  const userId  = String(req.user.id);
  const isParty = String(escrow.employerId) === userId || String(escrow.workerId) === userId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (!isParty && !isAdmin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Forbidden' });
  }

  return res.status(HTTP_STATUS.OK).json({ success: true, data: { escrow } });
});

// GET /api/v1/escrow  — my escrows (employer or worker)
export const getMyEscrows = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await escrowService.getUserEscrows(req.user.id, {
    page: Number(page),
    limit: Number(limit),
    status,
  });
  return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

// POST /api/v1/escrow/:id/release  — admin only
export const releaseEscrow = asyncHandler(async (req, res) => {
  const { profession, jobType, userRole, promoCode, promoRate } = req.body;
  const escrow = await escrowService.release(req.params.id, req.user.id, {
    profession: profession ?? null,
    jobType:    jobType    ?? null,
    userRole:   userRole   ?? 'worker',
    promoCode:  promoCode  ?? null,
    promoRate:  promoRate  != null ? Number(promoRate) : null,
  });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { escrow },
    message: 'Escrow released',
  });
});

// POST /api/v1/escrow/:id/refund  — admin only
export const refundEscrow = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const escrow = await escrowService.refund(req.params.id, req.user.id, note ?? '');
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { escrow },
    message: 'Escrow refunded',
  });
});

// POST /api/v1/escrow/:id/dispute
export const disputeEscrow = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const escrow = await escrowService.dispute(req.params.id, req.user.id, note ?? '');
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { escrow },
    message: 'Dispute opened',
  });
});

// POST /api/v1/escrow/:id/resolve  — admin only
export const resolveDispute = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const escrow = await escrowService.resolveDispute(req.params.id, req.user.id, note ?? '');
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { escrow },
    message: 'Dispute resolved',
  });
});