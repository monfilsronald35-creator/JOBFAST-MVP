import mongoose from 'mongoose';
import { COMMISSION_TIER } from '../config/financial.js';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const commissionSchema = new mongoose.Schema(
  {
    // Source document that triggered this commission
    referenceType: {
      type: String,
      enum: ['escrow', 'payment'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Integer minor units — gross amount on which commission was calculated
    baseAmount: {
      type: Number,
      required: true,
      min: [1, 'Base amount must be positive'],
    },

    // Calculated commission in minor units
    commissionAmount: {
      type: Number,
      required: true,
      min: [0, 'Commission amount cannot be negative'],
    },

    // Effective rate used (stored for audit; computed at time of creation)
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    currency: {
      type: String,
      required: true,
      enum: SUPPORTED_CURRENCY_CODES,
    },

    // Which tier of the 5-tier hierarchy resolved this rate
    tier: {
      type: String,
      enum: Object.values(COMMISSION_TIER),
      required: true,
    },

    // For promo-code tier: store the code that was applied
    promoCode: { type: String, default: null },

    // For profesiion/job_type tiers: what drove the override
    tierContext: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Whether commission has been transferred to platform wallet
    settled: { type: Boolean, default: false },
    settledAt: { type: Date, default: null },

    // LedgerEntry journalId for this commission transaction
    journalId: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

commissionSchema.index({ referenceType: 1, referenceId: 1 });
commissionSchema.index({ payerId: 1, createdAt: -1 });
commissionSchema.index({ settled: 1, settledAt: 1 });

export default mongoose.model('Commission', commissionSchema);