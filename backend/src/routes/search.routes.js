import express from 'express';
import userRepo from '../repositories/user.repository.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

/**
 * GET /api/v1/search
 * Full-text user search backed by Supabase.
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

    const userLat     = lat ? parseFloat(lat) : null;
    const userLng     = lng ? parseFloat(lng) : null;
    const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);
    const pageNum     = Math.max(1, parseInt(page,  10) || 1);
    const limitNum    = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    // Fetch from Supabase with search + availability filter
    const { users } = await userRepo.getUsers({
      page:   1,          // fetch broadly; distance filter happens below
      limit:  200,        // generous cap for distance post-filtering
      search: q.trim(),
      status: availableOnly === 'true' ? 'active' : null,
    });

    // Attach distance + optional post-filter
    let candidates = users.map(u => {
      let distanceKm = null;
      if (hasLocation && u.location?.city) {
        // No coordinates stored yet — distance N/A unless we add location_lat/lng
        distanceKm = null;
      }
      return { ...u, distanceKm };
    });

    if (maxDistance && hasLocation) {
      const max = parseFloat(maxDistance);
      if (Number.isFinite(max) && max > 0) {
        candidates = candidates.filter(u => u.distanceKm == null || u.distanceKm <= max);
      }
    }

    // Sort: available first → rating desc → distance asc
    candidates.sort((a, b) => {
      const aAvail  = a.isAvailable ? 10 : 0;
      const bAvail  = b.isAvailable ? 10 : 0;
      const aRating = a.stats?.rating ?? 0;
      const bRating = b.stats?.rating ?? 0;
      const aDist   = a.distanceKm   ?? 9999;
      const bDist   = b.distanceKm   ?? 9999;
      if (bAvail  !== aAvail)  return bAvail  - aAvail;
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