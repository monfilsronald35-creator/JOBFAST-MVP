// =========================================================================
// JOBFAST — LOGIN CONTROLLER (Supabase)
// =========================================================================
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepo from '../repositories/user.repository.js';
import { env } from '../config/env.js';

/**
 * POST /api/v1/auth/login
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

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    if (!isEmail && email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL_FORMAT', message: 'Fòma imèl sa a pa valab.', requestId },
      });
    }

    const adminEmails = env.ADMIN_EMAILS || [];
    const isAdminEmail = adminEmails.includes(identifier);

    // ── Lookup in Supabase ─────────────────────────────────────────────────
    const dbUser = await userRepo.findByIdentifierWithPassword(identifier);

    if (!dbUser && !isAdminEmail) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
      });
    }

    // Verify password (admin bypass: allow when no real account exists)
    if (dbUser) {
      const hash = dbUser.passwordHash;
      if (!hash) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
        });
      }
      const passwordValid = await bcrypt.compare(password, hash);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Idantifyan yo pa kòrèk.', requestId },
        });
      }
    }

    const userId   = dbUser?.id    || `uid_admin_${crypto.randomBytes(4).toString('hex')}`;
    const role     = dbUser?.role  || (isAdminEmail ? 'admin' : 'user');
    const userName = dbUser?.name  || (isAdminEmail ? 'Admin JOBFAST' : 'Itilizatè JOBFAST');

    const accessToken = jwt.sign(
      { id: userId, email: identifier, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Strip passwordHash before sending to client
    const { passwordHash: _pw, ...safeUser } = dbUser || {};

    return res.status(200).json({
      success: true,
      meta: { version: '1.0.0', timestamp: new Date().toISOString(), requestId },
      data: {
        token: accessToken,
        token_type: 'Bearer',
        expires_in: env.JWT_EXPIRES_IN || '7d',
        user: {
          id:              userId,
          _id:             userId,
          name:            userName,
          email:           identifier,
          role,
          tier:            'free',
          profileComplete: !!dbUser,
          location:        dbUser?.location || { city: 'Haiti', coordinates: { lat: 18.5944, lng: -72.3074 } },
          stats:           dbUser?.stats    || { totalJobs: 0, rating: 0, memberSince: new Date().getFullYear().toString() },
          lastLogin:       new Date().toISOString(),
          ...(dbUser ? safeUser : {}),
        },
      },
    });

  } catch (error) {
    next(error);
  }
};