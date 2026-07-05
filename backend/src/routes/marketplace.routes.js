/**
 * marketplace.routes.js
 *
 * Shared marketplace backend for all JOBFAST business categories.
 * All roles share these endpoints; role-specific behavior is driven
 * by query params and the user object itself.
 *
 * Everything is stored on user.marketplaceData in usersDatabase
 * (same pattern as companyData / enterpriseData).
 *
 * NOTE (MVP): userId from body/query, not JWT middleware.
 *
 * Mounted at: /api/v1/marketplace
 *
 * Endpoints:
 *   GET  /listings           — role-filtered listing search
 *   POST /book               — shared booking engine
 *   GET  /reviews            — reviews for a listing
 *   POST /reviews            — submit a review
 *   GET  /favorites          — favorites list for a user
 *   POST /favorites/toggle   — toggle favorite
 *   PATCH /availability      — update own availability
 */

import express from 'express';
import crypto  from 'crypto';
import { usersDatabase }       from '../controllers/register.controller.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

// ── Provider roles — roles whose users appear as marketplace listings ──
const PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

// ── Helpers ──────────────────────────────────────────────────

function safeUser(u) {
  const { password, notifications: _n, ...safe } = u;
  return safe;
}

/** Initialise marketplaceData on user if absent. */
function getMD(user) {
  if (!user.marketplaceData) {
    user.marketplaceData = {
      listings:     [],
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

/** Recompute avgRating from reviews array. */
function recomputeAvgRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + (r.rating ?? 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// ── GET /api/v1/marketplace/listings ─────────────────────────
// Role-filtered listing search.
//
// Query params:
//   role      — required: marketplace role to filter by (restaurant, hotel, etc.)
//   q         — optional text search
//   tab       — optional sub-category tab (ignored server-side, placeholder)
//   lat, lng  — optional GPS coords for distance
//   page, limit
//
// Returns users whose role matches the requested role,
// with distanceKm and marketplaceData attached.

router.get('/listings', (req, res) => {
  const {
    role, q = '',
    lat, lng,
    page  = '1',
    limit = '20',
  } = req.query;

  if (!role) {
    return res.status(400).json({ success: false, error: { message: 'role requis' } });
  }

  const userLat    = lat ? parseFloat(lat) : null;
  const userLng    = lng ? parseFloat(lng) : null;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

  // ── Candidate listings ────────────────────────────────────
  let candidates = Array.from(usersDatabase.values())
    .filter(u => u.role === role)
    .map(u => {
      const { password, notifications: _n, ...safe } = u;
      const md = getMD(u);

      let distanceKm = null;
      if (hasLocation && u.location?.coordinates) {
        distanceKm = calculateDistanceKm(
          userLat, userLng,
          u.location.coordinates.latitude,
          u.location.coordinates.longitude,
        );
      }

      return {
        ...safe,
        distanceKm,
        marketplaceData: {
          bookingCount:  (md.bookings  || []).length,
          reviewCount:   (md.reviews   || []).length,
          avgRating:     md.avgRating  ?? 0,
          availability:  md.availability ?? 'available',
        },
        availability: md.availability ?? safe.availability ?? 'available',
      };
    });

  // ── Text search ──────────────────────────────────────────
  const trimmedQ = q.trim().toLowerCase();
  if (trimmedQ) {
    candidates = candidates.filter(u =>
      u.name?.toLowerCase().includes(trimmedQ)
      || u.profession?.toLowerCase().includes(trimmedQ)
      || u.location?.city?.toLowerCase().includes(trimmedQ)
      || u.profileMetadata?.bio?.toLowerCase().includes(trimmedQ)
    );
  }

  // ── Sort: available first, then by rating ────────────────
  candidates.sort((a, b) => {
    const aAvail = a.availability === 'available' ? 1 : 0;
    const bAvail = b.availability === 'available' ? 1 : 0;
    if (aAvail !== bAvail) return bAvail - aAvail;
    const aRating = a.stats?.rating ?? a.marketplaceData?.avgRating ?? 0;
    const bRating = b.stats?.rating ?? b.marketplaceData?.avgRating ?? 0;
    return bRating - aRating;
  });

  // ── Pagination ───────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const total    = candidates.length;
  const start    = (pageNum - 1) * limitNum;
  const items    = candidates.slice(start, start + limitNum);
  const hasMore  = start + limitNum < total;

  return res.json({
    success: true,
    data: { items, total, page: pageNum, limit: limitNum, hasMore },
  });
});

// ── POST /api/v1/marketplace/book ────────────────────────────
// Shared booking engine.
//
// Body: {
//   customerId, customerName,
//   targetId,   targetName,
//   bookingType,
//   date, time, partySize, duration, notes
// }

router.post('/book', (req, res) => {
  const {
    customerId, customerName,
    targetId,   targetName,
    bookingType,
    date, time, partySize, duration, notes,
  } = req.body;

  if (!targetId) {
    return res.status(400).json({ success: false, error: { message: 'targetId requis' } });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
  }

  const md = getMD(target);
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

  md.bookings.unshift(booking);
  usersDatabase.set(targetId, target);

  // Notify target
  if (!target.notifications) target.notifications = [];
  target.notifications.unshift({
    id:        crypto.randomUUID(),
    type:      'booking_received',
    title:     `Nouvo ${bookingType || 'rezèvasyon'}`,
    message:   `${customerName || 'Yon kliyan'} fè yon demann${date ? ` pou ${date}` : ''}.`,
    data:      { bookingId: booking.id },
    actionUrl: '/dashboard',
    createdAt: new Date().toISOString(),
    isRead:    false,
  });

  // If customer is in usersDatabase, track their sent booking too
  if (customerId) {
    const customer = usersDatabase.get(customerId);
    if (customer) {
      const cmd = getMD(customer);
      cmd.sentBookings.unshift({ ...booking, targetId, targetName: targetName || target.name });
      usersDatabase.set(customerId, customer);
    }
  }

  return res.json({
    success: true,
    data: { booking, message: 'Demann rezèvasyon anvwaye' },
  });
});

// ── GET /api/v1/marketplace/reviews?targetId= ────────────────
// Returns all reviews for a listing.

router.get('/reviews', (req, res) => {
  const { targetId } = req.query;
  if (!targetId) {
    return res.status(400).json({ success: false, error: { message: 'targetId requis' } });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
  }

  const md = getMD(target);
  return res.json({
    success: true,
    data: {
      reviews:    md.reviews    || [],
      avgRating:  md.avgRating  ?? 0,
      reviewCount: (md.reviews || []).length,
    },
  });
});

// ── POST /api/v1/marketplace/reviews ─────────────────────────
// Submit a review for a listing.
//
// Body: { targetId, reviewerId, reviewerName, rating, criteria, comment }

router.post('/reviews', (req, res) => {
  const { targetId, reviewerId, reviewerName, rating, criteria, comment } = req.body;

  if (!targetId || !rating) {
    return res.status(400).json({ success: false, error: { message: 'targetId ak rating requis' } });
  }

  const parsedRating = parseFloat(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ success: false, error: { message: 'Rating dwe ant 1 ak 5' } });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Lis pa jwenn' } });
  }

  const md = getMD(target);

  // Prevent duplicate review from same reviewer
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

  if (existingIdx >= 0) {
    md.reviews[existingIdx] = review;           // update existing
  } else {
    md.reviews.unshift(review);                 // prepend new
  }

  md.avgRating   = recomputeAvgRating(md.reviews);
  md.reviewCount = md.reviews.length;

  usersDatabase.set(targetId, target);

  // Notify the listing owner
  if (!target.notifications) target.notifications = [];
  target.notifications.unshift({
    id:        crypto.randomUUID(),
    type:      'new_review',
    title:     'Nouvo Evalyasyon',
    message:   `${reviewerName || 'Yon kliyan'} ba ou ⭐ ${parsedRating}/5.`,
    createdAt: new Date().toISOString(),
    isRead:    false,
  });

  return res.json({
    success: true,
    data: { review, avgRating: md.avgRating, reviewCount: md.reviewCount },
  });
});

// ── GET /api/v1/marketplace/favorites?userId= ────────────────
// Returns the list of favorited listing IDs for a user.

router.get('/favorites', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const md = getMD(user);
  return res.json({ success: true, data: { favorites: md.favorites || [] } });
});

// ── POST /api/v1/marketplace/favorites/toggle ─────────────────
// Toggle a listing as favorite/unfavorite.
//
// Body: { userId, targetId }

router.post('/favorites/toggle', (req, res) => {
  const { userId, targetId } = req.body;

  if (!userId || !targetId) {
    return res.status(400).json({ success: false, error: { message: 'userId ak targetId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const md = getMD(user);
  const favorites = md.favorites || [];
  const idx = favorites.indexOf(targetId);

  let action;
  if (idx >= 0) {
    favorites.splice(idx, 1);
    action = 'removed';
  } else {
    favorites.push(targetId);
    action = 'added';
  }

  md.favorites = favorites;
  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { favorites, action } });
});

// ── PATCH /api/v1/marketplace/availability ───────────────────
// Update a listing's availability state.
//
// Body: { userId, availability }
// Valid states: available, busy, fully_booked, closed, rented,
//               maintenance, unavailable, vacation, emergency_only

const VALID_AVAILABILITY = new Set([
  'available', 'busy', 'fully_booked', 'closed',
  'rented', 'maintenance', 'unavailable', 'vacation', 'emergency_only',
]);

router.patch('/availability', (req, res) => {
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

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const md = getMD(user);
  md.availability = availability;
  user.availability = availability;         // also update top-level availability field
  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { availability } });
});

// ── POST /api/v1/marketplace/bookings/:id/respond ────────────
// Provider accepts or rejects an incoming booking.
//
// Body: { userId, bookingId, action: 'confirmed' | 'rejected' }

router.post('/bookings/respond', (req, res) => {
  const { userId, bookingId, action } = req.body;

  if (!userId || !bookingId || !['confirmed','rejected'].includes(action)) {
    return res.status(400).json({ success: false, error: { message: 'userId, bookingId, ak aksyon (confirmed|rejected) requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const md = getMD(user);
  const booking = (md.bookings || []).find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: { message: 'Rezèvasyon pa jwenn' } });
  }

  booking.status = action;
  usersDatabase.set(userId, user);

  // Notify the customer
  const customer = booking.customerId ? usersDatabase.get(booking.customerId) : null;
  if (customer) {
    if (!customer.notifications) customer.notifications = [];
    customer.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      'booking_response',
      title:     action === 'confirmed' ? 'Rezèvasyon Konfime! ✅' : 'Rezèvasyon Refize',
      message:   action === 'confirmed'
        ? `Rezèvasyon ou nan ${user.name} konfime!`
        : `Rezèvasyon ou nan ${user.name} pa aksepte.`,
      data:      { bookingId, action },
      createdAt: new Date().toISOString(),
      isRead:    false,
    });
    usersDatabase.set(booking.customerId, customer);
  }

  return res.json({ success: true, data: { bookingId, action } });
});

export default router;