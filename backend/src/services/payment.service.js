/**
 * Payment Service — JOBFAST Financial Foundation (Supabase)
 *
 * Replaces Mongoose session-based transactions with:
 *   - walletRepo.atomicCredit/Debit RPC calls (ACID via PostgreSQL)
 *   - paymentRepo for record persistence
 *
 * Flow (FinOps §2 deterministic order):
 *   initiatePayment → [Stripe PaymentIntent] → capturePayment
 *                                             → cancelPayment
 *                                             → refundPayment
 */

import paymentRepo  from '../repositories/payment.repository.js';
import walletRepo   from '../repositories/wallet.repository.js';
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
import { randomUUID } from 'crypto';

const IDEM_TTL = FINANCIAL_LIMITS.IDEMPOTENCY_TTL_MS;

function idemCacheKey(key) { return `pay:idem:${key}`; }

function validateAmount(amount, currency) {
  assertPositive(amount, 'payment amount');
  if (currency === 'HTG' && amount < FINANCIAL_LIMITS.MIN_PAYMENT_HTG) {
    throw new FinancialError(
      `Minimum payment is ${FINANCIAL_LIMITS.MIN_PAYMENT_HTG} minor units`,
      'AMOUNT_TOO_SMALL'
    );
  }
  if (currency === 'HTG' && amount > FINANCIAL_LIMITS.MAX_PAYMENT_HTG) {
    throw new FinancialError(`Maximum payment is ${FINANCIAL_LIMITS.MAX_PAYMENT_HTG} minor units`, 'AMOUNT_TOO_LARGE');
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initiate a payment.
 * For card: creates Stripe PaymentIntent and returns clientSecret.
 * For wallet: debits payer immediately.
 * For cash: records as PENDING for manual confirmation.
 */
export async function initiatePayment({ payerId, payeeId, jobId = null, amount, currency = 'HTG', method, idempotencyKey, metadata = {} }) {
  const cached = memory.get(idemCacheKey(idempotencyKey));
  if (cached) return cached;

  validateAmount(amount, currency);

  let payment;
  let stripeClientSecret = null;

  if (method === PAYMENT_METHOD.CARD) {
    const intent = await stripeAdapter.createPaymentIntent({
      amount, currency, idempotencyKey,
      metadata: { payerId: String(payerId), payeeId: String(payeeId), jobId: String(jobId) },
    });

    payment = await paymentRepo.create({
      payerId, payeeId, amount, currency, paymentMethod: method,
      referenceType: 'job', referenceId: jobId,
      gatewayTxnId: intent.id,
      gatewayData: { clientSecret: intent.client_secret },
      status: PAYMENT_STATUS.PROCESSING,
    });

    stripeClientSecret = intent.client_secret;

  } else if (method === PAYMENT_METHOD.WALLET) {
    const journalId = randomUUID();

    await walletRepo.atomicDebit({
      userId: String(payerId), amount, currency, journalId,
      referenceType: 'payment', referenceId: journalId,
      description: `Wallet payment to ${payeeId}`,
    });

    payment = await paymentRepo.create({
      payerId, payeeId, amount, currency, paymentMethod: method,
      referenceType: 'job', referenceId: jobId, status: PAYMENT_STATUS.CAPTURED,
      gatewayData: metadata,
    });

  } else {
    payment = await paymentRepo.create({
      payerId, payeeId, amount, currency, paymentMethod: method,
      referenceType: 'job', referenceId: jobId, status: PAYMENT_STATUS.PENDING,
      gatewayData: metadata,
    });
  }

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION, actorId: String(payerId),
    targetId: String(payment.id), targetType: 'payment',
    action: 'initiate', meta: { amount, currency, method, status: payment.status },
  });

  const result = { payment, stripeClientSecret };
  memory.set(idemCacheKey(idempotencyKey), result, IDEM_TTL);
  return result;
}

/**
 * Confirm a payment as CAPTURED.
 * Credits the payee's wallet.
 */
