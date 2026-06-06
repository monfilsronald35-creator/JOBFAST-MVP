// ======================================================
// 🔐 JOBFAST — AUTHENTICATION ROUTES (PRODUCTION SAFE)
// ======================================================

import express from 'express';

// 🚀 Enpòtasyon kontwolè yo
import { loginController } from '../controllers/login.controller.js';
import { registerController } from '../controllers/register.controller.js';

// 🛡️ FIKS MIDDLEWARE: Chemen sekirize pou Linux sou Render
// Si folder ou a sou Git rele "middleware" san "s", jis wete "s" la nan chemen sa a:
import { authMiddleware } from './../middlewares/auth.js';

const router = express.Router();

// ======================================================
// 🛡️ LIGHTWEIGHT MEMORY RATE LIMITER (ANTI-BRUTE FORCE)
// ======================================================
const requestMap = new Map();

function rateLimit(req, res, next) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minit
  const maxRequests = 50;          // Limit tantativ

  if (requestMap.size > 5000) {
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
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS'
    });
  }

  data.count++;
  next();
}

// ======================================================
// 🔓 PUBLIC ENDPOINTS
// ======================================================
router.post('/register', rateLimit, registerController);
router.post('/login', rateLimit, loginController);

// ======================================================
// 🔒 PROTECTED ENDPOINTS (REQUIRES VALID AUTH TOKEN)
// ======================================================
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: req.user,
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Session closed successfully. Logged out.',
  });
});

export default router;
