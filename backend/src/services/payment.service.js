/**
 * Payment Service — JOBFAST Financial Foundation
 *
 * Flow (FinOps §2 deterministic order):
 *   initiatePayment → [Stripe PaymentIntent] → capturePayment
 *                                             → cancelPayment
 *                                             → refundPayment
 *
 * All operations:
 * - Idempotent (MemoryStore + DB unique constraint on idempotencyKey)
 * - ACID via Mongoose session where multi-document writes occur
 * - Append-only status history on Payment document
 * - Audit log entry on every state change
 */

import mongoose from 'mongoose';
import Payment from '../models/payment.model.js';
import * as walletService from './wallet.service.js';
import * as stripeAdapter from '../adapters/stripe.adapter.js';
import memory from '../models/memory.js';
import { assertPositive, FinancialError } from '../utils/money.js';
import {
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  FINANCIAL_LIMITS,
  canTransitionPayment,
} from '../config/financial.js';
import { appendAuditLog, AUDIT_TYPES } from '../utils/auditLog.js';

const IDEM_TTL = FINANCIAL_LIMITS.IDEMPOTENCY_TTL_MS;

// ── Helpers ───────────────────────────────────────────────────────────────────

function idemCacheKey(key) {
  return `pay:idem:${key}`;
}

function validateAmount(amount, currency) {
  assertPositive(amount, 'payment amount');
  if (currency === 'HTG' && amount < FINANCIAL_LIMITS.MIN_PAYMENT_HTG) {
    throw new FinancialError(
      `Minimum payment is ${FINANCIAL_LIMITS.MIN_PAYMENT_HTG} minor units (${FINANCIAL_LIMITS.MIN_PAYMENT_HTG / 100} HTG)`,
      'AMOUNT_TOO_SMALL'
    );
  }
  if (currency === 'HTG' && amount > FINANCIAL_LIMITS.MAX_PAYMENT_HTG) {
    throw new FinancialError(
      `Maximum payment is ${FINANCIAL_LIMITS.MAX_PAYMENT_HTG} minor units`,
      'AMOUNT_TOO_LARGE'
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initiate a payment.
 *
 * For card payments: creates a Stripe PaymentIntent and returns the clientSecret
 *   for the frontend to confirm the payment.
 * For wallet payments: debits the payer's wallet immediately.
 * For cash: records the payment in PENDING state for manual confirmation.
 *
 * @param {object} params
 * @param {string} params.payerId
 * @param {string} params.payeeId
 * @param {string} [params.jobId]
 * @param {number} params.amount          Integer minor units
 * @param {string} params.currency        'HTG' | 'USD' | 'EUR'
 * @param {string} params.method          PAYMENT_METHOD value
 * @param {string} params.idempotencyKey  UUID or equivalent unique string
 * @param {object} [params.metadata]
 */
export async function initiatePayment({
  payerId,
  payeeId,
  jobId = null,
  amount,
  currency = 'HTG',
  method,
  idempotencyKey,
  metadata = {},
}) {
  // Idempotency check — return cached result if same key was already processed
  const cached = memory.get(idemCacheKey(idempotencyKey));
  if (cached) return cached;

  validateAmount(amount, currency);

  let payment;
  let stripeClientSecret = null;

  if (method === PAYMENT_METHOD.CARD) {
    // Card: create Stripe PaymentIntent first, then record
    const intent = await stripeAdapter.createPaymentIntent({
      amount,
      currency,
      idempotencyKey,
      metadata: { payerId: String(payerId), payeeId: String(payeeId), jobId: String(jobId) },
    });

    payment = await Payment.create({
      payerId,
      payeeId,
      jobId,
      amount,
      currency,
      method,
      idempotencyKey,
      status: PAYMENT_STATUS.PROCESSING,
      stripePaymentIntentId: intent.id,
      stripeClientSecret: intent.client_secret,
      metadata,
    });

    stripeClientSecret = intent.client_secret;
  } else if (method === PAYMENT_METHOD.WALLET) {
    // Wallet-to-wallet: debit payer immediately, record as captured
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        payment = await Payment.create(
          [{ payerId, payeeId, jobId, amount, currency, method, idempotencyKey, status: PAYMENT_STATUS.PENDING, metadata }],
          { session }
        );
        payment = payment[0];

        await walletService.debit(payerId, amount, currency, String(payment._id), session);

        payment.status = PAYMENT_STATUS.CAPTURED;
        payment.capturedAt = new Date();
        await payment.save({ session });
      });
    } finally {
      await session.endSession();
    }
  } else {
    // Cash / bank transfer / mobile money: record as PENDING for manual confirmation
    payment = await Payment.create({
      payerId,
      payeeId,
      jobId,
      amount,
      currency,
      method,
      idempotencyKey,
      status: PAYMENT_STATUS.PENDING,
      metadata,
    });
  }

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(payerId),
    targetId: String(payment._id),
    targetType: 'payment',
    action: 'initiate',
    meta: { amount, currency, method, status: payment.status },
  });

  const result = { payment, stripeClientSecret };
  memory.set(idemCacheKey(idempotencyKey), result, IDEM_TTL);
  return result;
}

/**
 * Confirm a payment as CAPTURED.
 * Called after Stripe webhook confirms payment_intent.succeeded,
 * or by admin for cash/bank payments.
 *
 * Credits the payee's wallet after capture.
 */
