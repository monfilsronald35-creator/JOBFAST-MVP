import { asyncHandler } from '../utils/asyncHandler.js';
import * as walletService from '../services/wallet.service.js';
import { HTTP_STATUS } from '../config/constants.js';
import { FinancialError } from '../utils/money.js';

// GET /api/v1/wallet
export const getMyWallet = asyncHandler(async (req, res) => {
  let wallet = await walletService.getWallet(req.user.id);

  // Auto-create wallet on first access
  if (!wallet) {
    wallet = await walletService.createWallet(req.user.id);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { wallet },
    message: 'Wallet retrieved successfully',
  });
});

// POST /api/v1/wallet  — creates wallet if not already present
export const ensureWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.createWallet(req.user.id, req.body.currency);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { wallet },
    message: 'Wallet ready',
  });
});

// GET /api/v1/wallet/:userId  — admin only
export const getWalletByUser = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWallet(req.params.userId);
  if (!wallet) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Wallet not found' });
  }
  return res.status(HTTP_STATUS.OK).json({ success: true, data: { wallet } });
});

// POST /api/v1/wallet/:walletId/freeze  — admin only
export const freezeWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.freezeWallet(req.params.walletId, req.user.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { wallet },
    message: 'Wallet frozen',
  });
});

// POST /api/v1/wallet/:walletId/unfreeze  — admin only
export const unfreezeWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.unfreezeWallet(req.params.walletId, req.user.id);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { wallet },
    message: 'Wallet unfrozen',
  });
});