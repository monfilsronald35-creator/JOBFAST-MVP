/**
 * CommissionRepository — maps the `commissions` Supabase table.
 *
 * Mongoose field → Supabase column:
 *   escrowId     → escrow_id
 *   paymentId    → payment_id
 *   fromUserId   → from_user_id   (payer of commission — usually the payee of the job)
 *   tier         → tier           ('role'|'profession'|'job_type'|'amount_bracket'|'promo_code')
 *   tierContext  → tier_context   (jsonb — what triggered this tier)
 *   rate         → rate           (numeric, e.g. 0.08 = 8%)
 *   baseAmount   → base_amount    (integer minor units — amount commission was calculated on)
 *   amount       → amount         (integer minor units — actual commission amount)
 *   currency     → currency
 *   status       → status         ('pending'|'settled'|'waived'|'refunded')
 *   journalId    → journal_id     (ledger entry that settled this commission)
 *   settledAt    → settled_at
 */

import { BaseRepository } from './base.repository.js';

class CommissionRepository extends BaseRepository {
  constructor() {
    super('commissions');
  }

  _toRow(obj) {
    const row = {};
    if (obj.escrowId    !== undefined) row.escrow_id    = obj.escrowId;
    if (obj.paymentId   !== undefined) row.payment_id   = obj.paymentId;
    if (obj.fromUserId  !== undefined) row.from_user_id = obj.fromUserId;
    if (obj.tier        !== undefined) row.tier         = obj.tier;
    if (obj.tierContext !== undefined) row.tier_context  = obj.tierContext;
    if (obj.rate        !== undefined) row.rate         = obj.rate;
    if (obj.baseAmount  !== undefined) row.base_amount  = obj.baseAmount;
    if (obj.amount      !== undefined) row.amount       = obj.amount;
    if (obj.currency    !== undefined) row.currency     = obj.currency;
    if (obj.status      !== undefined) row.status       = obj.status;
    if (obj.journalId   !== undefined) row.journal_id   = obj.journalId;
    if (obj.settledAt   !== undefined) row.settled_at   = obj.settledAt;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:         row.id,
      id:          row.id,
      escrowId:    row.escrow_id,
      paymentId:   row.payment_id,
      fromUserId:  row.from_user_id,
      tier:        row.tier         ?? 'role',
      tierContext: row.tier_context ?? {},
      rate:        row.rate         ?? 0,
      baseAmount:  row.base_amount  ?? 0,
      amount:      row.amount       ?? 0,
      currency:    row.currency     ?? 'HTG',
      status:      row.status       ?? 'pending',
      journalId:   row.journal_id,
      settledAt:   row.settled_at,
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /** Record a new commission (called after calculation). */
  async record({ escrowId, paymentId, fromUserId, tier, tierContext, rate, baseAmount, amount, currency }) {
    return this.insert({ escrowId, paymentId, fromUserId, tier, tierContext, rate, baseAmount, amount, currency, status: 'pending' });
  }

  /** Mark commission as settled, linking the ledger journal entry. */
  async settle(commissionId, journalId) {
    return this.update(commissionId, {
      status:    'settled',
      journalId,
      settledAt: new Date().toISOString(),
    });
  }

  /** Waive a commission (admin action). */
  async waive(commissionId) {
    return this.update(commissionId, { status: 'waived' });
  }

  /** Paginated commission history for a user. */
  async getUserCommissions(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { data, count, error } = await this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    this._unwrap({ data, error });
    return {
      commissions: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
    };
  }

  /** Find commission by escrow + status, e.g. to check if already settled. */
  async findByEscrow(escrowId) {
    return this.findOne({ escrow_id: escrowId });
  }
}

export default new CommissionRepository();