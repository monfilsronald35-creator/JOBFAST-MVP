/**
 * Payout Service — 6-state payout engine.
 *
 * Flow:
 *   PENDING → PROCESSING → COMPLETED
 *                       → FAILED → PENDING (retry)
 *   PENDING | PROCESSING → CANCELLED
 *   PENDING → ON_HOLD (compliance review)
 *
 * A payout deducts from the recipient's internal wallet and records a
 * double-entry ledger entry. External transfer (Stripe, mobile money) is
 * represented by the externalRef field once the transfer is confirmed.
 */

import mongoose from 'mongoose';
import Payout from '../models/payout.model.js';
import {
  PAYOUT_STATUS,
  FINANCIAL_LIMITS,
} from '../config/financial.js';
import { FinancialError, assertPositive } from '../utils/money.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';
import * as walletService from './wallet.service.js';
import * as ledgerService from './ledger.service.js';

// ── Valid transitions ─────────────────────────────────────────────────────────
const PAYOUT_TRANSITIONS = Object.freeze({
  [PAYOUT_STATUS.PENDING]:    [PAYOUT_STATUS.PROCESSING, PAYOUT_STATUS.CANCELLED, PAYOUT_STATUS.ON_HOLD],
  [PAYOUT_STATUS.PROCESSING]: [PAYOUT_STATUS.COMPLETED, PAYOUT_STATUS.FAILED, PAYOUT_STATUS.CANCELLED],
  [PAYOUT_STATUS.FAILED]:     [PAYOUT_STATUS.PENDING],
  [PAYOUT_STATUS.ON_HOLD]:    [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.CANCELLED],
});

function assertTransition(payout, toStatus) {
  if (!PAYOUT_TRANSITIONS[payout.status]?.includes(toStatus)) {
    throw new FinancialError(
      `Invalid payout transition: ${payout.status} → ${toStatus}`,
      'INVALID_STATE_TRANSITION'
    );
  }
}

// ── Internal "platform" account userId for ledger entries ─────────────────────
// When funds leave the platform, the other side of the double-entry is the
// platform escrow account. This sentinel string is stored as the debitUserId.
const PLATFORM_ACCOUNT_ID = 'platform';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initiate a payout request.
 * Deducts from recipient's wallet immediately — payout is then in PROCESSING state.
 *
 * @param {object} opts
 * @param {string} opts.recipientId   — user receiving the payout
 * @param {number} opts.amount        — integer minor units
 * @param {string} opts.currency
 * @param {string} opts.method        — 'card' | 'mobile_money' | 'bank_transfer' etc.
 * @param {string} [opts.escrowId]
 * @param {string} [opts.initiatedBy] — admin who triggered this
 * @param {object} [opts.metadata]
 * @returns {Payout}
 */
export async function initiate({
  recipientId,
  amount,
  currency,
  method,
  escrowId    = null,
  initiatedBy = null,
  metadata    = {},
}) {
  assertPositive(amount, 'payout amount');

  if (amount < FINANCIAL_LIMITS.MIN_PAYOUT_HTG) {
    throw new FinancialError(
      `Payout below minimum (${FINANCIAL_LIMITS.MIN_PAYOUT_HTG} minor units)`,
      'BELOW_MINIMUM'
    );
  }

  const session = await mongoose.startSession();

  try {
    let payout;

    await session.withTransaction(async () => {
      // Debit recipient wallet (funds leave the platform wallet toward external)
      const wallet = await walletService.debit(
        recipientId,
        amount,
        currency,
        null, // journalId assigned after ledger entry
        session
      );

      // Double-entry: recipient wallet → platform exit account
      const { journalId } = await ledgerService.recordDoubleEntry({
        debitUserId:         String(recipientId),
        creditUserId:        PLATFORM_ACCOUNT_ID,
        amount,
        currency,
        debitBalanceAfter:   wallet.balance,
        creditBalanceAfter:  0,
        referenceType:       'payout',
        referenceId:         new mongoose.Types.ObjectId(), // placeholder; updated after payout created
        description:         `Payout via ${method}`,
        session,
      });

      [payout] = await Payout.create(
        [
          {
            recipientId,
            escrowId:   escrowId ?? null,
            amount,
            currency,
            status:     PAYOUT_STATUS.PROCESSING,
            method,
            initiatedBy: initiatedBy ?? null,
            processedAt: new Date(),
            journalId,
            metadata,
            statusHistory: [{ status: PAYOUT_STATUS.PROCESSING, actorId: initiatedBy }],
          },
        ],
        { session }
      );
    });

    appendAuditLog({
      type:       AUDIT_TYPES.ADMIN_ACTION,
      actorId:    String(initiatedBy ?? recipientId),
      targetId:   String(payout._id),
      targetType: 'payout',
      action:     'initiate',
      meta:       { amount, currency, method },
    });

    return payout;
  } finally {
    await session.endSession();
  }
}

