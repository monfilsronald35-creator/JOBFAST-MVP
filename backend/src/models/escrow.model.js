import mongoose from 'mongoose';
import {
  ESCROW_STATUS_VALUES,
  ESCROW_STATUS,
} from '../config/financial.js';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const escrowSchema = new mongoose.Schema(
  {
    // The job this escrow is attached to
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },

    // The Payment document that funded this escrow
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
    },

    // Parties
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Integer minor units
    amount: {
      type: Number,
      required: true,
      min: [1, 'Escrow amount must be positive'],
    },

    currency: {
      type: String,
      required: true,
      enum: SUPPORTED_CURRENCY_CODES,
    },

    status: {
      type: String,
      enum: ESCROW_STATUS_VALUES,
      default: ESCROW_STATUS.CREATED,
      index: true,
    },

    // Commission already deducted when releasing to worker (minor units)
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Net amount released to worker after commission
    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional: linked commission document
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commission',
      default: null,
    },

    // Timestamps for key state changes
    fundedAt:   { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    disputedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    expiresAt:  { type: Date, default: null },

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

escrowSchema.index({ status: 1, expiresAt: 1 });
escrowSchema.index({ employerId: 1, status: 1 });
escrowSchema.index({ workerId: 1, status: 1 });

// Auto-append status changes to history
escrowSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

export default mongoose.model('Escrow', escrowSchema);