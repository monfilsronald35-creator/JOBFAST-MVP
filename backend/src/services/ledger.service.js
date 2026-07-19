/**
 * Ledger Service — double-entry bookkeeping (Supabase)
 *
 * NOTE: wallet credit/debit operations automatically create ledger entries
 * via the PostgreSQL RPCs (jobfast_credit_wallet / jobfast_debit_wallet).
 * Call recordDoubleEntry() only when you need additional ledger records
 * that are NOT covered by a wallet credit/debit (e.g., cross-account entries).
 */

import ledgerRepo from '../repositories/ledger.repository.js';
import { assertPositive, FinancialError } from '../utils/money.js';

/**
 * Record a double-entry pair (debit + credit).
 * The `session` parameter is ignored — no longer needed.
 *
 * @returns {{ journalId, debitEntry, creditEntry }}
 */
export async function recordDoubleEntry({
  debitUserId,
  creditUserId,
  amount,
  currency,
  debitBalanceAfter  = 0,
  creditBalanceAfter = 0,
  referenceType,
  referenceId,
  description = '',
  journalId   = null,
  session     = null, // ignored — kept for API compatibility
}) {
  assertPositive(amount, 'ledger amount');

  if (debitBalanceAfter < 0) {
    throw new FinancialError('Debit balance after entry cannot be negative', 'INSUFFICIENT_FUNDS');
  }

  const result = await ledgerRepo.recordDoubleEntry({
    debitUserId,
    creditUserId,
    amount,
    currency,
    debitBalanceAfter,
    creditBalanceAfter,
    referenceType,
    referenceId: String(referenceId),
    description,
  });

  // If a specific journalId was requested (for linking existing records),
  // we can't enforce it here since ledgerRepo generates its own UUID.
  // The returned journalId is what was actually stored.
  return {
    journalId:   result.journalId,
    debitEntry:  result.debit,
    creditEntry: result.credit,
  };
}

/**
 * Retrieve all entries for a journal (should return exactly 2).
 */
export async function getJournalEntries(journalId) {
  return ledgerRepo.getJournalEntries(journalId);
}

/**
 * Paginated ledger history for a user.
 */
export async function getUserLedger(userId, { page = 1, limit = 20 } = {}) {
  return ledgerRepo.getUserLedger(userId, { page, limit });
}