/**
 * Mark a payout as COMPLETED after external transfer confirmation.
 *
 * @param {string} payoutId
 * @param {string} externalRef — Stripe payout ID, mobile money ref, etc.
 * @param {string} actorId
 * @returns {Payout}
 */
export async function complete(payoutId, externalRef, actorId) {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.COMPLETED);

  payout.status      = PAYOUT_STATUS.COMPLETED;
  payout.externalRef = externalRef ?? null;
  payout.completedAt = new Date();
  payout.statusHistory.push({ status: PAYOUT_STATUS.COMPLETED, actorId });
  await payout.save();

  appendAuditLog({
    type:       AUDIT_TYPES.ADMIN_ACTION,
    actorId:    String(actorId),
    targetId:   String(payoutId),
    targetType: 'payout',
    action:     'complete',
    meta:       { externalRef },
  });

  return payout;
}

/**
 * Mark a payout as FAILED and return funds to recipient's wallet.
 * The payout can then be retried (FAILED → PENDING → PROCESSING → ...).
 *
 * @param {string} payoutId
 * @param {string} reason
 * @param {string} actorId
 * @returns {Payout}
 */
export async function fail(payoutId, reason, actorId) {
  const session = await mongoose.startSession();

  try {
    let payout;

    await session.withTransaction(async () => {
      payout = await Payout.findById(payoutId).session(session);
      if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
      assertTransition(payout, PAYOUT_STATUS.FAILED);

      // Return funds to recipient wallet
      const wallet = await walletService.credit(
        payout.recipientId,
        payout.amount,
        payout.currency,
        payout.journalId,
        session
      );

      // Reversal ledger entry
      await ledgerService.recordDoubleEntry({
        debitUserId:         PLATFORM_ACCOUNT_ID,
        creditUserId:        String(payout.recipientId),
        amount:              payout.amount,
        currency:            payout.currency,
        debitBalanceAfter:   0,
        creditBalanceAfter:  wallet.balance,
        referenceType:       'payout',
        referenceId:         payout._id,
        description:         `Payout reversal: ${reason}`,
        session,
      });

      payout.status        = PAYOUT_STATUS.FAILED;
      payout.failureReason = reason ?? null;
      payout.failedAt      = new Date();
      payout.statusHistory.push({ status: PAYOUT_STATUS.FAILED, actorId, note: reason });
      await payout.save({ session });
    });

    appendAuditLog({
      type:       AUDIT_TYPES.ADMIN_ACTION,
      actorId:    String(actorId),
      targetId:   String(payoutId),
      targetType: 'payout',
      action:     'fail',
      meta:       { reason },
    });

    return payout;
  } finally {
    await session.endSession();
  }
}

/**
 * Cancel a PENDING or PROCESSING payout. Returns funds to wallet.
 */
export async function cancel(payoutId, actorId, note = '') {
  const session = await mongoose.startSession();

  try {
    let payout;

    await session.withTransaction(async () => {
      payout = await Payout.findById(payoutId).session(session);
      if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
      assertTransition(payout, PAYOUT_STATUS.CANCELLED);

      // Only return funds if payout had already debited (PROCESSING state)
      if (payout.status === PAYOUT_STATUS.PROCESSING) {
        const wallet = await walletService.credit(
          payout.recipientId,
          payout.amount,
          payout.currency,
          payout.journalId,
          session
        );

        await ledgerService.recordDoubleEntry({
          debitUserId:         PLATFORM_ACCOUNT_ID,
          creditUserId:        String(payout.recipientId),
          amount:              payout.amount,
          currency:            payout.currency,
          debitBalanceAfter:   0,
          creditBalanceAfter:  wallet.balance,
          referenceType:       'payout',
          referenceId:         payout._id,
          description:         `Payout cancelled: ${note}`,
          session,
        });
      }

      payout.status      = PAYOUT_STATUS.CANCELLED;
      payout.cancelledAt = new Date();
      payout.statusHistory.push({ status: PAYOUT_STATUS.CANCELLED, actorId, note });
      await payout.save({ session });
    });

    appendAuditLog({
      type:       AUDIT_TYPES.ADMIN_ACTION,
      actorId:    String(actorId),
      targetId:   String(payoutId),
      targetType: 'payout',
      action:     'cancel',
      meta:       { note },
    });

    return payout;
  } finally {
    await session.endSession();
  }
}

/**
 * Place a payout ON_HOLD for compliance review (admin only).
 */
export async function placeOnHold(payoutId, actorId, note = '') {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.ON_HOLD);

  payout.status = PAYOUT_STATUS.ON_HOLD;
  payout.statusHistory.push({ status: PAYOUT_STATUS.ON_HOLD, actorId, note });
  await payout.save();
  return payout;
}

export async function getPayout(payoutId) {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  return payout;
}

export async function getUserPayouts(userId, { page = 1, limit = 20, status } = {}) {
  const skip  = (page - 1) * limit;
  const query = {
    recipientId: userId,
    ...(status ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    Payout.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payout.countDocuments(query),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}