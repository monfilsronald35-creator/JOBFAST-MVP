import mongoose from 'mongoose';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
} from '../config/financial.js';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const statusHistoryEntry = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    reason:    { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    // Parties
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },

    // Amount — integer minor units (e.g. 50000 = 500.00 HTG)
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be at least 1 minor unit'],
    },
    currency: {
      type: String,
      required: true,
      default: 'HTG',
      enum: SUPPORTED_CURRENCY_CODES,
    },

    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      required: true,
    },

    // Idempotency — enforced at DB level too
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Stripe fields — populated after Stripe call
    stripePaymentIntentId: { type: String, default: null, index: true },
    stripeClientSecret:    { type: String, default: null, select: false },

    // Refund tracking
    amountRefunded: { type: Number, default: 0 },

    // Immutable audit timestamps
    capturedAt:  { type: Date, default: null },
    failedAt:    { type: Date, default: null },
    refundedAt:  { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Append-only status history — full audit trail
    statusHistory: { type: [statusHistoryEntry], default: [] },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ payerId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ payeeId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ jobId: 1, status: 1 });

// Append to status history on every status change
paymentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  next();
});

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.stripeClientSecret;
    return ret;
  },
});

export default mongoose.model('Payment', paymentSchema);