// ======================================================
// 🔐 JOBFAST — AUTHENTICATION ROUTES (PRODUCTION SAFE)
// ======================================================

import express from 'express';
import mongoose from 'mongoose';

import { loginController } from '../controllers/login.controller.js';
import { registerController } from '../controllers/register.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { usersDatabase } from '../controllers/register.controller.js';
import User from '../models/user.model.js';

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

// ── Authenticated endpoints ───────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  // 1. Try in-memory first (fast path, same Render instance)
  let user = Array.from(usersDatabase.values()).find(
    (u) => u.id === userId || u.userId === userId || String(u._id) === userId
  );

  // 2. Fallback to MongoDB (survives restarts)
  if (!user && mongoose.connection.readyState === 1) {
    try {
      const mongoUser = await User.findById(userId).lean();
      if (mongoUser) {
        user = { ...mongoUser, id: mongoUser._id.toString(), _id: mongoUser._id.toString() };
      }
    } catch (_) {}
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { password: _pw, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    data: { user: { ...safeUser, _id: safeUser.id || safeUser._id } },
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Session closed successfully.',
  });
});

// ======================================================
// 🔑 ONE-TIME BOOTSTRAP ADMIN (delete after first use)
// POST /api/v1/auth/bootstrap-admin
// Body: { "email": "you@email.com", "secret": "JOBFAST_ADMIN_2026" }
// ======================================================
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
  let promoted = false;

  // 1. Update MongoDB (persistent)
  if (mongoose.connection.readyState === 1) {
    try {
      const result = await User.findOneAndUpdate(
        { email: cleanEmail },
        { role: 'super_admin' },
        { new: true }
      );
      if (result) promoted = true;
    } catch (_) {}
  }

  // 2. Update in-memory store
  for (const [key, u] of usersDatabase.entries()) {
    if (u.email === cleanEmail || u.email?.toLowerCase() === cleanEmail) {
      usersDatabase.set(key, { ...u, role: 'super_admin' });
      promoted = true;
    }
  }

  if (!promoted) {
    return res.status(404).json({ success: false, message: `User "${cleanEmail}" not found. Register first, then call this endpoint.` });
  }

  return res.json({
    success: true,
    message: `✅ ${cleanEmail} is now super_admin. Log out and log in again to access /admin.`,
  });
});

export default router;
