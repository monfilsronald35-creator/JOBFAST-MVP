/**
 * marketplace.routes.js — Supabase (migrated from in-memory usersDatabase)
 * marketplace_data JSONB on profiles stores: bookings[], sentBookings[], reviews[],
 * avgRating, reviewCount, favorites[], availability
 * Mounted at: /api/v1/marketplace
 */

import express from 'express';
import crypto  from 'crypto';
import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';
import supabase from '../config/supabaseClient.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

const PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

const VALID_AVAILABILITY = new Set([
  'available', 'busy', 'fully_booked', 'closed',
  'rented', 'maintenance', 'unavailable', 'vacation', 'emergency_only',
]);

function getMD(user) {
  if (!user.marketplaceData || !Array.isArray(user.marketplaceData.bookings)) {
    return {
      bookings:     [],
      sentBookings: [],
      reviews:      [],
      avgRating:    0,
      reviewCount:  0,
      favorites:    [],
      availability: 'available',
    };
  }
  return user.marketplaceData;
}

function recomputeAvgRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + (r.rating ?? 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// ── GET /api/v1/marketplace/listings ─────────────────────────

router.get('/listings', async (req, res) => {
  const { role, q = '', lat, lng, page = '1', limit = '20' } = req.query;

  if (!role) {
    return res.status(400).json({ success: false, error: { message: 'role requis' } });
  }

  const userLat     = lat ? parseFloat(lat) : null;
  const userLng     = lng ? parseFloat(lng) : null;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

  try {
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, name, role, profession, location_city, location_country, location_lat, location_lng, profile_metadata, marketplace_data, availability, stats, account_status')
      .eq('role', role)
      .eq('account_status', 'active')
      .limit(200);

    if (error) throw error;

    let candidates = (rows || []).map(u => {
      const md = (u.marketplace_data && Array.isArray(u.marketplace_data.bookings))
        ? u.marketplace_data
        : { bookings: [], reviews: [], avgRating: 0, availability: 'available' };

      let distanceKm = null;
      if (hasLocation && u.location_lat != null && u.location_lng != null) {
        distanceKm = calculateDistanceKm(userLat, userLng, u.location_lat, u.location_lng);
      }

      return {
        id:         u.id,
        _id:        u.id,
        name:       u.name,
        role:       u.role,
        profession: u.profession,
        location:   { city: u.location_city, country: u.location_country },
        distanceKm,
        availability: md.availability ?? u.availability ?? 'available',
        stats:      u.stats ?? {},
        marketplaceData: {
          bookingCount: (md.bookings || []).length,
          reviewCount:  (md.reviews  || []).length,
          avgRating:    md.avgRating ?? 0,
          availability: md.availability ?? 'available',
        },
      };
    });

    // Text search
    const trimmedQ = q.trim().toLowerCase();
    if (trimmedQ) {
      candidates = candidates.filter(u =>
        u.name?.toLowerCase().includes(trimmedQ)
        || u.profession?.toLowerCase().includes(trimmedQ)
        || u.location?.city?.toLowerCase().includes(trimmedQ)
      );
    }

    // Sort: available first, then by rating
    candidates.sort((a, b) => {
      const aAvail = a.availability === 'available' ? 1 : 0;
      const bAvail = b.availability === 'available' ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;
      const aRating = a.stats?.rating ?? a.marketplaceData?.avgRating ?? 0;
      const bRating = b.stats?.rating ?? b.marketplaceData?.avgRating ?? 0;
      return bRating - aRating;
    });

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const total    = candidates.length;
    const start    = (pageNum - 1) * limitNum;
    const items    = candidates.slice(start, start + limitNum);

    return res.json({ success: true, data: { items, total, page: pageNum, limit: limitNum, hasMore: start + limitNum < total } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/marketplace/book ────────────────────────────

router.post('/book', async (req, res) => {
  const {
    customerId, customerName,
    targetId,   targetName,
    bookingType, date, time, partySize, duration, notes,
  } = req.body;

  if (!targetId) {
    return res.status(400).json({ success: false, error: { message: 'targetId requis' } });
  }

  try {
    const target = await userRepo.getById(targetId);
    const md     = getMD(target);

    const booking = {
      id:           crypto.randomUUID(),
      customerId,
      customerName: customerName || 'Kliyan',
      bookingType:  bookingType  || 'reservation',
      date:         date         || null,
      time:         time         || null,
      partySize:    partySize    || 1,
      duration:     duration     || 1,
      notes:        notes        || '',
      status:       'pending',
      createdAt:    new Date().toISOString(),
    };

    md.bookings = [booking, ...(md.bookings || [])];
    await userRepo.update(targetId, { marketplaceData: md });

    // Notify target
    await notificationRepo.insert({
      userId:   targetId,
      type:     'booking_received',
      title:    `Nouvo ${bookingType || 'rezèvasyon'}`,
      message:  `${customerName || 'Yon kliyan'} fè yon demann${date ? ` pou ${date}` : ''}.`,
      data:     { bookingId: booking.id },
      actionUrl: '/dashboard',
      sourceUserId: customerId || null,
    }).catch(() => {});

    // Track sent booking on customer side (best-effort)
    if (customerId) {
      try {
        const customer = await userRepo.getById(customerId);
        const cmd      = getMD(customer);
        cmd.sentBookings = [{ ...booking, targetId, targetName: targetName || target.name }, ...(cmd.sentBookings || [])];
        await userRepo.update(customerId, { marketplaceData: cmd });
      } catch { /* non-critical */ }
    }

    return res.json({ success: true, data: { booking, message: 'Demann rezèvasyon anvwaye' } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /api/v1/marketplace/reviews?targetId= ────────────────

router.get('/reviews', async (req, res) => {
  const { targetId } = req.query;
  if (!targetId) {
    return res.status(400).json({ success: false, error: { message: 'targetId requis' } });
  }

  try {
    const target = await userRepo.getById(targetId);
    const md     = getMD(target);
    return res.json({
      success: true,
      data: {
        reviews:     md.reviews    || [],
        avgRating:   md.avgRating  ?? 0,
        reviewCount: (md.reviews   || []).length,
      },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/marketplace/reviews ─────────────────────────

router.post('/reviews', async (req, res) => {
  const { targetId, reviewerId, reviewerName, rating, criteria, comment } = req.body;

  if (!targetId || !rating) {
    return res.status(400).json({ success: false, error: { message: 'targetId ak rating requis' } });
  }
  const parsedRating = parseFloat(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ success: false, error: { message: 'Rating dwe ant 1 ak 5' } });
  }

  try {
    const target = await userRepo.getById(targetId);
    const md     = getMD(target);

    const existingIdx = (md.reviews || []).findIndex(r => r.reviewerId === reviewerId);
    const review = {
      id:           existingIdx >= 0 ? md.reviews[existingIdx].id : crypto.randomUUID(),
      reviewerId:   reviewerId   || null,
      reviewerName: reviewerName || 'Anonim',
      rating:       parsedRating,
      criteria:     criteria     || {},
      comment:      comment      || '',
      verified:     false,
      createdAt:    new Date().toISOString(),
    };

    if (!md.reviews) md.reviews = [];
    if (existingIdx >= 0) {
      md.reviews[existingIdx] = review;
    } else {
      md.reviews = [review, ...md.reviews];
    }

    md.avgRating   = recomputeAvgRating(md.reviews);
    md.reviewCount = md.reviews.length;

    await userRepo.update(targetId, { marketplaceData: md });

    await notificationRepo.insert({
      userId:   targetId,
      type:     'new_review',
      title:    'Nouvo Evalyasyon',
      message:  `${reviewerName || 'Yon kliyan'} ba ou ⭐ ${parsedRating}/5.`,
      sourceUserId: reviewerId || null,
    }).catch(() => {});

    return res.json({
      success: true,
      data: { review, avgRating: md.avgRating, reviewCount: md.reviewCount },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /api/v1/marketplace/favorites?userId= ────────────────

router.get('/favorites', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const md   = getMD(user);
    return res.json({ success: true, data: { favorites: md.favorites || [] } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/marketplace/favorites/toggle ─────────────────

router.post('/favorites/toggle', async (req, res) => {
  const { userId, targetId } = req.body;

  if (!userId || !targetId) {
    return res.status(400).json({ success: false, error: { message: 'userId ak targetId requis' } });
  }

  try {
    const user      = await userRepo.getById(userId);
    const md        = getMD(user);
    const favorites = md.favorites || [];
    const idx       = favorites.indexOf(targetId);

    let action;
    if (idx >= 0) {
      favorites.splice(idx, 1);
      action = 'removed';
    } else {
      favorites.push(targetId);
      action = 'added';
    }

    md.favorites = favorites;
    await userRepo.update(userId, { marketplaceData: md });

    return res.json({ success: true, data: { favorites, action } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/marketplace/availability ───────────────────

router.patch('/availability', async (req, res) => {
  const { userId, availability } = req.body;

  if (!userId || !availability) {
    return res.status(400).json({ success: false, error: { message: 'userId ak availability requis' } });
  }
  if (!VALID_AVAILABILITY.has(availability)) {
    return res.status(400).json({
      success: false,
      error: { message: `Eta invalide. Chwa: ${[...VALID_AVAILABILITY].join(', ')}` },
    });
  }

  try {
    const user = await userRepo.getById(userId);
    const md   = getMD(user);
    md.availability = availability;

    await userRepo.update(userId, {
      marketplaceData: md,
      availability,
      isAvailable: availability === 'available',
    });

    return res.json({ success: true, data: { availability } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/marketplace/bookings/respond ────────────────

router.post('/bookings/respond', async (req, res) => {
  const { userId, bookingId, action } = req.body;

  if (!userId || !bookingId || !['confirmed', 'rejected'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: { message: 'userId, bookingId, ak aksyon (confirmed|rejected) requis' },
    });
  }

  try {
    const user    = await userRepo.getById(userId);
    const md      = getMD(user);
    const booking = (md.bookings || []).find(b => b.id === bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, error: { message: 'Rezèvasyon pa jwenn' } });
    }

    booking.status = action;
    await userRepo.update(userId, { marketplaceData: md });

    // Notify customer (best-effort)
    if (booking.customerId) {
      await notificationRepo.insert({
        userId:    booking.customerId,
        type:      'booking_response',
        title:     action === 'confirmed' ? 'Rezèvasyon Konfime! ✅' : 'Rezèvasyon Refize',
        message:   action === 'confirmed'
          ? `Rezèvasyon ou nan ${user.name} konfime!`
          : `Rezèvasyon ou nan ${user.name} pa aksepte.`,
        data:      { bookingId, action },
        sourceUserId: userId,
      }).catch(() => {});
    }

    return res.json({ success: true, data: { bookingId, action } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;