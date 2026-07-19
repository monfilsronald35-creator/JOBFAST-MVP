/**
 * PaymentRepository — maps the `payments` Supabase table.
 *
 * Mongoose field → Supabase column:
 *   payerId        → payer_id
 *   payeeId        → payee_id
 *   amount         → amount          (integer minor units)
 *   currency       → currency
 *   status         → status
 *   paymentMethod  → payment_method
 *   referenceType  → reference_type
 *   referenceId    → reference_id
 *   gatewayTxnId   → gateway_txn_id
 *   gatewayData    → gateway_data    (jsonb)
 *   failureReason  → failure_reason
 *   refundedAt     → refunded_at
 *   refundReason   → refund_reason
 *   refundAmount   → refund_amount
 */

import { BaseRepository } from './base.repository.js';

class PaymentRepository extends BaseRepository {
  constructor() {
    super('payments');
  }

  _toRow(obj) {
    const row = {};
    if (obj.payerId       !== undefined) row.payer_id        = obj.payerId;
    if (obj.payeeId       !== undefined) row.payee_id        = obj.payeeId;
    if (obj.amount        !== undefined) row.amount          = obj.amount;
    if (obj.currency      !== undefined) row.currency        = obj.currency;
    if (obj.status        !== undefined) row.status          = obj.status;
    if (obj.paymentMethod !== undefined) row.payment_method  = obj.paymentMethod;
    if (obj.referenceType !== undefined) row.reference_type  = obj.referenceType;
    if (obj.referenceId   !== undefined) row.reference_id    = obj.referenceId;
    if (obj.gatewayTxnId  !== undefined) row.gateway_txn_id  = obj.gatewayTxnId;
    if (obj.gatewayData   !== undefined) row.gateway_data    = obj.gatewayData;
    if (obj.failureReason !== undefined) row.failure_reason  = obj.failureReason;
    if (obj.refundedAt    !== undefined) row.refunded_at     = obj.refundedAt;
    if (obj.refundReason  !== undefined) row.refund_reason   = obj.refundReason;
    if (obj.refundAmount  !== undefined) row.refund_amount   = obj.refundAmount;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:           row.id,
      id:            row.id,
      payerId:       row.payer_id,
      payeeId:       row.payee_id,
      amount:        row.amount         ?? 0,
      currency:      row.currency       ?? 'HTG',
      status:        row.status         ?? 'pending',
      paymentMethod: row.payment_method ?? 'wallet',
      referenceType: row.reference_type,
      referenceId:   row.reference_id,
      gatewayTxnId:  row.gateway_txn_id,
      gatewayData:   row.gateway_data   ?? {},
      failureReason: row.failure_reason,
      refundedAt:    row.refunded_at,
      refundReason:  row.refund_reason,
      refundAmount:  row.refund_amount  ?? 0,
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /** Create a new payment record. */
  async create({ payerId, payeeId, amount, currency, paymentMethod, referenceType, referenceId, gatewayData }) {
    return this.insert({ payerId, payeeId, amount, currency, paymentMethod, referenceType, referenceId, gatewayData });
  }

  /** Mark a payment as completed. */
  async complete(paymentId, { gatewayTxnId, gatewayData } = {}) {
    return this.update(paymentId, { status: 'completed', gatewayTxnId, gatewayData });
  }

  /** Mark a payment as failed. */
  async fail(paymentId, reason) {
    return this.update(paymentId, { status: 'failed', failureReason: reason });
  }

  /** Record a full refund. */
  async refund(paymentId, { reason, refundAmount } = {}) {
    return this.update(paymentId, {
      status: 'refunded',
      refundedAt:  new Date().toISOString(),
      refundReason: reason,
      refundAmount,
    });
  }

  /** Paginated payments for a payer or payee. */
  async getUserPayments(userId, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);

    const { data, count, error } = await q;
    this._unwrap({ data, error });
    return {
      payments: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
    };
  }

  /** Find payment by gateway transaction ID (for webhook deduplication). */
  async findByGatewayTxnId(gatewayTxnId) {
    return this.findOne({ gateway_txn_id: gatewayTxnId });
  }
}

export default new PaymentRepository();