/**
 * Wallet Service — JOBFAST Financial Foundation (Supabase)
 *
 * All credit/debit operations delegate to PostgreSQL stored procedures
 * via walletRepo RPCs for ACID atomicity. The `session` parameter
 * accepted by the old Mongoose version is present for API compatibility
 * but is silently ignored — atomicity is guaranteed at the DB level.
 */

import walletRepo from '../repositories/wallet.repository.js';
import { assertPositive, FinancialError } from '../utils/money.js';
import { WALLET_STATUS } from '../config/financial.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';
import { randomUUID } from 'crypto';

/**
 * Create a wallet for a new user.
 * Idempotent: returns existing wallet if already present.
 */
export async function createWallet(userId, currency = 'HTG') {
  return walletRepo.ensureWallet(userId, currency);
}

/**
 * Get a user's wallet. Returns null if not found.
 */
export async function getWallet(userId, currency = 'HTG') {
  return walletRepo.findByUser(userId, currency);
}

/**
 * Get a wallet by its ID.
 */
export async function getWalletById(walletId) {
  return walletRepo.findById(walletId);
}

/**
 * Credit a wallet — add funds.
 *
 * @param {string} userId
 * @param {number} amount         Integer minor units (must be > 0)
 * @param {string} currency
 * @param {object} [opts]
 * @param {string} [opts.referenceType]  e.g. 'escrow', 'payment', 'payout', 'manual'
 * @param {string} [opts.referenceId]
 * @param {string} [opts.description]
 * @param {string} [opts.journalId]     — optional; new UUID used if omitted
 * @param {*}      [_session]           — ignored; kept for API compatibility
 */
export async function credit(userId, amount, currency, opts = {}, _session = null) {
  assertPositive(amount, 'credit amount');

  // Allow callers still using old positional (string journalId as 4th arg)
  const options = typeof opts === 'string' || opts == null ? {} : opts;

  return walletRepo.atomicCredit({
    userId,
    amount,
    currency,
    journalId:     options.journalId     || randomUUID(),
    referenceType: options.referenceType || 'manual',
    referenceId:   options.referenceId   || String(userId),
    description:   options.description   || 'Wallet credit',
  });
}

/**
 * Debit a wallet — deduct funds.
 * Throws INSUFFICIENT_FUNDS if balance is too low.
 *
 * @param {string} userId
 * @param {number} amount         Integer minor units (must be > 0)
 * @param {string} currency
 * @param {object} [opts]
 * @param {*}      [_session]     — ignored; kept for API compatibility
 */
export async function debit(userId, amount, currency, opts = {}, _session = null) {
  assertPositive(amount, 'debit amount');

  const options = typeof opts === 'string' || opts == null ? {} : opts;

  return walletRepo.atomicDebit({
    userId,
    amount,
    currency,
    journalId:     options.journalId     || randomUUID(),
    referenceType: options.referenceType || 'manual',
    referenceId:   options.referenceId   || String(userId),
    description:   options.description   || 'Wallet debit',
  });
}

/**
 * Admin: freeze a wallet.
 */
export async function freezeWallet(walletId, adminId) {
  const wallet = await walletRepo.freeze(walletId);
  if (!wallet) throw new FinancialError('Wallet not found', 'WALLET_NOT_FOUND');

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(adminId),
    targetId: String(walletId),
    targetType: 'wallet',
    action: 'freeze',
  });

  return wallet;
}

/**
 * Admin: unfreeze a wallet.
 */
export async function unfreezeWallet(walletId, adminId) {
  const wallet = await walletRepo.unfreeze(walletId);
  if (!wallet) throw new FinancialError('Wallet not found', 'WALLET_NOT_FOUND');

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(adminId),
    targetId: String(walletId),
    targetType: 'wallet',
    action: 'unfreeze',
  });

  return wallet;
}