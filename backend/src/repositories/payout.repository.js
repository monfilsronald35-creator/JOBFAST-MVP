/**
 * PayoutRepository — maps the `payouts` Supabase table.
 *
 * Mongoose field → Supabase column:
 *   userId         → user_id
 *   amount         → amount          (integer minor units)
 *   currency       → currency
 *   status         → status          ('pending'|'processing'|'completed'|'failed'|'cancelled')
 *   method         → method          ('bank_transfer'|'mobile_money'|'crypto'|'cash')
 *   accountDetails → account_details (jsonb — bank account / mobile money number / etc.)
 *   gatewayTxnId   → gateway_txn_id
 *   failureReason  → failure_reason
 *   processedAt    → processed_at
 *   scheduledAt    → scheduled_at
 */

import { BaseRepository } from './base.repository.js';

class PayoutRepository extends BaseRepository {
  constructor() {
    super('payouts');
  }

  _toRow(obj) {
    const row = {};
    if (obj.userId         !== undefined) row.user_id         = obj.userId;
    if (obj.amount         !== undefined) row.amount          = obj.amount;
    if (obj.currency       !== undefined) row.currency        = obj.currency;
    if (obj.status         !== undefined) row.status          = obj.status;
    if (obj.method         !== undefined) row.method          = obj.method;
    if (obj.accountDetails !== undefined) row.account_details = obj.accountDetails;
    if (obj.gatewayTxnId   !== undefined) row.gateway_txn_id  = obj.gatewayTxnId;
    if (obj.failureReason  !== undefined) row.failure_reason  = obj.failureReason;
    if (obj.processedAt    !== undefined) row.processed_at    = obj.processedAt;
    if (obj.scheduledAt    !== undefined) row.scheduled_at    = obj.scheduledAt;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:            row.id,
      id:             row.id,
      userId:         row.user_id,
      amount:         row.amount          ?? 0,
      currency:       row.currency        ?? 'HTG',
      status:         row.status          ?? 'pending',
      method:         row.method          ?? 'bank_transfer',
      accountDetails: row.account_details ?? {},
      gatewayTxnId:   row.gateway_txn_id,
      failureReason:  row.failure_reason,
      processedAt:    row.processed_at,
      scheduledAt:    row.scheduled_at,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /** Create a payout request. */
  async request({ userId, amount, currency, method, accountDetails, scheduledAt }) {
    return this.insert({ userId, amount, currency, method, accountDetails, scheduledAt, status: 'pending' });
  }

  /** Transition to 'processing'. */
  async markProcessing(payoutId) {
    return this.update(payoutId, { status: 'processing' });
  }

  /** Complete a payout with optional gateway ID. */
  async complete(payoutId, gatewayTxnId) {
    return this.update(payoutId, {
      status: 'completed',
      gatewayTxnId,
      processedAt: new Date().toISOString(),
    });
  }

  /** Fail a payout with reason. */
  async fail(payoutId, reason) {
    return this.update(payoutId, { status: 'failed', failureReason: reason });
  }

  /** Cancel a payout. */
  async cancel(payoutId) {
    return this.update(payoutId, { status: 'cancelled' });
  }

  /** Paginated payout history for a user. */
  async getUserPayouts(userId, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);

    const { data, count, error } = await q;
    this._unwrap({ data, error });
    return {
      payouts: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
    };
  }

  /** Find all pending payouts (for batch processing). */
  async getPendingPayouts({ limit = 50 } = {}) {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }
}

export default new PayoutRepository();