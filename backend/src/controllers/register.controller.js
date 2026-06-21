// =========================================================================
// 🚀 JOBFAST ENTERPRISE SYSTEM — REGISTER CONTROLLER (INTERNATIONAL SCALE)
// =========================================================================
import crypto from 'crypto';

// ⚙️ GLOBAL IN-MEMORY DATABASE MATRIX (MVP — pa gen over-engineering)
export const usersDatabase = new Map();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\s]{6,15}$/;

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const buildToken = () => crypto.randomBytes(64).toString('hex');

/**
 * @desc    Enskripsyon Itilizatè yo (Construction, Services, ak Business Directory)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerController = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID();

  try {
    const body = req.body || {};

    // ✅ Aksepte plizyè non chan pou frontend la rete fleksib
    const name = (body.name || body.fullName || '').toString().trim();
    const rawIdentifier = (body.email || body.phone || body.emailOrPhone || '')
      .toString()
      .trim();
    const password = (body.password || '').toString();
    const role = (body.role || body.accountType || 'worker')
      .toString()
      .toLowerCase()
      .trim();
    const accountType = (body.accountType || 'individual').toString().trim();
    const city = (body.city || 'N/A').toString().trim();
    const state = (body.state || 'N/A').toString().trim();

    // 1. 🛡️ CHAN OBLIGATWA
    if (!name || !rawIdentifier || !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REGISTRATION_FIELDS',
        message: 'Operasyon echwe. Non, imèl/telefòn ak modpas la obligatwa.',
        requestId,
      });
    }

    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Non konplè a dwe genyen omwen 3 karaktè.',
        requestId,
      });
    }

    // 2. 🔍 IDANTIFYAN: imèl oswa telefòn
    const cleanEmail = rawIdentifier.toLowerCase();
    const isEmail = emailRegex.test(cleanEmail);
    const isPhone = phoneRegex.test(rawIdentifier);

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_IDENTIFIER',
        message: 'Antre yon imèl oswa yon nimewo telefòn ki valab.',
        requestId,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        message: 'Modpas la dwe genyen omwen 6 karaktè pou sekirite kont ou.',
        requestId,
      });
    }

    const userEmail = isEmail ? cleanEmail : null;
    const userPhone = isEmail ? null : rawIdentifier;

    // 3. 🚫 ANTI-DUPLICATION CHECK
    const userExists = Array.from(usersDatabase.values()).some(
      (u) =>
        (userEmail && u.email === userEmail) ||
        (userPhone && u.phone === userPhone)
    );

    if (userExists) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_ALREADY_EXISTS',
        message: 'Yon kont egziste deja ak idantifyan sa a nan JOBFAST.',
        requestId,
      });
    }

    // 4. 📍 LOCATION + GPS SIMULATION
    const gpsLocation = {
      city,
      state,
      country: 'Dominican Republic',
      coordinates: {
        lat: 18.5944 + (Math.random() - 0.5) * 0.02,
        lng: -68.3744 + (Math.random() - 0.5) * 0.02,
      },
    };

    // 5. 🏗️ PROFILE CONSTRUCTOR
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;

    const newUser = {
      id: userId,
      name,
      email: userEmail,
      phone: userPhone,
      password: hashPassword(password),
      accountType,
      role,
      tier: 'free',
      location: gpsLocation,
      availability: accountType === 'business' ? 'online' : 'available',
      stats: {
        totalJobs: 0,
        rating: 5.0,
        memberSince: new Date().toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        skills: [],
      },
      createdAt: new Date(),
    };

    usersDatabase.set(userId, newUser);

    console.log(`\n📢 [MATCH NOTIFICATION ALERT]`);
    console.log(`👤 New Registration: ${newUser.name}`);
    console.log(`💼 Role: ${newUser.role}`);
    console.log(`📍 Location: ${newUser.location.city}, ${newUser.location.state}`);
    console.log(`🟢 Status: ${newUser.availability}\n`);

    // 6. 📦 RESPONSE MATRIX (token enkli pou auto-login)
    const accessToken = buildToken();

    return res.status(201).json({
      success: true,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        requestId,
      },
      data: {
        message: 'Pwofil ou kreye ak siksè nan rezo entènasyonal JOBFAST la!',
        token: accessToken,
        token_type: 'Bearer',
        expires_in: '24h',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          accountType: newUser.accountType,
          tier: newUser.tier,
          profileComplete: true,
          availability: newUser.availability,
          location: newUser.location,
          stats: newUser.stats,
        },
      },
    });
  } catch (error) {
    console.error(`[REGISTER FATAL ERROR] [RID: ${requestId}] Context: ${error.message}`);
    next(error);
  }
};
