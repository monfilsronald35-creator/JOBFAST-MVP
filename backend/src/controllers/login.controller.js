// =========================================================================
// JOBFAST — AUTHENTICATION CONTROLLER
// =========================================================================
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Imèl ak modpas obligatwa.', requestId },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL_FORMAT', message: 'Fòma imèl sa a pa valab.', requestId },
      });
    }

    if (password.length < 6) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    // Look up user in in-memory store (populated by Register flow)
    const dbUser = Array.from(usersDatabase.values()).find(
      (u) => u.email === cleanEmail || u.emailOrPhone === cleanEmail
    );

    // Admin email check — read from env (never raw process.env)
    const adminEmails = env.ADMIN_EMAILS || [];
    const isAdminEmail = adminEmails.includes(cleanEmail);

    if (dbUser) {
      // Verify password with bcrypt (passwords stored as bcrypt hash since registration fix)
      const passwordValid = await bcrypt.compare(password, dbUser.password);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
        });
      }
    } else if (!isAdminEmail) {
      // No user found and not an admin email — reject
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    const userId   = dbUser?.userId || dbUser?.id || `uid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
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