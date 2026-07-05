/**
 * Wallet Service — JOBFAST Financial Foundation
 *
 * Rules (FinOps §2):
 * - Every credit/debit runs inside a MongoDB session (ACID)
 * - Balance is always checked before debit — no optimistic debit
 * - Wallet is unique per user — enforced at DB level
 * - All amounts are integer minor units
 */

import mongoose from 'mongoose';
import Wallet from '../models/wallet.model.js';
import { assertPositive, assertNonNegative, FinancialError } from '../utils/money.js';
import { WALLET_STATUS } from '../config/financial.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';

/**
 * Create a wallet for a new user.
 * Called during registration or on first payment attempt.
 * Idempotent: returns existing wallet if already present.
 */
export async function createWallet(userId, currency = 'HTG') {
  const existing = await Wallet.findOne({ userId });
  if (existing) return existing;

  const wallet = await Wallet.create({ userId, currency, balance: 0 });
  return wallet;
}

/**
 * Get a user's wallet. Returns null if not found.
 */
export async function getWallet(userId) {
  return Wallet.findOne({ userId });
}

/**
 * Get a wallet by its _id.
 */
export async function getWalletById(walletId) {
  return Wallet.findById(walletId);
}

/**
 * Credit a wallet — add funds.
 *
 * @param {string|ObjectId} userId
 * @param {number}          amount      Integer minor units (must be > 0)
 * @param {string}          currency
 * @param {string}          journalId   Links this credit to a ledger entry (Batch 2)
 * @param {object}          [session]   Mongoose session for ACID multi-doc transactions
 */
export async function credit(userId, amount, currency, journalId, session = null) {
  assertPositive(amount, 'credit amount');

  const opts = session ? { session } : {};

  const wallet = await Wallet.findOne({ userId }, null, opts);
  if (!wallet) throw new FinancialError(`Wallet not found for user ${userId}`, 'WALLET_NOT_FOUND');
  if (!wallet.canCredit()) {
    throw new FinancialError(
      `Wallet is ${wallet.status} — credits not allowed`,
      'WALLET_NOT_ACTIVE'
    );
  }
  if (wallet.currency !== currency) {
    throw new FinancialError(
      `Currency mismatch: wallet is ${wallet.currency}, credit is ${currency}`,
      'CURRENCY_MISMATCH'
    );
  }

  wallet.balance += amount;
  wallet.totalCredited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save(opts);

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(userId),
    targetId: String(wallet._id),
    targetType: 'wallet',
    action: 'credit',
    meta: { amount, currency, journalId, newBalance: wallet.balance },
  });

  return wallet;
}

/**
 * Debit a wallet — deduct funds.
 * Atomically checks and deducts — never allows negative balance.
 *
 * @param {string|ObjectId} userId
 * @param {number}          amount      Integer minor units (must be > 0)
 * @param {string}          currency
 * @param {string}          journalId   Links to a ledger entry (Batch 2)
 * @param {object}          [session]   Mongoose session for ACID
 */
export async function debit(userId, amount, currency, journalId, session = null) {
  assertPositive(amount, 'debit amount');

  const opts = session ? { session } : {};

  const wallet = await Wallet.findOne({ userId }, null, opts);
  if (!wallet) throw new FinancialError(`Wallet not found for user ${userId}`, 'WALLET_NOT_FOUND');
  if (!wallet.canDebit(amount)) {
    if (wallet.status !== WALLET_STATUS.ACTIVE) {
      throw new FinancialError(
        `Wallet is ${wallet.status} — debits not allowed`,
        'WALLET_NOT_ACTIVE'
      );
    }
    throw new FinancialError('Insufficient wallet balance', 'INSUFFICIENT_FUNDS');
  }
  if (wallet.currency !== currency) {
    throw new FinancialError(
      `Currency mismatch: wallet is ${wallet.currency}, debit is ${currency}`,
      'CURRENCY_MISMATCH'
    );
  }

  wallet.balance -= amount;
  wallet.totalDebited += amount;
  wallet.lastTransactionAt = new Date();
  await wallet.save(opts);

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(userId),
    targetId: String(wallet._id),
    targetType: 'wallet',
    action: 'debit',
    meta: { amount, currency, journalId, newBalance: wallet.balance },
  });

  return wallet;
}

/**
 * Admin: freeze a wallet.
 */
export async function freezeWallet(walletId, adminId) {
  const wallet = await Wallet.findByIdAndUpdate(
    walletId,
    { status: WALLET_STATUS.FROZEN },
    { new: true }
  );
  if (!wallet) throw new FinancialError('Wallet not found', 'WALLET_NOT_FOUND');

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: adminId,
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
  const wallet = await Wallet.findByIdAndUpdate(
    walletId,
    { status: WALLET_STATUS.ACTIVE },
    { new: true }
  );
  if (!wallet) throw new FinancialError('Wallet not found', 'WALLET_NOT_FOUND');

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: adminId,
    targetId: String(walletId),
    targetType: 'wallet',
    action: 'unfreeze',
  });

  return wallet;
}