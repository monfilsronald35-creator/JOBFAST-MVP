// =========================================================================
// JOBFAST — AUTHENTICATION CONTROLLER
// =========================================================================
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { usersDatabase } from './register.controller.js';

/**
 * POST /api/v1/auth/login
 * Authenticates a user against the in-memory usersDatabase (ADR-001).
 * Admin emails (ADMIN_EMAILS env var) bypass the password check only when
 * no registered user exists for that email.
 */
export const loginController = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();

  try {
    const { email, phone, password } = req.body;
    const identifier = (email || phone || '').trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Imèl (oswa telefon) ak modpas obligatwa.', requestId },
      });
    }

    if (password.length < 6) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    // Validate email format only when the identifier looks like an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    if (!isEmail && email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL_FORMAT', message: 'Fòma imèl sa a pa valab.', requestId },
      });
    }

    const cleanEmail = identifier;
    const adminEmails = env.ADMIN_EMAILS || [];
    const isAdminEmail = adminEmails.includes(cleanEmail);

    // Search order: MongoDB first (persists across restarts) → in-memory fallback
    let dbUser = null;
    let passwordValid = false;

    if (mongoose.connection.readyState === 1) {
      const query = isEmail ? { email: cleanEmail } : { $or: [{ email: cleanEmail }, { phone: cleanEmail }] };
      const mongoUser = await User.findOne(query).select('+password').lean();
      if (mongoUser) {
        passwordValid = await bcrypt.compare(password, mongoUser.password);
        if (passwordValid) {
          dbUser = { ...mongoUser, id: mongoUser._id.toString(), _id: mongoUser._id.toString() };
        }
      }
    }

    // Fallback to in-memory (same Render instance, or no MongoDB)
    if (!dbUser) {
      const memUser = Array.from(usersDatabase.values()).find(
        (u) => u.email === cleanEmail || u.emailOrPhone === cleanEmail
      );
      if (memUser) {
        passwordValid = await bcrypt.compare(password, memUser.password);
        if (passwordValid) dbUser = memUser;
      }
    }

    if (!dbUser && !isAdminEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    if (dbUser && !passwordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    const userId   = dbUser?.userId || dbUser?.id || dbUser?._id?.toString() || `uid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const role     = dbUser?.role   || (isAdminEmail ? 'admin' : 'worker');
    const userName = dbUser?.name   || dbUser?.fullName || (isAdminEmail ? 'Admin JOBFAST' : 'Itilizatè JOBFAST');

    const accessToken = jwt.sign(
      { id: userId, email: cleanEmail, role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _pw, ...safeDbUser } = dbUser || {};

    return res.status(200).json({
      success: true,
      meta: { version: '1.0.0', timestamp: new Date().toISOString(), requestId },
      data: {
        token: accessToken,
        token_type: 'Bearer',
        expires_in: '24h',
        user: {
          id: userId,
          _id: userId,
          name: userName,
          email: cleanEmail,
          role,
          tier: dbUser?.tier || 'free',
          profileComplete: !!dbUser,
          location: dbUser?.location || { city: 'Haiti', state: '', coordinates: { lat: 18.5944, lng: -72.3074 } },
          stats: dbUser?.stats || { totalJobs: 0, rating: 0, memberSince: new Date().getFullYear().toString() },
          lastLogin: new Date().toISOString(),
          ...(dbUser ? safeDbUser : {}),
        },
      },
    });

  } catch (error) {
    next(error);
  }
};