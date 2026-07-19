/**
 * Commission Service — 5-tier hierarchy (Supabase)
 *
 * Resolution order (highest priority wins):
 *   T5 promo_code → T4 amount_bracket → T3 job_type → T2 profession → T1 role (default)
 *
 * Only the persistence layer changed (Commission Mongoose model → commissionRepo).
 * Business logic and rate resolution are unchanged.
 */

import commissionRepo from '../repositories/commission.repository.js';
import {
  DEFAULT_COMMISSION_RATES,
  COMMISSION_TIER,
  FINANCIAL_LIMITS,
} from '../config/financial.js';
import { assertPositive, multiply, FinancialError } from '../utils/money.js';

// ── Amount brackets (T4) ─────────────────────────────────────────────────────
const AMOUNT_BRACKETS = [
  { minAmount: 10_000_000, rate: 0.06 }, // 100,000.00 HTG+
  { minAmount:  5_000_000, rate: 0.07 }, //  50,000.00 HTG+
  { minAmount:  1_000_000, rate: 0.08 }, //  10,000.00 HTG+
];

// ── Profession overrides (T2) ─────────────────────────────────────────────────
const PROFESSION_RATES = Object.freeze({
  plumber:       0.08,
  electrician:   0.08,
  tour_guide:    0.06,
  hotel_manager: 0.05,
});

// ── Job type overrides (T3) ───────────────────────────────────────────────────
const JOB_TYPE_RATES = Object.freeze({
  emergency:   0.05,
  premium:     0.12,
});

function resolveRate({ userRole, profession = null, jobType = null, amount, promoCode = null, promoRate = null }) {
  // T5: promo code (highest priority)
  if (promoCode && promoRate != null) {
    if (promoRate < 0 || promoRate > 1) throw new FinancialError('Invalid promo rate', 'INVALID_PROMO_RATE');
    return { rate: promoRate, tier: COMMISSION_TIER.PROMO, tierContext: { promoCode } };
  }
  // T4: amount bracket
  for (const bracket of AMOUNT_BRACKETS) {
    if (amount >= bracket.minAmount) {
      return { rate: bracket.rate, tier: COMMISSION_TIER.AMOUNT, tierContext: { minAmount: bracket.minAmount } };
    }
  }
  // T3: job type
  if (jobType && JOB_TYPE_RATES[jobType] != null) {
    return { rate: JOB_TYPE_RATES[jobType], tier: COMMISSION_TIER.JOB_TYPE, tierContext: { jobType } };
  }
  // T2: profession
  if (profession && PROFESSION_RATES[profession] != null) {
    return { rate: PROFESSION_RATES[profession], tier: COMMISSION_TIER.PROFESSION, tierContext: { profession } };
  }
  // T1: role default
  const defaultRate = DEFAULT_COMMISSION_RATES[userRole] ?? DEFAULT_COMMISSION_RATES.default;
  return { rate: defaultRate, tier: COMMISSION_TIER.ROLE, tierContext: { userRole } };
}

/**
 * Calculate and persist a commission record.
 * `session` is ignored — kept for API compatibility with callers.
 */
export async function calculate({
  payerId,
  userRole,
  baseAmount,
  currency,
  referenceType,
  referenceId,
  profession  = null,
  jobType     = null,
  promoCode   = null,
  promoRate   = null,
  session     = null, // ignored
}) {
  assertPositive(baseAmount, 'base amount');

  if (baseAmount < FINANCIAL_LIMITS.MIN_PAYMENT_HTG) {
    throw new FinancialError(
      `Amount below minimum (${FINANCIAL_LIMITS.MIN_PAYMENT_HTG} minor units)`,
      'BELOW_MINIMUM'
    );
  }

  const { rate, tier, tierContext } = resolveRate({ userRole, profession, jobType, amount: baseAmount, promoCode, promoRate });
  const commissionAmount = multiply(baseAmount, rate);

  const commission = await commissionRepo.record({
    fromUserId:    String(payerId),
    escrowId:      referenceType === 'escrow'   ? String(referenceId) : null,
    paymentId:     referenceType === 'payment'  ? String(referenceId) : null,
    tier,
    tierContext,
    rate,
    baseAmount,
    amount:        commissionAmount,
    currency,
  });

  // Expose commissionAmount alias for backward compatibility with escrow.service.js
  commission.commissionAmount = commissionAmount;

  return commission;
}

/**
 * Mark a commission as settled.
 * `session` is ignored — kept for API compatibility.
 */
export async function settleCommission(commissionId, journalId, session = null) {
  const commission = await commissionRepo.settle(commissionId, journalId);
  if (!commission) throw new FinancialError('Commission not found', 'NOT_FOUND');
  return commission;
}

/**
 * Get commissions for a user.
 */
export async function getUserCommissions(payerId, { page = 1, limit = 20 } = {}) {
  const result = await commissionRepo.getUserCommissions(String(payerId), { page, limit });
  return {
    items:  result.commissions,
    total:  result.total,
    page:   result.page,
    limit:  result.limit,
    pages:  Math.ceil(result.total / limit),
  };
}