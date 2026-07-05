/**
 * Financial State Machines — JOBFAST MVP
 *
 * Payment: 9 states
 * Wallet:  3 states
 * Escrow:  7 states  (Batch 2)
 * Payout:  6 states  (Batch 2)
 *
 * All state values are lowercase strings matching the DB enum.
 * Import these constants everywhere — never hardcode state strings.
 */

// ── Payment State Machine ─────────────────────────────────────────────────────

export const PAYMENT_STATUS = Object.freeze({
  PENDING:             'pending',           // Created, awaiting action
  PROCESSING:          'processing',        // Stripe is processing
  CAPTURED:            'captured',          // Funds captured successfully
  FAILED:              'failed',            // Payment failed
  CANCELLED:           'cancelled',         // Cancelled before capture
  REFUNDED:            'refunded',          // Fully refunded
  PARTIALLY_REFUNDED:  'partially_refunded',
  DISPUTED:            'disputed',          // Chargeback opened
  EXPIRED:             'expired',           // Timed out (no action taken)
});

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

// Valid status transitions (state machine)
export const PAYMENT_TRANSITIONS = Object.freeze({
  [PAYMENT_STATUS.PENDING]:    [PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.CAPTURED, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.EXPIRED],
  [PAYMENT_STATUS.PROCESSING]: [PAYMENT_STATUS.CAPTURED, PAYMENT_STATUS.FAILED],
  [PAYMENT_STATUS.CAPTURED]:   [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED, PAYMENT_STATUS.DISPUTED],
  [PAYMENT_STATUS.DISPUTED]:   [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.CAPTURED],
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: [PAYMENT_STATUS.REFUNDED],
});

export function canTransitionPayment(from, to) {
  return Boolean(PAYMENT_TRANSITIONS[from]?.includes(to));
}

// ── Wallet State Machine ──────────────────────────────────────────────────────

export const WALLET_STATUS = Object.freeze({
  ACTIVE:  'active',
  FROZEN:  'frozen',   // Suspended by admin — no credits or debits allowed
  CLOSED:  'closed',   // Permanently closed
});

export const WALLET_STATUS_VALUES = Object.values(WALLET_STATUS);

// ── Escrow State Machine (Batch 2) ────────────────────────────────────────────

export const ESCROW_STATUS = Object.freeze({
  CREATED:   'created',    // Escrow initialised
  FUNDED:    'funded',     // Payment captured, funds held
  RELEASED:  'released',   // Funds released to worker
  REFUNDED:  'refunded',   // Funds returned to employer
  DISPUTED:  'disputed',   // Under dispute review
  RESOLVED:  'resolved',   // Dispute resolved
  EXPIRED:   'expired',    // Job never started, auto-refunded
});

export const ESCROW_STATUS_VALUES = Object.values(ESCROW_STATUS);

export const ESCROW_TRANSITIONS = Object.freeze({
  [ESCROW_STATUS.CREATED]:  [ESCROW_STATUS.FUNDED, ESCROW_STATUS.EXPIRED],
  [ESCROW_STATUS.FUNDED]:   [ESCROW_STATUS.RELEASED, ESCROW_STATUS.REFUNDED, ESCROW_STATUS.DISPUTED],
  [ESCROW_STATUS.DISPUTED]: [ESCROW_STATUS.RELEASED, ESCROW_STATUS.REFUNDED, ESCROW_STATUS.RESOLVED],
});

export function canTransitionEscrow(from, to) {
  return Boolean(ESCROW_TRANSITIONS[from]?.includes(to));
}

// ── Payout State Machine (Batch 2) ────────────────────────────────────────────

export const PAYOUT_STATUS = Object.freeze({
  PENDING:    'pending',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  FAILED:     'failed',
  CANCELLED:  'cancelled',
  ON_HOLD:    'on_hold',   // Compliance review
});

export const PAYOUT_STATUS_VALUES = Object.values(PAYOUT_STATUS);

// ── Payment Methods ───────────────────────────────────────────────────────────

export const PAYMENT_METHOD = Object.freeze({
  CARD:          'card',
  MOBILE_MONEY:  'mobile_money',  // Digicel/Natcom momo — Haiti market
  CASH:          'cash',          // In-person cash — offline recording
  WALLET:        'wallet',        // Internal wallet balance
  BANK_TRANSFER: 'bank_transfer',
});

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

// ── Commission Tiers (Batch 2) ────────────────────────────────────────────────
// 5-tier hierarchy: role → profession → job_type → amount_bracket → promo_code

export const COMMISSION_TIER = Object.freeze({
  ROLE:       'role',        // T1: role-based default
  PROFESSION: 'profession',  // T2: profession-specific override
  JOB_TYPE:   'job_type',    // T3: job category override
  AMOUNT:     'amount',      // T4: volume-based bracket
  PROMO:      'promo',       // T5: promotional code
});

// Default platform commission rates by tier
export const DEFAULT_COMMISSION_RATES = Object.freeze({
  worker:           0.10,  // 10% on worker payments received
  employer:         0.05,  // 5% on job postings paid
  tourism:          0.08,
  service_provider: 0.10,
  default:          0.10,
});

// ── Financial Limits ──────────────────────────────────────────────────────────

export const FINANCIAL_LIMITS = Object.freeze({
  MIN_PAYMENT_HTG:        100,          //       1.00 HTG minimum
  MAX_PAYMENT_HTG:        50_000_000,   // 500,000.00 HTG maximum per payment
  MAX_WALLET_BALANCE_HTG: 100_000_000,  // 1,000,000.00 HTG maximum wallet balance
  IDEMPOTENCY_TTL_MS:     24 * 60 * 60 * 1000,  // 24 hours
  PAYMENT_EXPIRY_MS:      30 * 60 * 1000,        // 30 minutes for card payment confirmation
  ESCROW_MAX_HOLD_DAYS:   30,           // Maximum days escrow can be held before auto-refund
  MIN_PAYOUT_HTG:         1_000,        //      10.00 HTG minimum payout
});