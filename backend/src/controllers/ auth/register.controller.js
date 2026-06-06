// =========================================================================
// 🚀 JOBFAST ENTERPRISE SYSTEM — REGISTER CONTROLLER (INTERNATIONAL SCALE)
// =========================================================================
import crypto from 'crypto';

// ⚙️ GLOBAL IN-MEMORY DATABASE MATRIX (Pou MVP la pa gen over-engineering)
// Sa a pèmèt nou stoke done yo nan memwa sèvè a pou tès yo kouri rapid fwa sa a.
export const usersDatabase = new Map();

/**
 * @desc    Enskripsyon Itilizatè yo (Construction, Services, ak Business Directory)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerController = async (req, res, next) => {
  const requestId = req.id || crypto.randomUUID(); // Tracking inik entènasyonal

  try {
    const { 
      name, 
      email, 
      password, 
      accountType, // 'individual' (pou moun) oswa 'business' (pou konpayi)
      role,        // boss, worker, plumber, restaurant, hospital, elatriye.
      city, 
      state 
    } = req.body;

    // 1. 🛡️ DATA SANITIZATION & MANDATORY FIELDS CHECK
    if (!name || !email || !password || !accountType || !role || !city || !state) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REGISTRATION_FIELDS",
          message: "Operasyon echwe. Tout jaden yo obligatwa pou kreye pwofil la nan sistèm lan.",
          requestId
        }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. 🔍 REGEX VALIDATION POU EMAIL ENTERPRISE
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL_FORMAT",
          message: "Fòma imèl sa a pa konfòm ak nòm RFC 5322 entènasyonal yo.",
          requestId
        }
      });
    }

    // Modpas sekirite debaz (Pa mwens pase 6 karaktè)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Modpas la dwe genyen o mwen 6 karaktè pou sekirite kont ou.",
          requestId
        }
      });
    }

    // 3. 🚫 ANTI-DUPLICATION CHECK (Tcheke si itilizatè a enskri deja)
    const userExists = Array.from(usersDatabase.values()).some(u => u.email === cleanEmail);
    if (userExists) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Yon kont egziste deja ak adrès imèl sa a nan JOBFAST.",
          requestId
        }
      });
    }

    // 4. 📍 LOCATION INJECTION & COORDINATES SIMULATION (GPS READY)
    // Nou simule kowòdone GPS Bavaro/Punta Cana daprè foto a pou sistèm distance sorting lan
    const gpsLocation = {
      city: city.trim(),
      state: state.trim(),
      country: "Dominican Republic", // Oubyen "Haiti" selon zòn nan
      coordinates: {
        latitude: 18.5944 + (Math.random() - 0.5) * 0.02, // Similasyon ti varyasyon GPS
        longitude: -68.3744 + (Math.random() - 0.5) * 0.02
      }
    };

    // 5. 🏗️ MATRIX PROFILE CONSTRUCTOR (Daprè bèl foto MVP a)
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    
    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: crypto.createHash('sha256').update(password).digest('hex'), // Sekirize modpas la nan kòd
      accountType, 
      role: role.toLowerCase().trim(),
      tier: "free", // Default pwofil tier
      
      // 📍 GPS Location Core
      location: gpsLocation,

      // 🔘 Status Disponibilite otomatik pou moun ki nan Konstriksyon ak Sèvis
      availability: accountType === 'individual' ? 'available' : 'online',

      // 📊 Estrikti pou Evalyasyon ak Estatistik Mondyal pita
      stats: {
        totalJobs: 0,
        rating: 5.0, // Tout nouvo moun kòmanse ak 5 zetwal!
        memberSince: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        skills: []
      },
      createdAt: new Date()
    };

    // Sove nouvo kont lan nan memwa a
    usersDatabase.set(userId, newUser);

    // 📢 6. SIMULATION MATCH NOTIFICATION LOG (Daprè nòt misyon w lan)
    console.log(`\n📢 [MATCH NOTIFICATION ALERT]`);
    console.log(`👤 New Registration: ${newUser.name}`);
    console.log(`💼 Role: ${newUser.role}`);
    console.log(`📍 Location: ${newUser.location.city}, ${newUser.location.state}`);
    console.log(`🟢 Status: ${newUser.availability}\n`);

    // 7. 📦 RESPONSE MATRIX
    return res.status(201).json({
      success: true,
      meta: {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        requestId
      },
      data: {
        message: "Pwofil ou kreye ak siksè nan rezo entènasyonal JOBFAST la!",
        userId: newUser.id,
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          accountType: newUser.accountType,
          availability: newUser.availability,
          location: newUser.location,
          stats: newUser.stats
        }
      }
    });

  } catch (error) {
    console.error(`[REGISTER FATAL ERROR] [RID: ${requestId}] Context: ${error.message}`);
    next(error); // Voye l dirèkteman bay ErrorHandler.js
  }
};
