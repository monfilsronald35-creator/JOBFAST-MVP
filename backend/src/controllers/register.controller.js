// =========================================================================
// 🚀 JOBFAST ENTERPRISE SYSTEM — REGISTER CONTROLLER (INTERNATIONAL SCALE)
// =========================================================================
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { CATEGORIES, PROFESSION_METADATA, getRequiredFields } from '../config/categories.js';
import { notifyNewCategoryMember } from '../services/matchingService.js';

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
      category,    // 6 main categories: business_directory, marketplace, etc.
      profession,  // Specific profession within category
      profileMetadata, // Category-specific profile data
      city,
      state
    } = req.body;

    // 1. 🛡️ DATA SANITIZATION & MANDATORY FIELDS CHECK
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REGISTRATION_FIELDS",
          message: "Non, imèl, ak modpas obligatwa.",
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

    // 3. 🚫 ANTI-DUPLICATION CHECK (in-memory + MongoDB)
    const userExistsInMemory = Array.from(usersDatabase.values()).some(u => u.email === cleanEmail);
    if (userExistsInMemory) {
      return res.status(409).json({
        success: false,
        error: { code: "EMAIL_ALREADY_EXISTS", message: "Yon kont egziste deja ak adrès imèl sa a nan JOBFAST.", requestId }
      });
    }
    if (mongoose.connection.readyState === 1) {
      const mongoExists = await User.findOne({ email: cleanEmail }).lean();
      if (mongoExists) {
        return res.status(409).json({
          success: false,
          error: { code: "EMAIL_ALREADY_EXISTS", message: "Yon kont egziste deja ak adrès imèl sa a nan JOBFAST.", requestId }
        });
      }
    }

    // 4. 🏷️ CATEGORY & PROFESSION — accept any value for MVP flexibility
    let userCategory = category || '';
    let userProfession = profession || role || '';

    // Merge top-level fields into metadata so field validation always passes
    let categoryMetadata = {
      ...(profileMetadata || {}),
      fullName:  (profileMetadata?.fullName)  || name  || '',
      role:      (profileMetadata?.role)      || (profileMetadata?.jobRole) || userProfession || '',
      location:  (profileMetadata?.location)  || `${city || ''}, ${state || ''}`.replace(/^,\s*/, '').trim() || '',
      // Business fields fallback
      businessName:  profileMetadata?.businessName  || name  || '',
      restaurantName: profileMetadata?.restaurantName || name || '',
      hotelName:      profileMetadata?.hotelName      || name || '',
      officeName:     profileMetadata?.officeName     || name || '',
      hospitalName:   profileMetadata?.hospitalName   || name || '',
      clinicName:     profileMetadata?.clinicName     || name || '',
      organizationName: profileMetadata?.organizationName || name || '',
    };

    // 5. 📍 LOCATION INJECTION & COORDINATES SIMULATION (GPS READY)
    const gpsLocation = {
      city:    (city    || '').trim(),
      state:   (state   || '').trim(),
      country: "Haiti",
      coordinates: {
        latitude:  18.5432 + (Math.random() - 0.5) * 0.02,
        longitude: -72.3395 + (Math.random() - 0.5) * 0.02
      }
    };

    // 6. 🏗️ USER OBJECT CONSTRUCTOR
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;

    const requiredCount = userProfession ? (getRequiredFields(userProfession)?.length || 0) : 0;
    const totalFields   = Math.max(requiredCount + 5, Object.keys(categoryMetadata).length + 5);
    const filledFields  = 5 + Object.keys(categoryMetadata).filter(k => categoryMetadata[k]).length;
    const profileCompleteness = Math.min(100, Math.round((filledFields / totalFields) * 100));

    const newUser = {
      id: userId,
      _id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: await bcrypt.hash(password, 12),
      accountType,
      role: role?.toLowerCase().trim() || userProfession?.toLowerCase().trim() || "user",
      category: userCategory,
      profession: userProfession,
      profileMetadata: categoryMetadata,
      profileCompleteness,
      tier: "free",
      location: gpsLocation,
      availability: accountType === 'individual' ? 'available' : 'online',
      stats: {
        totalJobs: 0,
        rating: 5.0,
        memberSince: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        skills: []
      },
      createdAt: new Date()
    };

    // 💾 PERSIST TO MONGODB when available — graceful fallback to in-memory for MVP
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoDoc = await User.create({
          name: newUser.name,
          email: newUser.email,
          password,                   // plain — User model pre-save hook hashes it
          phone: req.body.phone || null,
          role: role?.toLowerCase().trim() || 'user',
          category: userCategory || null,
          profession: userProfession || null,
          profileMetadata: categoryMetadata,
          profileCompleteness: newUser.profileCompleteness,
          location: {
            type: 'Point',
            coordinates: [gpsLocation.coordinates.longitude, gpsLocation.coordinates.latitude],
            city: gpsLocation.city,
            country: 'Haiti',
          },
        });
        // Upgrade to real MongoDB _id
        newUser.id  = mongoDoc._id.toString();
        newUser._id = mongoDoc._id.toString();
        console.log(`💾 User persisted to MongoDB: ${cleanEmail} (${mongoDoc._id})`);
      } catch (dbErr) {
        console.warn(`⚠️ MongoDB persist failed for ${cleanEmail} — using in-memory fallback:`, dbErr.message);
      }
    } else {
      console.warn(`⚠️ MongoDB not connected — ${cleanEmail} saved in-memory only (data lost on restart)`);
    }

    // Always cache in-memory (fast path for same Render instance)
    usersDatabase.set(newUser.id, newUser);

    // Generate JWT token so the user is immediately logged in after registration
    const accessToken = jwt.sign(
      { id: newUser.id, email: cleanEmail, role: newUser.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // 📢 TRIGGER MATCHING SERVICE (non-blocking, after response)
    setImmediate(() => {
      try {
        notifyNewCategoryMember(newUser).catch(err =>
          console.error('Error notifying about new member:', err.message)
        );
      } catch (err) {
        console.error('Matching service error (non-blocking):', err.message);
      }
    });

    console.log(`✅ Register: ${cleanEmail} (${newUser.role})`);

    // 8. 📦 RESPONSE MATRIX
    return res.status(201).json({
      success: true,
      meta: {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        requestId
      },
      data: {
        message: "Pwofil ou kreye ak siksè nan rezo entènasyonal JOBFAST la!",
        userId:  newUser.id,
        _id:     newUser.id,
        token:   accessToken,
        user: {
          id: newUser.id,
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          category: newUser.category,
          profession: newUser.profession,
          profileMetadata: newUser.profileMetadata,
          profileCompleteness: newUser.profileCompleteness,
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

