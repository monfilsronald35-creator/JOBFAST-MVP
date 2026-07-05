/**
 * Idempotency middleware for financial routes.
 *
 * Validates the X-Idempotency-Key header and attaches it to req.idempotencyKey.
 * The actual deduplication check lives in the service layer (wallet.service, payment.service)
 * using the shared MemoryStore with a 24-hour TTL.
 *
 * Clients must supply a UUID or equivalent unique key per operation.
 * Retrying with the same key returns the original result without side effects.
 */

export const requireIdempotencyKey = (req, res, next) => {
  const raw = req.headers['x-idempotency-key'];

  if (!raw || typeof raw !== 'string' || raw.trim().length < 8) {
    return res.status(400).json({
      success: false,
      message:
        'X-Idempotency-Key header is required for financial operations (UUID recommended, min 8 chars)',
    });
  }

  req.idempotencyKey = raw.trim();
  return next();
};