/**
 * LedgerRepository — maps the `ledger_entries` Supabase table.
 *
 * CRITICAL: ledger_entries is IMMUTABLE and APPEND-ONLY.
 * Never update or delete rows. INSERT only.
 * Violations break double-entry accounting integrity.
 *
 * Double-entry convention: every transaction produces two rows
 * with the same journal_id — one DEBIT, one CREDIT.
 * sum(amount WHERE type='credit') - sum(amount WHERE type='debit')
 * MUST always equal the wallet balance.
 *
 * Mongoose field → Supabase column:
 *   journalId     → journal_id     (groups a debit+credit pair)
 *   userId        → user_id
 *   type          → type           ('debit'|'credit')
 *   amount        → amount         (integer minor units, always positive)
 *   currency      → currency
 *   referenceType → reference_type ('escrow'|'payment'|'payout'|'commission'|'transfer'|'refund')
 *   referenceId   → reference_id
 *   description   → description
 *   balanceAfter  → balance_after  (snapshot of wallet balance after this entry)
 */

import { BaseRepository } from './base.repository.js';
import { randomUUID } from 'crypto';

class LedgerRepository extends BaseRepository {
  constructor() {
    super('ledger_entries');
  }

  _toRow(obj) {
    const row = {};
    if (obj.journalId     !== undefined) row.journal_id      = obj.journalId;
    if (obj.userId        !== undefined) row.user_id         = obj.userId;
    if (obj.type          !== undefined) row.type            = obj.type;
    if (obj.amount        !== undefined) row.amount          = obj.amount;
    if (obj.currency      !== undefined) row.currency        = obj.currency;
    if (obj.referenceType !== undefined) row.reference_type  = obj.referenceType;
    if (obj.referenceId   !== undefined) row.reference_id    = obj.referenceId;
    if (obj.description   !== undefined) row.description     = obj.description;
    if (obj.balanceAfter  !== undefined) row.balance_after   = obj.balanceAfter;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:           row.id,
      id:            row.id,
      journalId:     row.journal_id,
      userId:        row.user_id,
      type:          row.type          ?? 'credit',
      amount:        row.amount        ?? 0,
      currency:      row.currency      ?? 'HTG',
      referenceType: row.reference_type,
      referenceId:   row.reference_id,
      description:   row.description  ?? '',
      balanceAfter:  row.balance_after ?? 0,
      createdAt:     row.created_at,
    };
  }

  // Prevent updates/deletes — ledger is immutable
  async update() { throw new Error('ledger_entries is immutable — updates are not allowed'); }
  async delete() { throw new Error('ledger_entries is immutable — deletes are not allowed'); }

  // ── Domain methods ────────────────────────────────────────────────────────

  /**
   * Record a double-entry pair (debit + credit) atomically.
   * Both entries share the same journalId.
   * Returns { journalId, debit, credit }.
   */
  async recordDoubleEntry({
    debitUserId,
    creditUserId,
    amount,
    currency,
    referenceType,
    referenceId,
    description = '',
    debitBalanceAfter  = 0,
    creditBalanceAfter = 0,
  }) {
    const journalId = randomUUID();

    const rows = await this.insertMany([
      {
        journalId, userId: debitUserId,  type: 'debit',
        amount, currency, referenceType, referenceId,
        description, balanceAfter: debitBalanceAfter,
      },
      {
        journalId, userId: creditUserId, type: 'credit',
        amount, currency, referenceType, referenceId,
        description, balanceAfter: creditBalanceAfter,
      },
    ]);

    return {
      journalId,
      debit:  rows.find(r => r.type === 'debit'),
      credit: rows.find(r => r.type === 'credit'),
    };
  }

  /**
   * Paginated journal entries for a user.
   * Matches ledger.service.js getUserLedger() interface.
   */
  async getUserLedger(userId, { page = 1, limit = 20, referenceType = null } = {}) {
    const offset = (page - 1) * limit;
    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (referenceType) q = q.eq('reference_type', referenceType);

    const { data, count, error } = await q;
    this._unwrap({ data, error });
    return {
      entries: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
    };
  }

  /** Fetch all entries for a journal (should return exactly 2 rows). */
  async getJournalEntries(journalId) {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('journal_id', journalId);
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }
}

export default new LedgerRepository();