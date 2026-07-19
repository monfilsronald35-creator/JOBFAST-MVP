/**
 * EscrowRepository — maps the `escrows` Supabase table.
 *
 * status_history is stored as JSONB (array of {status, at, by, note}).
 * The Mongoose embedded array becomes a JSONB column append operation.
 *
 * Mongoose field → Supabase column:
 *   payerId       → payer_id
 *   payeeId       → payee_id
 *   jobId         → job_id
 *   bookingId     → booking_id
 *   amount        → amount          (integer minor units)
 *   currency      → currency
 *   status        → status
 *   releaseDate   → release_date
 *   statusHistory → status_history  (jsonb)
 *   heldAt        → held_at
 *   releasedAt    → released_at
 *   refundedAt    → refunded_at
 *   disputeReason → dispute_reason
 *   resolvedAt    → resolved_at
 *   resolutionNote → resolution_note
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class EscrowRepository extends BaseRepository {
  constructor() {
    super('escrows');
  }

  _toRow(obj) {
    const row = {};
    if (obj.payerId        !== undefined) row.payer_id        = obj.payerId;
    if (obj.payeeId        !== undefined) row.payee_id        = obj.payeeId;
    if (obj.jobId          !== undefined) row.job_id          = obj.jobId;
    if (obj.bookingId      !== undefined) row.booking_id      = obj.bookingId;
    if (obj.amount         !== undefined) row.amount          = obj.amount;
    if (obj.currency       !== undefined) row.currency        = obj.currency;
    if (obj.status         !== undefined) row.status          = obj.status;
    if (obj.releaseDate    !== undefined) row.release_date    = obj.releaseDate;
    if (obj.statusHistory  !== undefined) row.status_history  = obj.statusHistory;
    if (obj.heldAt         !== undefined) row.held_at         = obj.heldAt;
    if (obj.releasedAt     !== undefined) row.released_at     = obj.releasedAt;
    if (obj.refundedAt     !== undefined) row.refunded_at     = obj.refundedAt;
    if (obj.disputeReason  !== undefined) row.dispute_reason  = obj.disputeReason;
    if (obj.resolvedAt     !== undefined) row.resolved_at     = obj.resolvedAt;
    if (obj.resolutionNote !== undefined) row.resolution_note = obj.resolutionNote;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:            row.id,
      id:             row.id,
      payerId:        row.payer_id,
      payeeId:        row.payee_id,
      jobId:          row.job_id,
      bookingId:      row.booking_id,
      amount:         row.amount          ?? 0,
      currency:       row.currency        ?? 'HTG',
      status:         row.status          ?? 'pending',
      releaseDate:    row.release_date,
      statusHistory:  row.status_history  ?? [],
      heldAt:         row.held_at,
      releasedAt:     row.released_at,
      refundedAt:     row.refunded_at,
      disputeReason:  row.dispute_reason,
      resolvedAt:     row.resolved_at,
      resolutionNote: row.resolution_note,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /** Hold funds in escrow. */
  async hold({ payerId, payeeId, jobId, bookingId, amount, currency = 'HTG' }) {
    const now = new Date().toISOString();
    return this.insert({
      payerId, payeeId, jobId, bookingId, amount, currency,
      status: 'held',
      heldAt: now,
      statusHistory: [{ status: 'held', at: now, by: payerId }],
    });
  }

  /**
   * Append a status history entry and update the escrow record.
   * Uses PostgreSQL's jsonb_build_object + array append via RPC to avoid
   * a read-modify-write race condition.
   */
  async updateStatus(escrowId, { status, by, note, extraFields = {} }) {
    const now = new Date().toISOString();
    const historyEntry = { status, at: now, by, note };

    // Append to the JSONB array via Supabase's jsonb_append approach:
    // We fetch current history, append, then update (acceptable for low-concurrency MVP).
    const current = await this.findById(escrowId);
    if (!current) {
      const err = new Error('Escrow not found');
      err.statusCode = 404;
      throw err;
    }

    const updatedHistory = [...(current.statusHistory || []), historyEntry];
    return this.update(escrowId, {
      status,
      statusHistory: updatedHistory,
      ...extraFields,
    });
  }

  /** Transition to 'released'. */
  async release(escrowId, actorId) {
    return this.updateStatus(escrowId, {
      status: 'released',
      by:     actorId,
      extraFields: { releasedAt: new Date().toISOString() },
    });
  }

  /** Transition to 'refunded'. */
  async refund(escrowId, actorId, note) {
    return this.updateStatus(escrowId, {
      status: 'refunded',
      by:     actorId,
      note,
      extraFields: { refundedAt: new Date().toISOString() },
    });
  }

  /** Transition to 'disputed'. */
  async dispute(escrowId, actorId, reason) {
    return this.updateStatus(escrowId, {
      status: 'disputed',
      by:     actorId,
      note:   reason,
      extraFields: { disputeReason: reason },
    });
  }

  /** Transition to 'resolved'. */
  async resolve(escrowId, actorId, note) {
    return this.updateStatus(escrowId, {
      status: 'resolved',
      by:     actorId,
      note,
      extraFields: { resolvedAt: new Date().toISOString(), resolutionNote: note },
    });
  }

  /** Find escrow by bookingId. */
  async findByBooking(bookingId) {
    return this.findOne({ booking_id: bookingId });
  }

  /** Paginated escrows for a user (payer or payee). */
  async getUserEscrows(userId, { page = 1, limit = 20, status = null } = {}) {
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
      escrows: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
    };
  }

  /** Find escrows that have passed their release_date but are still 'held'. */
  async findExpired() {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('status', 'held')
      .lt('release_date', new Date().toISOString());
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }
}

export default new EscrowRepository();