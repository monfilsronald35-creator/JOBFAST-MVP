// =========================================================================
// JOBFAST — AUTH ROUTES (Supabase)
// =========================================================================
import express from 'express';
import { loginController }    from '../controllers/login.controller.js';
import { registerController } from '../controllers/register.controller.js';
import { authMiddleware }     from '../middlewares/authMiddleware.js';
import userRepo from '../repositories/user.repository.js';

const router = express.Router();

// ── In-process rate limiter (anti-brute-force) ────────────────────────────
const requestMap = new Map();

function rateLimit(req, res, next) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const ip    = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;
  const now   = Date.now();
  const WINDOW_MS   = 15 * 60 * 1000;
  const MAX_REQUESTS = 50;

  if (requestMap.size > 5000) requestMap.clear();

  const data = requestMap.get(ip);
  if (!data) { requestMap.set(ip, { count: 1, start: now }); return next(); }
  if (now - data.start > WINDOW_MS) { requestMap.set(ip, { count: 1, start: now }); return next(); }
  if (data.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    });
  }
  data.count++;
  return next();
}

// ── Public endpoints ──────────────────────────────────────────────────────
router.post('/register', rateLimit, registerController);
router.post('/login',    rateLimit, loginController);

// ── /me ───────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user   = await userRepo.getById(String(userId));
    const { passwordHash: _pw, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      data: { user: { ...safeUser, _id: safeUser.id } },
    });
  } catch (err) {
    const status = err.statusCode === 404 ? 404 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ── /logout (stateless JWT — just confirm client-side disposal) ───────────
router.post('/logout', authMiddleware, (_req, res) =>
  res.status(200).json({ success: true, message: 'Session closed successfully.' })
);

// ── /bootstrap-admin (one-time; delete after first use) ──────────────────
router.post('/bootstrap-admin', async (req, res) => {
  const BOOTSTRAP_SECRET = 'JOBFAST_ADMIN_2026';
  const { email, secret } = req.body || {};

  if (!secret || secret !== BOOTSTRAP_SECRET) {
    return res.status(403).json({ success: false, message: 'Invalid secret' });
  }
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await userRepo.findByEmail(cleanEmail).catch(() => null);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User "${cleanEmail}" not found. Register first, then call this endpoint.`,
    });
  }

  await userRepo.update(user.id, { role: 'super_admin' });

  return res.json({
    success: true,
    message: `✅ ${cleanEmail} is now super_admin. Log out and log in again to access /admin.`,
  });
});

export default router;