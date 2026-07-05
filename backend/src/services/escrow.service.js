/**
 * Escrow Service — 7-state escrow engine.
 *
 * Flow:
 *   CREATED → FUNDED (payment captured)
 *   FUNDED  → RELEASED (work completed, net amount credited to worker)
 *   FUNDED  → REFUNDED (job cancelled, amount returned to employer)
 *   FUNDED  → DISPUTED → RESOLVED → RELEASED | REFUNDED
 *   CREATED | FUNDED → EXPIRED (auto-refund after ESCROW_MAX_HOLD_DAYS)
 *
 * Commission is calculated and deducted on release.
 * Double-entry ledger entries are recorded for every state change that moves money.
 */

import mongoose from 'mongoose';
import Escrow from '../models/escrow.model.js';
import {
  ESCROW_STATUS,
  FINANCIAL_LIMITS,
  canTransitionEscrow,
} from '../config/financial.js';
import { FinancialError, assertPositive, subtract } from '../utils/money.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';
import * as walletService from './wallet.service.js';
import * as commissionService from './commission.service.js';
import * as ledgerService from './ledger.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function assertTransition(escrow, toStatus) {
  if (!canTransitionEscrow(escrow.status, toStatus)) {
    throw new FinancialError(
      `Invalid escrow transition: ${escrow.status} → ${toStatus}`,
      'INVALID_STATE_TRANSITION'
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create an escrow record after a payment is captured.
 * Does NOT move money — payment.service already captured funds into employer wallet or Stripe.
 *
 * @param {object} opts
 * @param {string} opts.jobId
 * @param {string} opts.paymentId
 * @param {string} opts.employerId
 * @param {string} opts.workerId
 * @param {number} opts.amount       — integer minor units
 * @param {string} opts.currency
 * @param {string} [opts.actorId]
 * @returns {Escrow}
 */
export async function hold({ jobId, paymentId, employerId, workerId, amount, currency, actorId = null }) {
  assertPositive(amount, 'escrow amount');

  const existing = await Escrow.findOne({ paymentId });
  if (existing) return existing;

  const expiresAt = new Date(Date.now() + FINANCIAL_LIMITS.ESCROW_MAX_HOLD_DAYS * 24 * 60 * 60 * 1000);

  const escrow = await Escrow.create({
    jobId,
    paymentId,
    employerId,
    workerId,
    amount,
    currency,
    status: ESCROW_STATUS.FUNDED,
    fundedAt: new Date(),
    expiresAt,
    statusHistory: [{ status: ESCROW_STATUS.FUNDED, actorId }],
  });

  appendAuditLog({
    type:       AUDIT_TYPES.BOOKING_ACTION,
    actorId:    String(actorId ?? employerId),
    targetId:   String(escrow._id),
    targetType: 'escrow',
    action:     'hold',
    meta:       { amount, currency, jobId, paymentId },
  });

  return escrow;
}

/**
 * Release escrow to the worker.
 * Calculates commission, credits worker's wallet with net amount, records ledger entries.
 *
 * @param {string} escrowId
 * @param {string} actorId          — admin or employer releasing
 * @param {object} [opts]
 * @param {string} [opts.profession]
 * @param {string} [opts.jobType]
 * @param {string} [opts.userRole]  — worker's role (for commission tier)
 * @param {string} [opts.promoCode]
 * @param {number} [opts.promoRate]
 * @returns {Escrow}
 */
export async function release(escrowId, actorId, opts = {}) {
  const session = await mongoose.startSession();

  try {
    let escrow;

    await session.withTransaction(async () => {
      escrow = await Escrow.findById(escrowId).session(session);
      if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');

      assertTransition(escrow, ESCROW_STATUS.RELEASED);

      // Calculate commission on gross amount
      const commission = await commissionService.calculate({
        payerId:       String(escrow.workerId),
        userRole:      opts.userRole ?? 'worker',
        baseAmount:    escrow.amount,
        currency:      escrow.currency,
        referenceType: 'escrow',
        referenceId:   escrow._id,
        profession:    opts.profession ?? null,
        jobType:       opts.jobType    ?? null,
        promoCode:     opts.promoCode  ?? null,
        promoRate:     opts.promoRate  ?? null,
        session,
      });

      const netAmount = subtract(escrow.amount, commission.commissionAmount, 'escrow amount');

      // Credit worker wallet with net amount
      const workerWallet = await walletService.credit(
        escrow.workerId,
        netAmount,
        escrow.currency,
        null, // journalId set after ledger entry
        session
      );

      // Record ledger entries (employer → worker, net)
      const { journalId } = await ledgerService.recordDoubleEntry({
        debitUserId:         String(escrow.employerId),
        creditUserId:        String(escrow.workerId),
        amount:              netAmount,
        currency:            escrow.currency,
        debitBalanceAfter:   0, // employer's escrow-side doesn't track a live balance
        creditBalanceAfter:  workerWallet.balance,
        referenceType:       'escrow',
        referenceId:         escrow._id,
        description:         `Escrow release – net after ${commission.rate * 100}% commission`,
        session,
      });

      // Mark commission as settled with this journal
      await commissionService.settleCommission(commission._id, journalId, session);

      // Update escrow document
      escrow.status           = ESCROW_STATUS.RELEASED;
      escrow.commissionAmount = commission.commissionAmount;
      escrow.netAmount        = netAmount;
      escrow.commissionId     = commission._id;
      escrow.releasedAt       = new Date();
      escrow.statusHistory.push({ status: ESCROW_STATUS.RELEASED, actorId });
      // Skip pre-save hook double-append — we push manually
      escrow.$set({ status: ESCROW_STATUS.RELEASED });
      await escrow.save({ session });
    });

    appendAuditLog({
      type:       AUDIT_TYPES.BOOKING_ACTION,
      actorId:    String(actorId),
      targetId:   String(escrowId),
      targetType: 'escrow',
      action:     'release',
      meta:       { netAmount: escrow.netAmount, commissionAmount: escrow.commissionAmount },
    });

    return escrow;
  } finally {
    await session.endSession();
  }
}

/**
 * Refund escrow to the employer (job cancelled or dispute resolved in employer's favour).
 *
 * @param {string} escrowId
 * @param {string} actorId
 * @param {string} [note]
 * @returns {Escrow}
 */
export async function refund(escrowId, actorId, note = '') {
  const session = await mongoose.startSession();

  try {
    let escrow;

    await session.withTransaction(async () => {
      escrow = await Escrow.findById(escrowId).session(session);
      if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');

      assertTransition(escrow, ESCROW_STATUS.REFUNDED);

      // Credit employer wallet with full escrow amount
      const employerWallet = await walletService.credit(
        escrow.employerId,
        escrow.amount,
        escrow.currency,
        null,
        session
      );

      // Ledger: worker/platform → employer (refund path)
      await ledgerService.recordDoubleEntry({
        debitUserId:         String(escrow.workerId),
        creditUserId:        String(escrow.employerId),
        amount:              escrow.amount,
        currency:            escrow.currency,
        debitBalanceAfter:   0,
        creditBalanceAfter:  employerWallet.balance,
        referenceType:       'escrow',
        referenceId:         escrow._id,
        description:         `Escrow refund${note ? ': ' + note : ''}`,
        session,
      });

      escrow.status     = ESCROW_STATUS.REFUNDED;
      escrow.refundedAt = new Date();
      escrow.statusHistory.push({ status: ESCROW_STATUS.REFUNDED, actorId, note });
      escrow.$set({ status: ESCROW_STATUS.REFUNDED });
      await escrow.save({ session });
    });

    appendAuditLog({
      type:       AUDIT_TYPES.BOOKING_ACTION,
      actorId:    String(actorId),
      targetId:   String(escrowId),
      targetType: 'escrow',
      action:     'refund',
      meta:       { amount: escrow.amount, note },
    });

    return escrow;
  } finally {
    await session.endSession();
  }
}

/**
 * Open a dispute on a funded escrow.
 */
export async function dispute(escrowId, actorId, note = '') {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.DISPUTED);

  escrow.status     = ESCROW_STATUS.DISPUTED;
  escrow.disputedAt = new Date();
  escrow.statusHistory.push({ status: ESCROW_STATUS.DISPUTED, actorId, note });
  await escrow.save();

  appendAuditLog({
    type:       AUDIT_TYPES.DISPUTE_ESCALATED,
    actorId:    String(actorId),
    targetId:   String(escrowId),
    targetType: 'escrow',
    action:     'dispute',
    meta:       { note },
  });

  return escrow;
}

/**
 * Resolve a dispute (admin only). Then call release() or refund() as outcome.
 */
export async function resolveDispute(escrowId, actorId, note = '') {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.RESOLVED);

  escrow.status     = ESCROW_STATUS.RESOLVED;
  escrow.resolvedAt = new Date();
  escrow.statusHistory.push({ status: ESCROW_STATUS.RESOLVED, actorId, note });
  await escrow.save();

  return escrow;
}

/**
 * Expire a funded escrow (cron or scheduler — auto-refund path).
 */
export async function expire(escrowId) {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');

  if (![ESCROW_STATUS.CREATED, ESCROW_STATUS.FUNDED].includes(escrow.status)) {
    return escrow;
  }

  // Expire → refund employer if funded
  if (escrow.status === ESCROW_STATUS.FUNDED) {
    return refund(escrowId, 'system', 'Auto-expired after hold period');
  }

  escrow.status = ESCROW_STATUS.EXPIRED;
  escrow.statusHistory.push({ status: ESCROW_STATUS.EXPIRED, actorId: 'system' });
  await escrow.save();
  return escrow;
}

export async function getEscrow(escrowId) {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  return escrow;
}

export async function getUserEscrows(userId, { page = 1, limit = 20, status } = {}) {
  const skip  = (page - 1) * limit;
  const query = {
    $or: [{ employerId: userId }, { workerId: userId }],
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    Escrow.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Escrow.countDocuments(query),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}