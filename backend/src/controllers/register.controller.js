// =========================================================================
// JOBFAST — REGISTER CONTROLLER (Supabase)
// =========================================================================
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepo from '../repositories/user.repository.js';
import { env } from '../config/env.js';
import { getRequiredFields } from '../config/categories.js';
import { notifyNewCategoryMember } from '../services/matchingService.js';

/**
 * POST /api/v1/auth/register
 */
export const registerController = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();

  try {
    const {
      name,
      email,
      password,
      accountType,
      role,
      category,
      profession,
      profileMetadata,
      phone,
      city,
      state,
    } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REGISTRATION_FIELDS', message: 'Non, imèl, ak modpas obligatwa.', requestId },
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL_FORMAT', message: 'Fòma imèl sa a pa valab.', requestId },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Modpas la dwe genyen o mwen 6 karaktè.', requestId },
      });
    }

    // ── Duplicate check (Supabase) ─────────────────────────────────────────
    const existing = await userRepo.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Yon kont egziste deja ak imèl sa a.', requestId },
      });
    }

    // ── Build profile metadata ─────────────────────────────────────────────
    const userProfession = profession || role || '';
    const userCategory   = category  || '';

    const categoryMetadata = {
      ...(profileMetadata || {}),
      fullName:          profileMetadata?.fullName          || name        || '',
      role:              profileMetadata?.role              || userProfession || '',
      location:          profileMetadata?.location          || `${city || ''}, ${state || ''}`.replace(/^,\s*/, '').trim() || '',
      businessName:      profileMetadata?.businessName      || name || '',
      restaurantName:    profileMetadata?.restaurantName    || name || '',
      hotelName:         profileMetadata?.hotelName         || name || '',
      officeName:        profileMetadata?.officeName        || name || '',
      hospitalName:      profileMetadata?.hospitalName      || name || '',
      clinicName:        profileMetadata?.clinicName        || name || '',
      organizationName:  profileMetadata?.organizationName  || name || '',
    };

    const requiredCount = userProfession ? (getRequiredFields(userProfession)?.length || 0) : 0;
    const totalFields   = Math.max(requiredCount + 5, Object.keys(categoryMetadata).length + 5);
    const filledFields  = 5 + Object.keys(categoryMetadata).filter(k => categoryMetadata[k]).length;
    const profileCompleteness = Math.min(100, Math.round((filledFields / totalFields) * 100));

    // ── Persist to Supabase ────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await userRepo.insert({
      name:                name.trim(),
      email:               cleanEmail,
      phone:               phone || null,
      passwordHash,
      role:                (role || userProfession || 'user').toLowerCase().trim(),
      category:            userCategory || null,
      profession:          userProfession || null,
      profileMetadata:     categoryMetadata,
      profileCompleteness,
      isAvailable:         true,
      accountStatus:       'active',
      location: {
        city:    (city  || '').trim(),
        country: 'Haiti',
        coordinates: [
          -72.3395 + (Math.random() - 0.5) * 0.02,
          18.5432  + (Math.random() - 0.5) * 0.02,
        ],
      },
    });

    console.log(`✅ Register: ${cleanEmail} (${newUser.role}) → Supabase id: ${newUser.id}`);

    // ── Issue JWT ──────────────────────────────────────────────────────────
    const accessToken = jwt.sign(
      { id: newUser.id, email: cleanEmail, role: newUser.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // ── Non-blocking: notify matching service ──────────────────────────────
    setImmediate(() => {
      notifyNewCategoryMember({ ...newUser, _id: newUser.id }).catch(err =>
        console.error('[matchingService] notifyNewCategoryMember error:', err.message)
      );
    });

    return res.status(201).json({
      success: true,
      meta: { version: '1.0.0', timestamp: new Date().toISOString(), requestId },
      data: {
        message: 'Pwofil ou kreye ak siksè nan rezo entènasyonal JOBFAST la!',
        userId:  newUser.id,
        _id:     newUser.id,
        token:   accessToken,
        user: {
          id:                  newUser.id,
          _id:                 newUser.id,
          name:                newUser.name,
          email:               newUser.email,
          role:                newUser.role,
          category:            newUser.category,
          profession:          newUser.profession,
          profileMetadata:     newUser.profileMetadata,
          profileCompleteness: newUser.profileCompleteness,
          accountType,
          availability:        'available',
          location:            newUser.location,
          stats:               { totalJobs: 0, rating: 5.0, memberSince: new Date().getFullYear().toString(), skills: [] },
        },
      },
    });

  } catch (error) {
    console.error(`[REGISTER ERROR] [RID: ${requestId}]`, error.message);
    next(error);
  }
};
