
import express from 'express';

// Controllers
import { loginController } from '../controllers/auth/login.controller.js';
import { registerController } from '../controllers/auth/register.controller.js';

// Middleware
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// ================= RATE LIMIT =================
const requestMap = new Map();

function rateLimit(req, res, next) {
  const rawIp = req.headers['x-forwarded-for'] || req.ip;
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 50;

  // 🧹 cleanup
  if (requestMap.size > 1000) {
    requestMap.clear();
  }

  const data = requestMap.get(ip);

  if (!data) {
    requestMap.set(ip, { count: 1, start: now });
    return next();
  }

  if (now - data.start > windowMs) {
    requestMap.set(ip, { count: 1, start: now });
    return next();
  }

  if (data.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
    });
  }

  data.count++;
  next();
}

// ================= PUBLIC =================
router.post('/register', rateLimit, registerController);
router.post('/login', rateLimit, loginController);

// ================= PROTECTED =================
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out',
  });
});

export default router;