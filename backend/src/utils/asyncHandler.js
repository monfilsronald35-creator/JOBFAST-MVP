/**
 * asyncHandler — wraps an async Express route handler so that
 * any thrown error is forwarded to next(err) automatically.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};