export async function capturePayment(paymentId, actorId) {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.CAPTURED)) {
    throw new FinancialError(`Cannot capture payment in status: ${payment.status}`, 'INVALID_TRANSITION');
  }

  await walletRepo.atomicCredit({
    userId: String(payment.payeeId), amount: payment.amount, currency: payment.currency,
    journalId: randomUUID(),
    referenceType: 'payment', referenceId: String(paymentId),
    description: `Payment capture from ${payment.payerId}`,
  });

  const updated = await paymentRepo.complete(paymentId);

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION, actorId: String(actorId),
    targetId: String(paymentId), targetType: 'payment',
    action: 'capture', meta: { amount: payment.amount, currency: payment.currency },
  });

  return updated;
}

/**
 * Cancel a payment. Cancels Stripe intent if card.
 */
export async function cancelPayment(paymentId, actorId, reason = '') {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.CANCELLED)) {
    throw new FinancialError(`Cannot cancel payment in status: ${payment.status}`, 'INVALID_TRANSITION');
  }

  if (payment.gatewayTxnId && payment.paymentMethod === 'card') {
    try {
      await stripeAdapter.cancelPaymentIntent(payment.gatewayTxnId);
    } catch {
      // Stripe cancel may fail if already consumed
    }
  }

  const updated = await paymentRepo.update(paymentId, {
    status: PAYMENT_STATUS.CANCELLED,
    gatewayData: { ...(payment.gatewayData || {}), cancelReason: reason },
  });

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION, actorId: String(actorId),
    targetId: String(paymentId), targetType: 'payment',
    action: 'cancel', meta: { reason },
  });

  return updated;
}

/**
 * Refund a captured payment (full or partial).
 */
export async function refundPayment(paymentId, refundAmount, actorId, reason = '') {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');

  if (!canTransitionPayment(payment.status, PAYMENT_STATUS.REFUNDED) &&
      !canTransitionPayment(payment.status, PAYMENT_STATUS.PARTIALLY_REFUNDED)) {
    throw new FinancialError(`Cannot refund payment in status: ${payment.status}`, 'INVALID_TRANSITION');
  }

  const amount = refundAmount ?? payment.amount;
  assertPositive(amount, 'refund amount');

  if (amount > payment.amount) {
    throw new FinancialError(`Refund amount (${amount}) exceeds payment amount (${payment.amount})`, 'REFUND_EXCEEDS_AMOUNT');
  }

  // Stripe refund for card payments
  if (payment.gatewayTxnId && payment.paymentMethod === 'card') {
    await stripeAdapter.createRefund({ stripePaymentIntentId: payment.gatewayTxnId, amount, reason: 'requested_by_customer' });
  }

  // Debit payee wallet (reverse the credit)
  await walletRepo.atomicDebit({
    userId: String(payment.payeeId), amount, currency: payment.currency,
    journalId: randomUUID(),
    referenceType: 'payment', referenceId: String(paymentId),
    description: `Refund: ${reason}`,
  });

  const updated = await paymentRepo.refund(paymentId, { reason, refundAmount: amount });

  appendAuditLog({
    type: AUDIT_TYPES.ADMIN_ACTION, actorId: String(actorId),
    targetId: String(paymentId), targetType: 'payment',
    action: 'refund', meta: { amount, currency: payment.currency, reason },
  });

  return updated;
}

export async function getPayment(paymentId) {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new FinancialError('Payment not found', 'PAYMENT_NOT_FOUND');
  return payment;
}

export async function getUserPayments(userId, { page = 1, limit = 20, status } = {}) {
  return paymentRepo.getUserPayments(String(userId), { page, limit: Math.min(limit, 100), status });
}

/**
 * Process Stripe webhook event.
 */
export async function handleStripeWebhook(rawBody, signature) {
  const event = stripeAdapter.constructWebhookEvent(rawBody, signature);

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await paymentRepo.findByGatewayTxnId(intent.id);
    if (payment && payment.status === PAYMENT_STATUS.PROCESSING) {
      await capturePayment(String(payment.id), 'stripe_webhook');
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const payment = await paymentRepo.findByGatewayTxnId(intent.id);
    if (payment && canTransitionPayment(payment.status, PAYMENT_STATUS.FAILED)) {
      await paymentRepo.fail(String(payment.id), intent.last_payment_error?.message || 'Stripe payment failed');
    }
  }

  return { received: true, type: event.type };
}