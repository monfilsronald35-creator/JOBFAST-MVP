/**
 * workers.routes.js
 *
 * Worker-specific REST endpoints.  All reads and writes go through
 * the shared in-memory usersDatabase from register.controller.js —
 * no separate collection or duplicate data.
 *
 * NOTE (MVP): userId is accepted from the request body / query params
 * instead of relying on the JWT middleware because of a known field
 * mismatch bug (authService signs { userId } but authMiddleware reads
 * decoded.id).  Replace with authMiddleware once that bug is fixed.
 *
 * Mounted at: /api/v1/workers
 */

import express from 'express';
import { usersDatabase } from '../controllers/register.controller.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────

const VALID_AVAILABILITY = ['available', 'busy', 'looking', 'vacation', 'unavailable', 'online'];

/** Strip password before sending a user object to the client. */
function safeUser(u) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = u;
  return safe;
}

/** Recompute profile completeness based on current user fields. */
function recomputeCompleteness(user) {
  const meta   = user.profileMetadata || {};
  const filled = [
    user.name,
    user.email,
    user.profession,
    user.location?.city,
    meta.phone || user.phone,
    meta.bio,
    meta.skills?.length > 0,
    meta.yearsExperience || user.experience,
    user.accountType,
  ].filter(Boolean).length;
  return Math.min(100, Math.round((filled / 9) * 100));
}

// ── GET /api/v1/workers/stats ─────────────────────────────────
// Returns the full (safe) profile of a specific worker.
// Query param: userId

router.get('/stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
  }

  return res.json({ success: true, data: safeUser(user) });
});

// ── PATCH /api/v1/workers/availability ───────────────────────
// Update a worker's availability status.
// Body: { userId, availability }

router.patch('/availability', (req, res) => {
  const { userId, availability } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  if (!VALID_AVAILABILITY.includes(availability)) {
    return res.status(400).json({
      success: false,
      error: { message: `availability dwe youn nan: ${VALID_AVAILABILITY.join(', ')}` },
    });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
  }

  user.availability = availability;
  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { availability } });
});

// ── PATCH /api/v1/workers/location ───────────────────────────
// Update a worker's GPS coordinates and optional service radius.
// Body: { userId, lat, lng, serviceRadius? }

router.patch('/location', (req, res) => {
  const { userId, lat, lng, serviceRadius } = req.body;

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (!userId || !Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return res.status(400).json({
      success: false,
      error: { message: 'userId, lat ak lng requis e dwe valid' },
    });
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({
      success: false,
      error: { message: 'Kowòdone GPS pa valid' },
    });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
  }

  if (!user.location) user.location = {};
  if (!user.location.coordinates) user.location.coordinates = {};

  user.location.coordinates.latitude  = parsedLat;
  user.location.coordinates.longitude = parsedLng;
  user.location.lastUpdated = new Date().toISOString();

  if (serviceRadius != null) {
    const radius = parseFloat(serviceRadius);
    if (Number.isFinite(radius) && radius > 0) {
      user.location.serviceRadius = radius;
    }
  }

  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { location: user.location } });
});

// ── PATCH /api/v1/workers/profile ────────────────────────────
// Additive update of worker-specific profile fields.
// Body: { userId, profileMetadata?, experience?, skills? }

router.patch('/profile', (req, res) => {
  const { userId, profileMetadata, experience, skills } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
  }

  // Additive merge for profileMetadata
  if (profileMetadata && typeof profileMetadata === 'object') {
    user.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
  }

  // Update experience (years)
  if (typeof experience === 'number' && experience >= 0) {
    user.experience = experience;
  }

  // Convenience: skills can be passed at the top level
  if (Array.isArray(skills)) {
    if (!user.profileMetadata) user.profileMetadata = {};
    user.profileMetadata.skills = skills;
  }

  // Recompute profile completeness after update
  user.profileCompleteness = recomputeCompleteness(user);

  usersDatabase.set(userId, user);

  return res.json({ success: true, data: safeUser(user) });
});

// ── GET /api/v1/workers/reviews ──────────────────────────────
// Placeholder — review system is a future phase.
// Returns the worker's aggregate rating + an empty review list.

router.get('/reviews', (req, res) => {
  const { userId } = req.query;

  let avgRating = 0;
  if (userId) {
    const user = usersDatabase.get(userId);
    if (user) avgRating = user.stats?.rating ?? 0;
  }

  return res.json({
    success: true,
    data: { reviews: [], avgRating, total: 0 },
  });
});

export default router;