export async function capturePayment(paymentId, actorId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.CAPTURED)) {
    throw new FinancialError(
      `Cannot capture payment in status: ${payment.status}`,
      'INVALID_TRANSITION'
    );
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      payment.status = PAYMENT_STATUS.CAPTURED;
      payment.capturedAt = new Date();
      await payment.save({ session });

      // Credit payee wallet
      await walletService.credit(
        payment.payeeId,
        payment.amount,
        payment.currency,
        String(payment._id),
        session
      );
    });
  } finally {
    await session.endSession();
  }

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(actorId),
    targetId: String(payment._id),
    targetType: 'payment',
    action: 'capture',
    meta: { amount: payment.amount, currency: payment.currency },
  });

  return payment;
}

/**
 * Cancel a payment. Only valid for PENDING or PROCESSING payments.
 * If Stripe PaymentIntent exists, it is also cancelled.
 */
export async function cancelPayment(paymentId, actorId, reason = '') {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.CANCELLED)) {
    throw new FinancialError(
      `Cannot cancel payment in status: ${payment.status}`,
      'INVALID_TRANSITION'
    );
  }

  if (payment.stripePaymentIntentId) {
    try {
      await stripeAdapter.cancelPaymentIntent(payment.stripePaymentIntentId);
    } catch {
      // Stripe cancel may fail if already consumed — log and continue
      appendAuditLog({
        type: AUDIT_TYPES.ADMIN_ACTION,
        actorId: String(actorId),
        targetId: String(payment._id),
        targetType: 'payment',
        action: 'stripe_cancel_failed',
        meta: { stripeId: payment.stripePaymentIntentId },
      });
    }
  }

  payment.status = PAYMENT_STATUS.CANCELLED;
  payment.cancelledAt = new Date();
  if (reason) payment.metadata = { ...payment.metadata, cancelReason: reason };
  await payment.save();

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(actorId),
    targetId: String(payment._id),
    targetType: 'payment',
    action: 'cancel',
    meta: { reason },
  });

  return payment;
}

/**
 * Refund a captured payment (full or partial).
 *
 * Flow: Stripe refund (if card) → debit payee wallet → update payment status.
 */
export async function refundPayment(paymentId, refundAmount, actorId, reason = '') {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.REFUNDED) &&
      !canTransitionPayment(payment.status, PAYMENT_STATUS.PARTIALLY_REFUNDED)) {
    throw new FinancialError(
      `Cannot refund payment in status: ${payment.status}`,
      'INVALID_TRANSITION'
    );
  }

  const amount = refundAmount ?? payment.amount;
  assertPositive(amount, 'refund amount');

  const remaining = payment.amount - payment.amountRefunded;
  if (amount > remaining) {
    throw new FinancialError(
      `Refund amount (${amount}) exceeds refundable amount (${remaining})`,
      'REFUND_EXCEEDS_AMOUNT'
    );
  }

  const isPartial = amount < remaining;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Stripe refund for card payments
      if (payment.stripePaymentIntentId) {
        await stripeAdapter.createRefund({
          stripePaymentIntentId: payment.stripePaymentIntentId,
          amount,
          reason: 'requested_by_customer',
        });
      }

      // Debit payee wallet (reverse the credit)
      await walletService.debit(
        payment.payeeId,
        amount,
        payment.currency,
        `refund:${String(payment._id)}`,
        session
      );

      payment.amountRefunded += amount;
      payment.status = isPartial ? PAYMENT_STATUS.PARTIALLY_REFUNDED : PAYMENT_STATUS.REFUNDED;
      payment.refundedAt = new Date();
      if (reason) payment.metadata = { ...payment.metadata, refundReason: reason };
      await payment.save({ session });
    });
  } finally {
    await session.endSession();
  }

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION,
    actorId: String(actorId),
    targetId: String(payment._id),
    targetType: 'payment',
    action: 'refund',
    meta: { amount, currency: payment.currency, isPartial, reason },
  });

  return payment;
}

/**
 * Get a single payment by ID.
 */
export async function getPayment(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');
  return payment;
}

/**
 * Get paginated payments for a user (as payer or payee).
 */
export async function getUserPayments(userId, { page = 1, limit = 20, status } = {}) {
  const query = { $or: [{ payerId: userId }, { payeeId: userId }] };
  if (status) query.status = status;

  const skip = (page - 1) * Math.min(limit, 100);
  const [payments, total] = await Promise.all([
    Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 100)),
    Payment.countDocuments(query),
  ]);

  return { payments, total, page, limit: Math.min(limit, 100) };
}

/**
 * Process Stripe webhook event (called from payment routes).
 * Handles payment_intent.succeeded and payment_intent.payment_failed.
 */
export async function handleStripeWebhook(rawBody, signature) {
  const event = stripeAdapter.constructWebhookEvent(rawBody, signature);

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (payment && payment.status === PAYMENT_STATUS.PROCESSING) {
      await capturePayment(String(payment._id), 'stripe_webhook');
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (payment && canTransitionPayment(payment.status, PAYMENT_STATUS.FAILED)) {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.failedAt = new Date();
      await payment.save();
    }
  }

  return { received: true, type: event.type };
}