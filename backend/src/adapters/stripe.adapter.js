/**
 * Stripe Adapter — Anti-Corruption Layer
 *
 * All Stripe SDK calls are isolated here. Domain code never imports Stripe directly.
 * If Stripe is replaced, only this file changes.
 *
 * Stripe SDK: stripe@16 (MIT license, 0 audit vulnerabilities)
 * API version: 2024-06-20
 */

import Stripe from 'stripe';
import { env } from '../config/env.js';

// Lazy singleton — only instantiated when a Stripe key is present
let _client = null;

function getClient() {
  if (_client) return _client;

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Set it in your .env file before using card payments.'
    );
  }

  _client = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    telemetry: false,
  });

  return _client;
}

/**
 * Create a Stripe PaymentIntent.
 * @param {object} params
 * @param {number} params.amount       Integer minor units (e.g. 50000 = 500.00 HTG)
 * @param {string} params.currency     Lowercase ISO code (e.g. 'htg', 'usd')
 * @param {string} params.idempotencyKey
 * @param {object} [params.metadata]
 */
export async function createPaymentIntent({ amount, currency, idempotencyKey, metadata = {} }) {
  const stripe = getClient();
  return stripe.paymentIntents.create(
    {
      amount,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey }
  );
}

/**
 * Retrieve a PaymentIntent by its Stripe ID.
 */
export async function retrievePaymentIntent(stripePaymentIntentId) {
  return getClient().paymentIntents.retrieve(stripePaymentIntentId);
}

/**
 * Cancel a PaymentIntent (only possible when status is requires_payment_method,
 * requires_capture, requires_confirmation, or requires_action).
 */
export async function cancelPaymentIntent(stripePaymentIntentId) {
  return getClient().paymentIntents.cancel(stripePaymentIntentId);
}

/**
 * Create a refund for a PaymentIntent.
 * @param {object} params
 * @param {string} params.stripePaymentIntentId
 * @param {number} [params.amount]  Partial refund in minor units. Omit for full refund.
 * @param {string} [params.reason]  'duplicate' | 'fraudulent' | 'requested_by_customer'
 */
export async function createRefund({ stripePaymentIntentId, amount, reason }) {
  const params = { payment_intent: stripePaymentIntentId };
  if (amount !== undefined) params.amount = amount;
  if (reason) params.reason = reason;
  return getClient().refunds.create(params);
}

/**
 * Validate and parse a Stripe webhook event.
 * Throws if signature is invalid.
 */
export function constructWebhookEvent(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
  }
  return getClient().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}