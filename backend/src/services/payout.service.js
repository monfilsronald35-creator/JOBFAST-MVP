/**
 * Payout Service — 6-state payout engine (Supabase)
 *
 * Replaces Mongoose session-based transactions with:
 *   - walletRepo.atomicCredit/Debit RPC calls (ACID via PostgreSQL)
 *   - payoutRepo for state machine
 *
 * Flow:
 *   PENDING → PROCESSING → COMPLETED
 *                       → FAILED → PENDING (retry)
 *   PENDING | PROCESSING → CANCELLED
 *   PENDING → ON_HOLD (compliance review)
 */

import payoutRepo from '../repositories/payout.repository.js';
import walletRepo  from '../repositories/wallet.repository.js';
import {
  PAYOUT_STATUS,
  FINANCIAL_LIMITS,
} from '../config/financial.js';
import { FinancialError, assertPositive } from '../utils/money.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';
import { randomUUID } from 'crypto';

const PAYOUT_TRANSITIONS = Object.freeze({
  [PAYOUT_STATUS.PENDING]:    [PAYOUT_STATUS.PROCESSING, PAYOUT_STATUS.CANCELLED, PAYOUT_STATUS.ON_HOLD],
  [PAYOUT_STATUS.PROCESSING]: [PAYOUT_STATUS.COMPLETED,  PAYOUT_STATUS.FAILED,    PAYOUT_STATUS.CANCELLED],
  [PAYOUT_STATUS.FAILED]:     [PAYOUT_STATUS.PENDING],
  [PAYOUT_STATUS.ON_HOLD]:    [PAYOUT_STATUS.PENDING,    PAYOUT_STATUS.CANCELLED],
});

function assertTransition(payout, toStatus) {
  if (!PAYOUT_TRANSITIONS[payout.status]?.includes(toStatus)) {
    throw new FinancialError(
      `Invalid payout transition: ${payout.status} → ${toStatus}`,
      'INVALID_STATE_TRANSITION'
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initiate a payout request.
 * Deducts from recipient's wallet immediately.
 */
export async function initiate({ recipientId, amount, currency, method, escrowId = null, initiatedBy = null, metadata = {} }) {
  assertPositive(amount, 'payout amount');

  if (amount < FINANCIAL_LIMITS.MIN_PAYOUT_HTG) {
    throw new FinancialError(
      `Payout below minimum (${FINANCIAL_LIMITS.MIN_PAYOUT_HTG} minor units)`,
      'BELOW_MINIMUM'
    );
  }

  const journalId = randomUUID();

  // ACID debit — atomically deducts from wallet + creates ledger entry
  await walletRepo.atomicDebit({
    userId:        String(recipientId),
    amount,
    currency,
    journalId,
    referenceType: 'payout',
    referenceId:   journalId,
    description:   `Payout via ${method}`,
  });

  const payout = await payoutRepo.insert({
    userId:         String(recipientId),
    amount,
    currency,
    status:         PAYOUT_STATUS.PROCESSING,
    method,
    accountDetails: metadata,
    processedAt:    new Date().toISOString(),
  });

  appendAuditLog({
    type:       AUDIT_TYPES.ADMIN_ACTION,
    actorId:    String(initiatedBy ?? recipientId),
    targetId:   String(payout.id),
    targetType: 'payout',
    action:     'initiate',
    meta:       { amount, currency, method },
  });

  return payout;
}

/**
 * Mark a payout as COMPLETED after external transfer confirmation.
 */
export async function complete(payoutId, externalRef, actorId) {
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.COMPLETED);

  const updated = await payoutRepo.complete(payoutId, externalRef);

  appendAuditLog({
    type:       AUDIT_TYPES.ADMIN_ACTION,
    actorId:    String(actorId),
    targetId:   String(payoutId),
    targetType: 'payout',
    action:     'complete',
    meta:       { externalRef },
  });

  return updated;
}

/**
 * Mark a payout as FAILED and return funds to recipient's wallet.
 */
export async function fail(payoutId, reason, actorId) {
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.FAILED);

  // Return funds to recipient wallet
  await walletRepo.atomicCredit({
    userId:        payout.userId,
    amount:        payout.amount,
    currency:      payout.currency,
    journalId:     randomUUID(),
    referenceType: 'payout',
    referenceId:   String(payoutId),
    description:   `Payout reversal: ${reason}`,
  });

  const updated = await payoutRepo.fail(payoutId, reason);

  appendAuditLog({
    type:       AUDIT_TYPES.ADMIN_ACTION,
    actorId:    String(actorId),
    targetId:   String(payoutId),
    targetType: 'payout',
    action:     'fail',
    meta:       { reason },
  });

  return updated;
}

/**
 * Cancel a PENDING or PROCESSING payout. Returns funds to wallet if already processing.
 */
export async function cancel(payoutId, actorId, note = '') {
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.CANCELLED);

  // Only return funds if the debit already ran (PROCESSING state)
  if (payout.status === PAYOUT_STATUS.PROCESSING) {
    await walletRepo.atomicCredit({
      userId:        payout.userId,
      amount:        payout.amount,
      currency:      payout.currency,
      journalId:     randomUUID(),
      referenceType: 'payout',
      referenceId:   String(payoutId),
      description:   `Payout cancelled: ${note}`,
    });
  }

  const updated = await payoutRepo.cancel(payoutId);

  appendAuditLog({
    type:       AUDIT_TYPES.ADMIN_ACTION,
    actorId:    String(actorId),
    targetId:   String(payoutId),
    targetType: 'payout',
    action:     'cancel',
    meta:       { note },
  });

  return updated;
}

/**
 * Place a payout ON_HOLD for compliance review (admin only).
 */
export async function placeOnHold(payoutId, actorId, note = '') {
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  assertTransition(payout, PAYOUT_STATUS.ON_HOLD);

  return payoutRepo.update(payoutId, { status: PAYOUT_STATUS.ON_HOLD });
}

export async function getPayout(payoutId) {
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) throw new FinancialError('Payout not found', 'NOT_FOUND');
  return payout;
}

export async function getUserPayouts(userId, { page = 1, limit = 20, status } = {}) {
  const result = await payoutRepo.getUserPayouts(String(userId), { page, limit, status });
  return { items: result.payouts, total: result.total, page: result.page, limit: result.limit, pages: Math.ceil(result.total / limit) };
}