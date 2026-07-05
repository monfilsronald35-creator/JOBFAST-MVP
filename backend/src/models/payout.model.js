import mongoose from 'mongoose';
import {
  PAYOUT_STATUS_VALUES,
  PAYOUT_STATUS,
  PAYMENT_METHOD_VALUES,
} from '../config/financial.js';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const payoutSchema = new mongoose.Schema(
  {
    // Worker or service provider receiving the payout
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // The escrow document being paid out (optional — manual payouts may not have one)
    escrowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      default: null,
      index: true,
    },

    // Integer minor units
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payout amount must be positive'],
    },

    currency: {
      type: String,
      required: true,
      enum: SUPPORTED_CURRENCY_CODES,
    },

    status: {
      type: String,
      enum: PAYOUT_STATUS_VALUES,
      default: PAYOUT_STATUS.PENDING,
      index: true,
    },

    // Destination: how funds leave the platform
    method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      required: true,
    },

    // External transfer reference (Stripe payout ID, mobile money ref, etc.)
    externalRef: { type: String, default: null },

    // Admin who initiated or approved this payout
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    failureReason: { type: String, default: null },

    // Key timestamps
    processedAt:  { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    failedAt:     { type: Date, default: null },
    cancelledAt:  { type: Date, default: null },

    // LedgerEntry journalId for this payout transaction
    journalId: { type: String, default: null },

    // Append-only audit trail
    statusHistory: [
      {
        status:    { type: String, required: true },
        actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note:      { type: String, default: '' },
        timestamp: { type: Date, default: () => new Date() },
      },
    ],

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

payoutSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

// Auto-append status changes to history
payoutSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

export default mongoose.model('Payout', payoutSchema);