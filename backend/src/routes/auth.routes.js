// ======================================================
// 🔐 JOBFAST — AUTHENTICATION ROUTES (PRODUCTION SAFE)
// ======================================================

import express from 'express';

// 🚀 Enpòtasyon kontwolè yo (Fiks san sous-folder)
import { loginController } from '../controllers/login.controller.js';
import { registerController } from '../controllers/register.controller.js';

const router = express.Router();

// ======================================================
// 🛡️ LIGHTWEIGHT MEMORY RATE LIMITER (ANTI-BRUTE FORCE)
// ======================================================
const requestMap = new Map();

function rateLimit(req, res, next) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 50;

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
// 🔒 ENDPOINTS TEMPORAIRE (SAN MIDDLEWARE POU DEBLOKE RENDER)
// ======================================================
router.get('/me', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile endpoint ready (Otantifikasyon tanporè)',
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Session closed successfully.',
  });
});

export default router;
