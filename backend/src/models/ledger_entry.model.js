/**
 * LedgerEntry — double-entry bookkeeping model.
 *
 * Every financial event creates exactly TWO documents sharing the same journalId:
 *   one DEBIT entry + one CREDIT entry.
 *
 * This is the immutable financial audit trail. Never delete, never update.
 * Query by journalId to find a complete transaction.
 */

import mongoose from 'mongoose';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const ENTRY_TYPE = Object.freeze({ DEBIT: 'debit', CREDIT: 'credit' });

const ledgerEntrySchema = new mongoose.Schema(
  {
    // Every double-entry pair shares one journalId
    journalId: {
      type: String,
      required: true,
      index: true,
    },

    // The account this entry belongs to (wallet owner)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(ENTRY_TYPE),
      required: true,
    },

    // Integer minor units — always positive
    amount: {
      type: Number,
      required: true,
      min: [1, 'Ledger amount must be positive'],
    },

    currency: {
      type: String,
      required: true,
      enum: SUPPORTED_CURRENCY_CODES,
    },

    // Running balance AFTER this entry (snapshot at time of recording)
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    // Reference to the source document
    referenceType: {
      type: String,
      enum: ['payment', 'escrow', 'payout', 'commission', 'adjustment'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    // Immutable — no updates allowed after creation
  }
);

ledgerEntrySchema.index({ journalId: 1, type: 1 });
ledgerEntrySchema.index({ userId: 1, createdAt: -1 });
ledgerEntrySchema.index({ referenceType: 1, referenceId: 1 });

export { ENTRY_TYPE };
export default mongoose.model('LedgerEntry', ledgerEntrySchema);