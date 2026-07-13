import express    from 'express';
import mongoose   from 'mongoose';
import User       from '../models/user.model.js';
import { usersDatabase } from '../controllers/register.controller.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

/**
 * GET /api/v1/search
 * Public search — tries MongoDB first, falls back to in-memory for MVP.
 */
router.get('/', async (req, res) => {
  try {
    const {
      q            = '',
      lat, lng,
      maxDistance,
      availableOnly,
      page         = '1',
      limit        = '20',
    } = req.query;

    const userLat    = lat ? parseFloat(lat) : null;
    const userLng    = lng ? parseFloat(lng) : null;
    const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);
    const pageNum    = Math.max(1, parseInt(page,  10) || 1);
    const limitNum   = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    let candidates = [];
    const isMongoUp = mongoose.connection.readyState === 1;

    if (isMongoUp) {
      // ── MongoDB path (persistent) ──────────────────────────────────
      const mongoQuery = {};
      const trimmedQ   = q.trim();
      if (trimmedQ) {
        mongoQuery.$or = [
          { name:            { $regex: trimmedQ, $options: 'i' } },
          { profession:      { $regex: trimmedQ, $options: 'i' } },
          { role:            { $regex: trimmedQ, $options: 'i' } },
          { 'location.city': { $regex: trimmedQ, $options: 'i' } },
        ];
      }
      if (availableOnly === 'true') mongoQuery.availability = 'available';

      const users = await User.find(mongoQuery)
        .select('-password -notifications -__v')
        .limit(200)
        .lean();

      candidates = users.map(u => {
        let distanceKm = null;
        if (hasLocation && u.location?.coordinates) {
          distanceKm = calculateDistanceKm(
            userLat, userLng,
            u.location.coordinates.latitude,
            u.location.coordinates.longitude,
          );
        }
        return { ...u, distanceKm };
      });
    } else {
      // ── In-memory fallback ─────────────────────────────────────────
      const trimmedQ = q.trim().toLowerCase();
      candidates = Array.from(usersDatabase.values()).map(u => {
        const { password, ...safe } = u;
        let distanceKm = null;
        if (hasLocation && u.location?.coordinates) {
          distanceKm = calculateDistanceKm(
            userLat, userLng,
            u.location.coordinates.latitude,
            u.location.coordinates.longitude,
          );
        }
        return { ...safe, distanceKm };
      }).filter(u => !trimmedQ ||
        u.name?.toLowerCase().includes(trimmedQ) ||
        u.profession?.toLowerCase().includes(trimmedQ) ||
        u.role?.toLowerCase().includes(trimmedQ) ||
        u.location?.city?.toLowerCase().includes(trimmedQ)
      );
    }

    // Distance filter
    if (maxDistance && hasLocation) {
      const max = parseFloat(maxDistance);
      if (Number.isFinite(max) && max > 0) {
        candidates = candidates.filter(u => u.distanceKm != null && u.distanceKm <= max);
      }
    }

    // Sort: available first, then by rating desc, then by distance asc
    candidates.sort((a, b) => {
      const aAvail = a.availability === 'available' ? 10 : 0;
      const bAvail = b.availability === 'available' ? 10 : 0;
      const aRating = a.stats?.rating ?? a.reputationData?.avgRating ?? 0;
      const bRating = b.stats?.rating ?? b.reputationData?.avgRating ?? 0;
      const aDist = a.distanceKm ?? 9999;
      const bDist = b.distanceKm ?? 9999;
      if (bAvail !== aAvail) return bAvail - aAvail;
      if (bRating !== aRating) return bRating - aRating;
      return aDist - bDist;
    });

    const total = candidates.length;
    const start = (pageNum - 1) * limitNum;
    const items = candidates.slice(start, start + limitNum);

    return res.json({
      success: true,
      data: { items, total, page: pageNum, limit: limitNum, hasMore: start + limitNum < total },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;