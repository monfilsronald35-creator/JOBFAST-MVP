/**
 * WalletRepository — maps the `wallets` Supabase table.
 *
 * CRITICAL: credit() and debit() MUST NOT be called directly.
 * They must go through the PostgreSQL stored procedures
 * (jobfast_credit_wallet / jobfast_debit_wallet) to guarantee
 * ACID atomicity with the ledger entry.
 * Use wallet.service.js which calls this.rpc() for those operations.
 */

import { BaseRepository } from './base.repository.js';

class WalletRepository extends BaseRepository {
  constructor() {
    super('wallets');
  }

  _toRow(obj) {
    const row = {};
    if (obj.userId    !== undefined) row.user_id             = obj.userId;
    if (obj.balance   !== undefined) row.balance             = obj.balance;
    if (obj.currency  !== undefined) row.currency            = obj.currency;
    if (obj.status    !== undefined) row.status              = obj.status;
    if (obj.totalCredited !== undefined) row.total_credited  = obj.totalCredited;
    if (obj.totalDebited  !== undefined) row.total_debited   = obj.totalDebited;
    if (obj.lastTransactionAt !== undefined) row.last_transaction_at = obj.lastTransactionAt;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:               row.id,
      id:                row.id,
      userId:            row.user_id,
      balance:           row.balance          ?? 0,
      currency:          row.currency         ?? 'HTG',
      status:            row.status           ?? 'active',
      totalCredited:     row.total_credited   ?? 0,
      totalDebited:      row.total_debited    ?? 0,
      lastTransactionAt: row.last_transaction_at,
      createdAt:         row.created_at,
      updatedAt:         row.updated_at,
      // Compatibility helpers matching Mongoose instance methods
      canCredit() { return this.status === 'active'; },
      canDebit(amount) { return this.status === 'active' && this.balance >= amount; },
    };
  }

  /** Find a user's wallet by userId + currency. Returns null if not found. */
  async findByUser(userId, currency = 'HTG') {
    return this.findOne({ user_id: userId, currency });
  }

  /**
   * Idempotent: create a wallet only if one doesn't exist yet.
   * Matches the Mongoose createWallet behaviour.
   */
  async ensureWallet(userId, currency = 'HTG') {
    const existing = await this.findByUser(userId, currency);
    if (existing) return existing;
    return this.insert({ userId, currency, balance: 0 });
  }

  /** Admin: freeze a wallet. */
  async freeze(walletId) {
    return this.update(walletId, { status: 'frozen' });
  }

  /** Admin: unfreeze a wallet. */
  async unfreeze(walletId) {
    return this.update(walletId, { status: 'active' });
  }

  /**
   * ACID credit — delegates to the PostgreSQL stored procedure.
   * Returns the updated wallet model.
   */
  async atomicCredit({ userId, amount, currency, journalId, referenceType, referenceId, description = '' }) {
    const data = await this.rpc('jobfast_credit_wallet', {
      p_user_id:        userId,
      p_amount:         amount,
      p_currency:       currency,
      p_journal_id:     journalId,
      p_reference_type: referenceType,
      p_reference_id:   referenceId,
      p_description:    description,
    });
    return this._toModel(data);
  }

  /**
   * ACID debit — delegates to the PostgreSQL stored procedure.
   * Throws INSUFFICIENT_FUNDS if the balance is too low.
   */
  async atomicDebit({ userId, amount, currency, journalId, referenceType, referenceId, description = '' }) {
    const data = await this.rpc('jobfast_debit_wallet', {
      p_user_id:        userId,
      p_amount:         amount,
      p_currency:       currency,
      p_journal_id:     journalId,
      p_reference_type: referenceType,
      p_reference_id:   referenceId,
      p_description:    description,
    });
    return this._toModel(data);
  }

  /**
   * ACID peer-to-peer transfer — delegates to the PostgreSQL stored procedure.
   */
  async atomicTransfer({ fromUserId, toUserId, amount, currency, journalId, referenceType, referenceId, description = '' }) {
    const data = await this.rpc('jobfast_wallet_transfer', {
      p_from_user_id:   fromUserId,
      p_to_user_id:     toUserId,
      p_amount:         amount,
      p_currency:       currency,
      p_journal_id:     journalId,
      p_reference_type: referenceType,
      p_reference_id:   referenceId,
      p_description:    description,
    });
    return data;
  }
}

export default new WalletRepository();