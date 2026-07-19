/**
 * workers.routes.js — Supabase (migrated from in-memory usersDatabase)
 * Mounted at: /api/v1/workers
 */

import express from 'express';
import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';

const router = express.Router();

const VALID_AVAILABILITY = ['available', 'busy', 'looking', 'vacation', 'unavailable', 'online'];

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
  ].filter(Boolean).length;
  return Math.min(100, Math.round((filled / 8) * 100));
}

// ── GET /api/v1/workers/stats?userId= ────────────────────────

router.get('/stats', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const { passwordHash: _pw, ...safeUser } = user;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/workers/availability ───────────────────────

router.patch('/availability', async (req, res) => {
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

  try {
    await userRepo.getById(userId); // 404 if not found
    const isAvailable = ['available', 'looking', 'online'].includes(availability);
    await userRepo.update(userId, { availability, isAvailable });
    return res.json({ success: true, data: { availability } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/workers/location ───────────────────────────

router.patch('/location', async (req, res) => {
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

  try {
    const user = await userRepo.getById(userId);
    const updates = {
      locationLat: parsedLat,
      locationLng: parsedLng,
    };
    if (serviceRadius != null) {
      const radius = parseFloat(serviceRadius);
      if (Number.isFinite(radius) && radius > 0) {
        updates.profileMetadata = { ...(user.profileMetadata || {}), serviceRadius: radius };
      }
    }
    await userRepo.update(userId, updates);

    const locationOut = {
      lat:          parsedLat,
      lng:          parsedLng,
      lastUpdated:  new Date().toISOString(),
      ...(serviceRadius != null ? { serviceRadius: parseFloat(serviceRadius) } : {}),
    };
    return res.json({ success: true, data: { location: locationOut } });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/workers/profile ────────────────────────────

router.patch('/profile', async (req, res) => {
  const { userId, profileMetadata, experience, skills } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const updates = {};

    if (profileMetadata && typeof profileMetadata === 'object') {
      updates.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
    }
    if (typeof experience === 'number' && experience >= 0) {
      updates.experience = experience;
    }
    if (Array.isArray(skills)) {
      const baseMeta = updates.profileMetadata || user.profileMetadata || {};
      updates.profileMetadata = { ...baseMeta, skills };
    }

    // Recompute completeness against merged state
    const merged = { ...user, ...updates };
    updates.profileCompleteness = recomputeCompleteness(merged);

    const updated = await userRepo.update(userId, updates);
    const { passwordHash: _pw, ...safeUser } = updated;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Travayè pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /api/v1/workers/reviews?userId= ──────────────────────

router.get('/reviews', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.json({ success: true, data: { reviews: [], avgRating: 0, total: 0 } });
  }

  try {
    const user     = await userRepo.getById(userId);
    const rd       = user.reputationData || {};
    const reviews  = (rd.workerReviews || []).filter(r => r.status === 'approved' || r.status == null);
    const avgRating = rd.avgRating || user.stats?.rating || 0;
    return res.json({ success: true, data: { reviews, avgRating, total: reviews.length } });
  } catch (err) {
    return res.json({ success: true, data: { reviews: [], avgRating: 0, total: 0 } });
  }
});

export default router;