/**
 * Ledger Service — double-entry bookkeeping.
 *
 * Every financial event MUST produce exactly two LedgerEntry documents:
 *   one DEBIT on the source account + one CREDIT on the destination account.
 *
 * Never call mongoose save() directly here — always use sessions for ACID.
 * The journalId ties the pair together for audit queries.
 */

import { randomUUID } from 'crypto';
import LedgerEntry, { ENTRY_TYPE } from '../models/ledger_entry.model.js';
import { assertPositive } from '../utils/money.js';
import { FinancialError } from '../utils/money.js';

/**
 * Record a double-entry pair.
 *
 * @param {object} opts
 * @param {string}   opts.debitUserId    — account being debited
 * @param {string}   opts.creditUserId   — account being credited
 * @param {number}   opts.amount         — integer minor units (positive)
 * @param {string}   opts.currency
 * @param {number}   opts.debitBalanceAfter  — balance of debit account after entry
 * @param {number}   opts.creditBalanceAfter — balance of credit account after entry
 * @param {string}   opts.referenceType  — 'payment' | 'escrow' | 'payout' | 'commission' | 'adjustment'
 * @param {string}   opts.referenceId    — ObjectId of the source document
 * @param {string}   [opts.description]
 * @param {string}   [opts.journalId]    — reuse an existing journal (default: new UUID)
 * @param {object}   [opts.session]      — Mongoose session for ACID
 * @returns {{ journalId: string, debitEntry: LedgerEntry, creditEntry: LedgerEntry }}
 */
export async function recordDoubleEntry({
  debitUserId,
  creditUserId,
  amount,
  currency,
  debitBalanceAfter,
  creditBalanceAfter,
  referenceType,
  referenceId,
  description = '',
  journalId = null,
  session = null,
}) {
  assertPositive(amount, 'ledger amount');

  if (debitBalanceAfter < 0) {
    throw new FinancialError('Debit balance after entry cannot be negative', 'INSUFFICIENT_FUNDS');
  }

  const jid = journalId ?? randomUUID();
  const saveOpts = session ? { session } : {};

  const [debitEntry, creditEntry] = await Promise.all([
    LedgerEntry.create(
      [
        {
          journalId:    jid,
          userId:       debitUserId,
          type:         ENTRY_TYPE.DEBIT,
          amount,
          currency,
          balanceAfter: debitBalanceAfter,
          referenceType,
          referenceId,
          description,
        },
      ],
      saveOpts
    ),
    LedgerEntry.create(
      [
        {
          journalId:    jid,
          userId:       creditUserId,
          type:         ENTRY_TYPE.CREDIT,
          amount,
          currency,
          balanceAfter: creditBalanceAfter,
          referenceType,
          referenceId,
          description,
        },
      ],
      saveOpts
    ),
  ]);

  // create() with an array returns an array; unwrap.
  return {
    journalId: jid,
    debitEntry:  Array.isArray(debitEntry)  ? debitEntry[0]  : debitEntry,
    creditEntry: Array.isArray(creditEntry) ? creditEntry[0] : creditEntry,
  };
}

/**
 * Retrieve all entries for a journal (should always return exactly 2).
 */
export async function getJournalEntries(journalId) {
  return LedgerEntry.find({ journalId }).sort({ createdAt: 1 }).lean();
}

/**
 * Paginated ledger history for a user.
 */
export async function getUserLedger(userId, { page = 1, limit = 20 } = {}) {
  const skip  = (page - 1) * limit;
  const query = { userId };

  const [entries, total] = await Promise.all([
    LedgerEntry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LedgerEntry.countDocuments(query),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
}