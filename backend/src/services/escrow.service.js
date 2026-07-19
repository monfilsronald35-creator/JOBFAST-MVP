/**
 * Escrow Service — 7-state escrow engine (Supabase)
 *
 * Replaces Mongoose session-based transactions with:
 *   - walletRepo.atomicCredit/Debit RPC calls (ACID via PostgreSQL)
 *   - escrowRepo for status state machine
 *
 * Flow:
 *   CREATED → FUNDED (payment captured)
 *   FUNDED  → RELEASED (work completed, net amount credited to worker)
 *   FUNDED  → REFUNDED (job cancelled, amount returned to employer)
 *   FUNDED  → DISPUTED → RESOLVED → RELEASED | REFUNDED
 *   CREATED | FUNDED → EXPIRED (auto-refund after ESCROW_MAX_HOLD_DAYS)
 */

import escrowRepo from '../repositories/escrow.repository.js';
import walletRepo  from '../repositories/wallet.repository.js';
import {
  ESCROW_STATUS,
  FINANCIAL_LIMITS,
  canTransitionEscrow,
} from '../config/financial.js';
import { FinancialError, assertPositive, subtract } from '../utils/money.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';
import * as commissionService from './commission.service.js';
import { randomUUID } from 'crypto';

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
 * Does NOT move money — payment.service already captured funds.
 */
export async function hold({ jobId, paymentId, employerId, workerId, amount, currency, actorId = null }) {
  assertPositive(amount, 'escrow amount');

  // Idempotency: return existing if same payment already has an escrow
  const existing = await escrowRepo.findOne({ booking_id: paymentId });
  if (existing) return existing;

  const expiresAt = new Date(Date.now() + FINANCIAL_LIMITS.ESCROW_MAX_HOLD_DAYS * 24 * 60 * 60 * 1000);

  const escrow = await escrowRepo.insert({
    jobId,
    bookingId:  paymentId,
    payerId:    employerId,
    payeeId:    workerId,
    amount,
    currency,
    status:     ESCROW_STATUS.FUNDED,
    heldAt:     new Date().toISOString(),
    releaseDate: expiresAt.toISOString(),
    statusHistory: [{ status: ESCROW_STATUS.FUNDED, at: new Date().toISOString(), by: String(actorId ?? employerId) }],
  });

  appendAuditLog({
    type: AUDIT_TYPES.BOOKING_ACTION,
    actorId: String(actorId ?? employerId),
    targetId: String(escrow.id),
    targetType: 'escrow',
    action: 'hold',
    meta: { amount, currency, jobId, paymentId },
  });

  return escrow;
}

/**
 * Release escrow to the worker (net of commission).
 */
export async function release(escrowId, actorId, opts = {}) {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.RELEASED);

  // Calculate commission on gross amount
  const commission = await commissionService.calculate({
    payerId:       escrow.payeeId,
    userRole:      opts.userRole    ?? 'worker',
    baseAmount:    escrow.amount,
    currency:      escrow.currency,
    referenceType: 'escrow',
    referenceId:   escrow.id,
    profession:    opts.profession  ?? null,
    jobType:       opts.jobType     ?? null,
    promoCode:     opts.promoCode   ?? null,
    promoRate:     opts.promoRate   ?? null,
  });

  const netAmount = subtract(escrow.amount, commission.commissionAmount, 'escrow amount');

  // ACID credit to worker wallet (creates ledger entry via RPC)
  const journalId = randomUUID();
  await walletRepo.atomicCredit({
    userId:        escrow.payeeId,
    amount:        netAmount,
    currency:      escrow.currency,
    journalId,
    referenceType: 'escrow',
    referenceId:   String(escrow.id),
    description:   `Escrow release – net after ${(commission.rate * 100).toFixed(1)}% commission`,
  });

  // Mark commission as settled
  await commissionService.settleCommission(commission.id, journalId);

  // Update escrow status
  const updated = await escrowRepo.updateStatus(escrowId, {
    status: ESCROW_STATUS.RELEASED,
    by:     String(actorId),
    extraFields: { releasedAt: new Date().toISOString() },
  });

  appendAuditLog({
    type: AUDIT_TYPES.BOOKING_ACTION,
    actorId: String(actorId),
    targetId: String(escrowId),
    targetType: 'escrow',
    action: 'release',
    meta: { netAmount, commissionAmount: commission.commissionAmount },
  });

  return updated;
}

/**
 * Refund escrow to the employer.
 */
export async function refund(escrowId, actorId, note = '') {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.REFUNDED);

  // ACID credit to employer wallet
  await walletRepo.atomicCredit({
    userId:        escrow.payerId,
    amount:        escrow.amount,
    currency:      escrow.currency,
    journalId:     randomUUID(),
    referenceType: 'escrow',
    referenceId:   String(escrow.id),
    description:   `Escrow refund${note ? ': ' + note : ''}`,
  });

  const updated = await escrowRepo.updateStatus(escrowId, {
    status: ESCROW_STATUS.REFUNDED,
    by:     String(actorId),
    note,
    extraFields: { refundedAt: new Date().toISOString() },
  });

  appendAuditLog({
    type: AUDIT_TYPES.BOOKING_ACTION,
    actorId: String(actorId),
    targetId: String(escrowId),
    targetType: 'escrow',
    action: 'refund',
    meta: { amount: escrow.amount, note },
  });

  return updated;
}

/**
 * Open a dispute on a funded escrow.
 */
export async function dispute(escrowId, actorId, note = '') {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.DISPUTED);

  const updated = await escrowRepo.updateStatus(escrowId, {
    status: ESCROW_STATUS.DISPUTED,
    by:     String(actorId),
    note,
    extraFields: { disputeReason: note },
  });

  appendAuditLog({
    type: AUDIT_TYPES.DISPUTE_ESCALATED,
    actorId: String(actorId),
    targetId: String(escrowId),
    targetType: 'escrow',
    action: 'dispute',
    meta: { note },
  });

  return updated;
}

/**
 * Resolve a dispute (admin only). Call release() or refund() afterwards as outcome.
 */
export async function resolveDispute(escrowId, actorId, note = '') {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  assertTransition(escrow, ESCROW_STATUS.RESOLVED);

  return escrowRepo.updateStatus(escrowId, {
    status: ESCROW_STATUS.RESOLVED,
    by:     String(actorId),
    note,
    extraFields: { resolvedAt: new Date().toISOString(), resolutionNote: note },
  });
}

/**
 * Expire a funded escrow (auto-refund path).
 */
export async function expire(escrowId) {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');

  if (![ESCROW_STATUS.CREATED, ESCROW_STATUS.FUNDED].includes(escrow.status)) {
    return escrow;
  }

  if (escrow.status === ESCROW_STATUS.FUNDED) {
    return refund(escrowId, 'system', 'Auto-expired after hold period');
  }

  return escrowRepo.updateStatus(escrowId, { status: ESCROW_STATUS.EXPIRED, by: 'system' });
}

export async function getEscrow(escrowId) {
  const escrow = await escrowRepo.findById(escrowId);
  if (!escrow) throw new FinancialError('Escrow not found', 'NOT_FOUND');
  return escrow;
}

export async function getUserEscrows(userId, { page = 1, limit = 20, status } = {}) {
  return escrowRepo.getUserEscrows(String(userId), { page, limit, status });
}