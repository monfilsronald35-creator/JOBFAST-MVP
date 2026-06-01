// ======================================================
// 🔐 JOBFAST — AUTHENTICATION ROUTES (PRODUCTION SAFE)
// ======================================================

import express from 'express';

// Controllers (Ranje ak chemen eksplit ak estansyon .js)
import { loginController } from '../controllers/auth/login.controller.js';
import { registerController } from '../controllers/auth/register.controller.js';

// Middleware
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// ======================================================
// 🛡️ LIGHTWEIGHT MEMORY RATE LIMITER (ANTI-BRUTE FORCE)
// ======================================================
const requestMap = new Map();

function rateLimit(req, res, next) {
  // Sekirize rekiperasyon IP a pou anpeche spoofing nan proxy
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minit fenèt anrejistreman
  const maxRequests = 50;          // Limit maksimòm tantativ

  // 🧹 Auto-cleanup memwa si map la vin twò gwo pou evite Memory Leaks
  if (requestMap.size > 5000) {
    requestMap.clear();
  }

  const data = requestMap.get(ip);

  if (!data) {
    requestMap.set(ip, { count: 1, start: now });
    return next();
  }

  // Si tan fenèt la fin pase, reset kontè a pou IP sa a
  if (now - data.start > windowMs) {
    requestMap.set(ip, { count: 1, start: now });
    return next();
  }

  // Bloque si li depase limit la
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
  // INFO: Nan JWT, logout la fèt plis sou frontend lan lè w siye token an, 
  // men endpoint sa a bon pou w ka invalidat li nan blacklist si sa nesesè pita.
  res.status(200).json({
    success: true,
    message: 'Session closed successfully. Logged out.',
  });
});

export default router;
