import mongoose from 'mongoose';
import { WALLET_STATUS, WALLET_STATUS_VALUES } from '../config/financial.js';
import { SUPPORTED_CURRENCY_CODES } from '../utils/money.js';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Integer minor units (centimes for HTG). Never floating point.
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Wallet balance cannot be negative'],
    },

    currency: {
      type: String,
      required: true,
      default: 'HTG',
      enum: SUPPORTED_CURRENCY_CODES,
    },

    status: {
      type: String,
      enum: WALLET_STATUS_VALUES,
      default: WALLET_STATUS.ACTIVE,
      index: true,
    },

    // Lifetime totals — append-only, never decremented
    totalCredited: { type: Number, default: 0 },
    totalDebited:  { type: Number, default: 0 },

    lastTransactionAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletSchema.index({ status: 1, userId: 1 });

walletSchema.methods.canDebit = function (amount) {
  return this.status === WALLET_STATUS.ACTIVE && this.balance >= amount;
};

walletSchema.methods.canCredit = function () {
  return this.status === WALLET_STATUS.ACTIVE;
};

export default mongoose.model('Wallet', walletSchema);